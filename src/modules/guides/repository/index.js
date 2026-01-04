/* eslint-disable */
const { prisma } = require('../../../shared/prisma');

// List guides (include linked user if you have that relation)
async function listGuides() {
  return prisma.guide.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });
}

async function getGuideById(id) {
  return prisma.guide.findUnique({
    where: { id },
    include: { user: true },
  });
}

// expected data: { userId, bio? }
async function createGuide(data) {
  return prisma.guide.create({ data });
}

async function updateGuide(id, data) {
  return prisma.guide.update({ where: { id }, data });
}

async function deleteGuide(id) {
  return prisma.guide.delete({ where: { id } });
}

module.exports = {
  listGuides,
  getGuideById,
  createGuide,
  updateGuide,
  deleteGuide,
};
