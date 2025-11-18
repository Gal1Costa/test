/* eslint-disable */
const { verifyIdToken } = require('../adapters/firebase.auth');

/**
 * Auth middleware:
 * - If Authorization: Bearer <FirebaseIdToken> exists -> verify via Firebase Admin.
 * - Else if DEV_MODE (env) and x-dev-user header present -> use that (dev only).
 * - Else -> treat as visitor.
 */
async function authMiddleware(req, res, next) {
  try {
    let user = null;

    const authHeader = req.headers.authorization;

    // 1) Try Firebase ID token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.substring('Bearer '.length).trim();
      const decoded = await verifyIdToken(idToken);
      if (decoded) {
        user = {
          firebaseUid: decoded.uid,
          email: decoded.email || null,
          name: decoded.name || null,
          picture: decoded.picture || null,
          role: 'hiker', // default role, can be overridden based on DB later
        };
      }
    }

    // 2) Dev fallback via x-dev-user header
    const devMode =
      process.env.NODE_ENV === 'development' &&
      process.env.DEV_MODE === 'true';

    if (!user && devMode) {
      const header = req.headers['x-dev-user'];
      if (header) {
        try {
          user = JSON.parse(header);
        } catch (e) {
          console.warn('[authMiddleware] Failed to parse x-dev-user header');
        }
      }
    }

    // 3) Default to visitor
    if (!user) {
      user = { role: 'visitor' };
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[authMiddleware] Error:', err);
    next(err);
  }
}

module.exports = { authMiddleware };
