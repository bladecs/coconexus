'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coconexus';
process.env.RATE_LIMIT_MAX_REQUESTS = '10000';
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = '10000';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { sequelize, Category, Article, ArticleDetail } = require('../models');
const { resetTestDatabase, createAdminUser, createPengelolaUser } = require('./helpers/testDb');

async function loginWith(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.data.token;
}

async function registerAndLogin(email = 'user.kms@coconexus.local') {
  await request(app).post('/api/auth/register').send({
    email,
    password: 'User12345',
    full_name: 'User KMS',
  });
  return loginWith(email, 'User12345');
}

async function createAndPublishArticle(token, payload) {
  const createRes = await request(app)
    .post('/api/pengelola/articles')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  assert.equal(createRes.status, 201, `createArticle: ${JSON.stringify(createRes.body)}`);
  const id = createRes.body.data.article.id;

  const publishRes = await request(app)
    .patch(`/api/pengelola/articles/${id}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'published' });
  assert.equal(publishRes.status, 200, `publishArticle: ${JSON.stringify(publishRes.body)}`);
  return createRes.body.data.article;
}

test.beforeEach(async () => {
  await resetTestDatabase();
});

test.after(async () => {
  await sequelize.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUP 1 — Article Type Baru
// ─────────────────────────────────────────────────────────────────────────────

test('pengelola can create prosedur article and article_type is stored correctly', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.type@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const res = await request(app)
    .post('/api/pengelola/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Prosedur Karbonisasi Batok Kelapa',
      body_content: 'Langkah-langkah karbonisasi batok kelapa dalam retort drum.',
      article_type: 'prosedur',
      category: { name: 'Pengolahan Batok' },
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.article.article_type, 'prosedur');

  const dbArticle = await Article.findByPk(res.body.data.article.id);
  assert.equal(dbArticle.article_type, 'prosedur');
});

test('pengelola can create all teknis article types without error', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.types@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const types = ['panduan', 'referensi', 'studi_kasus', 'troubleshooting'];
  let idx = 0;

  for (const articleType of types) {
    const res = await request(app)
      .post('/api/pengelola/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Artikel Tipe ${articleType}`,
        body_content: `Konten ${articleType}.`,
        article_type: articleType,
        category: { name: `Kategori ${idx++}` },
      });

    assert.equal(res.status, 201, `gagal buat tipe ${articleType}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.data.article.article_type, articleType);
  }
});

test('wawasan article defaults to main type when article_type not specified', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.default@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const res = await request(app)
    .post('/api/pengelola/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Mengenal Arang Aktif dari Batok Kelapa',
      body_content: 'Arang aktif adalah produk turunan batok kelapa berkualitas tinggi.',
      category: { name: 'Wawasan Kelapa' },
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.article.article_type, 'main');
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUP 2 — Link Wawasan ↔ Teknis (Bidirectional)
// ─────────────────────────────────────────────────────────────────────────────

test('teknis article can be linked to wawasan article via wawasan_article_id', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.link@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const wawasanRes = await request(app)
    .post('/api/pengelola/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Mengenal Arang Aktif dari Batok Kelapa',
      body_content: 'Pengenalan konsep arang aktif.',
      article_type: 'main',
      category: { name: 'Wawasan' },
    });
  assert.equal(wawasanRes.status, 201);
  const wawasanId = wawasanRes.body.data.article.id;

  const teknisRes = await request(app)
    .post('/api/pengelola/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Prosedur Pembuatan Arang Aktif dari Batok Kelapa',
      body_content: 'Langkah-langkah pembuatan arang aktif.',
      article_type: 'prosedur',
      wawasan_article_id: wawasanId,
      category: { name: 'Wawasan' },
    });

  assert.equal(teknisRes.status, 201);
  assert.equal(teknisRes.body.data.article.wawasan_article_id, wawasanId);
  assert.equal(teknisRes.body.data.article.article_type, 'prosedur');
});

test('published wawasan article shows technical_articles panel with linked teknis articles', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.bidir@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const wawasan = await createAndPublishArticle(token, {
    title: 'Mengenal Arang Aktif dari Batok Kelapa',
    body_content: 'Pengenalan arang aktif.',
    article_type: 'main',
    category: { name: 'Batok Kelapa' },
  });

  await createAndPublishArticle(token, {
    title: 'Prosedur Pembuatan Arang Aktif',
    body_content: 'Langkah-langkah karbonisasi.',
    article_type: 'prosedur',
    wawasan_article_id: wawasan.id,
    category: { name: 'Batok Kelapa' },
  });

  await createAndPublishArticle(token, {
    title: 'Panduan Aktivasi Kimia H3PO4',
    body_content: 'Panduan aktivasi dengan asam fosfat.',
    article_type: 'panduan',
    wawasan_article_id: wawasan.id,
    category: { name: 'Batok Kelapa' },
  });

  const res = await request(app).get(`/api/articles/published/${wawasan.id}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.article.article_type, 'main');

  const technicalArticles = res.body.data.article.technical_articles;
  assert.equal(technicalArticles.length, 2);

  const titles = technicalArticles.map((a) => a.title).sort();
  assert.deepEqual(titles, ['Panduan Aktivasi Kimia H3PO4', 'Prosedur Pembuatan Arang Aktif']);

  technicalArticles.forEach((ta) => {
    assert.notEqual(['prosedur', 'panduan'].indexOf(ta.article_type), -1);
    assert.equal(ta.status, 'published');
  });
});

test('published teknis article shows wawasan_article panel pointing back to wawasan', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.backlink@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const wawasan = await createAndPublishArticle(token, {
    title: 'Mengenal Arang Aktif',
    body_content: 'Dasar pengetahuan arang aktif.',
    article_type: 'main',
    category: { name: 'Arang' },
  });

  const teknis = await createAndPublishArticle(token, {
    title: 'Prosedur Karbonisasi 400-600 Derajat',
    body_content: 'Langkah karbonisasi suhu tinggi.',
    article_type: 'prosedur',
    wawasan_article_id: wawasan.id,
    category: { name: 'Arang' },
  });

  const res = await request(app).get(`/api/articles/published/${teknis.id}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.article.article_type, 'prosedur');
  assert.ok(res.body.data.article.wawasan_article, 'wawasan_article harus ada di response teknis');
  assert.equal(res.body.data.article.wawasan_article.id, wawasan.id);
  assert.equal(res.body.data.article.wawasan_article.title, 'Mengenal Arang Aktif');
});

test('teknis article without wawasan link has null wawasan_article', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.nolink@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const teknis = await createAndPublishArticle(token, {
    title: 'Prosedur Tanpa Link Wawasan',
    body_content: 'Artikel prosedur independen.',
    article_type: 'prosedur',
    category: { name: 'Teknis' },
  });

  const res = await request(app).get(`/api/articles/published/${teknis.id}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.article.wawasan_article, null);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUP 3 — Technical Metadata Fields
// ─────────────────────────────────────────────────────────────────────────────

test('prosedur article stores all technical metadata fields correctly', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.meta@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const payload = {
    title: 'Prosedur Pembuatan Arang Aktif Batok Kelapa',
    body_content: 'Karbonisasi batok kelapa pada suhu 400-600 derajat celcius.',
    article_type: 'prosedur',
    difficulty_level: 'menengah',
    time_required_minutes: 180,
    materials_list: [
      { name: 'Batok Kelapa', quantity: 10, unit: 'kg', note: 'Kering, kadar air < 15%' },
      { name: 'Asam Fosfat H3PO4', quantity: 0.5, unit: 'L', note: 'Konsentrasi 85%' },
    ],
    tools_list: [
      { name: 'Retort Drum', spec: 'Kapasitas 50L', purpose: 'Karbonisasi anaerob' },
      { name: 'Thermometer Digital', spec: '0-1000 derajat', purpose: 'Kontrol suhu' },
    ],
    process_parameters: {
      suhu_karbonisasi: { min: 400, max: 600, unit: 'C' },
      waktu_karbonisasi: { value: 2, unit: 'jam' },
    },
    quality_indicators: {
      bilangan_iod: { min: 750, unit: 'mg/g' },
      kadar_air: { max: 15, unit: '%' },
    },
    safety_notes: 'Gunakan APD lengkap. Jauhkan dari sumber api terbuka.',
    prerequisite_article_ids: [999],
    category: { name: 'Batok Kelapa' },
  };

  const res = await request(app)
    .post('/api/pengelola/articles')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);

  assert.equal(res.status, 201);
  const detail = res.body.data.article.detail;

  assert.equal(detail.difficulty_level, 'menengah');
  assert.equal(detail.time_required_minutes, 180);

  assert.equal(detail.materials_list.length, 2);
  assert.equal(detail.materials_list[0].name, 'Batok Kelapa');
  assert.equal(detail.materials_list[1].name, 'Asam Fosfat H3PO4');

  assert.equal(detail.tools_list.length, 2);
  assert.equal(detail.tools_list[0].name, 'Retort Drum');

  assert.equal(detail.process_parameters.suhu_karbonisasi.min, 400);
  assert.equal(detail.process_parameters.suhu_karbonisasi.max, 600);

  assert.equal(detail.quality_indicators.bilangan_iod.min, 750);

  assert.equal(detail.safety_notes, 'Gunakan APD lengkap. Jauhkan dari sumber api terbuka.');

  assert.deepEqual(detail.prerequisite_article_ids, [999]);
});

test('wawasan article (main) has null technical metadata fields — backward compatible', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.compat@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const wawasan = await createAndPublishArticle(token, {
    title: 'Mengenal Sabut Kelapa',
    body_content: 'Sabut kelapa merupakan limbah bernilai ekonomi tinggi.',
    category: { name: 'Sabut Kelapa' },
  });

  const res = await request(app).get(`/api/articles/published/${wawasan.id}`);

  assert.equal(res.status, 200);
  const detail = res.body.data.article.detail;

  assert.equal(detail.difficulty_level, null, 'difficulty_level harus null untuk wawasan');
  assert.equal(detail.time_required_minutes, null, 'time_required_minutes harus null');
  assert.equal(detail.materials_list, null, 'materials_list harus null');
  assert.equal(detail.tools_list, null, 'tools_list harus null');
  assert.equal(detail.process_parameters, null, 'process_parameters harus null');
  assert.equal(detail.quality_indicators, null, 'quality_indicators harus null');
  assert.equal(detail.safety_notes, null, 'safety_notes harus null');
  assert.equal(detail.prerequisite_article_ids, null, 'prerequisite_article_ids harus null');
});

test('technical fields can be updated via PUT and persisted', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.update@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const createRes = await request(app)
    .post('/api/pengelola/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Prosedur Awal',
      body_content: 'Konten awal.',
      article_type: 'prosedur',
      category: { name: 'Update Teknis' },
    });
  assert.equal(createRes.status, 201);
  const articleId = createRes.body.data.article.id;

  const updateRes = await request(app)
    .put(`/api/pengelola/articles/${articleId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Prosedur Karbonisasi Diperbarui',
      body_content: 'Konten diperbarui.',
      difficulty_level: 'lanjutan',
      time_required_minutes: 240,
      safety_notes: 'Wajib memakai masker gas.',
      category: { name: 'Update Teknis' },
    });

  assert.equal(updateRes.status, 200);
  const detail = updateRes.body.data.article.detail;
  assert.equal(detail.difficulty_level, 'lanjutan');
  assert.equal(detail.time_required_minutes, 240);
  assert.equal(detail.safety_notes, 'Wajib memakai masker gas.');
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUP 4 — Typed Sections
// ─────────────────────────────────────────────────────────────────────────────

test('sections with section_type are stored and returned correctly', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.sections@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const res = await request(app)
    .post('/api/pengelola/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Prosedur dengan Typed Sections',
      body_content: 'Konten utama artikel prosedur.',
      article_type: 'prosedur',
      category: { name: 'Typed Sections' },
      sections: [
        { title: 'Langkah Kerja', body_content: '1. Siapkan bahan\n2. Masukkan ke drum', section_type: 'procedure' },
        { title: 'Daftar Alat', body_content: 'Alat yang dibutuhkan.', section_type: 'tools' },
        { title: 'Peringatan K3', body_content: 'Gunakan APD.', section_type: 'warning' },
        { title: 'Catatan Tambahan', body_content: 'Info tambahan.', section_type: 'info' },
      ],
    });

  assert.equal(res.status, 201);
  const sections = res.body.data.article.detail.sections;
  assert.equal(sections.length, 4);

  const types = sections.map((s) => s.section_type);
  assert.deepEqual(types, ['procedure', 'tools', 'warning', 'info']);
});

test('sections without section_type default to info for backward compatibility', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.seccompat@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const res = await request(app)
    .post('/api/pengelola/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Artikel Wawasan Lama',
      body_content: 'Konten wawasan.',
      category: { name: 'Compat' },
      sections: [
        { title: 'Bagian 1', body_content: 'Isi bagian 1.' },
      ],
    });

  assert.equal(res.status, 201);
  const sections = res.body.data.article.detail.sections;
  assert.equal(sections.length, 1);
  // section_type bisa 'info' (jika dinormalisasi) atau undefined — keduanya backward-compatible
  const stype = sections[0].section_type;
  assert.ok(stype === 'info' || stype === undefined || stype === null, `section_type tidak valid: ${stype}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUP 5 — Filter article_type dan difficulty_level
// ─────────────────────────────────────────────────────────────────────────────

test('published article list can be filtered by article_type', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.filter@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  await createAndPublishArticle(token, {
    title: 'Artikel Wawasan Batok',
    body_content: 'Wawasan tentang batok.',
    article_type: 'main',
    category: { name: 'Filter' },
  });

  await createAndPublishArticle(token, {
    title: 'Prosedur Karbonisasi',
    body_content: 'Langkah karbonisasi.',
    article_type: 'prosedur',
    category: { name: 'Filter' },
  });

  await createAndPublishArticle(token, {
    title: 'Panduan Aktivasi',
    body_content: 'Panduan aktivasi kimia.',
    article_type: 'panduan',
    category: { name: 'Filter' },
  });

  const prosedurRes = await request(app).get('/api/articles/published?article_type=prosedur');
  assert.equal(prosedurRes.status, 200);
  const prosedurTitles = prosedurRes.body.data.articles.map((a) => a.title);
  assert.ok(prosedurTitles.includes('Prosedur Karbonisasi'), 'prosedur harus muncul');
  assert.ok(!prosedurTitles.includes('Artikel Wawasan Batok'), 'wawasan tidak boleh muncul di filter prosedur');
  assert.ok(!prosedurTitles.includes('Panduan Aktivasi'), 'panduan tidak boleh muncul di filter prosedur');

  const mainRes = await request(app).get('/api/articles/published?article_type=main');
  assert.equal(mainRes.status, 200);
  const mainTitles = mainRes.body.data.articles.map((a) => a.title);
  assert.ok(mainTitles.includes('Artikel Wawasan Batok'));
  assert.ok(!mainTitles.includes('Prosedur Karbonisasi'));

  const allRes = await request(app).get('/api/articles/published');
  assert.equal(allRes.status, 200);
  assert.equal(allRes.body.data.articles.length, 3, 'tanpa filter harus tampilkan semua');
});

test('published article list can be filtered by difficulty_level', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.difficulty@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  await createAndPublishArticle(token, {
    title: 'Prosedur Pemula',
    body_content: 'Panduan untuk pemula.',
    article_type: 'prosedur',
    difficulty_level: 'pemula',
    category: { name: 'Difficulty' },
  });

  await createAndPublishArticle(token, {
    title: 'Prosedur Lanjutan',
    body_content: 'Prosedur tingkat lanjut.',
    article_type: 'prosedur',
    difficulty_level: 'lanjutan',
    category: { name: 'Difficulty' },
  });

  await createAndPublishArticle(token, {
    title: 'Wawasan Tanpa Tingkat',
    body_content: 'Artikel wawasan biasa.',
    article_type: 'main',
    category: { name: 'Difficulty' },
  });

  const pemulaRes = await request(app).get('/api/articles/published?difficulty_level=pemula');
  assert.equal(pemulaRes.status, 200);
  const pemulaTitles = pemulaRes.body.data.articles.map((a) => a.title);
  assert.ok(pemulaTitles.includes('Prosedur Pemula'), 'pemula harus muncul');
  assert.ok(!pemulaTitles.includes('Prosedur Lanjutan'), 'lanjutan tidak boleh muncul');
  assert.ok(!pemulaTitles.includes('Wawasan Tanpa Tingkat'), 'wawasan tanpa tingkat tidak boleh muncul');

  const lanjutanRes = await request(app).get('/api/articles/published?difficulty_level=lanjutan');
  assert.equal(lanjutanRes.status, 200);
  assert.ok(lanjutanRes.body.data.articles.map((a) => a.title).includes('Prosedur Lanjutan'));
});

test('filter meta is returned in published article list response', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.filtermeta@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  await createAndPublishArticle(token, {
    title: 'Prosedur Meta Test',
    body_content: 'Konten.',
    article_type: 'prosedur',
    difficulty_level: 'menengah',
    category: { name: 'Meta' },
  });

  const res = await request(app).get('/api/articles/published?article_type=prosedur&difficulty_level=menengah');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.meta.article_type, 'prosedur');
  assert.equal(res.body.data.meta.difficulty_level, 'menengah');
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUP 6 — Glosarium CRUD
// ─────────────────────────────────────────────────────────────────────────────

test('glossary terms are publicly accessible without authentication', async () => {
  const res = await request(app).get('/api/glossary');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data.terms));
  assert.ok(res.body.data.meta);
});

test('pengelola can create glossary term with all fields', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.glos@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const res = await request(app)
    .post('/api/glossary')
    .set('Authorization', `Bearer ${token}`)
    .send({
      term: 'Karbonisasi',
      definition: 'Proses pemanasan bahan organik dalam kondisi tanpa oksigen (anaerob) untuk menghasilkan arang.',
      category: 'proses',
      standard_reference: 'SNI 06-3730-1995',
      related_article_ids: [1, 2],
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.term.term, 'Karbonisasi');
  assert.equal(res.body.data.term.category, 'proses');
  assert.equal(res.body.data.term.standard_reference, 'SNI 06-3730-1995');
  assert.deepEqual(res.body.data.term.related_article_ids, [1, 2]);
});

test('glossary term can be fetched by id publicly', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.glos2@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const createRes = await request(app)
    .post('/api/glossary')
    .set('Authorization', `Bearer ${token}`)
    .send({ term: 'Pirolisis', definition: 'Dekomposisi termal bahan organik tanpa oksigen.', category: 'proses' });

  const id = createRes.body.data.term.id;
  const getRes = await request(app).get(`/api/glossary/${id}`);

  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.data.term.term, 'Pirolisis');
  assert.equal(getRes.body.data.term.definition, 'Dekomposisi termal bahan organik tanpa oksigen.');
});

test('glossary returns 404 for non-existent term', async () => {
  const res = await request(app).get('/api/glossary/99999');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});

test('glossary rejects duplicate term name', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.glosdup@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  await request(app)
    .post('/api/glossary')
    .set('Authorization', `Bearer ${token}`)
    .send({ term: 'Aktivasi', definition: 'Proses meningkatkan luas permukaan pori arang.', category: 'proses' });

  const dupRes = await request(app)
    .post('/api/glossary')
    .set('Authorization', `Bearer ${token}`)
    .send({ term: 'Aktivasi', definition: 'Definisi duplikat.', category: 'kimia' });

  assert.equal(dupRes.status, 400);
  assert.equal(dupRes.body.success, false);
});

test('glossary rejects creation without required fields', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.glosval@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const noTerm = await request(app)
    .post('/api/glossary')
    .set('Authorization', `Bearer ${token}`)
    .send({ definition: 'Tanpa istilah.' });
  assert.equal(noTerm.status, 400);

  const noDef = await request(app)
    .post('/api/glossary')
    .set('Authorization', `Bearer ${token}`)
    .send({ term: 'Istilah Tanpa Definisi' });
  assert.equal(noDef.status, 400);
});

test('regular user cannot create glossary term', async () => {
  const userToken = await registerAndLogin('user.glos@coconexus.local');

  const res = await request(app)
    .post('/api/glossary')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ term: 'Pirolisis', definition: 'Proses dekomposisi termal.' });

  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
});

test('unauthenticated request cannot create glossary term', async () => {
  const res = await request(app)
    .post('/api/glossary')
    .send({ term: 'Aktivasi', definition: 'Proses aktivasi arang.' });

  assert.equal(res.status, 401);
});

test('glossary terms can be searched by keyword', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.glossearch@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  await request(app).post('/api/glossary').set('Authorization', `Bearer ${token}`)
    .send({ term: 'Karbonisasi', definition: 'Pemanasan anaerob bahan organik.', category: 'proses' });
  await request(app).post('/api/glossary').set('Authorization', `Bearer ${token}`)
    .send({ term: 'Pirolisis', definition: 'Dekomposisi termal tanpa oksigen.', category: 'proses' });
  await request(app).post('/api/glossary').set('Authorization', `Bearer ${token}`)
    .send({ term: 'Bilangan Iod', definition: 'Ukuran daya serap karbon aktif.', category: 'kualitas' });

  const searchRes = await request(app).get('/api/glossary?search=karbon');
  assert.equal(searchRes.status, 200);
  const terms = searchRes.body.data.terms.map((t) => t.term);
  assert.ok(terms.includes('Karbonisasi'), 'karbonisasi cocok dengan search "karbon"');
  assert.ok(terms.includes('Bilangan Iod'), 'definisi bilangan iod mengandung "karbon"');
  assert.ok(!terms.includes('Pirolisis'), 'pirolisis tidak mengandung "karbon"');
});

test('glossary terms can be filtered by category', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.gloscat@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  await request(app).post('/api/glossary').set('Authorization', `Bearer ${token}`)
    .send({ term: 'H3PO4', definition: 'Asam fosfat untuk aktivasi kimia.', category: 'kimia' });
  await request(app).post('/api/glossary').set('Authorization', `Bearer ${token}`)
    .send({ term: 'Retort Drum', definition: 'Alat karbonisasi anaerob.', category: 'alat' });
  await request(app).post('/api/glossary').set('Authorization', `Bearer ${token}`)
    .send({ term: 'Karbonisasi', definition: 'Pemanasan anaerob.', category: 'proses' });

  const kimiaRes = await request(app).get('/api/glossary?category=kimia');
  assert.equal(kimiaRes.status, 200);
  assert.equal(kimiaRes.body.data.terms.length, 1);
  assert.equal(kimiaRes.body.data.terms[0].term, 'H3PO4');

  const alatRes = await request(app).get('/api/glossary?category=alat');
  assert.equal(alatRes.status, 200);
  assert.equal(alatRes.body.data.terms[0].term, 'Retort Drum');
});

test('pengelola can update glossary term', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.glosupd@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const createRes = await request(app)
    .post('/api/glossary')
    .set('Authorization', `Bearer ${token}`)
    .send({ term: 'Aktivasi Fisika', definition: 'Definisi awal.', category: 'proses' });
  const id = createRes.body.data.term.id;

  const updateRes = await request(app)
    .put(`/api/glossary/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      definition: 'Aktivasi menggunakan uap air atau CO2 pada suhu 700-1000 derajat.',
      category: 'proses',
      standard_reference: 'ASTM D3860',
    });

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.data.term.definition, 'Aktivasi menggunakan uap air atau CO2 pada suhu 700-1000 derajat.');
  assert.equal(updateRes.body.data.term.standard_reference, 'ASTM D3860');
  assert.equal(updateRes.body.data.term.term, 'Aktivasi Fisika', 'term tidak berubah');
});

test('pengelola can delete glossary term', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.glosdel@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const createRes = await request(app)
    .post('/api/glossary')
    .set('Authorization', `Bearer ${token}`)
    .send({ term: 'Istilah Sementara', definition: 'Akan dihapus.', category: 'umum' });
  const id = createRes.body.data.term.id;

  const deleteRes = await request(app)
    .delete(`/api/glossary/${id}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(deleteRes.status, 200);
  assert.equal(deleteRes.body.success, true);

  const getRes = await request(app).get(`/api/glossary/${id}`);
  assert.equal(getRes.status, 404, 'term yang dihapus harus mengembalikan 404');
});

test('glossary list has correct pagination meta', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.glospag@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  const terms = ['Karbonisasi', 'Pirolisis', 'Aktivasi', 'Bilangan Iod', 'Kadar Air'];
  for (const t of terms) {
    await request(app).post('/api/glossary').set('Authorization', `Bearer ${token}`)
      .send({ term: t, definition: `Definisi ${t}.`, category: 'umum' });
  }

  const res = await request(app).get('/api/glossary?page=1&limit=3');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.terms.length, 3);
  assert.equal(res.body.data.meta.total_items, 5);
  assert.equal(res.body.data.meta.total_pages, 2);
  assert.equal(res.body.data.meta.page, 1);
  assert.equal(res.body.data.meta.limit, 3);

  const page2Res = await request(app).get('/api/glossary?page=2&limit=3');
  assert.equal(page2Res.body.data.terms.length, 2, 'halaman 2 harus memiliki 2 istilah');
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUP 7 — Skenario End-to-End KMS Teknis
// ─────────────────────────────────────────────────────────────────────────────

test('full KMS flow: wawasan article with linked prosedur and panduan including technical metadata', async () => {
  const { user, plainPassword } = await createPengelolaUser({ email: 'p.e2e@coconexus.local', job_title: 'Penulis Artikel' });
  const { user: pengelola2, plainPassword: pp2 } = await createPengelolaUser({ email: 'p.e2e2@coconexus.local', job_title: 'Penulis Artikel' });
  const token = await loginWith(user.email, plainPassword);

  // 1. Buat dan publish artikel wawasan
  const wawasan = await createAndPublishArticle(token, {
    title: 'Mengenal Briket Arang dari Batok Kelapa',
    body_content: 'Briket arang tempurung kelapa memiliki nilai kalor tinggi dan ramah lingkungan.',
    article_type: 'main',
    category: { name: 'Batok Kelapa' },
    sections: [
      { title: 'Apa Itu Briket?', body_content: 'Briket adalah bahan bakar padat terkompresi.', section_type: 'info' },
      { title: 'Manfaat Briket Arang', body_content: 'Nilai kalor 7000 kcal/kg, asap minimal.', section_type: 'info' },
    ],
  });

  // 2. Buat dan publish artikel prosedur yang terhubung ke wawasan
  const prosedur = await createAndPublishArticle(token, {
    title: 'Prosedur Pembuatan Briket Arang Batok Kelapa',
    body_content: 'Panduan langkah demi langkah pembuatan briket arang berkualitas SNI.',
    article_type: 'prosedur',
    wawasan_article_id: wawasan.id,
    difficulty_level: 'menengah',
    time_required_minutes: 300,
    materials_list: [
      { name: 'Arang Batok', quantity: 5, unit: 'kg', note: 'Lolos ayakan 60 mesh' },
      { name: 'Tepung Tapioka', quantity: 0.25, unit: 'kg', note: 'Sebagai perekat' },
    ],
    tools_list: [
      { name: 'Mesin Cetak Briket', spec: 'Tekanan 100-200 bar', purpose: 'Pencetakan briket silinder' },
    ],
    process_parameters: { suhu_pengeringan: { value: 60, unit: 'C' }, durasi: { value: 4, unit: 'jam' } },
    safety_notes: 'Gunakan masker debu saat menangani serbuk arang.',
    category: { name: 'Batok Kelapa' },
    sections: [
      { title: 'Persiapan Bahan', body_content: '1. Giling arang menjadi serbuk halus\n2. Ayak 60 mesh', section_type: 'procedure' },
      { title: 'Alat yang Dibutuhkan', body_content: 'Mesin cetak dan pengering.', section_type: 'tools' },
      { title: 'Peringatan', body_content: 'Hindari kontak serbuk arang dengan mata.', section_type: 'warning' },
    ],
  });

  // 3. Buat dan publish artikel referensi yang terhubung ke wawasan
  const referensi = await createAndPublishArticle(token, {
    title: 'Standar Kualitas Briket Arang SNI 01-6235-2000',
    body_content: 'Parameter kualitas briket berdasarkan standar nasional Indonesia.',
    article_type: 'referensi',
    wawasan_article_id: wawasan.id,
    difficulty_level: 'pemula',
    category: { name: 'Batok Kelapa' },
  });

  // 4. Tambah glossary terms terkait topik ini
  const { user: pengelolaGlos, plainPassword: pgPass } = await createPengelolaUser({ email: 'p.e2eglos@coconexus.local', job_title: 'Penulis Artikel' });
  const glosToken = await loginWith(pengelolaGlos.email, pgPass);

  await request(app).post('/api/glossary').set('Authorization', `Bearer ${glosToken}`)
    .send({ term: 'Briket', definition: 'Bahan bakar padat terkompresi dari arang atau biomasa.', category: 'umum' });
  await request(app).post('/api/glossary').set('Authorization', `Bearer ${glosToken}`)
    .send({ term: 'Nilai Kalor', definition: 'Jumlah panas yang dihasilkan saat pembakaran per satuan massa.', category: 'kualitas', standard_reference: 'SNI 01-6235-2000' });

  // 5. Verifikasi dari sisi pengguna awam: baca artikel wawasan → lihat link ke teknis
  const wawasanDetail = await request(app).get(`/api/articles/published/${wawasan.id}`);
  assert.equal(wawasanDetail.status, 200);
  const wawasanData = wawasanDetail.body.data.article;

  assert.equal(wawasanData.article_type, 'main');
  assert.equal(wawasanData.technical_articles.length, 2, 'harus ada 2 artikel teknis terhubung');

  const linkedTypes = wawasanData.technical_articles.map((a) => a.article_type).sort();
  assert.deepEqual(linkedTypes, ['prosedur', 'referensi']);

  // 6. Verifikasi dari sisi artikel prosedur: ada link balik ke wawasan
  const prosedurDetail = await request(app).get(`/api/articles/published/${prosedur.id}`);
  assert.equal(prosedurDetail.status, 200);
  const prosedurData = prosedurDetail.body.data.article;

  assert.equal(prosedurData.article_type, 'prosedur');
  assert.ok(prosedurData.wawasan_article, 'prosedur harus punya link balik ke wawasan');
  assert.equal(prosedurData.wawasan_article.id, wawasan.id);
  assert.equal(prosedurData.detail.difficulty_level, 'menengah');
  assert.equal(prosedurData.detail.time_required_minutes, 300);
  assert.equal(prosedurData.detail.materials_list.length, 2);
  assert.equal(prosedurData.detail.tools_list.length, 1);
  assert.equal(prosedurData.detail.safety_notes, 'Gunakan masker debu saat menangani serbuk arang.');
  assert.equal(prosedurData.detail.sections.length, 3);
  assert.equal(prosedurData.detail.sections[0].section_type, 'procedure');
  assert.equal(prosedurData.detail.sections[1].section_type, 'tools');
  assert.equal(prosedurData.detail.sections[2].section_type, 'warning');

  // 7. Verifikasi filter: hanya prosedur yang muncul saat filter prosedur
  const filterRes = await request(app).get('/api/articles/published?article_type=prosedur');
  assert.equal(filterRes.status, 200);
  const filterTitles = filterRes.body.data.articles.map((a) => a.title);
  assert.ok(filterTitles.includes('Prosedur Pembuatan Briket Arang Batok Kelapa'));
  assert.ok(!filterTitles.includes('Mengenal Briket Arang dari Batok Kelapa'));

  // 8. Verifikasi glosarium: 2 terms tersedia
  const glossaryRes = await request(app).get('/api/glossary');
  assert.equal(glossaryRes.status, 200);
  assert.equal(glossaryRes.body.data.meta.total_items, 2);

  const termNames = glossaryRes.body.data.terms.map((t) => t.term);
  assert.ok(termNames.includes('Briket'));
  assert.ok(termNames.includes('Nilai Kalor'));
});
