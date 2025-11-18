/* eslint-disable */
const { prisma } = require('../../../shared/prisma');

// Find any existing user or create a demo one
async function getOrCreateDemoUser() {
  // Try to use any existing user first
  const existing = await prisma.user.findFirst();
  if (existing) return existing;

  // Fallback: create a demo user
  return prisma.user.create({
    data: {
      email: 'demo@local',
      name: 'Demo User',
      role: 'user',
    },
  });
}

// Return "profile" data: user + their bookings + hikes
async function getCurrentUserProfile() {
  const user = await getOrCreateDemoUser();

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { hike: true },
  });

  return {
    ...user,
    bookings,
  };
}

module.exports = {
  getOrCreateDemoUser,
  getCurrentUserProfile,
};
