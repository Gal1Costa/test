# TrailHub Backend

A modular monolith backend built with Node.js/Express + Socket.IO + PostgreSQL(+PostGIS) + Firebase Auth/Storage.

## 🏗️ Architecture

**Modular Monolith with MVC layering:**
- **Application Layer**: Server bootstrap, config, middleware, routing
- **Shared Layer**: Database pool, logging utilities  
- **Adapters Layer**: Firebase Auth/Storage, Payments, Maps integrations
- **Modules Layer**: 9 business modules with controllers, repositories, gateways

## 📁 Project Structure

```
src/
├── app/                      # Application layer (bootstrap, middleware, routing)
│   ├── index.js             # Server bootstrap & startup (express + socket wiring)
│   ├── config.js            # Environment configuration loader
│   ├── routes.js            # Main router mounting all module routers
│   ├── auth.middleware.js   # Firebase token verification -> attaches user to req
│   ├── roles.middleware.js  # Role-based access control (requireRole helper)
│   └── errors.js            # Centralized error definitions & helpers
├── shared/                   # Shared utilities used across modules
│   ├── db.js                # PostgreSQL pool management / query helpers
│   └── logger.js            # JSON console logger wrapper
├── adapters/                 # Adapters for external services (thin ports)
│   ├── firebase.auth.js     # Firebase Authentication adapter (verify tokens)
│   ├── firebase.storage.js  # Firebase Storage adapter (upload helpers)
│   ├── payments.adapter.js  # Payment provider adapter (stripe/payments stub)
│   └── maps.adapter.js      # Geocoding / maps adapter
├── gateway/                  # Real-time and DB gateways
│   ├── db.js                # Alternative DB gateway (if used by chat/socket)
│   └── socket.js            # Socket.IO server wiring
├── controllers/              # Small app-level controllers (health etc.)
│   └── healthController.js   # /healthz handler
├── middleware/               # Express middleware (request logging, error handler)
│   ├── requestLogger.js
│   └── errorHandler.js
├── repositories/             # Shared repository base classes
│   ├── baseRepository.js
│   └── userRepository.js
├── modules/                  # Business modules (each follows MVC internally)
│   ├── identity/             # Identity module (controllers + repository)
│   │   ├── controller/
│   │   └── repository/
│   ├── users/                # User accounts & profiles
│   │   ├── controller/
│   │   └── repository/
│   ├── guides/               # Guides domain (models, repo, controller)
│   │   ├── guide.model.js
│   │   ├── controller/
│   │   └── repository/
│   ├── hikes/                # Hike (trail) management
│   │   ├── controller/
│   │   └── repository/
│   ├── bookings/             # Reservation system
│   │   ├── controller/
│   │   └── repository/
│   ├── reviews/              # Ratings & feedback
│   │   ├── controller/
│   │   └── repository/
│   ├── chat/                 # Real-time messaging + gateway
│   │   ├── gateway/
│   │   └── repository/
│   ├── administration/       # Admin operations & reporting
│   │   ├── controller/
│   │   └── repository/
│   └── analytics/            # Read-only aggregates & reporting
│       ├── controller/
│       └── repository/
├── app.js                    # Legacy entrypoint / alternative bootstrap (keeps compat)
└── routes/                   # Route modules & v1 API composition
   ├── index.js
   └── health.js

other/
├── db/                       # Migrations and DB helpers
│   └── migrations/
│       └── README.md
├── docs/                      # Project documentation (architecture, routes, adapters)
│   ├── ARCHITECTURE.md
│   ├── Module-Map.md
│   ├── Routes-v1.md
│   ├── Adapters-Catalog.md
│   └── Chat-Gateway-Events.md
├── package.json               # npm metadata & scripts
└── README.md                  # Project README (this file)

```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL (optional for development)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/Gal1Costa/trailhub1.git
   cd trailhub
   npm install
   ```

2. **Setup environment:**
   ```bash
   copy .env.example .env
   # Edit .env with your values (optional for development)
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Start production server:**
   ```bash
   npm start
   ```

✅ The server should print “TrailHub ready” and be available at [http://localhost:3000](http://localhost:3000)


## 🔗 API Endpoints

### Health Check
- `GET /healthz` - System health status

### Identity
- `GET /api/identity/me` - Current user info (visitor, hiker, guide, admin)

### Guides  
- `GET /api/guides/:id` - Get guide profile (visitor+)
- `PATCH /api/guides/me` - Update own profile (guide)

### Hikes
- `GET /api/hikes` - List hikes (visitor+)
- `GET /api/hikes/:id` - Get hike details (visitor+)
- `POST /api/hikes` - Create hike (guide)

### Bookings
- `POST /api/bookings` - Create booking (hiker)
- `DELETE /api/bookings/:id` - Cancel booking (hiker owner)

### Reviews
- `POST /api/reviews` - Create review (hiker)
- `GET /api/guides/:id/reviews` - List guide reviews (visitor+)

### Administration
- `GET /api/admin/overview` - Admin dashboard (admin)
- `GET /api/admin/analytics` - System analytics (admin)

## 👥 User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **visitor** | Anonymous user | View hikes, guides, reviews |
| **hiker** | Registered user | Book hikes, leave reviews |
| **guide** | Trail guide | Create hikes, manage bookings |
| **admin** | System admin | Full system access |

## 🔌 Socket.IO Events

### Chat Gateway (`/chat` namespace)
- **Room Pattern**: `chat:hike:{hikeId}`
- **Client Events**: `joinRoom`, `leaveRoom`, `sendMessage`, `sendPhoto`
- **Server Events**: `message`, `photo`, `systemNotice`

## 📊 Database Schema

### Module Ownership
- **users**: `users`, `user_profiles`, `user_roles`
- **guides**: `guides`, `guide_profiles`, `guide_verifications`
- **hikes**: `hikes`, `hike_media`, `routes`
- **bookings**: `bookings`, `participants`, `payment_intents`
- **chat**: `messages`, `attachments`
- **reviews**: `reviews`
- **administration**: `reports`, `moderation_actions`
- **analytics**: Read-only views/aggregates

## 🧪 Testing the Setup

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Test health endpoint:**
   ```bash
   curl http://localhost:3000/healthz
   # Expected: {"status":"ok"}
   ```

3. **Test API endpoints:**
   ```bash
   curl http://localhost:3000/api/hikes
   # Expected: {"todo":"list hikes"}
   
   curl http://localhost:3000/api/guides/123
   # Expected: {"todo":"get guide by id"}
   ```

4. **Check server logs:**
   - Should see "TrailHub ready" message
   - Should see request logs for each API call
   - Database connection warning is expected without PostgreSQL

## 📚 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Routes](docs/Routes-v1.md)
- [Permissions Matrix](docs/Permissions-Matrix.md)
- [Module Map](docs/Module-Map.md)
- [Adapters Catalog](docs/Adapters-Catalog.md)
- [Chat Gateway Events](docs/Chat-Gateway-Events.md)
- [Startup Sequence](docs/MainClass-Startup.md)
- [Guide Data Model](docs/Guide-Class.md)

## 🔧 Development Status

**Current Implementation:**
- ✅ Complete modular architecture
- ✅ All API endpoints with role guards
- ✅ Socket.IO chat gateway
- ✅ Firebase adapters (stubs)
- ✅ PostgreSQL integration (resilient)
- ✅ Comprehensive documentation

**Next Phase:**
- 🔄 Database schema implementation
- 🔄 Firebase real integration
- 🔄 Business logic implementation
- 🔄 Frontend React application
- 🔄 Testing suite
- 🔄 Production deployment

## 🛠️ Environment Variables

```bash
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/trailhub
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
STORAGE_BUCKET=
```

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 🤝 Contributing

1. Follow the modular monolith architecture
2. Add role guards to new endpoints
3. Update documentation for new features
4. Use JSDoc for type hints
5. Keep business logic in repositories
6. Add TODOs for future implementation

---

🧱 Frontend Integration (Current Dev Slice)

TrailHub includes a frontend prototype built with React + Vite, implementing the Hiker actor’s flow end-to-end:

Explore all hikes (GET /api/hikes)

View hike details (GET /api/hikes/:id)

Join or leave hikes (POST/DELETE /api/hikes/:id/join)

Mock authentication using the x-dev-user request header

Frontend is located in /frontend and connects to the backend at http://localhost:3000.

Run frontend locally:

cd frontend
npm install
npm run dev
# Visit http://localhost:5173

🧪 Dev Authentication (Mock Mode)

During early development, TrailHub uses a mock user header instead of Firebase Authentication:

x-dev-user: {"id":"u_hiker_1","role":"hiker","email":"hiker@example.com"}


This enables testing of user roles without authentication setup.

Role	Example Header
Hiker	{"id":"u_hiker_1","role":"hiker"}
Guide	{"id":"g1","role":"guide"}
Admin	{"id":"a1","role":"admin"}

All endpoints requiring authentication depend on this header when running in development mode.

🧭 Development Workflow

Branch structure:

main → stable branch (demo-ready)

dev → active feature development

feature/* → short-lived branches for specific features

Typical workflow:

git checkout dev
git checkout -b feature/guide-create-hike
# ... make changes ...
git push origin feature/guide-create-hike


Use pull requests to merge into dev → then into main when stable.



---

# 🐘 PostgreSQL Setup via Docker 

TrailHub uses **PostgreSQL** as its primary database.
The easiest local setup is via **Docker**.

---

## 1️⃣ Create the PostgreSQL Docker Container

> **Important:** PowerShell does *not* support multiline commands using `\` or `^`.
> Run this **on one line exactly**:

```powershell
docker run --name trailhub-postgres -e POSTGRES_USER=trailhub -e POSTGRES_PASSWORD=trailhub -e POSTGRES_DB=trailhub -p 5432:5432 -d postgres:15
```

---

## 2️⃣ Confirm the Container Is Running

```powershell
docker ps
```

Expected output:

```
CONTAINER ID   IMAGE         COMMAND                  CREATED        STATUS        PORTS                                         NAMES
xxxxxx         postgres:15   "docker-entrypoint.s…"   X minutes ago  Up X minutes  0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp   trailhub-postgres
```

If you do **not** see it running:

```powershell
docker start trailhub-postgres
```

---

## 3️⃣ Test That PostgreSQL Is Reachable

Enter the DB:

```powershell
docker exec -it trailhub-postgres psql -U trailhub -d trailhub
```

If you see:

```
trailhub=#
```

✔️ PostgreSQL is running correctly.

Type `\q` to exit.

---

## 4️⃣ Run Database Migrations (Create Tables)

PowerShell cannot use `< file.sql`, so we stream files using `Get-Content -Raw`.

```powershell
# Run core schema
Get-Content -Raw db/migrations/001_core.sql |
  docker exec -i trailhub-postgres psql -U trailhub -d trailhub -v ON_ERROR_STOP=1 -f -
```

---

## 5️⃣ Seed Development Data (Users, Guides, Events)

```powershell
Get-Content -Raw db/migrations/002_seed_dev.sql |
  docker exec -i trailhub-postgres psql -U trailhub -d trailhub -v ON_ERROR_STOP=1 -f -
```

---

## 6️⃣ Verify Tables Were Created Correctly

```powershell
docker exec -it trailhub-postgres psql -U trailhub -d trailhub -c "\dt"
```

You should see:

```
           List of relations
 Schema |     Name     | Type  |  Owner
--------+--------------+-------+----------
 public | events       | table | trailhub
 public | guides       | table | trailhub
 public | participants | table | trailhub
 public | reviews      | table | trailhub
 public | users        | table | trailhub
(5 rows)
```

---

## 7️⃣ (Optional) Confirm Seeded Events

```powershell
docker exec -it trailhub-postgres psql -U trailhub -d trailhub \
  -c "SELECT id, name, difficulty, location FROM events;"
```

---

## 8️⃣ Verify App Connects to PostgreSQL

Start the backend:

```powershell
node src/app/index.js
```

Expected output:

```
[config] NODE_ENV= development PORT= 3000
Database connection: OK
{"level":"info","msg":"TrailHub ready","port":3000}
```



---

# 🧪 Testing API Endpoints on Windows PowerShell


TrailHub uses a development mock authentication header:

```
x-dev-user: {"id":"<uuid>","role":"<role>"}
```

Use the correct PowerShell syntax below.

---

## 1️⃣ List All Hikes

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/hikes" `
  -Headers @{ "x-dev-user" = '{"id":"11111111-1111-1111-1111-111111111111","role":"hiker"}' }
```

---

## 2️⃣ Get Hike Details

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/hikes/88888888-8888-8888-8888-888888888888" `
  -Headers @{ "x-dev-user" = '{"id":"11111111-1111-1111-1111-111111111111","role":"hiker"}' }
```

---

## 3️⃣ Join a Hike (Hiker Only)

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/hikes/99999999-9999-9999-9999-999999999999/join" `
  -Method POST `
  -Headers @{ "x-dev-user" = '{"id":"11111111-1111-1111-1111-111111111111","role":"hiker"}' }
```

---

## 4️⃣ Leave a Hike

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/hikes/99999999-9999-9999-9999-999999999999/join" `
  -Method DELETE `
  -Headers @{ "x-dev-user" = '{"id":"11111111-1111-1111-1111-111111111111","role":"hiker"}' }
```

---

## 5️⃣ List Joined Hikes

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/hikes/joined/list" `
  -Headers @{ "x-dev-user" = '{"id":"11111111-1111-1111-1111-111111111111","role":"hiker"}' }
```

---

## 6️⃣ Identity Endpoint (`/api/me`)

This returns the current mock user loaded from `x-dev-user`:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/me" `
  -Headers @{ "x-dev-user" = '{"id":"11111111-1111-1111-1111-111111111111","role":"hiker","email":"hiker@example.com"}' }
```

---

### ✔️ If the requests return JSON successfully, the backend is running and connected to PostgreSQL.

---

### Explore Hikes (Join/Leave + Upcoming/Past)

The Explore page shows all hikes from `/api/hikes`, with client-side tabs:
- **Upcoming** — hikes with `date >= now`
- **Past** — hikes with `date < now`
- **All** — everything

**Buttons**
- **Join** appears when: upcoming AND not full AND not joined
- **Leave** appears when: upcoming AND joined
- Past hikes show a disabled **Past** button; full hikes show **Full**; joined ones show **Joined**

**Endpoints used**
- `GET /api/hikes` — list
- `POST /api/hikes/:id/join` — join
- `DELETE /api/hikes/:id/join` — leave

**Dev header**
All requests include:
x-dev-user: {"id":"11111111-1111-1111-1111-111111111111","role":"hiker"}

bash
Copy code
Configured via the axios interceptor in `frontend/src/api.js`.
Test checklist
Backend running (node src/app/index.js) and DB seeded.

Frontend running (npm run dev in frontend).

Visit http://localhost:5173/explore:

Try Join on Svaneti, then switch to /profile and confirm it appears in Upcoming.

Back on Explore, the card should now show Leave (since you joined).

Change dates in DB and refresh to see cards move between tabs.



## 🔐 Firebase Authentication (Dev & Real)

TrailHub supports **Firebase Authentication** on top of the existing dev header (`x-dev-user`).

### 1. Backend – Firebase Admin

We use `firebase-admin` on the backend to verify ID tokens coming from the frontend.

**Env variables (.env in project root):**

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://trailhub:trailhub@localhost:5432/trailhub
DEV_MODE=true

# Firebase Admin (service account JSON → mapped to env)
FIREBASE_PROJECT_ID=trailhub-82d1c
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-....@trailhub-82d1c.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional for Storage
FIREBASE_STORAGE_BUCKET=trailhub-82d1c.firebasestorage.app
```

> ⚠️ These values come from the **Firebase Service Account JSON**
> (`Project settings → Service accounts → Generate new private key`).


**Firebase Admin adapter** (`src/adapters/firebase.auth.js`):

* Initializes `firebase-admin` with the env vars.
* Exposes `verifyIdToken(idToken)` which:

  * returns decoded Firebase user claims (uid, email, name, picture, etc.)
  * returns `null` if token is missing/invalid.

**Auth middleware** (`src/app/auth.middleware.js`):

* Reads `Authorization: Bearer <FirebaseIdToken>` from incoming requests.
* If present and valid:

  * sets `req.user = { firebaseUid, email, name, picture, role: 'hiker' }`.
* If no token and `DEV_MODE=true`:

  * optionally falls back to `x-dev-user` header (for local development).
* Otherwise:

  * treats the request as `{ role: 'visitor' }`.

This middleware is registered early in the pipeline so all modules can use `req.user`.

**Database link to Firebase**:

We link Firebase users to our own `users` table via `firebase_uid`:

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
```

`/api/me` then:

* looks up a user by `firebase_uid` when a Firebase-authenticated request comes in,
* creates a new `users` row on first login (`name`, `email`, default `role='hiker'`),
* returns the app user profile.

---

### 2. Frontend – Firebase Web SDK + Axios Interceptor

On the frontend we use the **Firebase Web SDK** to sign users in and obtain ID tokens.

**Firebase client setup** (`frontend/src/firebase.js`):

```js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";

// Web config from Firebase Console (Project settings → General → Web app)
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "trailhub-82d1c.firebaseapp.com",
  projectId: "trailhub-82d1c",
  storageBucket: "trailhub-82d1c.firebasestorage.app",
  messagingSenderId: "283528215556",
  appId: "1:283528215556:web:...",
  measurementId: "G-HNS6CEZNK9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, onAuthStateChanged };
```

**API client** (`frontend/src/api.js`):

All HTTP requests go through a single axios instance that automatically attaches auth:

```js
import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  config.headers = config.headers || {};

  if (user) {
    // Real Firebase auth → send ID token
    const token = await user.getIdToken(false);
    config.headers.Authorization = `Bearer ${token}`;
  } else if (import.meta.env.DEV) {
    // Dev-mode fallback for local testing
    config.headers["x-dev-user"] = JSON.stringify({
      id: "11111111-1111-1111-1111-111111111111",
      role: "hiker",
      email: "hiker@example.com",
      name: "Demo Hiker",
    });
  }

  return config;
});

export default api;
```

Pages (`Explore`, `HikeDetails`, `Profile`) **no longer** pass headers manually (no `devUserHeader`).
They just call `api.get(...)`, `api.post(...)`, `api.delete(...)` and the interceptor handles auth.

**Sign in / Sign out UI** (`frontend/src/AppAuthBar.jsx`):

A small component in the header:

* Shows “Sign in with Google” when logged out.
* Shows avatar/name + “Sign out” when logged in.

Mounted in `main.jsx` inside the app header so auth is always available.

---

### 3. Dev vs Production

* **Development**

  * `DEV_MODE=true`
  * When logged in with Google → real Firebase ID tokens are used.
  * When not logged in → backend can still accept `x-dev-user` for quick testing.
* **Production**

  * Set `DEV_MODE=false` in `.env`.
  * Remove the `x-dev-user` fallback in `api.js`.
  * Only real Firebase-authenticated users (valid ID tokens) are treated as logged-in.

---

## 🧩 How this all fits together

1. User signs in with Google (frontend, Firebase Web SDK).
2. Axios interceptor grabs `auth.currentUser.getIdToken()` and sends it as:

   ```http
   Authorization: Bearer <ID_TOKEN>
   ```
3. Backend `auth.middleware` verifies the token with Firebase Admin.
4. `/api/me` finds or creates the corresponding `users` row by `firebase_uid`.
5. Other endpoints (hikes, bookings, etc.) use `req.user` and `user.id`/`role` to enforce permissions.

---


# TrailHub Backend

A modular monolith backend built with Node.js/Express + Socket.IO + PostgreSQL(+PostGIS) + Firebase Auth/Storage.

---

## 🆕 Additional Features Implemented (Prisma, Join/Leave, Frontend Integration)

This section documents the extra functionality implemented during the current dev work: Prisma integration, join/leave logic, capacity limits, and frontend Explore/Profile/HikeDetails behavior.

### 1. Prisma ORM Integration

- Introduced **Prisma** as the main ORM for PostgreSQL.
- Configured `prisma/schema.prisma` with a `db` datasource using:

  ```env
  DATABASE_URL="postgres://trailhub:trailhub@localhost:5432/trailhub"
  ```

- Generated Prisma client and migrations with:

  ```bash
  npx prisma generate
  npx prisma migrate dev --name init
  ```

- Enabled DB inspection with:

  ```bash
  npx prisma studio
  ```

### 2. Hikes Repository (Prisma-Based)

Location: `src/modules/hikes/repository/index.js`

- Implemented `listHikes()` and `getHikeById()` using Prisma:
  - Includes `guide` (and `guide.user`) for `guideName`.
  - Includes `_count.bookings` for `participantsCount`.

- Added a `mapHike(hike)` helper that normalizes fields for the frontend:

  - `id`
  - `name` (from `title` or `name`)
  - `location` (with `"Unknown location"` fallback)
  - `date` (from `date` / `startDate` / `createdAt`)
  - `difficulty`
  - `participantsCount` (from `_count.bookings`)
  - `capacity`
  - `isFull` (computed from `participantsCount >= capacity`)
  - `guideName`

- Kept `createHike`, `updateHike`, and `deleteHike` using Prisma.

### 3. Bookings / Join & Leave Logic

Location: `src/modules/bookings/repository/index.js`

- Implemented `createBooking({ hikeId, status })`:
  - Validates `hikeId`.
  - Loads a hike with `_count.bookings` to get current participants.
  - Applies capacity rule:
    - If `capacity > 0` and current bookings >= capacity → throws custom `HIKE_FULL` error.
  - Creates a `Booking` for the current (demo) user.

- Implemented `deleteBookingForCurrentUserAndHike(hikeId)`:
  - Looks up the booking for the current user/hike.
  - Deletes it if it exists (used for the **Leave** button).

- Added `getOrCreateDemoUser()` so the app works without full auth during development.

### 4. Updated API Routes (Express)

Location: `src/app/routes.js`

- Hike routes:
  - `GET /api/hikes` → list all hikes (normalized for frontend).
  - `GET /api/hikes/:id` → get single hike details.
  - `POST /api/hikes` → create hike.
  - `PUT /api/hikes/:id` → update hike.
  - `DELETE /api/hikes/:id` → delete hike.

- Join / Leave:
  - `POST /api/hikes/:id/join`:
    - Calls `bookingsRepo.createBooking({ hikeId, status })`.
    - If capacity is exceeded, returns `400 { "error": "This hike is full" }`.
  - `DELETE /api/hikes/:id/join`:
    - Calls `bookingsRepo.deleteBookingForCurrentUserAndHike(hikeId)`.
    - If no booking exists, returns `404 { "error": "No booking found for this hike" }`.

- Profile / Current User:
  - Central handler uses `usersRepo.getCurrentUserProfile()` to build:

    ```json
    {
      "id": "...",
      "email": "demo@local",
      "name": "Demo User",
      "role": "user",
      "bookings": [
        {
          "id": "...",
          "hikeId": "...",
          "hike": {
            "id": "...",
            "title": "...",
            "difficulty": "moderate",
            "capacity": 10
          }
        }
      ]
    }
    ```

  - Exposed as:
    - `GET /api/profile`
    - `GET /api/me`
    - `GET /api/users/me`

### 5. Explore Page Behavior (Frontend)

Location: `frontend/src/pages/Explore.jsx`

- Loads data on mount:
  - `GET /api/hikes` → all hikes.
  - `GET /api/profile` → current user + bookings.
  - Derives `joinedIds` from `profile.bookings`.

- Implements three tabs:
  - **Upcoming**: hikes with `date >= now`.
  - **Past**: hikes with `date < now`.
  - **All (Joined only)**: only hikes the user has joined (past + upcoming).

- Button rules:
  - If hike is in the past → show **Past** (disabled).
  - If upcoming and joined → show **Leave** (calls `DELETE /api/hikes/:id/join`).
  - If upcoming and not joined and not full → show **Join** (calls `POST /api/hikes/:id/join`).
  - If upcoming and not joined and full → show **Full** (disabled).

- Hike names are links to a details page:
  ```jsx
  <Link to={`/hikes/${h.id}`}>{h.name}</Link>
  ```

### 6. Profile Page: My Hikes

Location: `frontend/src/pages/Profile.jsx`

- Calls `GET /api/profile` to load:
  - user info (name, email, role)
  - bookings with attached hike info
- Splits joined hikes into:
  - Upcoming hikes
  - Past hikes
- Shows:
  - Summary counts (total joined, upcoming, past)
  - A **Leave** button for upcoming hikes (using `DELETE /api/hikes/:id/join`).

### 7. Hike Details Page

Location: `frontend/src/pages/HikeDetails.jsx`

- Route: `/hikes/:id`
- Loads:
  - `GET /api/hikes/:id` → hike details.
  - `GET /api/profile` → to detect if the current user joined this hike.
- Button logic:
  - Past hike → **Past** (disabled).
  - Upcoming & joined → **Leave**.
  - Upcoming & not joined & full → **Full**.
  - Upcoming & not joined & not full → **Join**.

---

