/* eslint-disable */
// This file handles user-related API requests - like getting user profiles
const { Router } = require('express');
const { requireRole } = require('../../../app/roles.middleware');
const usersRepo = require('../repository');

const router = Router();

// POST /api/users/register - Register a new user after Firebase signup
// Note: This endpoint does NOT require authentication (public endpoint for new signups)
router.post('/register', async (req, res, next) => {
  try {
    console.log('[users/register] Received registration request:', { 
      firebaseUid: req.body.firebaseUid, 
      email: req.body.email, 
      role: req.body.role 
    });

    const { firebaseUid, email, name, role } = req.body;

    if (!firebaseUid || !email) {
      console.error('[users/register] Missing required fields:', { firebaseUid: !!firebaseUid, email: !!email });
      return res.status(400).json({ error: 'firebaseUid and email are required' });
    }

    // Validate role
    const validRoles = ['hiker', 'guide'];
    const userRole = validRoles.includes(role) ? role : 'hiker';

    console.log('[users/register] Creating/updating user with role:', userRole);
    const user = await usersRepo.createOrUpdateUser({
      firebaseUid,
      email,
      name,
      role: userRole,
    });

    console.log('[users/register] User created/updated successfully:', { id: user.id, email: user.email, role: user.role });

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.error('[users/register] User registration error:', err);
    console.error('[users/register] Error details:', {
      code: err.code,
      message: err.message,
      meta: err.meta,
    });
    if (err.code === 'P2002') {
      // Prisma unique constraint violation
      return res.status(409).json({ error: 'User with this email or Firebase UID already exists' });
    }
    next(err);
  }
});

// PATCH /api/users/profile - Update current user's profile
router.patch('/profile', requireRole(['hiker', 'guide', 'admin']), async (req, res, next) => {
  try {
    const firebaseUid = req.user?.firebaseUid || req.user?.id;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await usersRepo.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'hiker') {
      const updated = await usersRepo.updateHikerProfile(user.id, req.body);
      return res.json(updated);
    } else if (user.role === 'guide') {
      const updated = await usersRepo.updateGuideProfile(user.id, req.body);
      return res.json(updated);
    }

    return res.status(400).json({ error: 'Invalid user role' });
  } catch (err) {
    console.error('[users/profile] Update error:', err);
    console.error('[users/profile] Error details:', {
      message: err.message,
      code: err.code,
      meta: err.meta,
      stack: err.stack,
    });
    
    // Return more specific error messages
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A record with this information already exists' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    return res.status(500).json({ 
      error: err.message || 'Failed to update profile',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

// Get a specific user's profile - need to be logged in (hiker, guide, or admin)
router.get('/:id', requireRole(['hiker','guide','admin']), (req, res) => {
  const { id } = req.params;
  res.status(200).json({ id, email: null, role: 'hiker' }); // TODO: fetch from repository
});

module.exports = router;
