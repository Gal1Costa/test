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
async function createBooking({ hikeId, status }) {
  if (!hikeId) {
    throw new Error('hikeId is required to create booking');
  }

  const user = await getOrCreateDemoUser();

  // Load hike with current bookings count
  const hike = await prisma.hike.findUnique({
    where: { id: hikeId },
    include: {
      _count: { select: { bookings: true } },
    },
  });

  if (!hike) {
    throw new Error(`Hike not found for id=${hikeId}`);
  }

  const capacity = hike.capacity ?? 0;                       // 0 = unlimited
  const current = hike._count?.bookings ?? 0;

  if (capacity > 0 && current >= capacity) {
    const err = new Error('Hike is full');
    err.code = 'HIKE_FULL';
    throw err;
  }

  return prisma.booking.create({
    data: {
      hikeId: hike.id,
      userId: user.id,
      status: status || 'pending',
    },
  });
}

// Delete a booking for the current user & hike (Leave)
async function deleteBookingForCurrentUserAndHike(hikeId) {
  if (!hikeId) throw new Error('hikeId required');

  const user = await getOrCreateDemoUser();

  const existing = await prisma.booking.findFirst({
    where: {
      hikeId,
      userId: user.id,
    },
  });

  if (!existing) {
    return null;
  }

  await prisma.booking.delete({
    where: { id: existing.id },
  });

  return existing;
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
