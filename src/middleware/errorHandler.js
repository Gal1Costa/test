/* eslint-disable */
/**
 * Not Found handler.
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({ error: 'Not Found' });
}

/**
 * Error handler.
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
}

module.exports = { notFoundHandler, errorHandler };
