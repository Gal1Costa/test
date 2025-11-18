/* eslint-disable */
const { Router } = require('express');
const router = Router();

const hikesRepo = require('../modules/hikes/repository');

let bookingsRepo;
try {
  bookingsRepo = require('../modules/bookings/repository');
} catch (e) {
  console.warn('[routes] bookings repo missing:', e.message);
}

let usersRepo;
try {
  usersRepo = require('../modules/users/repository');
} catch (e) {
  console.warn('[routes] users repo missing:', e.message);
}

/* ------------------- HIKES ------------------- */

// GET /api/hikes
router.get('/api/hikes', async (_req, res, next) => {
  try {
    if (!hikesRepo?.listHikes) return res.status(501).json({ error: 'listHikes not implemented' });
    const data = await hikesRepo.listHikes();
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/hikes/:id
router.get('/api/hikes/:id', async (req, res, next) => {
  try {
    if (!hikesRepo?.getHikeById) return res.status(501).json({ error: 'getHikeById not implemented' });
    const row = await hikesRepo.getHikeById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) { next(err); }
});

// POST /api/hikes
router.post('/api/hikes', async (req, res, next) => {
  try {
    if (!hikesRepo?.createHike) return res.status(501).json({ error: 'createHike not implemented' });
    const created = await hikesRepo.createHike(req.body);
    res.status(201).json(created);
  } catch (err) { next(err); }
});

// PUT /api/hikes/:id
router.put('/api/hikes/:id', async (req, res, next) => {
  try {
    if (!hikesRepo?.updateHike) return res.status(501).json({ error: 'updateHike not implemented' });
    const updated = await hikesRepo.updateHike(req.params.id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/hikes/:id
router.delete('/api/hikes/:id', async (req, res, next) => {
  try {
    if (!hikesRepo?.deleteHike) return res.status(501).json({ error: 'deleteHike not implemented' });
    await hikesRepo.deleteHike(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

/* ------------------- JOIN / LEAVE ------------------- */

// POST /api/hikes/:id/join
router.post('/api/hikes/:id/join', async (req, res, next) => {
  try {
    if (!bookingsRepo?.createBooking) {
      return res.status(501).json({ error: 'createBooking not implemented' });
    }

    const hikeId = req.params.id;
    const status = (req.body && req.body.status) || 'pending';

    console.log('[join] /api/hikes/:id/join', { hikeId, status });

    const booking = await bookingsRepo.createBooking({ hikeId, status });
    res.status(201).json(booking);
  } catch (err) {
    if (err.code === 'HIKE_FULL' || err.message === 'Hike is full') {
      return res.status(400).json({ error: 'This hike is full' });
    }
    console.error('Join error:', err);
    next(err);
  }
});

// DELETE /api/hikes/:id/join  (leave)
router.delete('/api/hikes/:id/join', async (req, res, next) => {
  try {
    if (!bookingsRepo?.deleteBookingForCurrentUserAndHike) {
      return res.status(501).json({ error: 'deleteBookingForCurrentUserAndHike not implemented' });
    }

    const hikeId = req.params.id;

    console.log('[leave] /api/hikes/:id/join', { hikeId });

    const deleted = await bookingsRepo.deleteBookingForCurrentUserAndHike(hikeId);
    if (!deleted) {
      return res.status(404).json({ error: 'No booking found for this hike' });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Leave error:', err);
    next(err);
  }
});

/* ------------------- PROFILE / USER ------------------- */

// central handler: builds "current user profile" shape
async function handleProfile(req, res, next) {
  try {
    if (!usersRepo?.getCurrentUserProfile) {
      return res.status(501).json({ error: 'getCurrentUserProfile not implemented' });
    }
    const profile = await usersRepo.getCurrentUserProfile();
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

router.get('/api/users/me', handleProfile);
router.get('/api/me', handleProfile);
router.get('/api/profile', handleProfile);

// fallback: any GET /api/* route containing "me" or "profile"
router.get('/api/*', (req, res, next) => {
  const p = req.path.toLowerCase();
  if (p.includes('me') || p.includes('profile')) {
    return handleProfile(req, res, next);
  }
  return next();
});

module.exports = router;
