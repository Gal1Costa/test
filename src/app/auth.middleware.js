/* eslint-disable */
// src/app/auth.middleware.js
const { verifyIdToken } = require('../adapters/firebase.auth');

/**
 * Dev-friendly auth:
 * - If x-dev-user header is present (JSON), use that as req.user.
 * - Otherwise, try Bearer token with verifyIdToken (stubbed for now).
 * - Fallback: visitor.
 */
async function authMiddleware(req, res, next) {
  try {
    const devHeader = req.headers['x-dev-user'];

    if (devHeader) {
      try {
        const parsed = JSON.parse(devHeader);
        req.user = {
          id: parsed.id || 'dev-user',
          email: parsed.email || null,
          role: parsed.role || 'hiker',
        };
        return next();
      } catch (e) {
        // ignore parse error, continue to token flow
      }
    }

    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

    if (token) {
      const data = await verifyIdToken(token);
      if (data) {
        req.user = {
          id: data.uid,
          email: data.email || null,
          role: data.role || 'hiker',
        };
        return next();
      }
    }

    // default: visitor
    req.user = { role: 'visitor' };
    next();
  } catch (err) {
    req.user = { role: 'visitor' };
    next();
  }
}

module.exports = { authMiddleware };

