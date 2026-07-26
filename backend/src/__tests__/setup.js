require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
process.env.NODE_ENV = "test";
// Raise rate limit so tests don't get throttled
process.env.RATE_LIMIT_MAX = "1000";
