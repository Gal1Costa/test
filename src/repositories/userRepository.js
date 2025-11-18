/* eslint-disable */
const { BaseRepository } = require('./baseRepository');

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {('visitor'|'hiker'|'guide'|'admin')} role
 */

class UserRepository extends BaseRepository {
  /**
   * Find user by id.
   * @param {string} id
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    void id;
    return null;
  }
}

module.exports = { UserRepository };
