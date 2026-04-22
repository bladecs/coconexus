'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const common = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || 'coconexus_db',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: process.env.DB_DIALECT || 'mysql',
  timezone: '+07:00',
  define: {
    underscored: true,
    freezeTableName: true,
  },
};

module.exports = {
  development: {
    ...common,
    logging: false,
  },
  test: {
    ...common,
    database: process.env.DB_TEST_NAME || 'coconexus_db_test',
    logging: false,
  },
  production: {
    ...common,
    logging: false,
  },
};
