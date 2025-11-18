/* eslint-disable */
/**
 * Request logger middleware.
 * Keep minimal to avoid performance overhead.
 */
function requestLogger(req, res, next) {
  // Minimal structured log
  console.log(JSON.stringify({
    level: 'info',
    msg: 'request',
    method: req.method,
    url: req.originalUrl,
  }));
  next();
}

module.exports = { requestLogger };
