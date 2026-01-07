/* eslint-disable */
// Owned tables: reports, moderation_actions

/** TODO: Replace with real DB aggregates. */
function getOverview() { return Promise.resolve({ users: 0, guides: 0, hikes: 0 }); }

module.exports = { getOverview };
