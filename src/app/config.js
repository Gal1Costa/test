/* eslint-disable */
const dotenv = require('dotenv');

dotenv.config();
console.log('[config] NODE_ENV=', process.env.NODE_ENV, 'PORT=', process.env.PORT);

/**
 * Application configuration derived from environment variables.
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/trailhub',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.STORAGE_BUCKET || ''
  }
};

module.exports = { config };
