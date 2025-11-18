/* eslint-disable */
const { Router } = require('express');
const { requireRole } = require('../../../app/roles.middleware');

const router = Router();

// POST /api/reviews
router.post('/', requireRole(['hiker','guide','admin']), (req, res) => {
  res.status(201).json({ id: 'r1' });
});

// GET /api/reviews/guide/:id
router.get('/guide/:id', requireRole(['visitor','hiker','guide','admin']), (req, res) => {
  res.status(200).json([]);
});

// GET /api/reviews/hike/:id
router.get('/hike/:id', requireRole(['visitor','hiker','guide','admin']), (req, res) => {
  res.status(200).json([]);
});

module.exports = router;
