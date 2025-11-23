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

// Create or update a user from Firebase auth data
async function createOrUpdateUser({ firebaseUid, email, name, role = 'hiker' }) {
  if (!firebaseUid || !email) {
    throw new Error('firebaseUid and email are required');
  }

  // Try to find existing user by firebaseUid or email
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { firebaseUid },
        { email },
      ],
    },
  });

  if (existing) {
    // Update existing user - always preserve existing role to avoid overwriting with defaults
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        firebaseUid,
        email,
        name: name || existing.name,
        // Always preserve existing role - don't overwrite with default 'hiker'
        role: existing.role,
      },
    });
  }

  // Create new user
  const user = await prisma.user.create({
    data: {
      firebaseUid,
      email,
      name,
      role,
    },
  });

  // Create role-specific profile
  if (role === 'guide') {
    await prisma.guide.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        displayName: name,
      },
    });
  } else if (role === 'hiker') {
    await prisma.hikerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        displayName: name,
      },
    });
  }

  return user;
}

// Get user by Firebase UID
async function getUserByFirebaseUid(firebaseUid) {
  if (!firebaseUid) {
    console.warn('[getUserByFirebaseUid] No firebaseUid provided');
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
  });
  
  if (!user) {
    console.warn('[getUserByFirebaseUid] No user found with firebaseUid:', firebaseUid);
    // Also try to find by email in case firebaseUid wasn't set during registration
    // But this should only be a fallback for debugging
    const usersByEmail = await prisma.user.findMany({
      where: { firebaseUid: null },
      take: 5,
    });
    if (usersByEmail.length > 0) {
      console.warn('[getUserByFirebaseUid] Found users without firebaseUid:', usersByEmail.map(u => ({ id: u.id, email: u.email, role: u.role })));
    }
  } else {
    console.log('[getUserByFirebaseUid] Found user:', { id: user.id, email: user.email, role: user.role, firebaseUid: user.firebaseUid });
  }
  
  return user;
}

// Return "profile" data: user + their bookings + hikes
async function getCurrentUserProfile(firebaseUid, userInfo = null) {
  let user;
  
  if (firebaseUid) {
    user = await getUserByFirebaseUid(firebaseUid);
    console.log('[getCurrentUserProfile] User lookup by firebaseUid:', firebaseUid, 'Found:', !!user, 'Role:', user?.role);
  }
  
  // If user doesn't exist but we have Firebase auth info, create them
  if (!user && firebaseUid && userInfo) {
    console.log('[getCurrentUserProfile] Creating new user with info:', { firebaseUid, email: userInfo.email, role: userInfo.role });
    user = await createOrUpdateUser({
      firebaseUid,
      email: userInfo.email || 'unknown@example.com',
      name: userInfo.name || null,
      role: userInfo.role || 'hiker', // Default to hiker if role not provided
    });
    console.log('[getCurrentUserProfile] Created user with role:', user.role);
  }
  
  // Fallback to demo user only if no firebaseUid provided (dev/testing)
  // IMPORTANT: Never fall back to demo user if we have a firebaseUid - that means the user doesn't exist in DB
  if (!user && !firebaseUid) {
    console.log('[getCurrentUserProfile] No user found and no firebaseUid, falling back to demo user (dev mode)');
    user = await getOrCreateDemoUser();
  } else if (!user && firebaseUid) {
    // User has firebaseUid but doesn't exist in DB - this is an error condition
    console.error('[getCurrentUserProfile] User with firebaseUid not found in database:', firebaseUid);
    throw new Error(`User not found in database. Please register first. Firebase UID: ${firebaseUid}`);
  }

  // Get bookings (for hikers - hikes they joined)
  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { hike: true },
  });

  // Get hiker profile (for hikers)
  let hikerProfile = null;
  if (user.role === 'hiker') {
    hikerProfile = await prisma.hikerProfile.findUnique({
      where: { userId: user.id },
    });
  }

  // Get guide profile and created hikes (for guides)
  let guideProfile = null;
  let createdHikes = [];
  
  if (user.role === 'guide') {
    guideProfile = await prisma.guide.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
      },
    });

    // Get hikes created by this guide (only if guide profile exists)
    if (guideProfile) {
      createdHikes = await prisma.hike.findMany({
        where: { guideId: guideProfile.id },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      });
    } else {
      console.warn('[getCurrentUserProfile] User has role "guide" but no guide profile found. User ID:', user.id);
    }
  }

  const profile = {
    ...user,
    bookings,
    ...(user.role === 'hiker' && {
      hikerProfile,
    }),
    ...(user.role === 'guide' && {
      guide: guideProfile,
      createdHikes: createdHikes.map(hike => ({
        ...hike,
        participantsCount: hike._count?.bookings ?? 0,
      })),
    }),
  };
  
  console.log('[getCurrentUserProfile] Returning profile with role:', profile.role, 
    user.role === 'guide' ? `Guide profile: ${!!guideProfile}, Created hikes: ${createdHikes.length}` : `Bookings: ${bookings.length}`);
  return profile;
}

// Update hiker profile
async function updateHikerProfile(userId, data) {
  const { name, bio, location, displayName, fitnessLevel } = data;
  
  // Ensure hiker profile exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { hikerProfile: true },
  });

  if (!user || user.role !== 'hiker') {
    throw new Error('User is not a hiker');
  }

  // Update user name if provided and not empty
  if (name !== undefined && name && name.trim() && name.trim() !== user.name) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
    });
  }

  // Update or create hiker profile
  // Build update object only with defined fields
  const updateData = {};
  if (bio !== undefined) updateData.bio = bio || null;
  if (location !== undefined) updateData.location = location || null;
  if (displayName !== undefined) updateData.displayName = displayName || null;
  if (fitnessLevel !== undefined) updateData.fitnessLevel = fitnessLevel || null;

  try {
    // If no fields to update, still ensure profile exists
    const hikerProfile = await prisma.hikerProfile.upsert({
      where: { userId },
      update: Object.keys(updateData).length > 0 ? updateData : undefined,
      create: {
        userId,
        bio: bio || null,
        location: location || null,
        displayName: displayName || name || null,
        fitnessLevel: fitnessLevel || null,
      },
    });

    console.log('[updateHikerProfile] Updated hiker profile:', { userId, hikerProfileId: hikerProfile.id });

    return hikerProfile;
  } catch (err) {
    // Check if error is due to missing column (location field)
    if (err.message && err.message.includes('column') && err.message.includes('location')) {
      console.error('[updateHikerProfile] Location column not found. Please run migration:', err.message);
      throw new Error('Database migration required. Please run: npx prisma migrate dev');
    }
    throw err;
  }
}

// Update guide profile
async function updateGuideProfile(userId, data) {
  const { name, bio, location, displayName } = data;
  
  // Ensure guide profile exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { guide: true },
  });

  if (!user || user.role !== 'guide') {
    throw new Error('User is not a guide');
  }

  // Update user name if provided and not empty
  if (name !== undefined && name && name.trim() && name.trim() !== user.name) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
    });
  }

  // Build update object only with defined fields
  const updateData = {};
  if (bio !== undefined) updateData.bio = bio || null;
  if (location !== undefined) updateData.location = location || null;
  if (displayName !== undefined) updateData.displayName = displayName || null;

  try {
    // Update or create guide profile
    const guideProfile = await prisma.guide.upsert({
      where: { userId },
      update: Object.keys(updateData).length > 0 ? updateData : undefined,
      create: {
        userId,
        bio: bio || null,
        location: location || null,
        displayName: displayName || name || null,
      },
    });

    console.log('[updateGuideProfile] Updated guide profile:', { userId, guideProfileId: guideProfile.id });

    return guideProfile;
  } catch (err) {
    // Check if error is due to missing column (location field)
    if (err.message && err.message.includes('column') && err.message.includes('location')) {
      console.error('[updateGuideProfile] Location column not found. Please run migration:', err.message);
      throw new Error('Database migration required. Please run: npx prisma migrate dev');
    }
    throw err;
  }
}

module.exports = {
  getOrCreateDemoUser,
  getCurrentUserProfile,
  createOrUpdateUser,
  getUserByFirebaseUid,
  updateHikerProfile,
  updateGuideProfile,
};
