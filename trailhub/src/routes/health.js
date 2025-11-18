/* eslint-disable */
const { Router } = require('express');
const { getHealth } = require('../controllers/healthController');

/**
 * Health check routes
 */
const router = Router();

router.get('/', getHealth);

module.exports = router;
