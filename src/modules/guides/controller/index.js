/* eslint-disable */
// This file handles guide-related API requests - like getting guide info or updating profiles
const { Router } = require('express');
const { requireRole } = require('../../../app/roles.middleware');
const guidesRepo = require('../repository');
const usersRepo = require('../../users/repository');
const { prisma } = require('../../../shared/prisma');

const router = Router();

// Get a specific guide's profile - anyone can view guide profiles
router.get('/:id', requireRole(['visitor','hiker','guide','admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get guide profile with user info
    const guide = await guidesRepo.getGuideById(id);
    
    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    // Get guide's hikes
    const hikes = await prisma.hike.findMany({
      where: { guideId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        difficulty: true,
        price: true,
        location: true,
        coverUrl: true,
        _count: { select: { bookings: true } },
      },
    });

    // Get guide's reviews and calculate rating
    const reviews = await prisma.review.findMany({
      where: { guideId: id },
    });

    const averageRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : 0;

    const guideResponse = {
      ...guide,
      averageRating: parseFloat(averageRating),
      totalReviews: reviews.length,
      completedHikesCount: hikes.length,
      hikes: hikes.map(h => ({
        ...h,
        participantsCount: h._count?.bookings ?? 0,
      })),
    };

    res.status(200).json(guideResponse);
  } catch (err) {
    console.error('[guides/get] Error:', err);
    next(err);
  }
});

module.exports = router;
