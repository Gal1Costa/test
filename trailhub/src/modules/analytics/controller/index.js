/* eslint-disable */
const { Router } = require('express');

const router = Router();

// GET /api/admin/analytics
router.get('/', (req, res) => {
  res.status(200).json({ activeUsers: 0, hikesCompleted: 0 });
});

module.exports = router;
