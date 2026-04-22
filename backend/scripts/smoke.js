'use strict';

require('../config/env');

const request = require('supertest');
const app = require('../app');

async function run() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@coconexus.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin12345';
  const uniqueSuffix = Date.now();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: adminEmail,
      password: adminPassword,
    });

  if (loginResponse.status !== 200) {
    throw new Error(`Login smoke test gagal: ${JSON.stringify(loginResponse.body)}`);
  }

  const token = loginResponse.body.data.token;

  const uploadResponse = await request(app)
    .post('/api/uploads/articles')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', Buffer.from('sample image payload'), 'smoke-test-image.png');

  if (uploadResponse.status !== 201) {
    throw new Error(`Upload smoke test gagal: ${JSON.stringify(uploadResponse.body)}`);
  }

  const createResponse = await request(app)
    .post('/api/articles/admin')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: `Smoke Test Article ${uniqueSuffix}`,
      body_content: 'Artikel ini dibuat otomatis untuk pengujian smoke test pada database development.',
      meta_description: 'Smoke test article',
      status: 'draft',
      category: {
        name: `Smoke Category ${uniqueSuffix}`,
      },
      media: [
        {
          file_path: uploadResponse.body.data.media.file_path,
          media_type: uploadResponse.body.data.media.media_type,
        },
      ],
    });

  if (createResponse.status !== 201) {
    throw new Error(`Create article smoke test gagal: ${JSON.stringify(createResponse.body)}`);
  }

  const articleId = createResponse.body.data.article.id;

  const publishResponse = await request(app)
    .patch(`/api/articles/admin/${articleId}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      status: 'published',
    });

  if (publishResponse.status !== 200) {
    throw new Error(`Publish smoke test gagal: ${JSON.stringify(publishResponse.body)}`);
  }

  const publishedListResponse = await request(app).get('/api/articles/published');

  if (publishedListResponse.status !== 200) {
    throw new Error(`Published list smoke test gagal: ${JSON.stringify(publishedListResponse.body)}`);
  }

  await request(app)
    .delete(`/api/articles/admin/${articleId}`)
    .set('Authorization', `Bearer ${token}`);

  console.log('Smoke test succeeded: login, upload, create draft, publish, list published, delete article.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
