'use strict';

const {
  PENGELOLA_JOBS,
  normalizeModeratorType,
  isValidModeratorType,
  ROLES,
} = require('./accessControl');

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

const COMMENT_STATUSES = ['pending', 'approved', 'rejected'];

function normalizeJobTitle(jobTitle) {
  return typeof jobTitle === 'string' ? jobTitle.trim() : '';
}

function isValidPengelolaJob(jobTitle) {
  return PENGELOLA_JOBS.includes(normalizeJobTitle(jobTitle));
}

function normalizeCommentStatus(status) {
  return typeof status === 'string' ? status.trim().toLowerCase() : '';
}

function isValidCommentStatus(status) {
  return COMMENT_STATUSES.includes(normalizeCommentStatus(status));
}

module.exports = {
  normalizeEmail,
  isValidEmail,
  isStrongPassword,
  isNonEmptyString,
  normalizeStatus,
  isValidArticleStatus,
  normalizeCategoryName,
  normalizeJobTitle,
  isValidPengelolaJob,
  PENGELOLA_JOBS,
  normalizeModeratorType,
  isValidModeratorType,
  ROLES,
  normalizeCommentStatus,
  isValidCommentStatus,
  COMMENT_STATUSES,
};
