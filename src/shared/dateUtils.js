const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');

dayjs.extend(utc);

/**
 * Determines if a review can be submitted for a hike based on its date.
 * Reviews are allowed once the hike's calendar day has started (same day or later).
 * Uses timezone-safe calendar day comparison.
 * 
 * @param {Date|string|null} hikeDate - The hike date (DateTime from database)
 * @returns {boolean} - true if reviews are allowed (hike date is today or in the past), false otherwise
 */
function canReviewHike(hikeDate) {
  if (!hikeDate) {
    // If no hike date, allow review (fallback behavior)
    return true;
  }

  // Parse the hike date and get calendar day in UTC
  const hikeDay = dayjs.utc(hikeDate).startOf('day');
  
  // Get today's calendar day in UTC
  const today = dayjs.utc().startOf('day');
  
  // Allow reviews if hike date is today or in the past (hikeDay <= today)
  return hikeDay.isSame(today) || hikeDay.isBefore(today);
}

module.exports = {
  canReviewHike,
};
