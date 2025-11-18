/* eslint-disable */
class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

class UnauthorizedError extends AppError { constructor(message = 'Unauthorized') { super(message, 401); } }
class ForbiddenError extends AppError { constructor(message = 'Forbidden') { super(message, 403); } }
class NotFoundError extends AppError { constructor(message = 'Not Found') { super(message, 404); } }

/**
 * Centralized error handler middleware.
 */
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
}

module.exports = { AppError, UnauthorizedError, ForbiddenError, NotFoundError, errorHandler };
