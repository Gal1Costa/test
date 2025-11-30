/* eslint-disable */
const { prisma } = require('../../../shared/prisma');

// Find or create a demo user (for now you don't have real auth)
async function getOrCreateDemoUser() {
  const existing = await prisma.user.findFirst();
  if (existing) return existing;

  return prisma.user.create({
    data: {
      email: 'demo@local',
      name: 'Demo User',
      role: 'user',
    },
  });
}

// List bookings
async function listBookings(filter = {}) {
  return prisma.booking.findMany({
    where: filter,
    orderBy: { createdAt: 'desc' },
    include: { user: true, hike: true },
  });
}

async function getBookingById(id) {
  return prisma.booking.findUnique({
    where: { id },
    include: { user: true, hike: true },
  });
}

// Create booking with capacity check
async function createBooking({ hikeId, status, userId }) {
  if (!hikeId) {
    throw new Error('hikeId is required to create booking');
  }

  // If userId is provided, use it; otherwise fall back to demo user (for dev/testing)
  let user;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`User not found for id=${userId}`);
    }
  } else {
    user = await getOrCreateDemoUser();
  }

  // Load hike with current bookings count and guide info
  const hike = await prisma.hike.findUnique({
    where: { id: hikeId },
    include: {
      _count: { select: { bookings: true } },
      guide: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!hike) {
    throw new Error(`Hike not found for id=${hikeId}`);
  }

  // Check if user is the creator of this hike (guide)
  if (hike.guide && hike.guide.userId === user.id) {
    const err = new Error('You cannot join a hike that you created');
    err.code = 'CANNOT_JOIN_OWN_HIKE';
    throw err;
  }

  const capacity = hike.capacity ?? 0;                       // 0 = unlimited
  const current = hike._count?.bookings ?? 0;

  if (capacity > 0 && current >= capacity) {
    const err = new Error('Hike is full');
    err.code = 'HIKE_FULL';
    throw err;
  }

  const booking = await prisma.booking.create({
    data: {
      hikeId: hike.id,
      userId: user.id,
      status: status || 'pending',
    },
  });

  console.log('[createBooking] Created booking', { 
    bookingId: booking.id, 
    hikeId: hike.id, 
    userId: user.id, 
    userRole: user.role 
  });

  return booking;
}

// Delete a booking for the current user & hike (Leave)
async function deleteBookingForCurrentUserAndHike(hikeId, userId) {
  if (!hikeId) throw new Error('hikeId required');
  if (!userId) throw new Error('userId required');

  try {
    // Get user to verify they exist
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`User not found for id=${userId}`);
    }

    console.log('[deleteBookingForCurrentUserAndHike] Looking for booking', {
      hikeId: String(hikeId),
      userId: String(userId),
      userRole: user.role || 'unknown'
    });

    // Try to find the booking
    let existing = await prisma.booking.findFirst({
      where: {
        hikeId,
        userId,
      },
    });

    // If not found, try to find by just userId and match manually (in case of type mismatch)
    if (!existing) {
      const userBookings = await prisma.booking.findMany({
        where: { userId },
        select: { id: true, hikeId: true, userId: true },
      });
      
      // Try to find a match manually (in case of type mismatch)
      const manualMatch = userBookings.find(b => 
        String(b.hikeId) === String(hikeId) || b.hikeId === hikeId
      );
      
      if (manualMatch) {
        console.log('[deleteBookingForCurrentUserAndHike] Found booking via manual match');
        existing = await prisma.booking.findUnique({
          where: { id: manualMatch.id },
        });
      }
    }

    if (!existing) {
      // Get all bookings for this hike for debugging
      const allBookingsForHike = await prisma.booking.findMany({
        where: { hikeId },
        select: { id: true, userId: true, hikeId: true },
      });
      
      console.log('[deleteBookingForCurrentUserAndHike] No booking found', {
        hikeId: String(hikeId),
        userId: String(userId),
        totalBookingsForHike: allBookingsForHike.length,
        bookingUserIds: allBookingsForHike.map(b => String(b.userId))
      });
      return null;
    }

    console.log('[deleteBookingForCurrentUserAndHike] Found booking, deleting');

    await prisma.booking.delete({
      where: { id: existing.id },
    });

    return existing;
  } catch (err) {
    console.error('[deleteBookingForCurrentUserAndHike] Error:', err.message);
    throw err;
  }
}

async function updateBooking(id, data) {
  return prisma.booking.update({ where: { id }, data });
}

async function deleteBooking(id) {
  return prisma.booking.delete({ where: { id } });
}

module.exports = {
  listBookings,
  getBookingById,
  createBooking,
  deleteBookingForCurrentUserAndHike,
  updateBooking,
  deleteBooking,
};
