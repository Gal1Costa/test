/* eslint-disable */
// This file handles user-related API requests - like getting user profiles
const { Router } = require('express');
const { requireRole } = require('../../../app/roles.middleware');

const router = Router();

// Get a specific user's profile - need to be logged in (hiker, guide, or admin)
router.get('/:id', requireRole(['hiker','guide','admin']), (req, res) => {
  const { id } = req.params;
  res.status(200).json({ id, email: null, role: 'hiker' }); // TODO: fetch from repository
});

module.exports = router;
