/* eslint-disable */
const { Router } = require('express');
const { prisma } = require('../../../shared/prisma');
const { requireRole } = require('../../../app/roles.middleware');

const router = Router();
const { recordAudit, listAudits } = require('../audit');

// GET /api/admin/overview  -> returns counts used by admin dashboard
router.get('/overview', requireRole(['admin']), async (req, res, next) => {
  try {
    const users = await prisma.user.count();
    const hikes = await prisma.hike.count();
    const bookings = await prisma.booking.count();
    const guides = await prisma.guide.count();

    const agg = await prisma.review.aggregate({ _avg: { rating: true } });
    const averageRating = agg && agg._avg ? agg._avg.rating : null;

    res.json({ users, hikes, guides, bookings, averageRating });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/analytics  -> returns time-series analytics data
router.get('/analytics', requireRole(['admin']), async (req, res, next) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // This month counts
    const [usersThisMonth, hikesThisMonth, bookingsThisMonth, guidesThisMonth, hikersThisMonth] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      prisma.hike.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      prisma.guide.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      prisma.user.count({ where: { role: 'hiker', createdAt: { gte: startOfThisMonth } } }),
    ]);

    // Last month counts
    const [usersLastMonth, hikesLastMonth, bookingsLastMonth, guidesLastMonth, hikersLastMonth] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.hike.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.guide.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.user.count({ where: { role: 'hiker', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    ]);

    // Total deleted users (all time)
    const [deletedUsersThisMonth, deletedUsersLastMonth] = await Promise.all([
      prisma.user.count({ where: { status: 'DELETED' } }),
      prisma.user.count({ where: { status: 'DELETED' } }),
    ]);

    // Daily data for the last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const dailyData = [];
    for (let i = 0; i < 30; i++) {
      const dayStart = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      const [users, hikes, bookings, guides, hikers] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
        prisma.hike.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
        prisma.booking.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
        prisma.guide.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
        prisma.user.count({ where: { role: 'hiker', createdAt: { gte: dayStart, lte: dayEnd } } }),
      ]);

      // Get cumulative deleted users up to this day
      const deletedUsers = await prisma.user.count({ 
        where: { 
          status: 'DELETED',
          createdAt: { lte: dayEnd } // Count all deleted users created up to this day
        } 
      });

      dailyData.push({
        date: dayStart.toISOString().split('T')[0],
        users,
        hikes,
        bookings,
        guides,
        hikers,
        deletedUsers,
      });
    }

    res.json({
      thisMonth: { 
        users: usersThisMonth, 
        hikes: hikesThisMonth, 
        bookings: bookingsThisMonth,
        guides: guidesThisMonth,
        hikers: hikersThisMonth,
        deletedUsers: deletedUsersThisMonth
      },
      lastMonth: { 
        users: usersLastMonth, 
        hikes: hikesLastMonth, 
        bookings: bookingsLastMonth,
        guides: guidesLastMonth,
        hikers: hikersLastMonth,
        deletedUsers: deletedUsersLastMonth
      },
      dailyData,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users  -> list users for admin UI with guide/hiker profiles
router.get('/users', requireRole(['admin']), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(200, Math.max(5, parseInt(req.query.pageSize, 10) || 20));
    const q = (req.query.q || '').trim();

    const where = q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    } : {};

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: { 
          id: true, 
          email: true, 
          name: true, 
          role: true, 
          status: true,
          createdAt: true,
          guide: { select: { id: true, displayName: true, isVerified: true, isFeatured: true } },
          hikerProfile: { select: { id: true, location: true } }
        },
      }),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/audit -> list audit logs
router.get('/audit', requireRole(['admin']), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(200, Math.max(10, parseInt(req.query.pageSize, 10) || 50));
    const data = await listAudits({ page, pageSize });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/guides -> list all guides with user info
router.get('/guides', requireRole(['admin']), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(200, Math.max(5, parseInt(req.query.pageSize, 10) || 20));
    const q = (req.query.q || '').trim();

    const where = q ? {
      OR: [
        { displayName: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ],
    } : {};

    const [total, items] = await Promise.all([
      prisma.guide.count({ where }),
      prisma.guide.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { 
          user: { select: { id: true, email: true, name: true, status: true } },
          _count: { select: { hikes: true, reviews: true } }
        },
      }),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/guides/:id -> update guide fields like isVerified/isFeatured
router.patch('/guides/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const allowed = ['displayName', 'bio', 'isVerified', 'isFeatured', 'status'];
    const data = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, k)) {
        data[k] = body[k] === '' ? null : body[k];
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided' });
    }

    const updated = await prisma.guide.update({ where: { id }, data });
    try {
      await recordAudit({ 
        actorId: req.user?.id || null, 
        actorEmail: req.user?.email || null, 
        action: 'update_guide', 
        resource: 'guide', 
        resourceId: id, 
        details: data 
      });
    } catch (e) {}
    
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/me -> quick admin verification endpoint
router.get('/me', requireRole(['admin']), async (req, res, next) => {
  try {
    const email = req.user?.email || null;
    const uid = req.user?.firebaseUid || req.user?.id || null;
    return res.json({ admin: true, email, uid });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/hikes/:id  -> admin can update hike fields
router.patch('/hikes/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    // Only allow specific fields to be updated by admin
    const allowed = ['title', 'description', 'difficulty', 'distance', 'duration', 'price', 'capacity', 'location', 'date', 'meetingTime', 'meetingPlace', 'elevationGain', 'whatToBring', 'coverUrl', 'routePath'];
    const data = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, k)) data[k] = body[k] === '' ? null : body[k];
    }

    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No valid fields provided' });

    const updated = await prisma.hike.update({ where: { id }, data });
    try {
      await recordAudit({ actorId: req.user?.id || null, actorEmail: req.user?.email || null, action: 'update_hike', resource: 'hike', resourceId: id, details: data });
    } catch (e) {}
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/hikes -> paginated hikes for admin UI
router.get('/hikes', requireRole(['admin']), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(200, Math.max(5, parseInt(req.query.pageSize, 10) || 20));
    const q = (req.query.q || '').trim();

    const where = q ? {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ],
    } : {};

    const [total, items] = await Promise.all([
      prisma.hike.count({ where }),
      prisma.hike.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { guide: { include: { user: true } }, _count: { select: { bookings: true } } },
      }),
    ]);

    // map items to a lighter shape expected by admin UI
    const mapped = items.map(i => ({
      id: i.id,
      title: i.title,
      name: i.title,
      guideName: i.guide?.user?.name || i.guide?.displayName || null,
      date: i.date,
      participantsCount: i._count?.bookings || 0,
      distance: i.distance,
    }));

    res.json({ items: mapped, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id -> admin can change role or basic user fields
router.patch('/users/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const allowed = ['role', 'name', 'email'];
    const data = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, k)) data[k] = body[k] === '' ? null : body[k];
    }

    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No valid fields provided' });

    // Get existing user to check if role is changing
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) return res.status(404).json({ error: 'User not found' });

    // Update user
    const updated = await prisma.user.update({ where: { id }, data, select: { id: true, email: true, name: true, role: true, createdAt: true } });
    
    // If role changed, ensure correct profile exists
    if (data.role && existingUser.role !== data.role) {
      const newRole = data.role;
      const displayName = updated.name || existingUser.name || null;

      if (newRole === 'guide') {
        // Create or ensure Guide profile exists
        await prisma.guide.upsert({
          where: { userId: updated.id },
          update: {},
          create: { 
            userId: updated.id, 
            displayName: displayName, 
            status: 'ACTIVE' 
          }
        });
      } else if (newRole === 'hiker') {
        // Create or ensure HikerProfile exists
        await prisma.hikerProfile.upsert({
          where: { userId: updated.id },
          update: {},
          create: { 
            userId: updated.id, 
            displayName: displayName 
          }
        });
      }
    }

    try {
      await recordAudit({ actorId: req.user?.id || null, actorEmail: req.user?.email || null, action: 'update_user', resource: 'user', resourceId: id, details: data });
    } catch (e) {}
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/hikes/:id  -> admin may permanently remove a hike (and related records)
router.delete('/hikes/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    // remove dependent reviews and bookings first to avoid FK constraints
    await prisma.review.deleteMany({ where: { hikeId: id } }).catch(() => {});
    await prisma.booking.deleteMany({ where: { hikeId: id } }).catch(() => {});
    await prisma.hike.delete({ where: { id } });
    try { await recordAudit({ actorId: req.user?.id || null, actorEmail: req.user?.email || null, action: 'delete_hike', resource: 'hike', resourceId: id }); } catch (e) {}
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id -> soft delete user by setting status='DELETED' and anonymizing
router.delete('/users/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Soft delete: set status to DELETED (keep email and name for admin visibility)
    await prisma.user.update({
      where: { id },
      data: {
        status: 'DELETED'
      }
    });
    
    try { 
      await recordAudit({ 
        actorId: req.user?.id || null, 
        actorEmail: req.user?.email || null, 
        action: 'soft_delete_user', 
        resource: 'user', 
        resourceId: id 
      }); 
    } catch (e) {}
    
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/guides/:id -> admin may remove a guide by guide id
router.delete('/guides/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get the guide to find the associated user
    const guide = await prisma.guide.findUnique({ 
      where: { id },
      include: { user: true }
    });
    
    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }
    
    // Soft delete: mark the guide's user as DELETED (keep email and name for admin visibility)
    if (guide.userId) {
      await prisma.user.update({
        where: { id: guide.userId },
        data: { status: 'DELETED' }
      });
    }
    
    // Also mark the guide profile as deleted
    await prisma.guide.update({
      where: { id },
      data: { status: 'DELETED' }
    });
    
    try { 
      await recordAudit({ 
        actorId: req.user?.id || null, 
        actorEmail: req.user?.email || null, 
        action: 'soft_delete_guide', 
        resource: 'guide', 
        resourceId: id 
      }); 
    } catch (e) {}
    
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;


