const mysql = require('mysql2/promise');
(async () => {
  try {
    const c = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'coconexus_db',
    });

    const [[a]] = await c.query('SELECT COUNT(*) as cnt FROM article');
    const [[d]] = await c.query('SELECT COUNT(*) as cnt FROM articledetail');
    const [[m]] = await c.query('SELECT COUNT(*) as cnt FROM articlemedia');

    console.log('articles=' + a.cnt + ' details=' + d.cnt + ' media=' + m.cnt);
    await c.end();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
