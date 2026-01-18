/* eslint-disable */
/**
 * @typedef {('visitor'|'hiker'|'guide'|'admin')} Role
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {Role} role
 */

/**
 * @typedef {Object} Trail
 * @property {string} id
 * @property {string} name
 * @property {string} difficulty
 * @property {number[]} coordinates // [lng, lat]
 */

module.exports = {};
