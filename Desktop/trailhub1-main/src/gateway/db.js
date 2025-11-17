/* eslint-disable */
/**
 * PostgreSQL gateway using pg.Pool.
 * TODO: Add PostGIS-specific helpers as needed.
 */
const { Pool } = require('pg');

/**
 * @type {Pool}
 */
let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // ssl: { rejectUnauthorized: false }, // enable in production if needed
    });
  }
  return pool;
}

module.exports = { getPool };
