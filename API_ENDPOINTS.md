# TrailHub Backend API Endpoints

## Base URL
`http://localhost:3000`

---

## 🏔️ Hikes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/hikes` | List all hikes | No |
| `GET` | `/api/hikes/:id` | Get hike by ID | No |
| `POST` | `/api/hikes` | Create a new hike | Yes |
| `PUT` | `/api/hikes/:id` | Update a hike | Yes |
| `DELETE` | `/api/hikes/:id` | Delete a hike | Yes |
| `POST` | `/api/hikes/:id/join` | Join a hike (create booking) | Yes (hiker/guide/admin) |
| `DELETE` | `/api/hikes/:id/join` | Leave a hike (cancel booking) | Yes (hiker/guide/admin) |

---

## 👤 Users & Profile

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/users/register` | Register new user after Firebase signup | No (public) |
| `GET` | `/api/users/me` | Get current user profile | Yes |
| `GET` | `/api/me` | Get current user profile (alias) | Yes |
| `GET` | `/api/profile` | Get current user profile (alias) | Yes |
| `GET` | `/api/users/:id` | Get specific user profile | Yes (hiker/guide/admin) |
| `PATCH` | `/api/users/profile` | Update current user's profile | Yes (hiker/guide/admin) |

**Note:** `/api/users/me`, `/api/me`, and `/api/profile` all return the same data (current user's profile with bookings, hikes, etc.)

---

## 📅 Bookings

| Method | Endpoint | Description | Auth Required | Status |
|--------|----------|-------------|---------------|--------|
| `POST` | `/api/bookings` | Create a booking | Yes (hiker/guide/admin) | ❌ **NOT MOUNTED** |
| `DELETE` | `/api/bookings/:id` | Delete a booking | Yes (hiker/guide/admin) | ❌ **NOT MOUNTED** |

**Note:** 
- These endpoints exist in the controller but are **NOT mounted** in routes, so they won't work
- Bookings are created/deleted via `/api/hikes/:id/join` and `DELETE /api/hikes/:id/join` which **DO work**

---

## 🧭 Guides

| Method | Endpoint | Description | Auth Required | Status |
|--------|----------|-------------|---------------|--------|
| `GET` | `/api/guides/:id` | Get guide profile by ID | Yes (visitor/hiker/guide/admin) | ❌ **NOT MOUNTED** |
| `PATCH` | `/api/guides/me` | Update my own guide profile | Yes (guide/admin) | ❌ **NOT MOUNTED** |

**Note:** These endpoints exist in the controller but are **NOT mounted** in routes, so they won't work

---

## ⭐ Reviews

| Method | Endpoint | Description | Auth Required | Status |
|--------|----------|-------------|---------------|--------|
| `POST` | `/api/reviews` | Create a review | Yes (hiker/guide/admin) | ❌ **NOT MOUNTED** |
| `GET` | `/api/reviews/guide/:id` | Get reviews for a guide | Yes (visitor/hiker/guide/admin) | ❌ **NOT MOUNTED** |
| `GET` | `/api/reviews/hike/:id` | Get reviews for a hike | Yes (visitor/hiker/guide/admin) | ❌ **NOT MOUNTED** |

**Note:** These endpoints exist in the controller but are **NOT mounted** in routes, so they won't work

---

## 🔐 Identity

| Method | Endpoint | Description | Auth Required | Status |
|--------|----------|-------------|---------------|--------|
| `GET` | `/api/identity` | Get current user identity | Yes (visitor/hiker/guide/admin) | ⚠️ Legacy/Dev |
| `GET` | `/api/identity/hikes` | Get current user's hikes | Yes (hiker) | ⚠️ Legacy/Dev |

**Note:** These endpoints appear to be legacy/dev endpoints. Use `/api/profile` instead.

---

## 👨‍💼 Administration

| Method | Endpoint | Description | Auth Required | Status |
|--------|----------|-------------|---------------|--------|
| `GET` | `/api/admin/overview` | Get admin overview stats | Yes | ❌ **NOT MOUNTED** |

**Note:** This endpoint exists in the controller but is **NOT mounted** in routes, so it won't work

---

## 📊 Analytics

| Method | Endpoint | Description | Auth Required | Status |
|--------|----------|-------------|---------------|--------|
| `GET` | `/api/admin/analytics` | Get analytics data | Yes | ❌ **NOT MOUNTED** |

**Note:** This endpoint exists in the controller but is **NOT mounted** in routes, so it won't work

---

## 🏥 Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/healthz` | Health check endpoint | No |

---

## 📝 Notes

### Authentication
- Most endpoints require authentication via Firebase JWT token
- Token should be sent in `Authorization: Bearer <token>` header
- Unauthenticated users have role `visitor`
- Authenticated users have roles: `hiker`, `guide`, or `admin`

### Status Legend
- ✅ **Fully Working** - Endpoint is implemented, mounted, and functional
- ❌ **NOT MOUNTED** - Endpoint exists in controller but is not mounted in routes (won't work)
- ⚠️ **TODO** - Endpoint exists but returns placeholder/mock data
- 🔧 **Legacy** - Endpoint exists but may be deprecated

### Currently Working Endpoints (11 total)
- ✅ All Hike endpoints (CRUD + join/leave) - **7 endpoints**
- ✅ User registration - **1 endpoint**
- ✅ User profile (get/update) - **3 endpoints**

### Endpoints That DON'T Work (16 total)
- ❌ Bookings controller endpoints (2) - Not mounted, but bookings work via `/api/hikes/:id/join`
- ❌ Guides endpoints (2) - Not mounted
- ❌ Reviews endpoints (3) - Not mounted
- ❌ Admin/Analytics endpoints (2) - Not mounted
- ❌ Identity endpoints (2) - Legacy, may not work
- ⚠️ `GET /api/users/:id` - Returns placeholder data

**Summary:** Only **11 out of 27 endpoints** are actually working. The rest exist in code but are not mounted in the Express router.

