/* eslint-disable */
// src/app/roles.middleware.js

/**
 * Usage:
 *  requireRole('admin')
 *  requireRole('hiker', 'guide')
 *  requireRole(['visitor', 'hiker'])
 */
function requireRole(...roles) {
  const allowed = Array.isArray(roles[0]) ? roles[0] : roles;

  return (req, res, next) => {
    const role = (req.user && req.user.role) || 'visitor';

    if (!allowed.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

module.exports = { requireRole };

