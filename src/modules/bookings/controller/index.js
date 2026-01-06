/* eslint-disable */
const { Router } = require('express');
const { requireRole } = require('../../../app/roles.middleware');

const router = Router();

// POST /api/bookings
router.post('/', requireRole(['hiker','guide','admin']), (req, res) => {
  res.status(201).json({ id: 'b1', status: 'created' }); // TODO
});

// DELETE /api/bookings/:id
router.delete('/:id', requireRole(['hiker','guide','admin']), (req, res) => {
  res.status(204).send(); // TODO
});

module.exports = router;
