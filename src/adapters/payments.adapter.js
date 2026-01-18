/* eslint-disable */
/**
 * Payments adapter stubs. We are not implementing payments yet.
 */
async function createIntent(amount, currency) {
  void amount; void currency;
  return { id: 'pi_stub', clientSecret: 'stub_secret' };
}

async function refund(intentId) {
  void intentId; return { id: 're_stub', status: 'succeeded' };
}

module.exports = { createIntent, refund };
