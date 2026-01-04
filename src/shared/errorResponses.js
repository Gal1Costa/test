/* eslint-disable */
/**
 * Standardized HTTP error response helpers to reduce duplication across controllers.
 * Usage: `return sendUnauthorized(res, 'Not authenticated')`
 */

const send400 = (res, error) => res.status(400).json({ error });
const send401 = (res, error = 'Unauthorized') => res.status(401).json({ error });
const send403 = (res, error = 'Forbidden') => res.status(403).json({ error });
const send404 = (res, error = 'Not found') => res.status(404).json({ error });
const send409 = (res, error = 'Conflict') => res.status(409).json({ error });
const send500 = (res, error = 'Internal server error') => res.status(500).json({ error });
const send501 = (res, error = 'Not implemented') => res.status(501).json({ error });

module.exports = {
  send400,
  send401,
  send403,
  send404,
  send409,
  send500,
  send501,
};
