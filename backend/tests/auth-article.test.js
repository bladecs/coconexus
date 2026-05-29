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
  CategoryTag,
  Article,
  ArticleDetail,
  ArticleMedia,
  ArticleView,
  ProductCard,
  Comment,
  User,
  UserProfile,
} = require('../models');
const { resetTestDatabase, createAdminUser, createPengelolaUser } = require('./helpers/testDb');

test.beforeEach(async () => {
  await resetTestDatabase();
});

test.after(async () => {
  await sequelize.close();
});

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

test('regular user cannot create article from pengelola workspace route', async () => {
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

test('pengelola can create and fetch article from workspace route', async () => {
  const { user: pengelolaUser, plainPassword } = await createPengelolaUser({
    email: 'pengelola.konten@coconexus.local',
    full_name: 'Pengelola Konten',
    bio: 'Mengelola alur artikel.',
  });

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: pengelolaUser.email,
      password: plainPassword,
    });

  const createResponse = await request(app)
    .post('/api/articles')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
    .send({
      title: 'Artikel Pengelola',
      body_content: 'Konten artikel dari pengelola.',
      meta_description: 'Ringkasan artikel pengelola.',
      status: 'draft',
      category: {
        name: 'Alur Pengelola',
      },
    });

  const detailResponse = await request(app)
    .get(`/api/articles/${createResponse.body.data.article.id}`)
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

  assert.equal(createResponse.status, 201);
  assert.equal(detailResponse.status, 200);
  assert.equal(detailResponse.body.data.article.title, 'Artikel Pengelola');
});

test('pengelola publisher can publish draft article to published', async () => {
  const { user: writerUser, plainPassword: writerPassword } = await createPengelolaUser({
    email: 'penulis.publish.flow@coconexus.local',
    full_name: 'Penulis Publish Flow',
    job_title: 'Penulis Artikel',
    department: 'Produksi Konten',
    division: 'Artikel Utama',
    bio: 'Menyiapkan draft untuk publish.',
  });

  const { user: publisherUser, plainPassword: publisherPassword } = await createPengelolaUser({
    email: 'publisher.flow@coconexus.local',
    full_name: 'Publisher Flow',
    job_title: 'Publisher Artikel',
    department: 'Validasi & Publikasi',
    division: 'Artikel Utama',
    bio: 'Menangani publikasi artikel.',
  });

  const writerLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: writerUser.email,
      password: writerPassword,
    });

  const createResponse = await request(app)
    .post('/api/articles')
    .set('Authorization', `Bearer ${writerLogin.body.data.token}`)
    .send({
      title: 'Artikel Publish Flow',
      body_content: 'Konten artikel publish flow.',
      meta_description: 'Ringkasan publish flow.',
      status: 'draft',
      category: {
        name: 'Publish Flow',
      },
    });

  const publisherLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: publisherUser.email,
      password: publisherPassword,
    });

  const publishResponse = await request(app)
    .patch(`/api/articles/${createResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${publisherLogin.body.data.token}`)
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

test('pengelola penulis cannot publish article', async () => {
  const { user: writerUser, plainPassword } = await createPengelolaUser({
    email: 'penulis.uji@coconexus.local',
    full_name: 'Penulis Uji',
    job_title: 'Penulis Artikel',
    department: 'Produksi Konten',
    division: 'Artikel Utama',
  });

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: writerUser.email,
      password: plainPassword,
    });

  const createResponse = await request(app)
    .post('/api/articles')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
    .send({
      title: 'Draft Penulis',
      body_content: 'Konten penulis.',
      meta_description: 'Meta penulis.',
      status: 'draft',
      category: {
        name: 'Penulis Uji',
      },
    });

  const publishResponse = await request(app)
    .patch(`/api/articles/${createResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
    .send({
      status: 'published',
    });

  assert.equal(createResponse.status, 201);
  assert.equal(publishResponse.status, 403);
  assert.equal(publishResponse.body.success, false);
});

test('pengelola publisher can publish draft article written by other pengelola', async () => {
  const { user: writerUser, plainPassword: writerPassword } = await createPengelolaUser({
    email: 'penulis.publish@coconexus.local',
    full_name: 'Penulis Publish',
    job_title: 'Penulis Artikel',
    department: 'Produksi Konten',
    division: 'Artikel Utama',
  });

  const { user: publisherUser, plainPassword: publisherPassword } = await createPengelolaUser({
    email: 'publisher.publish@coconexus.local',
    full_name: 'Publisher Publish',
    job_title: 'Publisher Artikel',
    department: 'Validasi & Publikasi',
    division: 'Artikel Utama',
  });

  const writerLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: writerUser.email,
      password: writerPassword,
    });

  const createResponse = await request(app)
    .post('/api/articles')
    .set('Authorization', `Bearer ${writerLogin.body.data.token}`)
    .send({
      title: 'Draft Untuk Publish',
      body_content: 'Konten yang akan dipublish publisher.',
      meta_description: 'Meta publish.',
      status: 'draft',
      category: {
        name: 'Publisher Uji',
      },
    });

  const publisherLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: publisherUser.email,
      password: publisherPassword,
    });

  const publishResponse = await request(app)
    .patch(`/api/articles/${createResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${publisherLogin.body.data.token}`)
    .send({
      status: 'published',
    });

  assert.equal(publishResponse.status, 200);
  assert.equal(publishResponse.body.data.article.status, 'published');
});

test('pengelola tag manager can manage categories while writer cannot', async () => {
  const { user: tagUser, plainPassword: tagPassword } = await createPengelolaUser({
    email: 'tag.manager@coconexus.local',
    full_name: 'Tag Manager',
    job_title: 'Pengelola Tag/Kategori',
    department: 'Kategori & Tag',
    division: 'Kategori',
  });

  const { user: writerUser, plainPassword: writerPassword } = await createPengelolaUser({
    email: 'category.writer@coconexus.local',
    full_name: 'Category Writer',
    job_title: 'Penulis Artikel',
    department: 'Produksi Konten',
    division: 'Artikel Utama',
  });

  const tagLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: tagUser.email,
      password: tagPassword,
    });

  const createCategoryResponse = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${tagLogin.body.data.token}`)
    .send({
      name: 'Kategori Job Test',
    });

  const writerLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: writerUser.email,
      password: writerPassword,
    });

  const writerCategoryResponse = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${writerLogin.body.data.token}`)
    .send({
      name: 'Kategori Dilarang',
    });

  assert.equal(createCategoryResponse.status, 201);
  assert.equal(writerCategoryResponse.status, 403);
});

test('pengelola comment moderator can access comment management while writer cannot', async () => {
  const { user: commentUser, plainPassword: commentPassword } = await createPengelolaUser({
    email: 'comment.moderator@coconexus.local',
    full_name: 'Comment Moderator',
    job_title: 'Moderator Komentar',
    department: 'Moderasi Komentar',
    division: 'Komentar',
  });

  const { user: writerUser, plainPassword: writerPassword } = await createPengelolaUser({
    email: 'comment.writer@coconexus.local',
    full_name: 'Comment Writer',
    job_title: 'Penulis Artikel',
    department: 'Produksi Konten',
    division: 'Artikel Utama',
  });

  const commentLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: commentUser.email,
      password: commentPassword,
    });

  const writerLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: writerUser.email,
      password: writerPassword,
    });

  const moderatorResponse = await request(app)
    .get('/api/comments?status=pending')
    .set('Authorization', `Bearer ${commentLogin.body.data.token}`);

  const writerResponse = await request(app)
    .get('/api/comments?status=pending')
    .set('Authorization', `Bearer ${writerLogin.body.data.token}`);

  assert.equal(moderatorResponse.status, 200);
  assert.equal(writerResponse.status, 403);
});

test('pengelola cannot publish another author article', async () => {
  const { user: adminUser } = await createAdminUser();
  const { user: pengelolaUser, plainPassword } = await createPengelolaUser({
    email: 'pengelola.lain@coconexus.local',
    full_name: 'Pengelola Lain',
  });

  const category = await CategoryTag.create({
    name: 'Artikel Milik Admin',
    description: 'Kategori pengujian kepemilikan.',
  });

  const ownedByAdmin = await Article.create({
    author_id: adminUser.id,
    category_id: category.id,
    title: 'Draft Admin',
    status: 'draft',
  });

  await ArticleDetail.create({
    article_id: ownedByAdmin.id,
    body_content: 'Konten draft admin.',
    meta_description: 'Draft admin.',
  });

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: pengelolaUser.email,
      password: plainPassword,
    });

  const publishResponse = await request(app)
    .patch(`/api/articles/${ownedByAdmin.id}/status`)
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
    .send({
      status: 'published',
    });

  assert.equal(publishResponse.status, 403);
  assert.equal(publishResponse.body.success, false);
});

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

test('admin article list rejects request without token', async () => {
  const response = await request(app).get('/api/articles/admin');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('admin article list rejects invalid token', async () => {
  const response = await request(app)
    .get('/api/articles/admin')
    .set('Authorization', 'Bearer token-tidak-valid');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('admin cannot create article without body content', async () => {
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
      title: 'Artikel Tanpa Konten',
      category: {
        name: 'Validasi Konten',
      },
    });

  assert.equal(createResponse.status, 400);
});

test('admin cannot upload unsupported article media type', async () => {
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
    .attach('file', Buffer.from('fake executable data'), {
      filename: 'malware.exe',
      contentType: 'application/x-msdownload',
    });

  assert.equal(uploadResponse.status, 400);
  assert.equal(uploadResponse.body.success, false);
});

test('user cannot comment on draft article', async () => {
  const { user: adminUser, plainPassword } = await createAdminUser();

  await request(app)
    .post('/api/auth/register')
    .send({
      email: 'komentator@coconexus.local',
      password: 'User12345',
      full_name: 'User Komentator',
    });

  const adminLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: adminUser.email,
      password: plainPassword,
    });

  const userLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'komentator@coconexus.local',
      password: 'User12345',
    });

  const createArticleResponse = await request(app)
    .post('/api/articles/admin')
    .set('Authorization', `Bearer ${adminLoginResponse.body.data.token}`)
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
  const { user: adminUser, plainPassword } = await createAdminUser();

  await request(app)
    .post('/api/auth/register')
    .send({
      email: 'komentar.kosong@coconexus.local',
      password: 'User12345',
      full_name: 'Komentar Kosong',
    });

  const adminLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: adminUser.email,
      password: plainPassword,
    });

  const userLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'komentar.kosong@coconexus.local',
      password: 'User12345',
    });

  const createArticleResponse = await request(app)
    .post('/api/articles/admin')
    .set('Authorization', `Bearer ${adminLoginResponse.body.data.token}`)
    .send({
      title: 'Artikel Untuk Komentar',
      body_content: 'Konten artikel sudah siap dipublikasikan.',
      category: {
        name: 'Komentar Kosong',
      },
    });

  await request(app)
    .patch(`/api/articles/admin/${createArticleResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${adminLoginResponse.body.data.token}`)
    .send({
      status: 'published',
    });

  const commentResponse = await request(app)
    .post(`/api/articles/${createArticleResponse.body.data.article.id}/comments`)
    .set('Authorization', `Bearer ${userLoginResponse.body.data.token}`)
    .send({
      body: '   ',
    });

  assert.equal(commentResponse.status, 400);
  assert.equal(commentResponse.body.success, false);
});

test('pending comments are hidden until moderator approves them', async () => {
  const { user: adminUser, plainPassword: adminPassword } = await createAdminUser();
  const { user: commenterUser, plainPassword: commenterPassword } = await createPengelolaUser({
    email: 'commenter.pending@coconexus.local',
    full_name: 'Commenter Pending',
    job_title: 'Penulis Artikel',
    department: 'Produksi Konten',
    division: 'Artikel Utama',
  });
  const { user: moderatorUser, plainPassword: moderatorPassword } = await createPengelolaUser({
    email: 'comment.moderator.queue@coconexus.local',
    full_name: 'Comment Moderator Queue',
    job_title: 'Moderator Komentar',
    department: 'Moderasi Komentar',
    division: 'Komentar',
  });

  const adminLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: adminUser.email,
      password: adminPassword,
    });

  const commenterLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: commenterUser.email,
      password: commenterPassword,
    });

  const createArticleResponse = await request(app)
    .post('/api/articles/admin')
    .set('Authorization', `Bearer ${adminLoginResponse.body.data.token}`)
    .send({
      title: 'Artikel Moderasi Komentar',
      body_content: 'Artikel untuk menguji alur moderasi komentar.',
      category: {
        name: 'Moderasi Komentar',
      },
    });

  await request(app)
    .patch(`/api/articles/admin/${createArticleResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${adminLoginResponse.body.data.token}`)
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

  const moderatorLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: moderatorUser.email,
      password: moderatorPassword,
    });

  const queueResponse = await request(app)
    .get('/api/comments?status=pending')
    .set('Authorization', `Bearer ${moderatorLoginResponse.body.data.token}`);

  const approveResponse = await request(app)
    .patch(`/api/comments/${commentResponse.body.data.comment.id}/status`)
    .set('Authorization', `Bearer ${moderatorLoginResponse.body.data.token}`)
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

test('moderator can reject comment and it stays hidden publicly', async () => {
  const { user: adminUser, plainPassword: adminPassword } = await createAdminUser();
  const { user: commenterUser, plainPassword: commenterPassword } = await createPengelolaUser({
    email: 'commenter.reject@coconexus.local',
    full_name: 'Commenter Reject',
    job_title: 'Penulis Artikel',
    department: 'Produksi Konten',
    division: 'Artikel Utama',
  });
  const { user: moderatorUser, plainPassword: moderatorPassword } = await createPengelolaUser({
    email: 'comment.moderator.reject@coconexus.local',
    full_name: 'Comment Moderator Reject',
    job_title: 'Moderator Komentar',
    department: 'Moderasi Komentar',
    division: 'Komentar',
  });

  const adminLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: adminUser.email,
      password: adminPassword,
    });

  const commenterLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: commenterUser.email,
      password: commenterPassword,
    });

  const createArticleResponse = await request(app)
    .post('/api/articles/admin')
    .set('Authorization', `Bearer ${adminLoginResponse.body.data.token}`)
    .send({
      title: 'Artikel Moderasi Tolak',
      body_content: 'Artikel untuk menguji penolakan komentar.',
      category: {
        name: 'Moderasi Tolak',
      },
    });

  await request(app)
    .patch(`/api/articles/admin/${createArticleResponse.body.data.article.id}/status`)
    .set('Authorization', `Bearer ${adminLoginResponse.body.data.token}`)
    .send({
      status: 'published',
    });

  const commentResponse = await request(app)
    .post(`/api/articles/${createArticleResponse.body.data.article.id}/comments`)
    .set('Authorization', `Bearer ${commenterLoginResponse.body.data.token}`)
    .send({
      body: 'Komentar yang akan ditolak.',
    });

  const moderatorLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: moderatorUser.email,
      password: moderatorPassword,
    });

  const rejectResponse = await request(app)
    .patch(`/api/comments/${commentResponse.body.data.comment.id}/status`)
    .set('Authorization', `Bearer ${moderatorLoginResponse.body.data.token}`)
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

test('published article list hides draft articles', async () => {
  const { user } = await createAdminUser();

  const category = await CategoryTag.create({
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

  const category = await CategoryTag.create({
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

test('admin can create category and duplicate category is rejected', async () => {
  const { user, plainPassword } = await createAdminUser();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: plainPassword,
    });

  const createResponse = await request(app)
    .post('/api/categories/admin')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
    .send({
      name: 'Kategori Sabut',
      description: 'Pengolahan limbah sabut kelapa.',
    });

  const duplicateResponse = await request(app)
    .post('/api/categories/admin')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
    .send({
      name: 'Kategori Sabut',
      description: 'Duplikat kategori.',
    });

  assert.equal(createResponse.status, 201);
  assert.equal(duplicateResponse.status, 409);
});

test('admin cannot delete category that is still used by article', async () => {
  const { user, plainPassword } = await createAdminUser();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: plainPassword,
    });

  const category = await CategoryTag.create({
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
    .delete(`/api/categories/admin/${category.id}`)
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`);

  assert.equal(deleteResponse.status, 409);
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
