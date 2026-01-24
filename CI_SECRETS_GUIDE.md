# CI/CD Secrets & Configuration Guide

## Required GitHub Secrets

You need to configure these secrets in your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

### 1. `CI_DATABASE_URL` ✅ Required
- **Purpose:** Database connection string for backend .env file and migration testing
- **Format:** `postgresql://user:password@host:port/database`
- **Example:** `postgresql://trailhub:secret@localhost:5432/trailhub_db`
- **Used in:** 
  - Line 50: Backend .env file (for Docker container)
  - Line 75: Prisma migration test (runs on GitHub Actions runner)
- **Important:** Must match the database credentials in `docker-compose.yml` (trailhub:secret@localhost:5432/trailhub_db)

### 2. `CI_ADMIN_UIDS` ✅ Required
- **Purpose:** Comma-separated list of Firebase UIDs that have admin access
- **Format:** `uid1,uid2,uid3` or single `uid`
- **Example:** `yPDBrkpp4yfMAeUI7ew1CcgdW823`
- **Used in:** Line 51 of `.github/workflows/playwright.yml`

---

## Hardcoded Values (OK for CI)

These values are hardcoded in the workflow and are **safe** because they're for local test environments:

### Other Hardcoded Values (Safe)
- `PORT=3000` - Standard port, not sensitive
- `NODE_ENV=production` - Environment flag, not sensitive
- `BASE_URL=http://localhost:3000` - Local test URL, not sensitive
- `VITE_API_URL=http://localhost:3000` - Local test URL, not sensitive

**Note:** Database URL is now using secrets (no longer hardcoded) ✅

---

## Optional Secrets (Not Currently Used)

These secrets are **not required** for CI but might be needed if you add Firebase auth testing:

### Firebase Credentials (Optional)
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Firebase service account email
- `FIREBASE_PRIVATE_KEY` - Firebase private key (with `\n` escaped)
- `FIREBASE_STORAGE_BUCKET` - Firebase storage bucket name

**When to add:** Only if your CI tests need to verify Firebase authentication (currently using dev mode)

---

## Current Setup Analysis

### ✅ What's Good
1. **Secrets are used consistently** for all database connections (`CI_DATABASE_URL` used in both places)
2. **No hardcoded credentials** - database URL now uses secrets ✅
3. **Hardcoded values are safe** - all are for local test environments (ports, URLs)
4. **No production credentials** exposed in the workflow

---

## How to Set Up Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: `CI_DATABASE_URL`
   - Value: `postgresql://trailhub:secret@localhost:5432/trailhub_db`
   - Click **Add secret**
5. Repeat for `CI_ADMIN_UIDS`

---

## Security Best Practices

✅ **Do:**
- Use secrets for any values that could be sensitive
- Use hardcoded values only for local test URLs/ports
- Keep production credentials out of workflows

❌ **Don't:**
- Commit production database URLs to the repository
- Hardcode API keys or tokens
- Expose Firebase private keys in workflow files

---

## Summary

**Required Secrets:** 2
- ✅ `CI_DATABASE_URL` - Database connection string (used in 2 places)
- ✅ `CI_ADMIN_UIDS` - Admin user IDs

**Hardcoded Values:** Safe ✅
- All hardcoded values are for local test environments (ports, URLs)
- No database credentials hardcoded (now using secrets)
- No production credentials exposed

**Your workflow is secure and consistent!** 🔒
