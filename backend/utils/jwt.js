'use strict';

const jwt = require('jsonwebtoken');
const { unauthorized } = require('./httpErrors');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET belum dikonfigurasi pada environment.');
  }

  return secret;
}

function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    throw unauthorized('Token tidak valid atau sudah kedaluwarsa.');
  }
}

module.exports = {
  generateToken,
  verifyToken,
};
