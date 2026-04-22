'use strict';

function createHttpError(statusCode, message, errors = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errors = errors;
  return error;
}

function badRequest(message, errors = null) {
  return createHttpError(400, message, errors);
}

function unauthorized(message, errors = null) {
  return createHttpError(401, message, errors);
}

function forbidden(message, errors = null) {
  return createHttpError(403, message, errors);
}

function notFound(message, errors = null) {
  return createHttpError(404, message, errors);
}

function conflict(message, errors = null) {
  return createHttpError(409, message, errors);
}

module.exports = {
  createHttpError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
};
