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

    // Check if user is authenticated
    if (!req.user || req.user.role === 'visitor') {
      return res.status(401).json({ error: 'You must be logged in to join a hike' });
    }

    // Get user ID from database (not just Firebase UID)
    const firebaseUid = req.user?.firebaseUid || req.user?.id;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unable to identify user' });
    }

    const user = await usersRepo.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hikeId = req.params.id;
    const status = (req.body && req.body.status) || 'pending';

    console.log('[join] /api/hikes/:id/join', { hikeId, status, userId: user.id });

    const booking = await bookingsRepo.createBooking({ hikeId, status, userId: user.id });
    res.status(201).json(booking);
  } catch (err) {
    if (err.code === 'HIKE_FULL' || err.message === 'Hike is full') {
      return res.status(400).json({ error: 'This hike is full' });
    }
    if (err.code === 'CANNOT_JOIN_OWN_HIKE' || err.message.includes('cannot join a hike that you created')) {
      return res.status(400).json({ error: 'You cannot join a hike that you created' });
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

    // Check if user is authenticated
    if (!req.user || req.user.role === 'visitor') {
      return res.status(401).json({ error: 'You must be logged in to leave a hike' });
    }

    // Get user ID from database (not just Firebase UID)
    const firebaseUid = req.user?.firebaseUid || req.user?.id;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unable to identify user' });
    }

    const user = await usersRepo.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hikeId = req.params.id;

    console.log('[leave] /api/hikes/:id/join', { 
      hikeId, 
      userId: user.id, 
      userRole: user.role,
      userEmail: user.email,
      firebaseUid: firebaseUid
    });

    const deleted = await bookingsRepo.deleteBookingForCurrentUserAndHike(hikeId, user.id);
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
    
    // Get firebaseUid from req.user (set by auth middleware)
    // Check both id and firebaseUid since different middlewares might use different property names
    const firebaseUid = req.user?.firebaseUid || req.user?.id || null;
    
    console.log('[handleProfile] Request from user:', {
      hasUser: !!req.user,
      firebaseUid,
      email: req.user?.email,
      role: req.user?.role,
      allUserProps: Object.keys(req.user || {}),
    });
    
    // Pass user info so we can create the user if they don't exist
    const userInfo = req.user ? {
      email: req.user.email,
      name: req.user.name,
      role: req.user.role, // This might be the default 'hiker' from auth middleware, but DB will have the real role
    } : null;
    
    if (!firebaseUid && req.user?.role !== 'visitor') {
      console.error('[handleProfile] No firebaseUid found but user is not a visitor!', req.user);
      return res.status(401).json({ error: 'Unable to identify user' });
    }
    
    const profile = await usersRepo.getCurrentUserProfile(firebaseUid, userInfo);
    
    console.log('[handleProfile] Returning profile:', {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      hasGuide: !!profile.guide,
      createdHikesCount: profile.createdHikes?.length || 0,
      bookingsCount: profile.bookings?.length || 0,
    });
    
    res.json(profile);
  } catch (err) {
    console.error('[handleProfile] Error:', err);
    next(err);
  }
}

// Mount users controller routes (includes /api/users/register)
const usersController = require('../modules/users/controller');
router.use('/api/users', usersController);

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
