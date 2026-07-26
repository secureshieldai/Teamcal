require("dotenv").config();
const app = require("./app");
const { testConnection } = require("./config/supabase");
const { initFirebase } = require("./config/firebase");
const logger = require("./config/logger");

const PORT = process.env.PORT || 3001;

async function start() {
  initFirebase();          // non-blocking — warns if keys missing
  await testConnection();  // exits if Supabase unreachable
  app.listen(PORT, () => {
    logger.info(`TeamCal backend running on port ${PORT} [${process.env.NODE_ENV}]`);
    logger.info(`Swagger docs: http://localhost:${PORT}/api/docs`);
  });
}

start().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});
