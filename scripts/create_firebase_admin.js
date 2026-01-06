#!/usr/bin/env node
/*
  scripts/create_firebase_admin.js

  Usage:
    node scripts/create_firebase_admin.js --email you@gmail.com --password 'S3cureP@ss'

  This script requires the Firebase service account envvars used by the app:
    - FIREBASE_PROJECT_ID
    - FIREBASE_CLIENT_EMAIL
    - FIREBASE_PRIVATE_KEY (with newlines escaped as \n)

  It will:
    - create or update a Firebase Email/Password user
    - set a custom claim `admin: true` (optional/helpful)
    - upsert a corresponding `user` row in the Prisma DB with role = 'admin'

  IMPORTANT: Do not commit the password or private key to source control.
*/

const admin = require('firebase-admin');
const { prisma } = require('../src/shared/prisma');
const crypto = require('crypto');

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((a) => {
    const m = a.match(/^--([a-zA-Z0-9_-]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  });
  return args;
}

function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    console.error('Missing Firebase service account env vars. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }

  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

async function ensureFirebaseUser(email, password) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log('Firebase user already exists:', user.uid);
    if (password) {
      await admin.auth().updateUser(user.uid, { password });
      console.log('Updated password for existing Firebase user.');
    }
    return user;
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/user-not-found') {
      const created = await admin.auth().createUser({ email, password, emailVerified: true });
      console.log('Created Firebase user:', created.uid);
      return created;
    }
    throw err;
  }
}

async function setAdminClaim(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log('Set custom claim { admin: true } for uid:', uid);
  } catch (err) {
    console.warn('Failed to set custom claims:', err.message || err);
  }
}

async function upsertPrismaUser({ firebaseUid, email, name = 'Admin' }) {
  // Upsert: if exists by firebaseUid or email, update role to admin and set firebaseUid
  let user = await prisma.user.findFirst({ where: { OR: [{ firebaseUid }, { email }] } });
  if (user) {
    user = await prisma.user.update({ where: { id: user.id }, data: { firebaseUid, email, name, role: 'admin' } });
    console.log('Updated existing DB user to admin:', user.id);
    return user;
  }

  user = await prisma.user.create({ data: { firebaseUid, email, name, role: 'admin' } });
  console.log('Created DB user (admin):', user.id);
  return user;
}

async function main() {
  const args = parseArgs();
  const email = args.email || process.env.DEV_ADMIN_EMAIL;
  let password = args.password || null;

  if (!email) {
    console.error('Email is required: --email=you@gmail.com');
    process.exit(1);
  }

  if (!password) {
    // generate a secure random password if not provided
    password = crypto.randomBytes(10).toString('base64').replace(/\+/g, 'A').replace(/\//g, 'B');
    console.log('No password provided; generated secure password (store it securely):', password);
  }

  initFirebase();

  try {
    const fbUser = await ensureFirebaseUser(email, password);
    await setAdminClaim(fbUser.uid);
    const dbUser = await upsertPrismaUser({ firebaseUid: fbUser.uid, email, name: 'Admin User' });

    console.log('\nDONE: Admin user ready to sign in.');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Firebase UID:', fbUser.uid);
    console.log('DB user id:', dbUser.id);
    console.log('\nSecurity: Do not commit the password or private key. Rotate or change the password if it becomes public.');
  } catch (err) {
    console.error('Error creating admin user:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) main();
