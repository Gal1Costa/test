/* eslint-disable */
const { prisma } = require('../../../shared/prisma');

// List bookings (optionally filtered)
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

// Create booking
// We'll build the correct shape in the route (userId, hikeId, status)
async function createBooking(data) {
  return prisma.booking.create({ data });
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
  updateBooking,
  deleteBooking,
};
