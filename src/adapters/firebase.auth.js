/* eslint-disable */
// src/adapters/firebase.auth.js
const admin = require('firebase-admin');

let appInitialized = false;

function initAdminIfNeeded() {
  if (appInitialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    console.warn('[firebase.auth] Missing Firebase env vars – verifyIdToken will return null');
    appInitialized = true; // avoid repeating warning
    return;
  }

  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: storageBucket || undefined,
  });

  appInitialized = true;
}

/**
 * Verify a Firebase ID token.
 * @param {string} idToken
 * @returns {Promise<import('firebase-admin').auth.DecodedIdToken | null>}
 */
async function verifyIdToken(idToken) {
  try {
    if (!idToken) return null;
    initAdminIfNeeded();

    if (!admin.apps || admin.apps.length === 0) {
      return null;
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded; // uid, email, name, picture, etc.
  } catch (err) {
    console.warn('[firebase.auth] verifyIdToken failed:', err.message);
    return null;
  }
}

module.exports = { verifyIdToken };
