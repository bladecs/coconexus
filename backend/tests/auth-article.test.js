'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coconexus';
process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || '10000';
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10000';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const {
  sequelize,
  Category,
  Article,
  ArticleDetail,
  ArticleMedia,
  ArticleView,
  ProductCard,
  Comment,
  DiscussionForum,
  User,
  UserProfile,
} = require('../models');
const {
  resetTestDatabase,
  createAdminUser,
  createPengelolaUser,
  createModeratorUser,
} = require('./helpers/testDb');

async function loginWith(email, password) {
  return request(app)
    .post('/api/auth/login')
    .send({ email, password });
}

async function createModerator(email, moderatorType, overrides = {}) {
  const { user, plainPassword } = await createModeratorUser({ email, moderator_type: moderatorType, ...overrides });
  const loginResponse = await loginWith(user.email, plainPassword);
  return { user, token: loginResponse.body.data.token };
}

test.beforeEach(async () => {
  await resetTestDatabase();
});

test.after(async () => {
  await sequelize.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth dasar (tidak terpengaruh redesain role)
// ─────────────────────────────────────────────────────────────────────────────

test('public register ignores requested admin role and creates regular user', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'calon.admin@coconexus.local',
      password: 'User12345',
      full_name: 'Calon Admin',
      role: 'admin',
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.data.user.role, 'user');

  const createdUser = await sequelize.models.User.findOne({
    where: { email: 'calon.admin@coconexus.local' },
  });

  assert.equal(createdUser.role, 'user');
});

test('regular user cannot access admin dashboard stats', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({
      email: 'user.biasa@coconexus.local',
      password: 'User12345',
      full_name: 'User Biasa',
    });

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'user.biasa@coconexus.local',
      password: 'User12345',
    });

  const statsResponse = await request(app)
    .get('/api/admin/stats')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

  assert.equal(statsResponse.status, 403);
});

test('regular user cannot create article', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({
      email: 'penulis.biasa@coconexus.local',
      password: 'User12345',
      full_name: 'Penulis Biasa',
    });

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'penulis.biasa@coconexus.local',
      password: 'User12345',
    });

  const createResponse = await request(app)
    .post('/api/articles')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
    .send({
      title: 'Artikel dari User Biasa',
      body_content: 'Konten tidak semestinya bisa dibuat oleh user umum.',
      category: {
        name: 'Uji Akses',
      },
    });

  assert.equal(createResponse.status, 403);
  assert.equal(createResponse.body.success, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// Kurator Konten (moderator, sub-tipe content) — authoring
// ─────────────────────────────────────────────────────────────────────────────

test('kurator konten can create and fetch article', async () => {
  const { token } = await createModerator('kurator.konten@coconexus.local', 'content');

  const createResponse = await request(app)
    .post('/api/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Artikel Kurator Konten',
      body_content: 'Konten artikel dari kurator konten.',
      meta_description: 'Ringkasan artikel kurator konten.',
      status: 'draft',
      category: {
        name: 'Alur Kurator',
      },
    });

  const detailResponse = await request(app)
    .get(`/api/moderator/content/articles/${createResponse.body.data.article.id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(createResponse.status, 201);
  assert.equal(detailResponse.status, 200);
  assert.equal(detailResponse.body.data.article.title, 'Artikel Kurator Konten');
});

test('kurator konten cannot create article without body content', async () => {
  const { token } = await createModerator('kurator.validasi@coconexus.local', 'content');

  const createResponse = await request(app)
    .post('/api/moderator/content/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Artikel Tanpa Konten',
      category: {
        name: 'Validasi Konten',
      },
    });

  assert.equal(createResponse.status, 400);
});

test('kurator konten can upload article media file', async () => {
  const { token } = await createModerator('kurator.upload.file@coconexus.local', 'content');

  const uploadResponse = await request(app)
    .post('/api/uploads/articles')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', Buffer.from('fake image data'), 'integration-image.png');

  assert.equal(uploadResponse.status, 201);
  assert.equal(uploadResponse.body.data.media.media_type, 'image');
  assert.match(uploadResponse.body.data.media.file_path, /^\/uploads\/articles\//);
});

test('kurator konten cannot upload unsupported article media type', async () => {
  const { token } = await createModerator('kurator.upload@coconexus.local', 'content');

  const uploadResponse = await request(app)
    .post('/api/uploads/articles')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', Buffer.from('fake executable data'), {
      filename: 'malware.exe',
      contentType: 'application/x-msdownload',
    });

  assert.equal(uploadResponse.status, 400);
  assert.equal(uploadResponse.body.success, false);
});

test('kurator konten can login and create draft article with auto-created category', async () => {
  const { token } = await createModerator('kurator.integrasi@coconexus.local', 'content');

  const createResponse = await request(app)
    .post('/api/moderator/content/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Artikel Uji Integrasi',
      body_content: 'Isi artikel untuk pengujian backend end-to-end.',
      meta_description: 'Ringkasan artikel uji.',
      status: 'draft',
      category: {
        name: 'Pengolahan Sabut',
        description: 'Kategori untuk pengujian otomatis.',
      },
      media: [
        {
          file_path: '/uploads/articles/sample-image.jpg',
          media_type: 'image',
        },
      ],
    });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.data.article.status, 'draft');
  assert.equal(createResponse.body.data.article.category.name, 'Pengolahan Sabut');

  const category = await Category.findOne({ where: { name: 'Pengolahan Sabut' } });
  const article = await Article.findByPk(createResponse.body.data.article.id);
  const detail = await ArticleDetail.findOne({ where: { article_id: article.id } });
  const media = await ArticleMedia.findAll({ where: { article_id: article.id } });

  assert.ok(category);
  assert.ok(article);
  assert.ok(detail);
  assert.equal(media.length, 1);
});

test('kurator konten can create article with dynamic product cards', async () => {
  const { token } = await createModerator('kurator.product.card@coconexus.local', 'content');

  const createResponse = await request(app)
    .post('/api/moderator/content/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Batok Kelapa',
      body_content: 'Artikel utama batok kelapa.',
      meta_description: 'Batok kelapa dan produk turunannya.',
      status: 'draft',
      category: {
        name: 'Limbah Kelapa',
      },
      product_cards: [
        {
          title: 'Arang',
          description: 'Produk arang tempurung kelapa.',
          image: '/uploads/articles/arang-card.jpg',
        },
        {
          title: 'Filter Air',
          description: 'Media filter berbasis karbon aktif.',
          image: '/uploads/articles/filter-card.jpg',
        },
      ],
    });

  assert.equal(createResponse.status, 201);
  assert.deepEqual(
    createResponse.body.data.article.product_cards.map((item) => item.title),
    ['Arang', 'Filter Air']
  );

  const createdCards = await ProductCard.findAll({
    where: { article_id: createResponse.body.data.article.id },
    order: [['created_at', 'ASC']],
  });

  assert.equal(createdCards.length, 2);
  assert.equal(createdCards[0].title, 'Arang');
  assert.equal(createdCards[1].title, 'Filter Air');
});

test('kurator konten can create detail article linked to selected product card', async () => {
  const { user, token } = await createModerator('kurator.detail.link@coconexus.local', 'content');

  const category = await Category.create({
    name: 'Kategori Linking',
    description: 'Kategori linking',
  });

  const mainArticle = await Article.create({
    author_id: user.id,
    category_id: category.id,
    title: 'Batok Kelapa',
    status: 'published',
  });

  await ArticleDetail.create({
    article_id: mainArticle.id,
    body_content: 'Konten utama.',
    meta_description: 'Konten utama.',
  });

  const productCard = await ProductCard.create({
    article_id: mainArticle.id,
    title: 'Arang',
    description: 'Card arang',
    image: '/uploads/articles/arang.jpg',
  });

  const response = await request(app)
    .post('/api/moderator/content/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Arang Tempurung Kelapa',
      body_content: 'Konten detail arang.',
      meta_description: 'Detail arang.',
      status: 'draft',
      parent_article_id: mainArticle.id,
      linked_product_card_id: productCard.id,
      category: {
        id: category.id,
      },
      product_cards: [],
      media: [],
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.data.article.parent_article_id, mainArticle.id);
  assert.equal(response.body.data.article.article_type, 'detail');
  assert.equal(response.body.data.article.linked_product_card.id, productCard.id);

  const linkedCard = await ProductCard.findByPk(productCard.id);
  assert.equal(linkedCard.linked_article_id, response.body.data.article.id);
});

test('kurator konten can update unlinked product cards from article editor', async () => {
  const { user, token } = await createModerator('kurator.update.cards@coconexus.local', 'content');

  const category = await Category.create({
    name: 'Kategori Update Card',
    description: 'Kategori update',
  });

  const article = await Article.create({
    author_id: user.id,
    category_id: category.id,
    title: 'Artikel Produk Turunan',
    status: 'draft',
  });

  await ArticleDetail.create({
    article_id: article.id,
    body_content: 'Konten awal.',
    meta_description: 'Meta awal.',
  });

  await ProductCard.bulkCreate([
    {
      article_id: article.id,
      title: 'Arang Lama',
      description: 'Deskripsi lama.',
      image: '/uploads/articles/arang-lama.jpg',
    },
    {
      article_id: article.id,
      title: 'Briket Lama',
      description: 'Briket lama.',
      image: '/uploads/articles/briket-lama.jpg',
    },
  ]);

  const updateResponse = await request(app)
    .put(`/api/moderator/content/articles/${article.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Artikel Produk Turunan',
      body_content: 'Konten awal.',
      meta_description: 'Meta awal.',
      category: {
        id: category.id,
      },
      product_cards: [
        {
          title: 'Arang Baru',
          description: 'Deskripsi arang baru.',
          image: '/uploads/articles/arang-baru.jpg',
        },
      ],
    });

  assert.equal(updateResponse.status, 200);
  assert.deepEqual(
    updateResponse.body.data.article.product_cards.map((item) => item.title),
    ['Arang Baru']
  );

  const updatedCards = await ProductCard.findAll({
    where: { article_id: article.id },
  });

  assert.equal(updatedCards.length, 1);
  assert.equal(updatedCards[0].title, 'Arang Baru');
});

// ─────────────────────────────────────────────────────────────────────────────
// Redaktur Publikasi (moderator, sub-tipe publication) — satu-satunya gerbang publish
// ─────────────────────────────────────────────────────────────────────────────

test('redaktur publikasi can publish draft article created by kurator konten', async () => {
  const { token: contentToken } = await createModerator('kurator.publish.flow@coconexus.local', 'content');
  const { token: publisherToken } = await createModerator('redaktur.publish.flow@coconexus.local', 'publication');

  const createResponse = await request(app)
    .post('/api/articles')
    .set('Authorization', `Bearer ${contentToken}`)
    .send({
      title: 'Artikel Publish Flow',
      body_content: 'Konten artikel publish flow.',
      meta_description: 'Ringkasan publish flow.',
      status: 'draft',
      article_type: 'panduan',
      category: {
        name: 'Publish Flow',
      },
    });

  const publishResponse = await request(app)
    .patch(`/api/articles/${createResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${publisherToken}`)
    .send({
      status: 'published',
    });

  const publishedDetailResponse = await request(app).get(
    `/api/articles/published/${createResponse.body.data.article.id}`
  );

  assert.equal(createResponse.status, 201);
  assert.equal(publishResponse.status, 200);
  assert.equal(publishResponse.body.data.article.status, 'published');
  assert.equal(publishedDetailResponse.status, 200);
  assert.equal(publishedDetailResponse.body.data.article.status, 'published');
});

test('kurator konten cannot publish artikelnya sendiri — wajib lewat redaktur publikasi', async () => {
  const { token } = await createModerator('kurator.selfpublish@coconexus.local', 'content');

  const createResponse = await request(app)
    .post('/api/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Draft Kurator',
      body_content: 'Konten kurator.',
      meta_description: 'Meta kurator.',
      status: 'draft',
      category: {
        name: 'Kurator Uji',
      },
    });

  const publishResponse = await request(app)
    .patch(`/api/articles/${createResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      status: 'published',
    });

  assert.equal(createResponse.status, 201);
  assert.equal(publishResponse.status, 403, 'kurator konten tidak boleh mempublikasikan artikel sendiri');
});

test('redaktur publikasi cannot create article — wajib lewat kurator konten', async () => {
  const { token } = await createModerator('redaktur.nocreate@coconexus.local', 'publication');

  const createResponse = await request(app)
    .post('/api/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Artikel dari Redaktur',
      body_content: 'Redaktur publikasi tidak semestinya bisa membuat artikel.',
      category: {
        name: 'Redaktur Uji',
      },
    });

  assert.equal(createResponse.status, 403);
});

test('pengelola cannot publish or create article — peran monitoring saja', async () => {
  const { user: pengelolaUser, plainPassword } = await createPengelolaUser({
    email: 'pengelola.monitoring@coconexus.local',
  });
  const loginResponse = await loginWith(pengelolaUser.email, plainPassword);
  const token = loginResponse.body.data.token;

  const createResponse = await request(app)
    .post('/api/articles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Artikel dari Pengelola',
      body_content: 'Pengelola tidak lagi bisa membuat artikel.',
      category: { name: 'Pengelola Uji' },
    });
  assert.equal(createResponse.status, 403, 'pengelola tidak boleh membuat artikel');

  const category = await Category.create({ name: 'Monitoring Only', description: 'Uji akses' });
  const article = await Article.create({
    author_id: pengelolaUser.id,
    category_id: category.id,
    title: 'Draft Untuk Uji Monitoring',
    status: 'draft',
  });
  await ArticleDetail.create({ article_id: article.id, body_content: 'Konten.', meta_description: 'Meta.' });

  const publishResponse = await request(app)
    .patch(`/api/articles/${article.id}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'published' });
  assert.equal(publishResponse.status, 403, 'pengelola tidak boleh mempublikasikan artikel');

  const monitoringResponse = await request(app)
    .get('/api/pengelola/articles')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(monitoringResponse.status, 200, 'pengelola tetap bisa memantau (read-only)');
});

test('redaktur publikasi can return published article to revision, kurator konten continues versioned edits', async () => {
  const { token: contentToken } = await createModerator('kurator.revision.flow@coconexus.local', 'content');
  const { token: publisherToken } = await createModerator('redaktur.revision.flow@coconexus.local', 'publication');

  const createResponse = await request(app)
    .post('/api/moderator/content/articles')
    .set('Authorization', `Bearer ${contentToken}`)
    .send({
      title: 'Artikel Revision Flow',
      body_content: 'Konten awal artikel revision flow.',
      meta_description: 'Ringkasan revision flow.',
      status: 'draft',
      article_type: 'panduan',
      category: {
        name: 'Revision Flow',
      },
    });

  const publishResponse = await request(app)
    .patch(`/api/moderator/publication/articles/${createResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${publisherToken}`)
    .send({
      status: 'published',
    });

  const revisionResponse = await request(app)
    .patch(`/api/moderator/publication/articles/${createResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${publisherToken}`)
    .send({
      status: 'revision',
    });

  const updateResponse = await request(app)
    .put(`/api/moderator/content/articles/${createResponse.body.data.article.id}`)
    .set('Authorization', `Bearer ${contentToken}`)
    .send({
      title: 'Artikel Revision Flow Diperbarui',
      body_content: 'Konten yang sudah direvisi.',
      meta_description: 'Ringkasan revisi.',
      status: 'revision',
    });

  assert.equal(createResponse.status, 201);
  assert.equal(publishResponse.status, 200);
  assert.equal(publishResponse.body.data.article.status, 'published');
  assert.equal(publishResponse.body.data.article.version, 2);
  assert.equal(revisionResponse.status, 200);
  assert.equal(revisionResponse.body.data.article.status, 'revision');
  assert.equal(revisionResponse.body.data.article.version, 3);
  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.data.article.status, 'revision');
  assert.equal(updateResponse.body.data.article.version, 4);
  assert.equal(updateResponse.body.data.article.title, 'Artikel Revision Flow Diperbarui');
});

test('redaktur publikasi can publish a selected historical version', async () => {
  const { token: contentToken } = await createModerator('kurator.version.pick@coconexus.local', 'content');
  const { token: publisherToken } = await createModerator('redaktur.version.pick@coconexus.local', 'publication');

  const createResponse = await request(app)
    .post('/api/moderator/content/articles')
    .set('Authorization', `Bearer ${contentToken}`)
    .send({
      title: 'Versi Awal Dipilih',
      body_content: 'Konten versi awal.',
      category: {
        name: 'Version Pick',
      },
    });

  const updateResponse = await request(app)
    .put(`/api/moderator/content/articles/${createResponse.body.data.article.id}`)
    .set('Authorization', `Bearer ${contentToken}`)
    .send({
      title: 'Versi Revisi',
      body_content: 'Konten versi revisi.',
      status: 'revision',
    });

  const versionsResponse = await request(app)
    .get(`/api/moderator/publication/articles/${createResponse.body.data.article.id}/versions`)
    .set('Authorization', `Bearer ${publisherToken}`);

  const publishSelectedResponse = await request(app)
    .post(`/api/moderator/publication/articles/${createResponse.body.data.article.id}/versions/1/publish`)
    .set('Authorization', `Bearer ${publisherToken}`);

  const detailResponse = await request(app)
    .get(`/api/moderator/content/articles/${createResponse.body.data.article.id}`)
    .set('Authorization', `Bearer ${contentToken}`);

  assert.equal(createResponse.status, 201);
  assert.equal(updateResponse.status, 200);
  assert.equal(versionsResponse.status, 200);
  assert.equal(versionsResponse.body.data.versions[0].version_number, 2);
  assert.equal(versionsResponse.body.data.versions[1].version_number, 1);
  assert.equal(publishSelectedResponse.status, 200);
  assert.equal(publishSelectedResponse.body.data.article.status, 'published');
  assert.equal(publishSelectedResponse.body.data.article.title, 'Versi Awal Dipilih');
  assert.equal(detailResponse.body.data.article.status, 'published');
  assert.equal(detailResponse.body.data.article.title, 'Versi Awal Dipilih');
  assert.equal(detailResponse.body.data.article.version, 3);
});

test('redaktur publikasi can publish draft article written by another kurator konten', async () => {
  const { token: writerToken } = await createModerator('kurator.publish2@coconexus.local', 'content');
  const { token: publisherToken } = await createModerator('redaktur.publish2@coconexus.local', 'publication');

  const createResponse = await request(app)
    .post('/api/articles')
    .set('Authorization', `Bearer ${writerToken}`)
    .send({
      title: 'Draft Untuk Publish',
      body_content: 'Konten yang akan dipublish redaktur.',
      meta_description: 'Meta publish.',
      status: 'draft',
      article_type: 'panduan',
      category: {
        name: 'Redaktur Uji',
      },
    });

  const publishResponse = await request(app)
    .patch(`/api/articles/${createResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${publisherToken}`)
    .send({
      status: 'published',
    });

  assert.equal(publishResponse.status, 200);
  assert.equal(publishResponse.body.data.article.status, 'published');
});

test('redaktur publikasi can publish draft article regardless of original author', async () => {
  const { user: adminUser } = await createAdminUser();
  const { token: publisherToken } = await createModerator('redaktur.lain@coconexus.local', 'publication');

  const category = await Category.create({
    name: 'Artikel Milik Admin',
    description: 'Kategori pengujian kepemilikan.',
  });

  const ownedByAdmin = await Article.create({
    author_id: adminUser.id,
    category_id: category.id,
    title: 'Draft Admin',
    status: 'draft',
    article_type: 'panduan',
  });

  await ArticleDetail.create({
    article_id: ownedByAdmin.id,
    body_content: 'Konten draft admin.',
    meta_description: 'Draft admin.',
  });

  const publishResponse = await request(app)
    .patch(`/api/articles/${ownedByAdmin.id}/status`)
    .set('Authorization', `Bearer ${publisherToken}`)
    .send({
      status: 'published',
    });

  assert.equal(publishResponse.status, 200);
  assert.equal(publishResponse.body.success, true);
});

test('redaktur publikasi can publish draft article from validation endpoint', async () => {
  const { token: writerToken } = await createModerator('kurator.publish.endpoint@coconexus.local', 'content');
  const { token: publisherToken } = await createModerator('redaktur.publish.endpoint@coconexus.local', 'publication');

  const createResponse = await request(app)
    .post('/api/moderator/content/articles')
    .set('Authorization', `Bearer ${writerToken}`)
    .send({
      title: 'Artikel Publish Test',
      body_content: 'Konten publish test.',
      article_type: 'panduan',
      category: {
        name: 'Tempurung Kelapa',
      },
    });

  const publishResponse = await request(app)
    .patch(`/api/articles/${createResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${publisherToken}`)
    .send({
      status: 'published',
    });

  assert.equal(publishResponse.status, 200);
  assert.equal(publishResponse.body.data.article.status, 'published');
});

// ─────────────────────────────────────────────────────────────────────────────
// Penata Taksonomi (moderator, sub-tipe tag) — CRUD kategori & tag
// ─────────────────────────────────────────────────────────────────────────────

test('penata taksonomi can manage categories', async () => {
  const { token } = await createModerator('penata.taksonomi@coconexus.local', 'tag');

  const createCategoryResponse = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Kategori Job Test',
    });

  assert.equal(createCategoryResponse.status, 201);
});

test('kurator konten cannot manage categories — wewenang penata taksonomi', async () => {
  const { token } = await createModerator('kurator.nocat@coconexus.local', 'content');

  const response = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Kategori Dilarang',
    });

  assert.equal(response.status, 403);
});

test('penata taksonomi can create category and duplicate category is rejected', async () => {
  const { token } = await createModerator('penata.duplicate@coconexus.local', 'tag');

  const createResponse = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Kategori Sabut',
      description: 'Pengolahan limbah sabut kelapa.',
    });

  const duplicateResponse = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Kategori Sabut',
      description: 'Duplikat kategori.',
    });

  assert.equal(createResponse.status, 201);
  assert.equal(duplicateResponse.status, 409);
});

test('penata taksonomi cannot delete category that is still used by article', async () => {
  const { user, token } = await createModerator('penata.delete@coconexus.local', 'tag');

  const category = await Category.create({
    name: 'Kategori Terpakai',
    description: 'Kategori yang masih digunakan artikel.',
  });

  await Article.create({
    author_id: user.id,
    category_id: category.id,
    title: 'Artikel Pemakai Kategori',
    status: 'draft',
  });

  const deleteResponse = await request(app)
    .delete(`/api/categories/${category.id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(deleteResponse.status, 409);
});

// ─────────────────────────────────────────────────────────────────────────────
// Fasilitator Diskusi (moderator, sub-tipe forum) & komentar
// ─────────────────────────────────────────────────────────────────────────────

test('fasilitator diskusi can access comment management while kurator konten cannot', async () => {
  const { token: forumToken } = await createModerator('fasilitator.comment@coconexus.local', 'forum');
  const { token: contentToken } = await createModerator('kurator.comment@coconexus.local', 'content');

  const moderatorResponse = await request(app)
    .get('/api/comments?status=pending')
    .set('Authorization', `Bearer ${forumToken}`);

  const writerResponse = await request(app)
    .get('/api/comments?status=pending')
    .set('Authorization', `Bearer ${contentToken}`);

  assert.equal(moderatorResponse.status, 200);
  assert.equal(writerResponse.status, 403);
});

test('user cannot comment on draft article', async () => {
  const { token: writerToken } = await createModerator('kurator.draft.comment@coconexus.local', 'content');

  await request(app)
    .post('/api/auth/register')
    .send({
      email: 'komentator@coconexus.local',
      password: 'User12345',
      full_name: 'User Komentator',
    });

  const userLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'komentator@coconexus.local',
      password: 'User12345',
    });

  const createArticleResponse = await request(app)
    .post('/api/moderator/content/articles')
    .set('Authorization', `Bearer ${writerToken}`)
    .send({
      title: 'Artikel Masih Draft',
      body_content: 'Konten belum dipublikasikan.',
      category: {
        name: 'Komentar Draft',
      },
    });

  const commentResponse = await request(app)
    .post(`/api/articles/${createArticleResponse.body.data.article.id}/comments`)
    .set('Authorization', `Bearer ${userLoginResponse.body.data.token}`)
    .send({
      body: 'Komentar pada artikel draft.',
    });

  assert.equal(commentResponse.status, 404);
});

test('user cannot submit empty comment on published article', async () => {
  const { token: writerToken } = await createModerator('kurator.comment.empty@coconexus.local', 'content');
  const { token: publisherToken } = await createModerator('redaktur.comment.empty@coconexus.local', 'publication');

  await request(app)
    .post('/api/auth/register')
    .send({
      email: 'komentar.kosong@coconexus.local',
      password: 'User12345',
      full_name: 'Komentar Kosong',
    });

  const userLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'komentar.kosong@coconexus.local',
      password: 'User12345',
    });

  const createArticleResponse = await request(app)
    .post('/api/moderator/content/articles')
    .set('Authorization', `Bearer ${writerToken}`)
    .send({
      title: 'Artikel Untuk Komentar',
      body_content: 'Konten artikel sudah siap dipublikasikan.',
      article_type: 'panduan',
      category: {
        name: 'Komentar Kosong',
      },
    });

  const publishResponse = await request(app)
    .patch(`/api/moderator/publication/articles/${createArticleResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${publisherToken}`)
    .send({
      status: 'published',
    });
  assert.equal(publishResponse.status, 200);

  const commentResponse = await request(app)
    .post(`/api/articles/${createArticleResponse.body.data.article.id}/comments`)
    .set('Authorization', `Bearer ${userLoginResponse.body.data.token}`)
    .send({
      body: '   ',
    });

  assert.equal(commentResponse.status, 400);
  assert.equal(commentResponse.body.success, false);
});

test('pending comments are hidden until fasilitator diskusi approves them', async () => {
  const { token: writerToken } = await createModerator('kurator.pending.article@coconexus.local', 'content');
  const { token: publisherToken } = await createModerator('redaktur.pending.article@coconexus.local', 'publication');
  const { token: forumToken } = await createModerator('fasilitator.pending.queue@coconexus.local', 'forum');

  await request(app).post('/api/auth/register').send({
    email: 'commenter.pending@coconexus.local',
    password: 'User12345',
    full_name: 'Commenter Pending',
  });
  const commenterLoginResponse = await loginWith('commenter.pending@coconexus.local', 'User12345');

  const createArticleResponse = await request(app)
    .post('/api/moderator/content/articles')
    .set('Authorization', `Bearer ${writerToken}`)
    .send({
      title: 'Artikel Moderasi Komentar',
      body_content: 'Artikel untuk menguji alur moderasi komentar.',
      article_type: 'panduan',
      category: {
        name: 'Moderasi Komentar',
      },
    });

  await request(app)
    .patch(`/api/moderator/publication/articles/${createArticleResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${publisherToken}`)
    .send({
      status: 'published',
    });

  const commentResponse = await request(app)
    .post(`/api/articles/${createArticleResponse.body.data.article.id}/comments`)
    .set('Authorization', `Bearer ${commenterLoginResponse.body.data.token}`)
    .send({
      body: 'Komentar yang masih pending moderasi.',
    });

  const publicDetailBeforeModeration = await request(app).get(
    `/api/articles/published/${createArticleResponse.body.data.article.id}`
  );

  const queueResponse = await request(app)
    .get('/api/moderator/forum/comments?status=pending')
    .set('Authorization', `Bearer ${forumToken}`);

  const approveResponse = await request(app)
    .patch(`/api/moderator/forum/comments/${commentResponse.body.data.comment.id}/status`)
    .set('Authorization', `Bearer ${forumToken}`)
    .send({
      status: 'approved',
    });

  const publicDetailAfterModeration = await request(app).get(
    `/api/articles/published/${createArticleResponse.body.data.article.id}`
  );

  assert.equal(commentResponse.status, 201);
  assert.equal(commentResponse.body.data.comment.status, 'pending');
  assert.equal(publicDetailBeforeModeration.body.data.article.comments.length, 0);
  assert.equal(queueResponse.status, 200);
  assert.equal(queueResponse.body.data.comments[0].status, 'pending');
  assert.equal(approveResponse.status, 200);
  assert.equal(approveResponse.body.data.comment.status, 'approved');
  assert.equal(publicDetailAfterModeration.body.data.article.comments.length, 1);
  assert.equal(publicDetailAfterModeration.body.data.article.comments[0].body, 'Komentar yang masih pending moderasi.');
});

test('fasilitator diskusi can reject comment and it stays hidden publicly', async () => {
  const { token: writerToken } = await createModerator('kurator.reject.article@coconexus.local', 'content');
  const { token: publisherToken } = await createModerator('redaktur.reject.article@coconexus.local', 'publication');
  const { token: forumToken } = await createModerator('fasilitator.reject@coconexus.local', 'forum');

  await request(app).post('/api/auth/register').send({
    email: 'commenter.reject@coconexus.local',
    password: 'User12345',
    full_name: 'Commenter Reject',
  });
  const commenterLoginResponse = await loginWith('commenter.reject@coconexus.local', 'User12345');

  const createArticleResponse = await request(app)
    .post('/api/moderator/content/articles')
    .set('Authorization', `Bearer ${writerToken}`)
    .send({
      title: 'Artikel Moderasi Tolak',
      body_content: 'Artikel untuk menguji penolakan komentar.',
      article_type: 'panduan',
      category: {
        name: 'Moderasi Tolak',
      },
    });

  await request(app)
    .patch(`/api/moderator/publication/articles/${createArticleResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${publisherToken}`)
    .send({
      status: 'published',
    });

  const commentResponse = await request(app)
    .post(`/api/articles/${createArticleResponse.body.data.article.id}/comments`)
    .set('Authorization', `Bearer ${commenterLoginResponse.body.data.token}`)
    .send({
      body: 'Komentar yang akan ditolak.',
    });

  const rejectResponse = await request(app)
    .patch(`/api/moderator/forum/comments/${commentResponse.body.data.comment.id}/status`)
    .set('Authorization', `Bearer ${forumToken}`)
    .send({
      status: 'rejected',
    });

  const publicDetailResponse = await request(app).get(
    `/api/articles/published/${createArticleResponse.body.data.article.id}`
  );

  assert.equal(commentResponse.body.data.comment.status, 'pending');
  assert.equal(rejectResponse.status, 200);
  assert.equal(rejectResponse.body.data.comment.status, 'rejected');
  assert.equal(publicDetailResponse.body.data.article.comments.length, 0);
});

test('fasilitator diskusi can create validate and activate discussion forum from comments', async () => {
  const { token: writerToken } = await createModerator('kurator.forum@coconexus.local', 'content');
  const { token: publisherToken } = await createModerator('redaktur.forum@coconexus.local', 'publication');
  const { token: forumToken } = await createModerator('fasilitator.forum@coconexus.local', 'forum');

  await request(app)
    .post('/api/auth/register')
    .send({
      email: 'forum.reader@coconexus.local',
      password: 'User12345',
      full_name: 'Forum Reader',
    });
  const readerLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'forum.reader@coconexus.local',
      password: 'User12345',
    });

  const createArticleResponse = await request(app)
    .post('/api/moderator/content/articles')
    .set('Authorization', `Bearer ${writerToken}`)
    .send({
      title: 'Artikel Pemicu Forum',
      body_content: 'Konten artikel untuk memicu forum diskusi.',
      article_type: 'panduan',
      category: {
        name: 'Forum Test',
      },
    });

  await request(app)
    .patch(`/api/moderator/publication/articles/${createArticleResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${publisherToken}`)
    .send({
      status: 'published',
    });

  const commentResponse = await request(app)
    .post(`/api/articles/${createArticleResponse.body.data.article.id}/comments`)
    .set('Authorization', `Bearer ${readerLoginResponse.body.data.token}`)
    .send({
      body: 'Komentar yang akan dijadikan dasar forum.',
    });

  const createForumResponse = await request(app)
    .post('/api/moderator/forum/discussion-forums')
    .set('Authorization', `Bearer ${forumToken}`)
    .send({
      article_id: createArticleResponse.body.data.article.id,
      title: 'Forum Diskusi Artikel Pemicu',
      summary: 'Forum hasil kurasi komentar pembaca.',
      comment_ids: [commentResponse.body.data.comment.id],
      notes: 'Layak dijadikan diskusi lanjutan.',
    });

  const validateForumResponse = await request(app)
    .patch(`/api/moderator/forum/discussion-forums/${createForumResponse.body.data.forum.id}/validate`)
    .set('Authorization', `Bearer ${forumToken}`)
    .send({
      notes: 'Sudah sesuai untuk dipublikasikan.',
    });

  const activateForumResponse = await request(app)
    .patch(`/api/moderator/forum/discussion-forums/${createForumResponse.body.data.forum.id}/activate`)
    .set('Authorization', `Bearer ${forumToken}`);

  const forumRecord = await DiscussionForum.findByPk(createForumResponse.body.data.forum.id);
  const publicForumResponse = await request(app).get(
    `/api/articles/${createArticleResponse.body.data.article.id}/discussion-forum`
  ).set('Authorization', `Bearer ${readerLoginResponse.body.data.token}`);
  const forumCommentResponse = await request(app)
    .post(`/api/discussion-forums/${createForumResponse.body.data.forum.id}/comments`)
    .set('Authorization', `Bearer ${readerLoginResponse.body.data.token}`)
    .send({
      body: 'Komentar forum publik untuk verifikasi endpoint.',
    });
  const forumCommentsResponse = await request(app).get(
    `/api/discussion-forums/${createForumResponse.body.data.forum.id}/comments`
  ).set('Authorization', `Bearer ${readerLoginResponse.body.data.token}`);

  assert.equal(createForumResponse.status, 201);
  assert.equal(createForumResponse.body.data.forum.status, 'draft');
  assert.equal(createForumResponse.body.data.forum.source_comments.length, 1);
  assert.equal(validateForumResponse.status, 200);
  assert.equal(validateForumResponse.body.data.forum.status, 'validated');
  assert.equal(activateForumResponse.status, 200);
  assert.equal(activateForumResponse.body.data.forum.status, 'active');
  assert.equal(forumRecord.status, 'active');
  assert.equal(publicForumResponse.status, 200);
  assert.equal(publicForumResponse.body.data.forum.status, 'active');
  assert.equal(forumCommentResponse.status, 201);
  assert.equal(forumCommentResponse.body.data.comment.status, 'approved');
  assert.equal(forumCommentsResponse.status, 200);
  assert.equal(forumCommentsResponse.body.data.comments.length, 1);
});

test('fasilitator diskusi can create forum topic from scratch without existing comments', async () => {
  const { token: writerToken } = await createModerator('kurator.forum.scratch@coconexus.local', 'content');
  const { token: forumToken } = await createModerator('fasilitator.forum.scratch@coconexus.local', 'forum');

  const createArticleResponse = await request(app)
    .post('/api/moderator/content/articles')
    .set('Authorization', `Bearer ${writerToken}`)
    .send({
      title: 'Artikel Untuk Forum Bebas',
      body_content: 'Konten artikel untuk topik forum yang dibuat bebas.',
      category: {
        name: 'Forum Bebas',
      },
    });

  const createForumResponse = await request(app)
    .post('/api/moderator/forum/discussion-forums')
    .set('Authorization', `Bearer ${forumToken}`)
    .send({
      article_id: createArticleResponse.body.data.article.id,
      title: 'Topik Forum Baru Tanpa Komentar Sumber',
      summary: 'Dibuka langsung oleh Fasilitator Diskusi.',
    });

  assert.equal(createForumResponse.status, 201);
  assert.equal(createForumResponse.body.data.forum.status, 'draft');
  assert.equal(createForumResponse.body.data.forum.source_comments.length, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Model-seeded (tidak menyentuh alur role sama sekali)
// ─────────────────────────────────────────────────────────────────────────────

test('published article list hides draft articles', async () => {
  const { user } = await createAdminUser();

  const category = await Category.create({
    name: 'Publikasi Artikel',
    description: 'Kategori publikasi',
  });

  const publishedArticle = await Article.create({
    author_id: user.id,
    category_id: category.id,
    title: 'Artikel Sudah Published',
    status: 'published',
  });

  const draftArticle = await Article.create({
    author_id: user.id,
    category_id: category.id,
    title: 'Artikel Masih Draft',
    status: 'draft',
  });

  await ArticleDetail.bulkCreate([
    {
      article_id: publishedArticle.id,
      body_content: 'Konten artikel published.',
      meta_description: 'Published',
    },
    {
      article_id: draftArticle.id,
      body_content: 'Konten artikel draft.',
      meta_description: 'Draft',
    },
  ]);

  const response = await request(app).get('/api/articles/published');

  assert.equal(response.status, 200);
  assert.deepEqual(
    response.body.data.articles.map((article) => article.title),
    ['Artikel Sudah Published']
  );
});

test('published article detail records article view', async () => {
  const { user } = await createAdminUser();

  const category = await Category.create({
    name: 'Statistik Baca',
    description: 'Kategori statistik baca',
  });

  const article = await Article.create({
    author_id: user.id,
    category_id: category.id,
    title: 'Artikel Dengan View',
    status: 'published',
  });

  await ArticleDetail.create({
    article_id: article.id,
    body_content: 'Konten artikel untuk pencatatan view.',
    meta_description: 'Pencatatan view',
  });

  const response = await request(app)
    .get(`/api/articles/published/${article.id}`)
    .set('x-coconexus-session-id', 'session-uji-bab-4');

  const viewCount = await ArticleView.count({
    where: { article_id: article.id },
  });

  assert.equal(response.status, 200);
  assert.equal(viewCount, 1);
});

test('published article detail returns product cards for main article exploration', async () => {
  const { user } = await createAdminUser();

  const category = await Category.create({
    name: 'Eksplorasi Produk',
    description: 'Kategori eksplorasi',
  });

  const mainArticle = await Article.create({
    author_id: user.id,
    category_id: category.id,
    title: 'Batok Kelapa',
    status: 'published',
  });

  const detailArticle = await Article.create({
    author_id: user.id,
    category_id: category.id,
    parent_article_id: mainArticle.id,
    title: 'Arang Tempurung',
    status: 'published',
  });

  await ArticleDetail.bulkCreate([
    {
      article_id: mainArticle.id,
      body_content: 'Konten utama batok kelapa.',
      meta_description: 'Artikel utama.',
    },
    {
      article_id: detailArticle.id,
      body_content: 'Konten detail arang.',
      meta_description: 'Artikel detail.',
    },
  ]);

  await ProductCard.create({
    article_id: mainArticle.id,
    title: 'Arang',
    description: 'Produk arang tempurung.',
    image: '/uploads/articles/arang.jpg',
    linked_article_id: detailArticle.id,
  });

  const response = await request(app).get(`/api/articles/published/${mainArticle.id}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.article.article_type, 'main');
  assert.equal(response.body.data.article.product_cards.length, 1);
  assert.equal(response.body.data.article.product_cards[0].title, 'Arang');
  assert.equal(response.body.data.article.product_cards[0].linked_article.id, detailArticle.id);
});

test('dashboard stats returns chart datasets for categories and comment months', async () => {
  const { user, plainPassword } = await createAdminUser();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: plainPassword,
    });

  const tempurungCategory = await Category.create({
    name: 'Tempurung',
    description: 'Produk tempurung',
  });

  const sabutCategory = await Category.create({
    name: 'Sabut',
    description: 'Produk sabut',
  });

  const firstArticle = await Article.create({
    author_id: user.id,
    category_id: tempurungCategory.id,
    title: 'Batok Kelapa',
    status: 'published',
  });

  const secondArticle = await Article.create({
    author_id: user.id,
    category_id: tempurungCategory.id,
    title: 'Arang Tempurung',
    status: 'draft',
  });

  const thirdArticle = await Article.create({
    author_id: user.id,
    category_id: sabutCategory.id,
    title: 'Sabut Kelapa',
    status: 'published',
  });

  await ArticleDetail.bulkCreate([
    {
      article_id: firstArticle.id,
      body_content: 'Konten artikel utama batok kelapa.',
      meta_description: 'Batok kelapa',
    },
    {
      article_id: secondArticle.id,
      body_content: 'Konten artikel arang.',
      meta_description: 'Arang',
    },
    {
      article_id: thirdArticle.id,
      body_content: 'Konten artikel sabut.',
      meta_description: 'Sabut',
    },
  ]);

  await Comment.bulkCreate([
    {
      body: 'Komentar pertama',
      user_id: user.id,
      article_id: firstArticle.id,
      created_at: new Date('2026-01-10T10:00:00Z'),
      updated_at: new Date('2026-01-10T10:00:00Z'),
    },
    {
      body: 'Komentar kedua',
      user_id: user.id,
      article_id: firstArticle.id,
      created_at: new Date('2026-01-15T10:00:00Z'),
      updated_at: new Date('2026-01-15T10:00:00Z'),
    },
    {
      body: 'Komentar ketiga',
      user_id: user.id,
      article_id: thirdArticle.id,
      created_at: new Date('2026-02-05T10:00:00Z'),
      updated_at: new Date('2026-02-05T10:00:00Z'),
    },
  ]);

  const statsResponse = await request(app)
    .get('/api/admin/stats')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

  assert.equal(statsResponse.status, 200);
  assert.equal(statsResponse.body.data.charts.articles_by_category.datasets[0].label, 'Jumlah Artikel');
  assert.deepEqual(statsResponse.body.data.charts.articles_by_category.labels, ['Tempurung', 'Sabut']);
  assert.deepEqual(statsResponse.body.data.charts.articles_by_category.datasets[0].data, [2, 1]);
  assert.deepEqual(statsResponse.body.data.charts.comments_by_month.items.map((item) => item.month_key), [
    '2026-01',
    '2026-02',
  ]);
  assert.deepEqual(statsResponse.body.data.charts.comments_by_month.datasets[0].data, [2, 1]);
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth & validasi umum lainnya
// ─────────────────────────────────────────────────────────────────────────────

test('login rejects invalid password', async () => {
  const { user } = await createAdminUser();

  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: 'PasswordSalah123',
    });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('register rejects weak password', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'password.lemah@coconexus.local',
      password: 'lemah',
      full_name: 'Password Lemah',
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test('register rejects duplicate active email', async () => {
  const payload = {
    email: 'duplikat@coconexus.local',
    password: 'User12345',
    full_name: 'User Duplikat',
  };

  const firstResponse = await request(app).post('/api/auth/register').send(payload);
  const secondResponse = await request(app).post('/api/auth/register').send(payload);

  assert.equal(firstResponse.status, 201);
  assert.equal(secondResponse.status, 409);
  assert.equal(secondResponse.body.success, false);
});

test('pengelola article list rejects request without token', async () => {
  const response = await request(app).get('/api/pengelola/articles');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('pengelola article list rejects invalid token', async () => {
  const response = await request(app)
    .get('/api/pengelola/articles')
    .set('Authorization', 'Bearer token-tidak-valid');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('admin can update user role and profile data', async () => {
  const { user: adminUser, plainPassword } = await createAdminUser();

  const targetUser = await User.create({
    email: 'target.user@coconexus.local',
    password: 'hashed-password-placeholder',
    role: 'user',
  });

  await UserProfile.create({
    user_id: targetUser.id,
    full_name: 'Target User',
    bio: null,
    avatar_url: null,
  });

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: adminUser.email,
      password: plainPassword,
    });

  const updateResponse = await request(app)
    .put(`/api/users/admin/${targetUser.id}`)
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
    .send({
      role: 'admin',
      profile: {
        full_name: 'Target Admin',
        bio: 'Naik role untuk pengujian.',
      },
    });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.data.user.role, 'admin');
  assert.equal(updateResponse.body.data.user.profile.full_name, 'Target Admin');
});

test('admin user list exposes job division fields', async () => {
  const { user: adminUser, plainPassword } = await createAdminUser();

  const targetUser = await User.create({
    email: 'pengelola.konten@coconexus.local',
    password: 'hashed-password-placeholder',
    role: 'pengelola',
  });

  await UserProfile.create({
    user_id: targetUser.id,
    full_name: 'Pengelola Konten',
    bio: 'Menangani alur artikel.',
    avatar_url: null,
    job_title: 'Editor Konten',
    department: 'Redaksi & Konten',
    division: 'Artikel Detail',
  });

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: adminUser.email,
      password: plainPassword,
    });

  const usersResponse = await request(app)
    .get('/api/users/admin')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

  const fetchedUser = usersResponse.body.data.users.find((item) => item.id === targetUser.id);

  assert.equal(usersResponse.status, 200);
  assert.equal(fetchedUser.profile.job_title, 'Editor Konten');
  assert.equal(fetchedUser.profile.department, 'Redaksi & Konten');
  assert.equal(fetchedUser.profile.division, 'Artikel Detail');
});

test('admin cannot soft delete own account', async () => {
  const { user, plainPassword } = await createAdminUser();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: plainPassword,
    });

  const deleteResponse = await request(app)
    .delete(`/api/users/admin/${user.id}`)
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

  assert.equal(deleteResponse.status, 403);
});

test('user can update own profile', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({
      email: 'profil.user@coconexus.local',
      password: 'User12345',
      full_name: 'Profil Awal',
    });

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'profil.user@coconexus.local',
      password: 'User12345',
    });

  const profileResponse = await request(app)
    .put('/api/users/me/profile')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
    .send({
      full_name: 'Profil Diperbarui',
      bio: 'Bio berhasil diperbarui.',
    });

  assert.equal(profileResponse.status, 200);
  assert.equal(profileResponse.body.data.user.profile.full_name, 'Profil Diperbarui');
});

test('available product cards endpoint returns only unlinked cards from selected main article', async () => {
  const { user, plainPassword } = await createPengelolaUser({
    email: 'pengelola.available.cards@coconexus.local',
  });

  const loginResponse = await loginWith(user.email, plainPassword);

  const category = await Category.create({
    name: 'Produk Turunan',
    description: 'Kategori untuk linking',
  });

  const mainArticle = await Article.create({
    author_id: user.id,
    category_id: category.id,
    title: 'Batok Kelapa',
    status: 'published',
  });

  const linkedDetailArticle = await Article.create({
    author_id: user.id,
    category_id: category.id,
    parent_article_id: mainArticle.id,
    title: 'Arang Tempurung Kelapa',
    status: 'draft',
  });

  await ArticleDetail.bulkCreate([
    {
      article_id: mainArticle.id,
      body_content: 'Konten batok kelapa.',
      meta_description: 'Batok',
    },
    {
      article_id: linkedDetailArticle.id,
      body_content: 'Konten arang.',
      meta_description: 'Arang',
    },
  ]);

  await ProductCard.bulkCreate([
    {
      article_id: mainArticle.id,
      title: 'Arang',
      description: 'Produk arang',
      image: '/uploads/articles/arang.png',
      linked_article_id: linkedDetailArticle.id,
    },
    {
      article_id: mainArticle.id,
      title: 'Kerajinan',
      description: 'Produk kerajinan',
      image: '/uploads/articles/kerajinan.png',
      linked_article_id: null,
    },
    {
      article_id: mainArticle.id,
      title: 'Filter Air',
      description: 'Produk filter air',
      image: '/uploads/articles/filter.png',
      linked_article_id: null,
    },
  ]);

  const availableCardsResponse = await request(app)
    .get(`/api/pengelola/articles/product-cards/available?article_id=${mainArticle.id}`)
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

  assert.equal(availableCardsResponse.status, 200);
  assert.equal(availableCardsResponse.body.data.article.title, 'Batok Kelapa');
  assert.deepEqual(
    availableCardsResponse.body.data.product_cards.map((item) => item.title),
    ['Kerajinan', 'Filter Air']
  );
  assert.ok(
    availableCardsResponse.body.data.product_cards.every((item) => item.linked_article_id === null)
  );
});

test('main articles endpoint returns parent articles for linking dropdown', async () => {
  const { user, plainPassword } = await createPengelolaUser({
    email: 'pengelola.main.articles@coconexus.local',
  });

  const loginResponse = await loginWith(user.email, plainPassword);

  const category = await Category.create({
    name: 'Kategori Artikel Utama',
    description: 'Kategori utama',
  });

  const mainArticle = await Article.create({
    author_id: user.id,
    category_id: category.id,
    title: 'Batok Kelapa',
    status: 'published',
  });

  await Article.create({
    author_id: user.id,
    category_id: category.id,
    parent_article_id: mainArticle.id,
    title: 'Arang Tempurung',
    status: 'draft',
  });

  const response = await request(app)
    .get('/api/pengelola/articles/main-articles')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data.articles.map((item) => item.title), ['Batok Kelapa']);
});
