'use strict';

const compression = require('compression');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const { getCorsOrigins } = require('./config/env');
const { uploadRoot } = require('./config/storage');
const { apiRateLimiter } = require('./middlewares/rateLimiter');

const app = express();
const allowedOrigins = getCorsOrigins();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin tidak diizinkan oleh konfigurasi CORS.'));
    },
    credentials: true,
  })
);
app.use(compression());
app.use(morgan(process.env.LOG_LEVEL || 'dev'));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'COCONEXUS backend is running.',
  });
});

app.use('/uploads', express.static(path.join(uploadRoot)));
app.use('/api', apiRateLimiter, routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
