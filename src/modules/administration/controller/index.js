/* eslint-disable */
const { Router } = require('express');

const router = Router();

// GET /api/admin/overview
router.get('/overview', (req, res) => {
  res.status(200).json({ users: 0, guides: 0, hikes: 0 });
});

module.exports = router;
