'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coconexus';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const {
  sequelize,
  CategoryTag,
  Article,
  ArticleDetail,
  ArticleMedia,
  ProductCard,
  Comment,
} = require('../models');
const { resetTestDatabase, createAdminUser } = require('./helpers/testDb');

test.beforeEach(async () => {
  await resetTestDatabase();
});

test.after(async () => {
  await sequelize.close();
});

test('admin can login and create draft article with auto-created category', async () => {
  const { user, plainPassword } = await createAdminUser();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: plainPassword,
    });

  assert.equal(loginResponse.status, 200);
  assert.ok(loginResponse.body.data.token);

  const createResponse = await request(app)
    .post('/api/articles/admin')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
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

  const category = await CategoryTag.findOne({ where: { name: 'Pengolahan Sabut' } });
  const article = await Article.findByPk(createResponse.body.data.article.id);
  const detail = await ArticleDetail.findOne({ where: { article_id: article.id } });
  const media = await ArticleMedia.findAll({ where: { article_id: article.id } });

  assert.ok(category);
  assert.ok(article);
  assert.ok(detail);
  assert.equal(media.length, 1);
});

test('admin can create article with dynamic product cards', async () => {
  const { user, plainPassword } = await createAdminUser();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: plainPassword,
    });

  const createResponse = await request(app)
    .post('/api/articles/admin')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
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

test('article validation endpoint can publish draft article', async () => {
  const { user, plainPassword } = await createAdminUser();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: plainPassword,
    });

  const createResponse = await request(app)
    .post('/api/articles/admin')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
    .send({
      title: 'Artikel Publish Test',
      body_content: 'Konten publish test.',
      category: {
        name: 'Tempurung Kelapa',
      },
    });

  const publishResponse = await request(app)
    .patch(`/api/articles/admin/${createResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
    .send({
      status: 'published',
    });

  assert.equal(publishResponse.status, 200);
  assert.equal(publishResponse.body.data.article.status, 'published');
});

test('admin can upload article media file', async () => {
  const { user, plainPassword } = await createAdminUser();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: plainPassword,
    });

  const uploadResponse = await request(app)
    .post('/api/uploads/articles')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
    .attach('file', Buffer.from('fake image data'), 'integration-image.png');

  assert.equal(uploadResponse.status, 201);
  assert.equal(uploadResponse.body.data.media.media_type, 'image');
  assert.match(uploadResponse.body.data.media.file_path, /^\/uploads\/articles\//);
});

test('dashboard stats returns chart datasets for categories and comment months', async () => {
  const { user, plainPassword } = await createAdminUser();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: plainPassword,
    });

  const tempurungCategory = await CategoryTag.create({
    name: 'Tempurung',
    description: 'Produk tempurung',
  });

  const sabutCategory = await CategoryTag.create({
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

test('available product cards endpoint returns only unlinked cards from selected main article', async () => {
  const { user, plainPassword } = await createAdminUser();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: plainPassword,
    });

  const category = await CategoryTag.create({
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
    .get(`/api/articles/admin/product-cards/available?article_id=${mainArticle.id}`)
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
  const { user, plainPassword } = await createAdminUser();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: plainPassword,
    });

  const category = await CategoryTag.create({
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
    .get('/api/articles/admin/main-articles')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data.articles.map((item) => item.title), ['Batok Kelapa']);
});

test('admin can create detail article linked to selected product card', async () => {
  const { user, plainPassword } = await createAdminUser();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: plainPassword,
    });

  const category = await CategoryTag.create({
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
    .post('/api/articles/admin')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
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

test('published article detail returns product cards for main article exploration', async () => {
  const { user } = await createAdminUser();

  const category = await CategoryTag.create({
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

test('admin can update unlinked product cards from article editor', async () => {
  const { user, plainPassword } = await createAdminUser();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: plainPassword,
    });

  const category = await CategoryTag.create({
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
    .put(`/api/articles/admin/${article.id}`)
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
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
