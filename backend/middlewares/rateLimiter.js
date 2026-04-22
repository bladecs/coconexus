'use strict';

const { createHttpError } = require('../utils/httpErrors');

function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  maxRequests = 100,
  keyGenerator = (req) => req.ip,
  message = 'Terlalu banyak request. Silakan coba lagi beberapa saat lagi.',
} = {}) {
  const bucket = new Map();

  return (req, res, next) => {
    const key = `${keyGenerator(req)}:${req.baseUrl}${req.path}`;
    const currentTime = Date.now();
    const entry = bucket.get(key);

    if (!entry || currentTime > entry.resetAt) {
      bucket.set(key, {
        count: 1,
        resetAt: currentTime + windowMs,
      });
      return next();
    }

    if (entry.count >= maxRequests) {
      return next(createHttpError(429, message));
    }

    entry.count += 1;
    return next();
  };
}

const apiRateLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 300),
});

const authRateLimiter = createRateLimiter({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000),
  maxRequests: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 20),
  message: 'Terlalu banyak percobaan autentikasi. Silakan tunggu beberapa menit lalu coba lagi.',
});

module.exports = {
  createRateLimiter,
  apiRateLimiter,
  authRateLimiter,
};
