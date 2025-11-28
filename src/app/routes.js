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

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

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

// POST /api/hikes (supports multipart: cover image and optional gpx file)
router.post('/api/hikes', upload.fields([{ name: 'cover' }, { name: 'gpx' }]), async (req, res, next) => {
  try {
    if (!hikesRepo?.createHike) return res.status(501).json({ error: 'createHike not implemented' });

    // Build data object from form fields
    const body = req.body || {};
    const data = {
      title: body.name || body.title || 'Untitled hike',
      description: body.description || null,
      difficulty: body.difficulty || null,
      distance: body.distance || null,
      duration: body.duration || null,
      price: body.price ? parseInt(body.price, 10) : null,
      capacity: body.capacity ? parseInt(body.capacity, 10) : null,
      date: body.date ? new Date(body.date) : null,
      meetingTime: body.meetingTime || null,
      location: body.location || null,
    };

    // Handle files: cover and gpx
    const adapters = req.app?.locals?.adapters || {};
    const storageAdapter = adapters.firebaseStorage;

    // Helper to save buffer locally
    function saveLocal(folder, filename, buffer) {
      const uploadsRoot = path.join(__dirname, '../../uploads');
      const destDir = path.join(uploadsRoot, folder);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const destPath = path.join(destDir, filename);
      fs.writeFileSync(destPath, buffer);
      // return web-accessible path
      return `/uploads/${folder}/${filename}`;
    }

    if (req.files) {
      // cover
      const coverArr = req.files['cover'];
      if (coverArr && coverArr.length > 0) {
        const f = coverArr[0];
        const key = `covers/${Date.now()}-${f.originalname}`;
        let uploaded = null;
        try {
          if (storageAdapter?.uploadObject) {
            uploaded = await storageAdapter.uploadObject(key, f.buffer, f.mimetype);
          }
        } catch (e) {
          console.warn('Storage adapter upload failed, falling back to local save', e.message || e);
        }
        if (uploaded && uploaded.url) {
          data.coverUrl = uploaded.url;
        } else {
          // local fallback
          const fname = `${Date.now()}-${f.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          data.coverUrl = saveLocal('covers', fname, f.buffer);
        }
      }

      // gpx
      const gpxArr = req.files['gpx'];
      if (gpxArr && gpxArr.length > 0) {
        const g = gpxArr[0];
        const key = `gpx/${Date.now()}-${g.originalname}`;
        let uploadedG = null;
        try {
          if (storageAdapter?.uploadObject) {
            uploadedG = await storageAdapter.uploadObject(key, g.buffer, g.mimetype);
          }
        } catch (e) {
          console.warn('Storage adapter upload failed, falling back to local save', e.message || e);
        }
        if (uploadedG && uploadedG.url) {
          data.gpxPath = uploadedG.url;
        } else {
          const fname = `${Date.now()}-${g.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          data.gpxPath = saveLocal('gpx', fname, g.buffer);
        }
      }
    }
    // Attach guideId from authenticated user (require guide profile)
    try {
      const firebaseUid = req.user?.firebaseUid || req.user?.id || null;
      if (!firebaseUid) {
        return res.status(401).json({ error: 'You must be authenticated to create a hike' });
      }

      if (!usersRepo || !usersRepo.getCurrentUserProfile) {
        console.warn('[routes] usersRepo.getCurrentUserProfile not available; cannot resolve guide');
        return res.status(500).json({ error: 'User repository not available' });
      }

      // getCurrentUserProfile will create the user record if needed and include guide when role=guide
      const profile = await usersRepo.getCurrentUserProfile(firebaseUid, req.user ? { email: req.user.email, name: req.user.name, role: req.user.role } : null);
      if (!profile) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Require that the user has a guide profile
      if (!profile.guide || !profile.guide.id) {
        return res.status(400).json({ error: 'You must have a guide profile to create hikes' });
      }

      data.guideId = profile.guide.id;
    } catch (e) {
      console.error('[routes] Error resolving guide for current user:', e);
      return res.status(500).json({ error: 'Unable to resolve guide for current user' });
    }

    const created = await hikesRepo.createHike(data);
    res.status(201).json(created);
  } catch (err) { next(err); }
});

// PUT /api/hikes/:id (supports multipart: cover image and optional gpx file)
router.put('/api/hikes/:id', upload.fields([{ name: 'cover' }, { name: 'gpx' }]), async (req, res, next) => {
  try {
    if (!hikesRepo?.updateHike) return res.status(501).json({ error: 'updateHike not implemented' });
    
    // Build data object from form fields
    const body = req.body || {};
    const data = {};
    
    // Only include fields that were provided
    if (body.title) data.title = body.title;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.difficulty) data.difficulty = body.difficulty;
    if (body.distance) data.distance = body.distance;
    if (body.duration) data.duration = body.duration;
    if (body.price !== undefined) data.price = body.price ? parseInt(body.price, 10) : null;
    if (body.capacity !== undefined) data.capacity = body.capacity ? parseInt(body.capacity, 10) : null;
    if (body.date) data.date = new Date(body.date);
    if (body.meetingTime !== undefined) data.meetingTime = body.meetingTime || null;
    if (body.location) data.location = body.location;

    // Handle files: cover and gpx (same logic as POST)
    const adapters = req.app?.locals?.adapters || {};
    const storageAdapter = adapters.firebaseStorage;

    // Helper to save buffer locally
    function saveLocal(folder, filename, buffer) {
      const uploadsRoot = path.join(__dirname, '../../uploads');
      const destDir = path.join(uploadsRoot, folder);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const destPath = path.join(destDir, filename);
      fs.writeFileSync(destPath, buffer);
      return `/uploads/${folder}/${filename}`;
    }

    if (req.files) {
      // cover
      const coverArr = req.files['cover'];
      if (coverArr && coverArr.length > 0) {
        const f = coverArr[0];
        const key = `covers/${Date.now()}-${f.originalname}`;
        let uploaded = null;
        try {
          if (storageAdapter?.uploadObject) {
            uploaded = await storageAdapter.uploadObject(key, f.buffer, f.mimetype);
          }
        } catch (e) {
          console.warn('Storage adapter upload failed, falling back to local save', e.message || e);
        }
        if (uploaded && uploaded.url) {
          data.coverUrl = uploaded.url;
        } else {
          const fname = `${Date.now()}-${f.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          data.coverUrl = saveLocal('covers', fname, f.buffer);
        }
      }

      // gpx
      const gpxArr = req.files['gpx'];
      if (gpxArr && gpxArr.length > 0) {
        const g = gpxArr[0];
        const key = `gpx/${Date.now()}-${g.originalname}`;
        let uploadedG = null;
        try {
          if (storageAdapter?.uploadObject) {
            uploadedG = await storageAdapter.uploadObject(key, g.buffer, g.mimetype);
          }
        } catch (e) {
          console.warn('Storage adapter upload failed, falling back to local save', e.message || e);
        }
        if (uploadedG && uploadedG.url) {
          data.gpxPath = uploadedG.url;
        } else {
          const fname = `${Date.now()}-${g.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          data.gpxPath = saveLocal('gpx', fname, g.buffer);
        }
      }
    }

    // Verify the user owns this hike before allowing update
    const firebaseUid = req.user?.firebaseUid || req.user?.id || null;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'You must be authenticated to update a hike' });
    }

    if (!usersRepo || !usersRepo.getCurrentUserProfile) {
      console.warn('[routes] usersRepo.getCurrentUserProfile not available; cannot verify ownership');
      return res.status(500).json({ error: 'User repository not available' });
    }

    const profile = await usersRepo.getCurrentUserProfile(firebaseUid, req.user ? { email: req.user.email, name: req.user.name, role: req.user.role } : null);
    if (!profile || !profile.guide) {
      return res.status(403).json({ error: 'Only guides can edit hikes' });
    }

    // Check if the hike belongs to this guide
    const hike = await hikesRepo.getHikeById(req.params.id);
    if (!hike || hike.guideId !== profile.guide.id) {
      return res.status(403).json({ error: 'You can only edit your own hikes' });
    }

    const updated = await hikesRepo.updateHike(req.params.id, data);
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
