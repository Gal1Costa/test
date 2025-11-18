/* eslint-disable */
const { Router } = require('express');
const healthRouter = require('./health');

/**
 * Main application router.
 */
const router = Router();

router.use('/healthz', healthRouter);

// Placeholder route to confirm server
router.get('/', (req, res) => {
  res.status(200).json({ name: 'TrailHub', status: 'ok' });
});

module.exports = router;
