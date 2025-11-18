/* eslint-disable */
const { Pool } = require('pg');
const { config } = require('../app/config');
const logger = require('./logger');

/** @type {Pool|undefined} */
let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: config.databaseUrl });
  }
  return pool;
}

async function connectPool() {
  try {
    const p = getPool();
    await p.query('SELECT 1');
    return p;
  } catch (err) {
    console.warn('Database connection failed (expected in dev without PostgreSQL):', err.message);
    return null;
  }
}

module.exports = { getPool, connectPool };
