# TrailHub: Technology Stack & API Documentation

**Last Updated**: November 30, 2025  
**Project**: TrailHub (Hiking Guide Marketplace)  
**Repository**: trailhub1 (Gal1Costa/trailhub1)

---

## 📋 Table of Contents

1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [API Endpoints](#api-endpoints)
4. [Authentication & Authorization](#authentication--authorization)
5. [Database Schema](#database-schema)
6. [Development Setup](#development-setup)
7. [Deployment Notes](#deployment-notes)

---

## Technology Stack

### **Backend**
- **Runtime**: Node.js (v20.19.5)
- **Framework**: Express.js (HTTP server, routing)
- **Language**: JavaScript (ES6+)
- **ORM**: Prisma (database abstraction, migrations)
- **Authentication**: Firebase Admin SDK (ID token verification)
- **File Storage**: Firebase Storage (adapter stub) + Local fallback (`/uploads`)
- **Real-time**: Socket.IO (chat gateway, not fully implemented)
- **Process Management**: npm scripts (`npm run dev`)

### **Frontend**
- **Framework**: React (with Vite bundler)
- **State Management**: React hooks (useState, useEffect)
- **Auth**: Firebase SDK (client-side token generation)
- **HTTP Client**: Axios (with custom interceptor for auth)
- **Styling**: CSS (component-scoped)
- **Build Tool**: Vite (dev server, production builds)

### **Database**
- **Type**: PostgreSQL
- **Client**: pg (node-postgres)
- **Schema Management**: Prisma Migrate (versioned migrations in `prisma/migrations/`)
- **Connection**: Environment variable `DATABASE_URL` (pooled connection via pg)
- **Current State**: 7 tables (User, HikerProfile, Guide, Hike, Booking, Review, Chat)

### **DevOps & Tooling**
- **Package Manager**: npm
- **Environment**: .env files (root and `prisma/.env`)
- **Linting**: ESLint (disabled in many controllers for dev speed)
- **Logging**: Console.log + structured logger stub (`src/shared/logger.js`)
- **Version Control**: Git (main branch)

### **Third-party Integrations (Stubs)**
- **Firebase Storage**: Upload adapter exists but not fully implemented (local fallback used)
- **Maps API**: Maps adapter stub (`src/adapters/maps.adapter.js`)
- **Payments**: Stripe adapter stub (`src/adapters/payments.adapter.js`)

---

## Architecture Overview

### **High-Level Design**

```
┌─────────────────────┐
│   Frontend (React)  │
│  - Pages, Components│
│  - Firebase Auth    │
└──────────┬──────────┘
           │
    ┌──────▼──────────────────────────────────┐
    │  API Gateway (Express + Middleware)     │
    │  - Auth Middleware                      │
    │  - Error Handler                        │
    │  - CORS, JSON Parser                    │
    └──────┬──────────────────────────────────┘
           │
    ┌──────▼────────────────────────────────────────────┐
    │  Module-Based Controllers (Router Pattern)         │
    │  - /api/hikes    (full CRUD + join/leave)        │
    │  - /api/users    (register, profile updates)      │
    │  - /api/guides   (profile view with stats)        │
    │  - /api/bookings (stub: join/leave handled by hikes) │
    │  - /api/reviews  (stub)                           │
    │  - /api/admin    (stub: overview)                 │
    └──────┬────────────────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────┐
    │  Repository Layer (Data Access)         │
    │  - Users Repo (Prisma)                  │
    │  - Hikes Repo (Prisma)                  │
    │  - Guides Repo (Prisma)                 │
    │  - Bookings Repo (Prisma)               │
    └──────┬──────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────┐
    │  Prisma Client (ORM)                    │
    │  - Schema: prisma/schema.prisma         │
    │  - Migrations: prisma/migrations/       │
    └──────┬──────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────┐
    │  PostgreSQL Database                    │
    │  - 7 tables                             │
    │  - Relationships (FK constraints)       │
    └──────────────────────────────────────────┘
```

### **Folder Structure**

```
trailhub1/
├── src/
│   ├── app/                    # Express app setup
│   │   ├── index.js            # Server startup, middleware config
│   │   ├── config.js           # Environment config
│   │   ├── auth.middleware.js  # Auth (Firebase + dev x-dev-user header)
│   │   ├── roles.middleware.js # Role-based access control
│   │   ├── routes.js           # Main router (mounts module routers)
│   │   ├── errors.js           # Error handler middleware
│   ├── modules/                # Feature modules (each has controller + repo)
│   │   ├── hikes/              # Hike CRUD + booking logic
│   │   │   ├── controller/     # Express Router
│   │   │   ├── repository/     # Prisma data access
│   │   │   └── utils/          # uploadHandler, etc.
│   │   ├── users/              # User auth & profiles
│   │   ├── guides/             # Guide profiles + stats
│   │   ├── bookings/           # Join/leave hikes (stub)
│   │   ├── reviews/            # Ratings (stub)
│   │   ├── administration/     # Admin dashboard (stub)
│   │   ├── analytics/          # Stats (stub)
│   │   ├── identity/           # Alternative identity routes (not used)
│   │   └── chat/               # Real-time chat gateway (stub)
│   ├── adapters/               # External service integrations
│   │   ├── firebase.auth.js    # Firebase ID token verification
│   │   ├── firebase.storage.js # Cloud storage (stub)
│   │   ├── maps.adapter.js     # Geocoding/maps (stub)
│   │   └── payments.adapter.js # Payment processing (stub)
│   ├── shared/                 # Shared utilities
│   │   ├── db.js               # PostgreSQL connection pool
│   │   ├── prisma.js           # Prisma client singleton
│   │   ├── logger.js           # Structured logger (minimal use)
│   │   └── errorResponses.js   # HTTP response helpers
│   └── middleware/             # Additional middleware
│       ├── auth.js             # Alternative auth (unused)
│       ├── errorHandler.js     # Error handling
│       └── requestLogger.js    # Request logging
├── frontend/                   # React app (Vite)
│   ├── src/
│   │   ├── pages/              # Route pages
│   │   ├── components/         # Reusable components
│   │   ├── api.js              # Axios instance with auth interceptor
│   │   └── firebase.js         # Firebase config
│   ├── package.json
│   └── vite.config.js
├── prisma/
│   ├── schema.prisma           # Data model
│   ├── migrations/             # Version-controlled DB changes
│   └── seed.js                 # (Optional) DB seeding
├── uploads/                    # Local file storage fallback
│   ├── covers/                 # Hike cover images
│   └── gpx/                    # GPS track files
├── package.json                # Backend dependencies
├── .env                        # Backend env (PORT, DATABASE_URL, Firebase)
└── TECH_STACK_AND_APIS.md     # This file
```

---

## API Endpoints

### **Legend**
- ✅ **Fully Functional**: Implemented, tested, data persisted
- 🟡 **Partially Functional**: Core logic works, may lack validation or edge cases
- ⚠️ **Stub/Not Implemented**: Placeholder endpoints, hardcoded responses
- 🔐 **Requires Auth**: Endpoint requires Firebase ID token or dev header
- 👤 **Role-Based**: Endpoint checks user role (hiker, guide, admin)

---

### **HIKES API** (`/api/hikes`)

| Method | Endpoint | Status | Auth | Role | Description |
|--------|----------|--------|------|------|-------------|
| GET | `/api/hikes` | ✅ | ❌ | - | List all hikes (public) |
| GET | `/api/hikes/:id` | ✅ | ❌ | - | Get hike details (public) |
| POST | `/api/hikes` | ✅ | 🔐 | guide | Create hike (multipart: cover + gpx) |
| PUT | `/api/hikes/:id` | ✅ | 🔐 | guide | Update hike (ownership check) |
| DELETE | `/api/hikes/:id` | ✅ | 🔐 | guide | Delete hike |
| POST | `/api/hikes/:id/join` | ✅ | 🔐 | hiker | Join hike (create booking) |
| DELETE | `/api/hikes/:id/join` | ✅ | 🔐 | hiker | Leave hike (cancel booking) |

**Notes**:
- File uploads use multer with 10MB limit; files stored locally in `/uploads` (Firebase adapter is a stub).
- POST/PUT require authenticated user with an active guide profile.
- Join/leave use bookings repository under the hood.

---

### **USERS API** (`/api/users`)

| Method | Endpoint | Status | Auth | Role | Description |
|--------|----------|--------|------|------|-------------|
| GET | `/api/users/me` | ✅ | ❌ | - | Get current user profile (or visitor stub) |
| POST | `/api/users/register` | ✅ | ❌ | - | Register/create user (public, called after Firebase signup) |
| PATCH | `/api/users/profile` | ✅ | 🔐 | hiker/guide | Update hiker or guide profile |
| GET | `/api/users/:id` | ✅ | 🔐 | hiker/guide/admin | Get user by ID (returns privacy-filtered public view; full profile for owner/admin) |

**Notes**:
- `/me` is also available at `/api/me` and `/api/profile` (backwards compatibility).
- `register` creates or updates a user in DB based on Firebase UID.
- `profile` route checks user role and calls either `updateHikerProfile` or `updateGuideProfile`.
- `GET /api/users/:id` is implemented: it fetches the user from the database and returns a privacy-filtered public view (omits sensitive fields like email). If the requester is the owner or an admin, a full profile (including related guide/hiker data and created hikes for guides) is returned.

---

### **GUIDES API** (`/api/guides`)

| Method | Endpoint | Status | Auth | Role | Description |
|--------|----------|--------|------|------|-------------|
| GET | `/api/guides/:id` | ✅ | ❌ | - | Get guide profile + hikes + reviews + avg rating (public) |

**Notes**:
- Returns guide info with computed fields: `averageRating`, `totalReviews`, `completedHikesCount`, hikes list.
- Public endpoint; no auth required.

---

### **BOOKINGS API** (`/api/bookings`)

| Method | Endpoint | Status | Auth | Role | Description |
|--------|----------|--------|------|------|-------------|
| POST | `/api/bookings` | ⚠️ | 🔐 | hiker/guide/admin | Create booking (stub—use `/api/hikes/:id/join` instead) |
| DELETE | `/api/bookings/:id` | ⚠️ | 🔐 | hiker/guide/admin | Delete booking (stub—use `/api/hikes/:id/join` instead) |

**Notes**:
- Bookings are handled via hikes endpoints (`/api/hikes/:id/join`, `/api/hikes/:id/join`).
- Direct booking endpoints are stubs and return hardcoded responses.

---

### **REVIEWS API** (`/api/reviews`)

| Method | Endpoint | Status | Auth | Role | Description |
|--------|----------|--------|------|------|-------------|
| POST | `/api/reviews` | ⚠️ | 🔐 | hiker/guide/admin | Create review (stub) |
| GET | `/api/reviews/guide/:id` | ⚠️ | ❌ | - | Get reviews for a guide (stub) |
| GET | `/api/reviews/hike/:id` | ⚠️ | ❌ | - | Get reviews for a hike (stub) |

**Notes**:
- All endpoints return empty/hardcoded data.
- To be implemented: wire to reviews repository + Prisma model.

---

### **ADMINISTRATION API** (`/api/admin`)

| Method | Endpoint | Status | Auth | Role | Description |
|--------|----------|--------|------|------|-------------|
| GET | `/api/admin/overview` | ⚠️ | ❌ | - | Get admin dashboard stats (stub) |

**Notes**:
- Returns hardcoded stats (0 users, 0 guides, 0 hikes).
- To be implemented: query DB for real metrics.

---

### **ANALYTICS API** (`/api/admin/analytics`)

| Method | Endpoint | Status | Auth | Role | Description |
|--------|----------|--------|------|------|-------------|
| GET | `/api/admin/analytics` | ⚠️ | ❌ | - | Get analytics (stub) |

**Notes**:
- Returns hardcoded data: `{ activeUsers: 0, hikesCompleted: 0 }`.
- To be implemented: aggregate real data from DB.

---

### **HEALTH CHECK**

| Method | Endpoint | Status | Auth | Description |
|--------|----------|--------|------|-------------|
| GET | `/healthz` | ✅ | ❌ | Server health check (returns `{ status: "ok" }`) |

---

## Authentication & Authorization

### **Authentication Flow**

1. **Frontend**: User logs in via Firebase (email/password or Google).
2. **Firebase Client SDK**: Generates ID token.
3. **Axios Interceptor** (`frontend/src/api.js`): Attaches token as `Authorization: Bearer <token>`.
4. **Backend Auth Middleware** (`src/app/auth.middleware.js`):
   - Extracts token from header.
   - Calls Firebase Admin SDK to verify token.
   - On success: Populates `req.user` with `{ firebaseUid, email, name, role }`.
   - On failure or no token: Treats user as `visitor`.

### **Development Mode**

For local testing without Firebase:
- Send `x-dev-user` header: `{ "id": "dev-123", "email": "dev@local", "role": "guide" }`.
- Auth middleware parses this and treats as authenticated user.

### **Authorization (Role-Based Access Control)**

**Roles**:
- `visitor`: No authentication (can view public endpoints).
- `hiker`: Authenticated user with default role.
- `guide`: Authenticated user with guide profile (can create/edit hikes).
- `admin`: Reserved for future admin panel.

**Middleware**: `src/app/roles.middleware.js`
- Function: `requireRole(['hiker', 'guide'])` wraps controllers.
- Checks `req.user.role` against allowed roles; returns 403 if unauthorized.

### **Profile Resolution**

**Key Function**: `usersRepo.getCurrentUserProfile(firebaseUid, userInfo)`
- **Behavior**:
  - Looks up user by Firebase UID.
  - If not found and `userInfo` provided: Creates new user record.
  - Returns user with nested `guide` and `hiker` profiles (or null if visitor).
  - Used by `/api/me` and `/api/users/me` endpoints.

---

## Database Schema

### **Tables Overview**

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **User** | Core user record | id, firebaseUid, email, name, role, createdAt |
| **HikerProfile** | Hiker-specific data | id, userId (FK), bio, avatar, location |
| **Guide** | Guide-specific data | id, userId (FK), displayName, bio, location |
| **Hike** | Hiking events | id, guideId (FK), title, description, difficulty, price, capacity, date, coverUrl, gpxPath |
| **Booking** | User → Hike joins | id, userId (FK), hikeId (FK), status (pending/confirmed/cancelled), createdAt |
| **Review** | Ratings/comments | id, guideId (FK), hikeId (FK), userId (FK), rating, comment, createdAt |
| **Chat** | Real-time messages | id, userId (FK), guideId (FK), message, createdAt |

### **Key Relationships**

```
User (1) ──→ (1) HikerProfile
User (1) ──→ (1) Guide
Guide (1) ──→ (*) Hike
Guide (1) ──→ (*) Review
User (1) ──→ (*) Booking
Hike (1) ──→ (*) Booking
Hike (1) ──→ (*) Review
User (1) ──→ (*) Chat
```

### **Running Migrations**

```bash
# Apply pending migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name <description>

# Reset (dev only)
npx prisma migrate reset
```

---

## Development Setup

### **Prerequisites**

- Node.js v20+
- PostgreSQL (local or remote)
- Firebase project (for auth)
- Git

### **Environment Variables**

Create `.env` in project root:

```bash
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://user:password@localhost:5432/trailhub
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=<firebase-private-key>
FIREBASE_CLIENT_EMAIL=<firebase-client-email>
```

Create `prisma/.env`:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/trailhub
```

### **Installation**

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Set up database (create schema + seed)
npx prisma migrate deploy
# (optional) npx prisma db seed

# (optional) Start Prisma Studio (GUI for DB)
npx prisma studio
```

### **Running Locally**

```bash
# Terminal 1: Start backend (port 3000)
npm run dev

# Terminal 2: Start frontend (port 5173)
cd frontend
npm run dev
```

### **Testing Endpoints**

```bash
# Example: List hikes
curl http://localhost:3000/api/hikes

# Example: Create hike (requires auth + guide role)
curl -X POST http://localhost:3000/api/hikes \
  -H "Authorization: Bearer <firebase-token>" \
  -F "title=My Hike" \
  -F "difficulty=moderate" \
  -F "cover=@path/to/image.jpg"

# Example: Dev mode (without Firebase)
curl http://localhost:3000/api/me \
  -H "x-dev-user: {\"id\":\"dev-1\",\"email\":\"dev@local\",\"role\":\"guide\"}"
```

---

## Deployment Notes

### **Production Checklist**

- [ ] Set `NODE_ENV=production` in `.env`.
- [ ] Use managed PostgreSQL (AWS RDS, Heroku Postgres, etc.).
- [ ] Implement Firebase Storage adapter (currently stubbed).
- [ ] Enable CORS only for your frontend domain (currently `http://localhost:5173`).
- [ ] Use environment-based secrets (AWS Secrets Manager, Heroku Config Vars, etc.).
- [ ] Run database migrations before deploying new code.
- [ ] Set up monitoring/logging (e.g., Datadog, CloudWatch, Sentry).
- [ ] Implement review endpoints (currently stubs).
- [ ] Implement analytics endpoints (currently stubs).
- [ ] Test file upload limits and storage fallback.

### **Recommended Hosting**

- **Backend**: Heroku, AWS EC2, Railway, Render.
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront.
- **Database**: AWS RDS PostgreSQL, Heroku Postgres.
- **File Storage**: AWS S3, Google Cloud Storage, Firebase Storage.

---

## Next Steps / TODO

### **High Priority**
- [ ] Implement reviews endpoints (wire to repository + DB).
- [ ] Implement bookings endpoints (currently hijacked by hikes).
- [ ] Full Firebase Storage adapter implementation.
- [ ] Add admin dashboard backend endpoints.

### **Medium Priority**
- [ ] Replace console.log with structured logger throughout.
- [ ] Add unit tests for repositories and controllers.
- [ ] Add integration tests for API endpoints.
- [ ] Implement chat real-time features (Socket.IO gateway).
- [ ] Add input validation (Joi, Zod, or express-validator).

### **Low Priority**
- [ ] Implement maps and geocoding adapter.
- [ ] Implement payments adapter.
- [ ] Add API rate limiting.
- [ ] Add request/response compression.
- [ ] Document API with OpenAPI/Swagger.

---

## Quick Reference

### **Common Commands**

```bash
# Backend
npm run dev                    # Start development server
npm run build                  # Build for production (if applicable)
npm test                       # Run tests (if configured)

# Database
npx prisma studio            # Open GUI for DB
npx prisma migrate dev        # Create + apply migration
npx prisma db seed            # Seed sample data

# Frontend
cd frontend && npm run dev    # Start Vite dev server
cd frontend && npm run build  # Build for production
```

### **Common Debugging**

```bash
# Check if backend is running
curl http://localhost:3000/healthz

# Check if frontend is running
curl http://localhost:5173

# View database
npx prisma studio

# Check environment config
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

---

## Contact & Support

For questions or issues:
1. Check `/CLEANUP_PLAN.md` for recent refactoring notes.
2. Review `src/app/routes.js` for mounted controllers.
3. Check individual module READMEs (if added).

---

**Generated**: November 30, 2025  
**Status**: Active Development
