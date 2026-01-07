/* eslint-disable */
/**
 * BaseRepository provides shared helpers for repositories.
 */
const { getPool } = require('../gateway/db');

class BaseRepository {
  /** @protected */ pool;

  constructor() {
    this.pool = getPool();
  }

  /**
   * Run a simple read-only query.
   * @param {string} text
   * @param {any[]} [params]
   * @returns {Promise<import('pg').QueryResult<any>>}
   */
  async query(text, params = []) {
    return this.pool.query(text, params);
  }
}

module.exports = { BaseRepository };
