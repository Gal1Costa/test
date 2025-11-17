# Guide Class

## Data Model (`src/modules/guides/guide.model.js`)

### Core Attributes
- `guideId`: string - Primary identifier
- `userId`: string - Reference to user account
- `displayName`: string - Public display name
- `photoUrl`: string|null - Profile photo URL
- `bio`: string|null - Guide biography
- `languages`: string[] - Spoken languages array
- `yearsExperience`: number - Years of guiding experience
- `profileSlug`: string - URL-friendly identifier

### Verification Attributes
- `isVerified`: boolean - Verification status
- `verifiedAt`: string|null - ISO timestamp of verification
- `verifiedBy`: string|null - Admin user ID who verified
- `complianceDocs`: string[] - Compliance document references

### Performance Attributes (Derived)
- `averageRating`: number - Calculated from reviews table
- `totalReviews`: number - Count from reviews table
- `completedHikesCount`: number - Completed hike count

### Business Attributes
- `isFeatured`: boolean - Featured guide status
- `payoutAccountRef`: string|null - Admin-only payment reference

## Relationships

### Guide → User (1:1)
- Each guide belongs to exactly one user
- Foreign key: `userId` → `users.id`

### Guide → Hikes (1:N)
- Each guide can create multiple hikes
- Foreign key: `hikes.guideId` → `guides.guideId`

### Guide → Reviews (1:N)
- Each guide can receive multiple reviews
- Foreign key: `reviews.guideId` → `guides.guideId`

## Owned Tables
- `guides` - Main guide records
- `guide_profiles` - Extended profile data
- `guide_verifications` - Verification history

## Derived Data Notes
- `averageRating` and `totalReviews` are calculated from the `reviews` table
- These values should be updated via triggers or scheduled jobs
- Consider caching for performance at scale
