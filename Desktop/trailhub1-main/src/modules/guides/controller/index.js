/* eslint-disable */
// This file handles guide-related API requests - like getting guide info or updating profiles
const { Router } = require('express');
const { requireRole } = require('../../../app/roles.middleware');

const router = Router();

// Get a specific guide's profile - anyone can view guide profiles
router.get('/:id', requireRole(['visitor','hiker','guide','admin']), (req, res) => {
  const { id } = req.params;
  res.status(200).json({ id, profile: { bio: null }, verified: false });
});

// Update my own guide profile
router.patch('/me', requireRole(['guide','admin']), (req, res) => {
  res.status(200).json({ updated: true }); // TODO
});

module.exports = router;
