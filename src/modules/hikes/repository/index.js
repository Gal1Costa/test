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

// List hikes for Explore page (with filters)
async function listHikes(filters = {}) {
  console.log("🔥 FILTER LOGIC LOADED");
  const { search, difficulty, dateFrom, dateTo, priceFrom, priceTo, location } = filters;

  const and = [];

  // Difficulty enum: EASY / MODERATE / HARD
  if (difficulty) {
    const diff = String(difficulty).toLowerCase();
    const enumValue =
      diff === "easy" ? "EASY" :
      diff === "moderate" ? "MODERATE" :
      diff === "hard" ? "HARD" :
      null;

    if (enumValue) and.push({ difficulty: enumValue });
  }

  // Price range
  if (priceFrom !== undefined && priceFrom !== null) and.push({ price: { gte: priceFrom } });
  if (priceTo !== undefined && priceTo !== null) and.push({ price: { lte: priceTo } });

  // Date range (hike.date)
  if (dateFrom) and.push({ date: { gte: dateFrom } });
  if (dateTo) and.push({ date: { lte: dateTo } });

  // Search: matches anything containing input across multiple fields
  if (search && String(search).trim()) {
    const q = String(search).trim();
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { meetingPlace: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  // Location filter: must match location OR meetingPlace OR title
  if (location && String(location).trim()) {
    const q = String(location).trim();
    and.push({
      OR: [
        { location: { contains: q, mode: "insensitive" } },
        { meetingPlace: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const where = and.length ? { AND: and } : {};

  console.log("🧪 filters:", filters);
  console.log("🧪 prisma where:", JSON.stringify(where, null, 2));


  const rows = await prisma.hike.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      guide: { include: { user: true } },
      _count: { select: { bookings: true } },
    },
  });

  // always return normalized shape
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
  await prisma.booking.deleteMany({
    where: { hikeId: id }
  });

  return prisma.hike.delete({
    where: { id }
  });
}

module.exports = {
  listHikes,
  getHikeById,
  createHike,
  updateHike,
  deleteHike,
};