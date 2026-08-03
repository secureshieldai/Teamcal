const Stripe = require("stripe");

let client;
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error("Stripe is not configured");
    error.statusCode = 503;
    throw error;
  }
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, timeout: 20000 });
  return client;
}

function platformFeeAmount(totalMinor) {
  const basisPoints = Math.max(0, Math.min(10000, Number(process.env.STRIPE_PLATFORM_FEE_BPS || 1000)));
  return Math.min(totalMinor, Math.round(totalMinor * basisPoints / 10000));
}

module.exports = { getStripe, platformFeeAmount };
