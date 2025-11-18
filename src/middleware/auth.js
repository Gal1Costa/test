// Re-exports authentication and role middlewares from /app/ folder.
// This avoids duplication and keeps logic centralized.

module.exports = {
  ...require('../app/auth.middleware'),
  ...require('../app/roles.middleware'),
};
