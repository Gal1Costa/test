/* eslint-disable */
// This file defines what data a Guide has - like a blueprint for guide profiles
/**
 * Guide model (data-only; no methods/logic).
 *
 * Relationships:
 * - Guide → User (1:1) via userId
 * - Guide → Hikes (1:N)
 * - Guide → Reviews (1:N)
 *
 * Note: averageRating and totalReviews are derived from the reviews table.
 */

/**
 * @typedef {Object} Guide
 * @property {string} guideId - Unique ID for this guide
 * @property {string} userId - Which user account this guide belongs to
 * @property {string} displayName - Public name shown to hikers
 * @property {string|null} photoUrl - Profile picture URL
 * @property {string|null} bio - Guide's description/bio
 * @property {string[]} languages - Languages the guide speaks
 * @property {number} yearsExperience - How many years guiding experience
 * @property {boolean} isVerified - Has admin verified this guide?
 * @property {string|null} verifiedAt - When was guide verified (ISO timestamp)
 * @property {string|null} verifiedBy - Which admin verified this guide
 * @property {number} averageRating - Average rating from reviews (calculated)
 * @property {number} totalReviews - Total number of reviews (calculated)
 * @property {number} completedHikesCount - How many hikes has guide completed
 * @property {string} profileSlug - URL-friendly name for profile page
 * @property {boolean} isFeatured - Is this guide featured on homepage?
 * @property {string[]} complianceDocs - References to safety/compliance documents
 * @property {string|null} payoutAccountRef - Payment account info (admin only)
 */

// Example of what a guide record looks like (with default values)
const GuideModel = {
  guideId: null,           // Will be set when created
  userId: null,           // Links to user account
  displayName: '',        // Public name
  photoUrl: null,         // Profile picture
  bio: null,             // About the guide
  languages: [],         // Languages spoken
  yearsExperience: 0,     // Experience level
  isVerified: false,     // Not verified by default
  verifiedAt: null,       // Verification date
  verifiedBy: null,       // Admin who verified
  averageRating: 0,       // Calculated from reviews
  totalReviews: 0,       // Count of reviews
  completedHikesCount: 0, // Hikes completed
  profileSlug: '',        // URL-friendly name
  isFeatured: false,      // Not featured by default
  complianceDocs: [],     // Safety documents
  payoutAccountRef: null, // Payment info
};

module.exports = { GuideModel };
