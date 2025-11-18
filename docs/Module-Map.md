# Module Map

## Core Modules and Their Scope

### Identity Module
- **Scope**: Current user profile management
- **Owned Tables**: None (uses users module)

### Users Module
- **Scope**: User accounts and profiles
- **Owned Tables**: 
  - `users`
  - `user_profiles`
  - `user_roles`

### Guides Module
- **Scope**: Guide profiles and verification
- **Owned Tables**:
  - `guides`
  - `guide_profiles`
  - `guide_verifications`

### Hikes Module
- **Scope**: Trail management and media
- **Owned Tables**:
  - `hikes`
  - `hike_media`
  - `routes`

### Bookings Module
- **Scope**: Reservation system and payments
- **Owned Tables**:
  - `bookings`
  - `participants`
  - `payment_intents`

### Chat Module
- **Scope**: Real-time messaging
- **Owned Tables**:
  - `messages`
  - `attachments` (meta only)

### Reviews Module
- **Scope**: Rating and feedback system
- **Owned Tables**:
  - `reviews`

### Administration Module
- **Scope**: Admin operations and moderation
- **Owned Tables**:
  - `reports`
  - `moderation_actions`

### Analytics Module
- **Scope**: Reporting and metrics
- **Owned Tables**: Read-only views/aggregates
