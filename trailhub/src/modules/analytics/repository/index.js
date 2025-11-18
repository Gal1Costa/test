/* eslint-disable */
// Owned tables: (read-only views/aggregates)

/** TODO: Replace with real DB aggregates. */
function getAnalyticsOverview() { return Promise.resolve({ activeUsers: 0, hikesCompleted: 0 }); }

module.exports = { getAnalyticsOverview };
