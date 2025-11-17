/* eslint-disable */
const { prisma } = require('../../../shared/prisma');

// List reviews (optionally by guideId or userId)
async function listReviews(filter = {}) {
  return prisma.review.findMany({
    where: filter,
    orderBy: { createdAt: 'desc' },
    include: { user: true, guide: true },
  });
}

async function getReviewById(id) {
  return prisma.review.findUnique({
    where: { id },
    include: { user: true, guide: true },
  });
}

// expected: { userId, guideId, rating, comment? }
async function createReview(data) {
  return prisma.review.create({ data });
}

async function updateReview(id, data) {
  return prisma.review.update({ where: { id }, data });
}

async function deleteReview(id) {
  return prisma.review.delete({ where: { id } });
}

module.exports = {
  listReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
};
