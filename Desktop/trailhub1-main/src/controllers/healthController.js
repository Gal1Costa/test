/* eslint-disable */
/**
 * @file Health controller
 */

/**
 * GET /healthz
 * Simple health endpoint.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function getHealth(req, res) {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
}

module.exports = { getHealth };
