/* eslint-disable */
const { prisma } = require('../../../shared/prisma');

function mapHike(hike) {
  if (!hike) return null;

  const guideName =
    hike.guide?.user?.name ||
    hike.guide?.name ||
    null;

  const participantsCount =
    hike.participantsCount ??
    (hike._count?.bookings ?? 0) ??
    0;

  const capacity = hike.capacity ?? 0;

  // Choose a date field the UI can use
  const date = hike.date || hike.startDate || hike.createdAt;

  return {
    // keep all original fields in case something else uses them
    ...hike,

    // image URL alias used by frontend components
    imageUrl: hike.coverUrl || null,

    // fields the UI expects:
    id: hike.id,
    name: hike.title || hike.name || 'Untitled hike',
    location: hike.location || 'Unknown location',
    date,
    difficulty: hike.difficulty || 'n/a',
    participantsCount,
    capacity,
    isFull: capacity > 0 && participantsCount >= capacity,
    guideName,
  };
}

// List hikes for Explore page
async function listHikes() {
  const rows = await prisma.hike.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      guide: {
        include: { user: true },
      },
      _count: {
        select: { bookings: true },
      },
    },
  });

  // prisma gives `_count.bookings`, we normalize in mapHike
  return rows.map((h) =>
    mapHike({
      ...h,
      participantsCount: h._count?.bookings ?? 0,
    })
  );
}

// Single hike details
async function getHikeById(id) {
  const h = await prisma.hike.findUnique({
    where: { id },
    include: {
      guide: { include: { user: true } },
      _count: { select: { bookings: true } },
      bookings: { include: { user: { include: { hikerProfile: true, guide: true } } } },
    },
  });

  if (!h) return null;

  return mapHike({
    ...h,
    participantsCount: h._count?.bookings ?? 0,
    participants: (h.bookings || []).map(b => ({
      id: b.user?.id,
      name: b.user?.name || b.user?.email || 'Participant',
      photoUrl: b.user?.hikerProfile?.photoUrl || null,
      role: b.user?.role || null,
      guideId: b.user?.guide?.id || null,
    })),
  });
}

// Create / update / delete keep raw Prisma data; frontend will still see mapped fields via list/get
async function createHike(data) {
  const h = await prisma.hike.create({ data });
  return mapHike(h);
}

async function updateHike(id, data) {
  const h = await prisma.hike.update({ where: { id }, data });
  return mapHike(h);
}

async function deleteHike(id) {
  return prisma.hike.delete({ where: { id } });
}

module.exports = {
  listHikes,
  getHikeById,
  createHike,
  updateHike,
  deleteHike,
};
