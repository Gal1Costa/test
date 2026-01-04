/* eslint-disable */
const { Router } = require('express');
const { prisma } = require('../../../shared/prisma');

function getAdminAllowlist() {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  if (!email) return false;
  return getAdminAllowlist().includes(String(email).toLowerCase());
}

const router = Router();

// GET /api/dev/enabled -> returns whether dev endpoints are available
router.get('/enabled', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ enabled: false });
    }
    return res.json({ enabled: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
