# TrailHub API Endpoints

**Base URL**: `http://localhost:3000` (dev)

---

## Authentication

**Dev Header** (local testing):
```
x-dev-user: {"id":"dev-1","email":"dev@local","role":"hiker|guide|admin"}
```

**Firebase Token** (production):
```
Authorization: Bearer <firebase-id-token>
```

---

## Endpoints

### Health
- `GET /healthz` — Server health check

### Hikes
- `GET /api/hikes` — List all hikes
- `GET /api/hikes/:id` — Get hike details
- `POST /api/hikes` — Create hike (guide only)
- `PUT /api/hikes/:id` — Update hike (owner only)
- `DELETE /api/hikes/:id` — Delete hike (owner only)
- `POST /api/hikes/:id/join` — Join hike (hiker only)
- `DELETE /api/hikes/:id/join` — Leave hike (hiker only)

### Users
- `GET /api/users/me` — Get current user profile
- `POST /api/users/register` — Register new user
- `GET /api/users/:id` — Get user by ID (privacy-filtered)
- `PATCH /api/users/profile` — Update user profile

### Guides
- `GET /api/guides/:id` — Get guide profile with stats

### Reviews
- `GET /api/reviews/guide/:id` — Get reviews by guide (stub)
- `GET /api/reviews/hike/:id` — Get reviews by hike (stub)

### Identity (Legacy)
- `GET /api/identity` — Get current user (legacy, uses old schema)
- `GET /api/identity/hikes` — Get user's joined hikes (legacy)

---

## API To-Do / Not Yet Implemented

**High Priority** (core features):
- ⚠️ `POST /api/reviews` — Create review for guide or hike
- ⚠️ `PUT /api/reviews/:id` — Update review
- ⚠️ `DELETE /api/reviews/:id` — Delete review
- ⚠️ `GET /api/bookings` — List user's bookings
- ⚠️ `GET /api/bookings/:id` — Get booking details
- ⚠️ `PATCH /api/bookings/:id/status` — Update booking status (confirm/cancel)

**Medium Priority** (user features):
- ⚠️ `POST /api/hikes/:id/rate` — Rate a completed hike
- ⚠️ `GET /api/users/:id/reviews` — Get reviews written by user
- ⚠️ `GET /api/guides/:id/reviews` — Get reviews for a guide
- ⚠️ `POST /api/users/:id/follow` — Follow a guide
- ⚠️ `DELETE /api/users/:id/follow` — Unfollow a guide

**Low Priority** (admin/analytics):
- ⚠️ `GET /api/admin/users` — List all users (admin only)
- ⚠️ `DELETE /api/admin/users/:id` — Delete user (admin only)
- ⚠️ `GET /api/admin/hikes` — Moderated hikes list
- ⚠️ `GET /api/analytics/stats` — Platform statistics

**Deprecated / Refactor**:
- 🔄 `/api/identity/*` — Migrate to `/api/users/*` and consolidate schema

---

## Deployment Strategy

### Current Deployment
- **Environment**: Local development (`npm run dev`)
- **Database**: PostgreSQL (local or cloud via `DATABASE_URL`)
- **Auth**: Firebase Authentication (token verification on each request)
- **Storage**: Firebase Storage (adapter in `src/adapters/firebase.storage.js`)
- **Config**: Environment variables (`.env` file)
- **Port**: 3000 (configurable via `PORT` env var)

**Setup**:
```bash
# Install dependencies
npm install

# Create .env file with:
# DATABASE_URL=postgres://user:pass@localhost:5432/trailhub
# FIREBASE_PROJECT_ID=...
# FIREBASE_CLIENT_EMAIL=...
# FIREBASE_PRIVATE_KEY=...
# FIREBASE_STORAGE_BUCKET=...

# Run migrations
npx prisma migrate dev

# Start server
npm run dev
```

### Future Deployment (Planned - Simple)
- **Option A (Easiest)**: Deploy to **Vercel** or **Railway** (1-click from GitHub)
  - Push to main branch → auto-deploys
  - Database: Use Vercel Postgres or Neon (free tier available)
  - No Docker or config needed
  
- **Option B (More Control)**: Deploy to **Heroku** or **Render**
  - Add `Procfile` with `web: npm run start`
  - Push to main → deploys automatically
  - Database: Managed PostgreSQL included

- **Option C (DIY)**: Self-host on **Linux VPS** (DigitalOcean, Linode, etc.)
  - Install Node.js + PostgreSQL
  - Clone repo → `npm install` → `npm run start`
  - Use PM2 or systemd for process management

---

