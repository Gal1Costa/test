# Routes v1

## Health Check
- `GET /healthz` - System health status

## Identity
- `GET /api/me` - Current user info (hiker, guide, admin)

## Guides
- `GET /api/guides/:id` - Get guide profile (visitor, hiker, guide, admin)
- `PATCH /api/guides/me` - Update own profile (guide)

## Hikes
- `GET /api/hikes` - List hikes (visitor, hiker, guide, admin)
- `GET /api/hikes/:id` - Get hike details (visitor, hiker, guide, admin)
- `POST /api/hikes` - Create hike (guide)

## Bookings
- `POST /api/bookings` - Create booking (hiker)
- `DELETE /api/bookings/:id` - Cancel booking (hiker owner)

## Reviews
- `POST /api/reviews` - Create review (hiker)
- `GET /api/guides/:id/reviews` - List guide reviews (visitor, hiker, guide, admin)

## Administration
- `GET /api/admin/overview` - Admin dashboard (admin)
- `GET /api/admin/analytics` - System analytics (admin)
