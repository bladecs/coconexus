'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-coconexus';
process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || '10000';
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10000';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { sequelize, AuditLog, User, UserProfile } = require('../models');
const { resetTestDatabase, createPengelolaUser, createAdminUser, createModeratorUser } = require('./helpers/testDb');

test.beforeEach(async () => {
  await resetTestDatabase();
});

test.after(async () => {
  await sequelize.close();
});

async function registerAndLoginUser(overrides = {}) {
  const email = overrides.email || 'pembaca@coconexus.local';
  const password = overrides.password || 'Pembaca12345';
  const full_name = overrides.full_name || 'Pembaca Umum';

  await request(app).post('/api/auth/register').send({ email, password, full_name });
  const loginResponse = await request(app).post('/api/auth/login').send({ email, password });
  return { email, password, token: loginResponse.body.data.token };
}

let publisherCounter = 0;

// Kurator Konten membuat draf, Redaktur Publikasi (aktor moderator terpisah, sesuai
// pemisahan wewenang wajib) yang mempublikasikannya — tidak ada jalur self-publish.
async function createAndPublishArticle(contentToken, overrides = {}) {
  const createResponse = await request(app)
    .post('/api/moderator/content/articles')
    .set('Authorization', `Bearer ${contentToken}`)
    .send({
      title: overrides.title || 'Panduan Pengolahan Sabut Kelapa',
      body_content: overrides.body_content || 'Konten panduan pengolahan sabut kelapa untuk UMKM.',
      meta_description: 'Ringkasan panduan.',
      article_type: overrides.article_type || 'panduan',
      status: 'draft',
      category: { name: overrides.categoryName || 'Personalisasi Test' },
    });
  assert.equal(createResponse.status, 201, `createArticle: ${JSON.stringify(createResponse.body)}`);
  const articleId = createResponse.body.data.article.id;

  publisherCounter += 1;
  const { user: publisher, plainPassword: publisherPassword } = await createModeratorUser({
    email: `publisher.personalisasi.${publisherCounter}@coconexus.local`,
    moderator_type: 'publication',
  });
  const publisherLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: publisher.email, password: publisherPassword });

  const publishResponse = await request(app)
    .patch(`/api/moderator/publication/articles/${articleId}/status`)
    .set('Authorization', `Bearer ${publisherLogin.body.data.token}`)
    .send({ status: 'published' });
  assert.equal(publishResponse.status, 200, `publishArticle: ${JSON.stringify(publishResponse.body)}`);

  return publishResponse.body.data.article;
}

async function setupWriterAndPublishedArticle() {
  const { user: writer, plainPassword } = await createModeratorUser({
    email: 'kurator.personalisasi@coconexus.local',
    moderator_type: 'content',
  });
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: writer.email, password: plainPassword });
  const article = await createAndPublishArticle(loginResponse.body.data.token);
  return { writerToken: loginResponse.body.data.token, article };
}

// ===================== BOOKMARK =====================

test('authenticated user can toggle bookmark on published article (create then remove)', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'bookmark.user@coconexus.local' });

  const createToggle = await request(app)
    .post(`/api/bookmarks/toggle/${article.id}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(createToggle.status, 201);
  assert.equal(createToggle.body.data.bookmarked, true);

  const removeToggle = await request(app)
    .post(`/api/bookmarks/toggle/${article.id}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(removeToggle.status, 200);
  assert.equal(removeToggle.body.data.bookmarked, false);
});

test('toggle bookmark on nonexistent article returns 404', async () => {
  const { token } = await registerAndLoginUser({ email: 'bookmark.user2@coconexus.local' });

  const response = await request(app)
    .post('/api/bookmarks/toggle/999999')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 404);
});

test('check bookmark status reflects current state', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'bookmark.user3@coconexus.local' });

  const beforeCheck = await request(app)
    .get(`/api/bookmarks/check/${article.id}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(beforeCheck.status, 200);
  assert.equal(beforeCheck.body.data.bookmarked, false);

  await request(app)
    .post(`/api/bookmarks/toggle/${article.id}`)
    .set('Authorization', `Bearer ${token}`);

  const afterCheck = await request(app)
    .get(`/api/bookmarks/check/${article.id}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(afterCheck.status, 200);
  assert.equal(afterCheck.body.data.bookmarked, true);
});

test('list bookmarks returns only bookmarked published articles with pagination meta', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'bookmark.user4@coconexus.local' });

  await request(app)
    .post(`/api/bookmarks/toggle/${article.id}`)
    .set('Authorization', `Bearer ${token}`);

  const listResponse = await request(app)
    .get('/api/bookmarks')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.data.bookmarks.length, 1);
  assert.equal(listResponse.body.data.bookmarks[0].article.id, article.id);
  assert.equal(listResponse.body.data.meta.total_items, 1);
});

test('bookmark endpoints reject unauthenticated request', async () => {
  const response = await request(app).get('/api/bookmarks');
  assert.equal(response.status, 401);
});

// ===================== CHATBOT =====================

test('public chatbot config endpoint is accessible without authentication', async () => {
  const response = await request(app).get('/api/chatbot/config');
  assert.equal(response.status, 200);
  assert.equal(response.body.data.is_enabled, false);
});

test('chat endpoint rejects empty message', async () => {
  const response = await request(app).post('/api/chatbot/chat').send({ message: '   ' });
  assert.equal(response.status, 400);
  assert.match(response.body.error, /tidak boleh kosong/);
});

test('chat endpoint returns 503 when chatbot is disabled by default', async () => {
  const response = await request(app).post('/api/chatbot/chat').send({ message: 'Halo, bagaimana cara mengolah sabut kelapa?' });
  assert.equal(response.status, 503);
  assert.match(response.body.error, /belum diaktifkan/);
});

test('non-admin cannot access chatbot admin settings', async () => {
  const { token } = await registerAndLoginUser({ email: 'chatbot.user@coconexus.local' });
  const response = await request(app)
    .get('/api/admin/chatbot/settings')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 403);
});

test('unauthenticated request cannot access chatbot admin settings', async () => {
  const response = await request(app).get('/api/admin/chatbot/settings');
  assert.equal(response.status, 401);
});

test('admin can update and retrieve chatbot settings with masked api key', async () => {
  const { user, plainPassword } = await createAdminUser({ email: 'admin.chatbot@coconexus.local' });
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: plainPassword });
  const token = loginResponse.body.data.token;

  const updateResponse = await request(app)
    .put('/api/admin/chatbot/settings')
    .set('Authorization', `Bearer ${token}`)
    .send({
      api_key: 'sk-test-1234567890',
      is_enabled: true,
      welcome_message: 'Halo dari admin!',
    });
  assert.equal(updateResponse.status, 200);

  const getResponse = await request(app)
    .get('/api/admin/chatbot/settings')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.body.data.is_enabled, true);
  assert.equal(getResponse.body.data.welcome_message, 'Halo dari admin!');
  assert.equal(getResponse.body.data.api_key, undefined);
  assert.match(getResponse.body.data.api_key_masked, /^••••••••/);
});

test('test connection endpoint returns 400 when api key not configured', async () => {
  const { user, plainPassword } = await createAdminUser({ email: 'admin.chatbot2@coconexus.local' });
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: plainPassword });

  const response = await request(app)
    .post('/api/admin/chatbot/test')
    .set('Authorization', `Bearer ${loginResponse.body.data.token}`);
  assert.equal(response.status, 400);
  assert.match(response.body.error, /API key belum dikonfigurasi/);
});

// ===================== READING HISTORY =====================

test('recording read on published article succeeds', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'reader.history1@coconexus.local' });

  const response = await request(app)
    .post(`/api/reading-history/${article.id}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.data.recorded, true);
});

test('recording read on nonexistent article no-ops without error', async () => {
  const { token } = await registerAndLoginUser({ email: 'reader.history2@coconexus.local' });

  const response = await request(app)
    .post('/api/reading-history/999999')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.data.recorded, false);
});

test('reading same article twice keeps a single history row and updates read_at', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'reader.history3@coconexus.local' });

  await request(app).post(`/api/reading-history/${article.id}`).set('Authorization', `Bearer ${token}`);
  await new Promise((resolve) => setTimeout(resolve, 20));
  await request(app).post(`/api/reading-history/${article.id}`).set('Authorization', `Bearer ${token}`);

  const idsResponse = await request(app)
    .get('/api/reading-history/ids')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(idsResponse.body.data.article_ids.length, 1);
});

test('get read ids returns all recorded article ids regardless of status', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'reader.history4@coconexus.local' });

  await request(app).post(`/api/reading-history/${article.id}`).set('Authorization', `Bearer ${token}`);

  const idsResponse = await request(app)
    .get('/api/reading-history/ids')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(idsResponse.status, 200);
  assert.deepEqual(idsResponse.body.data.article_ids, [article.id]);
});

test('list reading history only includes published articles with pagination meta', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'reader.history5@coconexus.local' });

  await request(app).post(`/api/reading-history/${article.id}`).set('Authorization', `Bearer ${token}`);

  const listResponse = await request(app)
    .get('/api/reading-history')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.data.history.length, 1);
  assert.equal(listResponse.body.data.meta.total_items, 1);
});

test('reading history endpoints reject unauthenticated request', async () => {
  const response = await request(app).get('/api/reading-history/ids');
  assert.equal(response.status, 401);
});

// ===================== STEP PROGRESS =====================

test('first toggle marks step completed, second toggle flips it back', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'progress.user1@coconexus.local' });

  const firstToggle = await request(app)
    .post(`/api/step-progress/${article.id}/0`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(firstToggle.status, 200);
  assert.equal(firstToggle.body.data.completed, true);

  const secondToggle = await request(app)
    .post(`/api/step-progress/${article.id}/0`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(secondToggle.status, 200);
  assert.equal(secondToggle.body.data.completed, false);

  const thirdToggle = await request(app)
    .post(`/api/step-progress/${article.id}/0`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(thirdToggle.body.data.completed, true);
});

test('get progress returns only completed step indexes', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'progress.user2@coconexus.local' });

  await request(app).post(`/api/step-progress/${article.id}/0`).set('Authorization', `Bearer ${token}`);
  await request(app).post(`/api/step-progress/${article.id}/1`).set('Authorization', `Bearer ${token}`);
  await request(app).post(`/api/step-progress/${article.id}/1`).set('Authorization', `Bearer ${token}`);

  const progressResponse = await request(app)
    .get(`/api/step-progress/${article.id}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(progressResponse.status, 200);
  assert.deepEqual(progressResponse.body.data.completed_steps, [0]);
});

test('toggle step on nonexistent article returns 404', async () => {
  const { token } = await registerAndLoginUser({ email: 'progress.user3@coconexus.local' });

  const response = await request(app)
    .post('/api/step-progress/999999/0')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 404);
});

test('reset progress clears all steps for the article', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'progress.user4@coconexus.local' });

  await request(app).post(`/api/step-progress/${article.id}/0`).set('Authorization', `Bearer ${token}`);
  await request(app).post(`/api/step-progress/${article.id}/1`).set('Authorization', `Bearer ${token}`);

  const resetResponse = await request(app)
    .delete(`/api/step-progress/${article.id}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(resetResponse.status, 200);
  assert.equal(resetResponse.body.data.reset, true);

  const progressResponse = await request(app)
    .get(`/api/step-progress/${article.id}`)
    .set('Authorization', `Bearer ${token}`);
  assert.deepEqual(progressResponse.body.data.completed_steps, []);
});

test('toggle step rejects invalid step index', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'progress.user5@coconexus.local' });

  const response = await request(app)
    .post(`/api/step-progress/${article.id}/-1`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 400);
});

test('step progress endpoints reject unauthenticated request', async () => {
  const response = await request(app).get('/api/step-progress/1');
  assert.equal(response.status, 401);
});

// ===================== ARTICLE RATING =====================

test('user can rate a published article and average/count are computed', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'rating.user1@coconexus.local' });

  const response = await request(app)
    .post(`/api/articles/published/${article.id}/rating`)
    .set('Authorization', `Bearer ${token}`)
    .send({ rating: 4 });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.user_rating, 4);
  assert.equal(response.body.data.average, 4);
  assert.equal(response.body.data.count, 1);
});

test('rating same article again updates rating instead of duplicating', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'rating.user2@coconexus.local' });

  await request(app)
    .post(`/api/articles/published/${article.id}/rating`)
    .set('Authorization', `Bearer ${token}`)
    .send({ rating: 3 });
  const secondResponse = await request(app)
    .post(`/api/articles/published/${article.id}/rating`)
    .set('Authorization', `Bearer ${token}`)
    .send({ rating: 5 });

  assert.equal(secondResponse.body.data.user_rating, 5);
  assert.equal(secondResponse.body.data.count, 1);
  assert.equal(secondResponse.body.data.average, 5);
});

test('rating rejects values outside 1-5 range', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'rating.user3@coconexus.local' });

  const tooLow = await request(app)
    .post(`/api/articles/published/${article.id}/rating`)
    .set('Authorization', `Bearer ${token}`)
    .send({ rating: 0 });
  assert.equal(tooLow.status, 400);

  const tooHigh = await request(app)
    .post(`/api/articles/published/${article.id}/rating`)
    .set('Authorization', `Bearer ${token}`)
    .send({ rating: 6 });
  assert.equal(tooHigh.status, 400);
});

test('rating a nonexistent article returns 404', async () => {
  const { token } = await registerAndLoginUser({ email: 'rating.user4@coconexus.local' });

  const response = await request(app)
    .post('/api/articles/published/999999/rating')
    .set('Authorization', `Bearer ${token}`)
    .send({ rating: 3 });
  assert.equal(response.status, 404);
});

test('get rating works without authentication and reports null user_rating', async () => {
  const { article } = await setupWriterAndPublishedArticle();
  const { token } = await registerAndLoginUser({ email: 'rating.user5@coconexus.local' });

  await request(app)
    .post(`/api/articles/published/${article.id}/rating`)
    .set('Authorization', `Bearer ${token}`)
    .send({ rating: 4 });

  const publicResponse = await request(app).get(`/api/articles/published/${article.id}/rating`);
  assert.equal(publicResponse.status, 200);
  assert.equal(publicResponse.body.data.average, 4);
  assert.equal(publicResponse.body.data.count, 1);
  assert.equal(publicResponse.body.data.user_rating, null);
});

test('get rating on nonexistent article returns zeroed stats instead of 404', async () => {
  const response = await request(app).get('/api/articles/published/999999/rating');
  assert.equal(response.status, 200);
  assert.equal(response.body.data.average, 0);
  assert.equal(response.body.data.count, 0);
});

// ===================== AUDIT LOG =====================

test('admin can view audit log entries created by other actions', async () => {
  const { user: writer, plainPassword } = await createModeratorUser({
    email: 'penata.audit@coconexus.local',
    moderator_type: 'tag',
  });
  const writerLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: writer.email, password: plainPassword });

  await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${writerLogin.body.data.token}`)
    .send({ name: 'Kategori Audit Test' });

  const { user: admin, plainPassword: adminPassword } = await createAdminUser({ email: 'admin.audit@coconexus.local' });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: admin.email, password: adminPassword });

  const auditResponse = await request(app)
    .get('/api/admin/audit-logs')
    .set('Authorization', `Bearer ${adminLogin.body.data.token}`);

  assert.equal(auditResponse.status, 200);
  assert.ok(auditResponse.body.data.logs.length >= 1);
  const categoryLog = auditResponse.body.data.logs.find((log) => log.action === 'tag.create_category');
  assert.ok(categoryLog, 'expected a tag.create_category audit log entry');
  assert.equal(categoryLog.actor.email, writer.email);
});

test('non-admin cannot access audit log endpoint', async () => {
  const { token } = await registerAndLoginUser({ email: 'audit.user@coconexus.local' });
  const response = await request(app)
    .get('/api/admin/audit-logs')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 403);
});

test('unauthenticated request cannot access audit log endpoint', async () => {
  const response = await request(app).get('/api/admin/audit-logs');
  assert.equal(response.status, 401);
});
