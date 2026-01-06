/* eslint-disable */
// src/app/auth.middleware.js
const { verifyIdToken } = require("../adapters/firebase.auth");
const { prisma } = require("../shared/prisma");

function getAdminAllowlist() {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  if (!email) return false;
  return getAdminAllowlist().includes(String(email).toLowerCase());
}

async function ensureNotDeletedByUserRecord(user) {
  if (user && user.status === "DELETED") {
    return { blocked: true, response: { status: 401, body: { error: "Account deleted" } } };
  }
  return { blocked: false };
}

/**
 * Auth rules (SAFE + PREDICTABLE):
 * - NEVER trust token claims for role.
 * - NEVER auto-upgrade to admin in middleware.
 * - Admin is TRUE only if (DB.role === 'admin') AND (email is allowlisted).
 * - Optionally demote DB admins whose email is not allowlisted.
 * - x-dev-user is ONLY honored if DEV_AUTH=1.
 */
async function authMiddleware(req, res, next) {
  try {
    // -----------------------------------------
    // 0) DEV HEADER (ONLY if explicitly enabled)
    // -----------------------------------------
    const devHeader = req.headers["x-dev-user"];
    const devAuthEnabled = process.env.DEV_AUTH === "1";

    if (devAuthEnabled && devHeader) {
      try {
        const parsed = JSON.parse(devHeader);
        const email = parsed.email || null;

        // dev header may request admin, but we still enforce allowlist
        const requestedRole = parsed.role || "hiker";
        const role = requestedRole === "admin" && isAdminEmail(email) ? "admin" : "hiker";

        // Optional: block deleted users (lookup by id/firebaseUid/email)
        const ors = [
          parsed.id ? { id: parsed.id } : null,
          parsed.firebaseUid ? { firebaseUid: parsed.firebaseUid } : null,
          email ? { email } : null,
        ].filter(Boolean);

        if (ors.length) {
          const found = await prisma.user.findFirst({ where: { OR: ors } }).catch(() => null);
          const deletedCheck = await ensureNotDeletedByUserRecord(found);
          if (deletedCheck.blocked) return res.status(deletedCheck.response.status).json(deletedCheck.response.body);
        }

        req.user = {
          id: parsed.id || "dev-user",
          firebaseUid: parsed.firebaseUid || null,
          email,
          role,
        };
        return next();
      } catch (e) {
        // ignore invalid dev header
      }
    }

    // -----------------------------------------
    // 1) TOKEN FLOW
    // -----------------------------------------
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!token) {
      req.user = { role: "visitor" };
      return next();
    }

    const data = await verifyIdToken(token);
    if (!data) {
      req.user = { role: "visitor" };
      return next();
    }

    const email = data.email || null;

    // Find user by firebaseUid OR email
    let user = null;
    try {
      const ors = [{ firebaseUid: data.uid }];
      if (email) ors.push({ email });
      user = await prisma.user.findFirst({ where: { OR: ors } });
    } catch (e) {
      user = null;
    }

    // Create missing user ALWAYS as hiker
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            firebaseUid: data.uid,
            email,
            name: data.name || null,
            role: "hiker",
            status: "ACTIVE",
          },
        });
      } catch (e) {
        // fallback identity if DB create fails
        req.user = { id: data.uid, firebaseUid: data.uid, email, role: "hiker" };
        return next();
      }
    }

    // Block deleted
    const deletedCheck = await ensureNotDeletedByUserRecord(user);
    if (deletedCheck.blocked) return res.status(deletedCheck.response.status).json(deletedCheck.response.body);

    // Compute role safely: admin only if DB role admin AND email allowlisted
    const allowlisted = isAdminEmail(email);
    let role = user.role || "hiker";

    if (role === "admin" && !allowlisted) {
      // Optional demotion to keep DB clean
      try {
        await prisma.user.update({ where: { id: user.id }, data: { role: "hiker" } });
      } catch (e) {}
      role = "hiker";
    } else if (role === "admin" && allowlisted) {
      role = "admin";
    } else if (role === "guide") {
      role = "guide";
    } else {
      role = "hiker";
    }

    req.user = {
      id: user.id,
      firebaseUid: data.uid,
      email,
      role,
    };

    return next();
  } catch (err) {
    req.user = { role: "visitor" };
    return next();
  }
}

module.exports = { authMiddleware };