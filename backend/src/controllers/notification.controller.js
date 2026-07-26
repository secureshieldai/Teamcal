const { supabase } = require("../config/supabase");

async function getNotifications(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const { data, error } = await supabase.from("tracker_entries").select("*")
      .eq("user_id", req.user.id).eq("tracker", "notification")
      .order("ts", { ascending: false }).limit(limit);
    if (error) throw error;
    const notifications = (data || []).map((item) => ({
      id: item.id, createdAt: item.ts, read: Boolean(item.meta?.read), ...item.meta,
    }));
    res.json({ success: true, notifications, unreadCount: notifications.filter((item) => !item.read).length });
  } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try {
    const { data: item, error } = await supabase.from("tracker_entries").select("id, meta")
      .eq("id", req.params.id).eq("user_id", req.user.id).eq("tracker", "notification").single();
    if (error || !item) return res.status(404).json({ success: false, message: "Notification not found" });
    const { error: updateError } = await supabase.from("tracker_entries")
      .update({ value: 1, meta: { ...(item.meta || {}), read: true } }).eq("id", item.id);
    if (updateError) throw updateError;
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try {
    const { data, error } = await supabase.from("tracker_entries").select("id, meta")
      .eq("user_id", req.user.id).eq("tracker", "notification");
    if (error) throw error;
    await Promise.all((data || []).filter((item) => !item.meta?.read).map((item) =>
      supabase.from("tracker_entries").update({ value: 1, meta: { ...(item.meta || {}), read: true } }).eq("id", item.id)
    ));
    res.json({ success: true });
  } catch (err) { next(err); }
}

/** GET /api/notifications/prefs */
async function getPrefs(req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("notif_milestones,notif_streaks,notif_hydration,notif_insights,notif_contests,notif_social,notif_commerce,notif_updates")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;
    res.json({
      success: true,
      notifPrefs: {
        milestones: user.notif_milestones,
        streaks: user.notif_streaks,
        hydration: user.notif_hydration,
        insights: user.notif_insights,
        contests: user.notif_contests,
        social: user.notif_social,
        commerce: user.notif_commerce,
        updates: user.notif_updates,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/notifications/prefs */
async function updatePrefs(req, res, next) {
  try {
    const patch = {};
    if (req.body.milestones !== undefined) patch.notif_milestones = req.body.milestones;
    if (req.body.streaks !== undefined) patch.notif_streaks = req.body.streaks;
    if (req.body.hydration !== undefined) patch.notif_hydration = req.body.hydration;
    if (req.body.insights !== undefined) patch.notif_insights = req.body.insights;
    if (req.body.contests !== undefined) patch.notif_contests = req.body.contests;
    if (req.body.social !== undefined) patch.notif_social = req.body.social;
    if (req.body.commerce !== undefined) patch.notif_commerce = req.body.commerce;
    if (req.body.updates !== undefined) patch.notif_updates = req.body.updates;

    const { data: user, error } = await supabase
      .from("users")
      .update(patch)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({
      success: true,
      notifPrefs: {
        milestones: user.notif_milestones,
        streaks: user.notif_streaks,
        hydration: user.notif_hydration,
        insights: user.notif_insights,
        contests: user.notif_contests,
        social: user.notif_social,
        commerce: user.notif_commerce,
        updates: user.notif_updates,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, markRead, markAllRead, getPrefs, updatePrefs };
