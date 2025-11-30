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

### Current Deployment (Development)

**Environment**: Local development only  
**Stack**: Node.js (npm scripts) + PostgreSQL + Firebase (stubbed)

```bash
# Start backend
npm run dev

# Start frontend
cd frontend && npm run dev

# Database setup
npx prisma migrate deploy
npx prisma db seed
```

**Key Configuration**:
- `NODE_ENV=development`
- `DATABASE_URL=postgres://user:pass@localhost:5432/trailhub`
- Dev auth via `x-dev-user` header (no Firebase required)
- Local file uploads to `/uploads`
- CORS: `http://localhost:5173` (frontend dev server)

---

### Future Deployment (Production)

**Recommended Stack**:

| Component | Service | Alternative |
|-----------|---------|-------------|
| **Backend** | Railway / Render | Heroku, AWS EC2, Railway |
| **Frontend** | Vercel / Netlify | AWS S3 + CloudFront, Netlify |
| **Database** | PostgreSQL (managed) | AWS RDS, Heroku Postgres, Railway Postgres |
| **File Storage** | Firebase Storage | AWS S3, Google Cloud Storage |
| **Secrets** | Environment variables | AWS Secrets Manager, Railway config |
| **Monitoring** | Sentry / DataDog | CloudWatch, Datadog, New Relic |
| **CI/CD** | GitHub Actions | GitLab CI, Travis CI |

**Deployment Checklist**:
- [ ] Set `NODE_ENV=production`
- [ ] Use managed PostgreSQL (RDS / Heroku / Railway)
- [ ] Implement Firebase Storage adapter (currently stubbed)
- [ ] Configure CORS for production domain only
- [ ] Set up environment secrets (no hardcoded keys)
- [ ] Run migrations before deploying: `npx prisma migrate deploy`
- [ ] Set up monitoring & error tracking (Sentry)
- [ ] Enable HTTPS (automatic on Vercel, Railway, Render)
- [ ] Test file upload limits and fallback
- [ ] Implement review & admin endpoints before launch

**Environment Variables (Production)**:
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://<user>:<pass>@<host>:<port>/<db>
FIREBASE_PROJECT_ID=<prod-project-id>
FIREBASE_PRIVATE_KEY=<key>
FIREBASE_CLIENT_EMAIL=<email>
CORS_ORIGIN=https://trailhub.com
```

**Deployment Commands**:
```bash
# Build backend (if needed)
npm ci                          # Clean install

# Migrate database
npx prisma migrate deploy

# Start backend
npm start                       # Runs on port 3000

# Frontend (Vercel/Netlify automatic)
cd frontend && npm run build
```

---

## Testing

```bash
# Quick test
./test_api.sh health

# Full test suite
./test_api.sh all

# Individual scenarios
./test_api.sh scenario1  # Register → List → Join
./test_api.sh scenario2  # Create → Update → Delete
./test_api.sh scenario3  # Privacy filtering
```

**Postman**: Import `postman_collection.json`

---

## Status Legend

- ✅ Fully Functional
- ⚠️ Stub (not implemented)
- 🔐 Requires Authentication
- 👤 Role-based access

---

**Last Updated**: November 30, 2025
