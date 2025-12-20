/* eslint-disable */
const { Router } = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const repo = require('../repository');
const { handleFileUploads } = require('../utils/uploadHandler');
const { send400, send401, send403, send404, send500, send501 } = require('../../../shared/errorResponses');

let usersRepo;
try { usersRepo = require('../../users/repository'); } catch (e) { console.warn('[hikes/controller] users repo missing:', e.message); }
let bookingsRepo;
try { bookingsRepo = require('../../bookings/repository'); } catch (e) { console.warn('[hikes/controller] bookings repo missing:', e.message); }

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

/* ------------------- ROUTE FILE HELPERS ------------------- */

function ensureRoutesDir() {
  const routesDir = path.join(__dirname, '..', 'uploads', 'routes');
  if (!fs.existsSync(routesDir)) fs.mkdirSync(routesDir, { recursive: true });
  return routesDir;
}

function safeJsonParse(value, fallback) {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function saveRouteFile({ hikeId, mapLocation, points }) {
  const routesDir = ensureRoutesDir();
  const filename = `${hikeId}.json`;
  const absPath = path.join(routesDir, filename);

  const payload = {
    version: 1,
    hikeId,
    savedAt: new Date().toISOString(),
    mapLocation: mapLocation ?? null,
    points: Array.isArray(points) ? points : [],
  };

  fs.writeFileSync(absPath, JSON.stringify(payload, null, 2), 'utf-8');
  return `/hikes/uploads/routes/${filename}`; // public URL path
}

function readRouteFile(routePath) {
  if (!routePath) return null;
  try {
    const filename = path.basename(routePath);
    const absPath = path.join(__dirname, '..', 'uploads', 'routes', filename);
    const raw = fs.readFileSync(absPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function haversineKm(a, b) {
  const R = 6371; // km
  const toRad = (x) => (x * Math.PI) / 180;

  const lat1 = toRad(a[0]), lon1 = toRad(a[1]);
  const lat2 = toRad(b[0]), lon2 = toRad(b[1]);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(s));
}

function totalRouteKm(points) {
  if (!Array.isArray(points) || points.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += haversineKm(points[i - 1], points[i]);
  }
  return sum;
}


/* ------------------- HIKES ------------------- */

// GET /api/hikes
router.get('/', async (_req, res, next) => {
  try {
    if (!repo?.listHikes) return send501(res, 'listHikes not implemented');
    const data = await repo.listHikes();
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/hikes/:id  (includes route + mapLocation loaded from file)
router.get('/:id', async (req, res, next) => {
  try {
    if (!repo?.getHikeById) return send501(res, 'getHikeById not implemented');
    const row = await repo.getHikeById(req.params.id);
    if (!row) return send404(res);

    const routeData = readRouteFile(row.routePath);
    const route = routeData?.points ?? [];
    const mapLocation = routeData?.mapLocation ?? null;

    res.json({ ...row, route, mapLocation });
  } catch (err) { next(err); }
});

// POST /api/hikes  (multipart: cover image; route/mapLocation saved as JSON file)
router.post('/', upload.fields([{ name: 'cover' }]), async (req, res, next) => {
  try {
    if (!repo?.createHike) return send501(res, 'createHike not implemented');

    const body = req.body || {};

    // Map data comes as JSON strings in multipart form-data
    const routePoints = safeJsonParse(body.route, []);
    const mapLocation = safeJsonParse(body.mapLocation, null);

    const data = {
      title: body.name || body.title || 'Untitled hike',
      description: body.description || null,
      difficulty: body.difficulty || null,
      distance: (Array.isArray(routePoints) && routePoints.length > 1) ? `${totalRouteKm(routePoints).toFixed(1)} km` : (body.distance || null),
      duration: body.duration || null,
      elevationGain: body.elevationGain || null,
      price: body.price ? parseInt(body.price, 10) : null,
      capacity: body.capacity ? parseInt(body.capacity, 10) : null,
      date: body.date ? new Date(body.date) : null,
      meetingTime: body.meetingTime || null,
      meetingPlace: body.meetingPlace || null,
      whatToBring: body.whatToBring || null,
      location: body.location || null,
      
    };

    // Handle cover upload (Firebase or whatever adapter you use)
    const adapters = req.app?.locals?.adapters || {};
    await handleFileUploads({
      files: req.files,
      data,
      storageAdapter: adapters.firebaseStorage,
    });

    // Resolve guide from current user
    try {
      const firebaseUid = req.user?.firebaseUid || req.user?.id || null;
      if (!firebaseUid) return send401(res, 'You must be authenticated to create a hike');
      if (!usersRepo?.getCurrentUserProfile) {
        console.warn('[hikes/controller] usersRepo.getCurrentUserProfile not available');
        return send500(res, 'User repository not available');
      }

      const profile = await usersRepo.getCurrentUserProfile(
        firebaseUid,
        req.user ? { email: req.user.email, name: req.user.name, role: req.user.role } : null
      );

      if (!profile) return send404(res, 'User not found');
      if (!profile.guide?.id) return send400(res, 'You must have a guide profile to create hikes');
      data.guideId = profile.guide.id;
    } catch (e) {
      console.error('[hikes/controller] Error resolving guide:', e);
      return send500(res, 'Unable to resolve guide');
    }

    // Create hike in DB
    const created = await repo.createHike(data);

    // Save route JSON to src/modules/hikes/uploads/routes/<hikeId>.json and store routePath in DB
    let routePath = null;
    if (Array.isArray(routePoints) && routePoints.length > 0) {
      routePath = saveRouteFile({ hikeId: created.id, mapLocation, points: routePoints });

      if (repo?.updateHike) {
        await repo.updateHike(created.id, { routePath });
      }
    }

    return res.status(201).json({
      ...created,
      routePath: routePath || created.routePath || null,
      route: Array.isArray(routePoints) ? routePoints : [],
      mapLocation: mapLocation ?? null,
    });
  } catch (err) { next(err); }
});

// PUT /api/hikes/:id  (multipart: cover image; optionally updates route/mapLocation JSON file)
router.put('/:id', upload.fields([{ name: 'cover' }]), async (req, res, next) => {
  try {
    if (!repo?.updateHike) return send501(res, 'updateHike not implemented');

    const body = req.body || {};
    const data = {};

    // Optional map data
    const routePoints = safeJsonParse(body.route, null);      // null means "not provided"
    const mapLocation = safeJsonParse(body.mapLocation, null);

    if (body.title) data.title = body.title;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.difficulty) data.difficulty = body.difficulty;
    if (Array.isArray(routePoints) && routePoints.length > 1) {
      data.distance = `${totalRouteKm(routePoints).toFixed(1)} km`;
    } else if (body.distance) {
      data.distance = body.distance;
}

    if (body.elevationGain !== undefined) data.elevationGain = body.elevationGain || null;
    if (body.duration) data.duration = body.duration;
    if (body.price !== undefined) data.price = body.price ? parseInt(body.price, 10) : null;
    if (body.capacity !== undefined) data.capacity = body.capacity ? parseInt(body.capacity, 10) : null;
    if (body.date) data.date = new Date(body.date);
    if (body.meetingTime !== undefined) data.meetingTime = body.meetingTime || null;
    if (body.meetingPlace !== undefined) data.meetingPlace = body.meetingPlace || null;
    if (body.whatToBring !== undefined) data.whatToBring = body.whatToBring || null;
    if (body.location) data.location = body.location;

    // Handle cover upload
    const adapters = req.app?.locals?.adapters || {};
    await handleFileUploads({
      files: req.files,
      data,
      storageAdapter: adapters.firebaseStorage,
    });

    // Verify ownership
    const firebaseUid = req.user?.firebaseUid || req.user?.id || null;
    if (!firebaseUid) return send401(res, 'You must be authenticated to update a hike');

    if (!usersRepo?.getCurrentUserProfile) {
      console.warn('[hikes/controller] usersRepo not available');
      return send500(res, 'User repository not available');
    }

    const profile = await usersRepo.getCurrentUserProfile(
      firebaseUid,
      req.user ? { email: req.user.email, name: req.user.name, role: req.user.role } : null
    );

    if (!profile?.guide) return send403(res, 'Only guides can edit hikes');

    const hike = await repo.getHikeById(req.params.id);
    if (!hike || hike.guideId !== profile.guide.id) return send403(res, 'You can only edit your own hikes');

    const updated = await repo.updateHike(req.params.id, data);

    // If route was provided, save/overwrite route file and store routePath
    if (Array.isArray(routePoints) && routePoints.length > 0) {
      const routePath = saveRouteFile({ hikeId: req.params.id, mapLocation, points: routePoints });
      const updated2 = await repo.updateHike(req.params.id, { routePath });
      return res.json({ ...updated2, route: routePoints, mapLocation: mapLocation ?? null });
    }

    // Otherwise, include existing route if there is one
    const routeData = readRouteFile(updated.routePath);
    return res.json({
      ...updated,
      route: routeData?.points ?? [],
      mapLocation: routeData?.mapLocation ?? null,
    });
  } catch (err) { next(err); }
});

// DELETE /api/hikes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    if (!repo?.deleteHike) return send501(res, 'deleteHike not implemented');

    // Verify ownership (same logic as PUT endpoint)
    const firebaseUid = req.user?.firebaseUid || req.user?.id || null;
    if (!firebaseUid) return send401(res, 'You must be authenticated to delete a hike');

    if (!usersRepo?.getCurrentUserProfile) {
      console.warn('[hikes/controller] usersRepo not available');
      return send500(res, 'User repository not available');
    }

    const profile = await usersRepo.getCurrentUserProfile(
      firebaseUid,
      req.user ? { email: req.user.email, name: req.user.name, role: req.user.role } : null
    );

    if (!profile?.guide) return send403(res, 'Only guides can delete hikes');

    const hike = await repo.getHikeById(req.params.id);
    if (!hike) return send404(res, 'Hike not found');
    if (hike.guideId !== profile.guide.id) return send403(res, 'You can only delete your own hikes');

    await repo.deleteHike(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

/* ------------------- JOIN / LEAVE ------------------- */

// POST /api/hikes/:id/join
router.post('/:id/join', async (req, res, next) => {
  try {
    if (!bookingsRepo?.createBooking) return send501(res, 'createBooking not implemented');
    if (!req.user || req.user.role === 'visitor') return send401(res, 'You must be logged in to join a hike');

    const firebaseUid = req.user?.firebaseUid || req.user?.id;
    if (!firebaseUid) return send401(res, 'Unable to identify user');
    if (!usersRepo?.getUserByFirebaseUid) return send500(res, 'User repository not available');

    const user = await usersRepo.getUserByFirebaseUid(firebaseUid);
    if (!user) return send404(res, 'User not found');

    const hikeId = req.params.id;
    const status = (req.body?.status) || 'pending';
    const booking = await bookingsRepo.createBooking({ hikeId, status, userId: user.id });
    res.status(201).json(booking);
  } catch (err) {
    if (err.code === 'HIKE_FULL' || err.message === 'Hike is full') return send400(res, 'This hike is full');
    if (err.code === 'CANNOT_JOIN_OWN_HIKE' || (err.message?.includes('cannot join a hike that you created'))) return send400(res, 'You cannot join a hike that you created');
    console.error('[hikes] join error:', err);
    next(err);
  }
});

// DELETE /api/hikes/:id/join  (leave)
router.delete('/:id/join', async (req, res, next) => {
  try {
    if (!bookingsRepo?.deleteBookingForCurrentUserAndHike) return send501(res, 'deleteBookingForCurrentUserAndHike not implemented');
    if (!req.user || req.user.role === 'visitor') return send401(res, 'You must be logged in to leave a hike');

    const firebaseUid = req.user?.firebaseUid || req.user?.id;
    if (!firebaseUid) return send401(res, 'Unable to identify user');
    if (!usersRepo?.getUserByFirebaseUid) return send500(res, 'User repository not available');

    const user = await usersRepo.getUserByFirebaseUid(firebaseUid);
    if (!user) return send404(res, 'User not found');

    const hikeId = req.params.id;
    const deleted = await bookingsRepo.deleteBookingForCurrentUserAndHike(hikeId, user.id);
    if (!deleted) return send404(res, 'No booking found for this hike');

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[hikes] leave error:', err);
    next(err);
  }
});

module.exports = router;
