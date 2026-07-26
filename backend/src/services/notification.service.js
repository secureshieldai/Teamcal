const { supabase } = require("../config/supabase");

async function createNotification(userId, type, title, message, extra = {}) {
  if (!userId) return null;
  const { data, error } = await supabase.from("tracker_entries").insert({
    user_id: userId,
    tracker: "notification",
    ts: Date.now(),
    value: 0,
    meta: { type, title, message, read: false, ...extra },
  }).select().single();
  if (error) throw error;
  return data;
}

function notifySafely(...args) {
  createNotification(...args).catch((error) => console.error("Notification creation failed:", error.message));
}

module.exports = { createNotification, notifySafely };
