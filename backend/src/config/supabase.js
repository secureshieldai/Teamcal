const { createClient } = require("@supabase/supabase-js");
const logger = require("./logger");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    const { data, error } = await supabase.from("users").select("id").limit(1);
    if (error && error.code !== "PGRST116") throw error; // PGRST116 = table empty, that's fine
    logger.info("Supabase connected successfully");
  } catch (err) {
    logger.error("Supabase connection failed", err);
    process.exit(1);
  }
}

module.exports = { supabase, testConnection };
