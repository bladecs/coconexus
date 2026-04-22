'use strict';

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isValidEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
}

function isStrongPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeStatus(status) {
  return typeof status === 'string' ? status.trim().toLowerCase() : '';
}

function isValidArticleStatus(status) {
  const normalizedStatus = normalizeStatus(status);
  return ['draft', 'revision', 'published'].includes(normalizedStatus);
}

function normalizeCategoryName(name) {
  return typeof name === 'string' ? name.trim() : '';
}

module.exports = {
  normalizeEmail,
  isValidEmail,
  isStrongPassword,
  isNonEmptyString,
  normalizeStatus,
  isValidArticleStatus,
  normalizeCategoryName,
};
