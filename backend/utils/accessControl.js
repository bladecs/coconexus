'use strict';

const ROLES = ['admin', 'pengelola', 'moderator', 'user'];
const PENGELOLA_JOBS = [
  'Penulis Artikel',
  'Editor Konten',
  'Validator Artikel',
  'Publisher Artikel',
  'Pengelola Tag/Kategori',
];
const ARTICLE_MANAGEMENT_JOBS = ['Penulis Artikel', 'Editor Konten'];
const ARTICLE_REVIEW_JOBS = ['Editor Konten', 'Validator Artikel'];
const ARTICLE_PUBLISH_JOBS = ['Publisher Artikel'];
const CATEGORY_MANAGEMENT_JOBS = ['Pengelola Tag/Kategori'];
const PENGELOLA_MODULES = [
  'article_creation',
  'article_review',
  'article_publishing',
  'category_and_tag_management',
];
const MODERATOR_TYPES = [
  'content',
  'publication',
  'forum',
  'tag',
];
const MODERATOR_MODULES = {
  content: ['review_article_revision'],
  publication: ['publish_article'],
  forum: ['review_comment', 'approve_comment', 'reject_comment', 'delete_comment'],
  tag: ['review_tag_and_category_changes'],
};

function normalizeRole(role) {
  return typeof role === 'string' ? role.trim().toLowerCase() : '';
}

function isValidRole(role) {
  return ROLES.includes(normalizeRole(role));
}

function normalizeModeratorType(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isValidModeratorType(value) {
  return MODERATOR_TYPES.includes(normalizeModeratorType(value));
}

function hasPengelolaJob(user, ...allowedJobs) {
  if (!user || user.role !== 'pengelola') {
    return false;
  }

  const jobTitle = typeof user.profile?.job_title === 'string' ? user.profile.job_title.trim() : '';
  return Boolean(jobTitle) && allowedJobs.includes(jobTitle);
}

function hasModeratorScope(user, ...allowedScopes) {
  if (!user || user.role !== 'moderator') {
    return false;
  }

  const scope = normalizeModeratorType(user.moderatorAssignment?.moderator_type);
  return Boolean(scope) && allowedScopes.includes(scope);
}

module.exports = {
  ROLES,
  PENGELOLA_JOBS,
  ARTICLE_MANAGEMENT_JOBS,
  ARTICLE_REVIEW_JOBS,
  ARTICLE_PUBLISH_JOBS,
  CATEGORY_MANAGEMENT_JOBS,
  PENGELOLA_MODULES,
  MODERATOR_TYPES,
  MODERATOR_MODULES,
  normalizeRole,
  isValidRole,
  normalizeModeratorType,
  isValidModeratorType,
  hasPengelolaJob,
  hasModeratorScope,
};
