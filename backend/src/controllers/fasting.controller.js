const { supabase } = require("../config/supabase");

/** GET /api/fasting/active */
async function getActive(req, res, next) {
  try {
    const { data: fast, error } = await supabase
      .from("fast_logs")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("active", true)
      .single();

    // PGRST116 = no rows — that's a valid "no active fast" state
    if (error && error.code !== "PGRST116") throw error;

    res.json({ success: true, fast: fast || null });
  } catch (err) {
    next(err);
  }
}

/** POST /api/fasting/start */
async function startFast(req, res, next) {
  try {
    // End any existing active fast first
    await supabase
      .from("fast_logs")
      .update({ active: false })
      .eq("user_id", req.user.id)
      .eq("active", true);

    const { protocol, targetHours } = req.body;
    const { data: fast, error } = await supabase
      .from("fast_logs")
      .insert({
        user_id: req.user.id,
        protocol,
        target_hours: Number(targetHours),
        started_at: Date.now(),
        active: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, fast });
  } catch (err) {
    next(err);
  }
}

/** POST /api/fasting/stop */
async function stopFast(req, res, next) {
  try {
    const { data: fast, error: fetchErr } = await supabase
      .from("fast_logs")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("active", true)
      .single();

    if (fetchErr && fetchErr.code !== "PGRST116") throw fetchErr;

    if (!fast) {
      return res.status(404).json({ success: false, message: "No active fast" });
    }

    const endedAt = Date.now();
    const achievedHours = (endedAt - fast.started_at) / 3_600_000;

    const { data: updated, error } = await supabase
      .from("fast_logs")
      .update({ ended_at: endedAt, achieved_hours: achievedHours, active: false })
      .eq("id", fast.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, fast: updated });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/fasting/extend */
async function extendFast(req, res, next) {
  try {
    const { data: fast, error: fetchErr } = await supabase
      .from("fast_logs")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("active", true)
      .single();

    if (fetchErr && fetchErr.code !== "PGRST116") throw fetchErr;

    if (!fast) {
      return res.status(404).json({ success: false, message: "No active fast" });
    }

    const newTarget = fast.target_hours + (Number(req.body.hoursDelta) || 0);
    const { data: updated, error } = await supabase
      .from("fast_logs")
      .update({ target_hours: newTarget })
      .eq("id", fast.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, fast: updated });
  } catch (err) {
    next(err);
  }
}

/** GET /api/fasting/history?limit=50&skip=0 */
async function getHistory(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const skip = Number(req.query.skip) || 0;

    const { data: history, error } = await supabase
      .from("fast_logs")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("active", false)
      .order("started_at", { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

    const { count } = await supabase
      .from("fast_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.user.id)
      .eq("active", false);

    res.json({ success: true, history, total: count || 0 });
  } catch (err) {
    next(err);
  }
}

/** GET /api/fasting/analytics */
async function getAnalytics(req, res, next) {
  try {
    const { data: logs, error } = await supabase
      .from("fast_logs")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("active", false);

    if (error) throw error;

    const longest = logs.reduce((m, h) => Math.max(m, h.achieved_hours || 0), 0);
    const avg = logs.length ? logs.reduce((s, h) => s + (h.achieved_hours || 0), 0) / logs.length : 0;
    const successRate = logs.length
      ? Math.round((logs.filter((h) => (h.achieved_hours || 0) >= h.target_hours).length / logs.length) * 100)
      : 0;
    const totalHours = logs.reduce((s, h) => s + (h.achieved_hours || 0), 0);

    // Last 30 days daily totals
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toDateString();
      return logs
        .filter((h) => h.ended_at && new Date(h.ended_at).toDateString() === key)
        .reduce((s, h) => s + (h.achieved_hours || 0), 0);
    });

    // Protocol breakdown
    const protocolCounts = logs.reduce((acc, h) => {
      acc[h.protocol] = (acc[h.protocol] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      analytics: { longest, avg, total: logs.length, successRate, totalHours, last30, protocolCounts },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getActive, startFast, stopFast, extendFast, getHistory, getAnalytics };
