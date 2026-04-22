'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const requiredVariables = ['JWT_SECRET'];

function validateEnvironment() {
  const missingVariables = requiredVariables.filter((key) => !process.env[key]);

  if (missingVariables.length > 0) {
    throw new Error(`Environment variable wajib belum diisi: ${missingVariables.join(', ')}`);
  }
}

function getCorsOrigins() {
  const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:5173';

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

module.exports = {
  validateEnvironment,
  getCorsOrigins,
};
