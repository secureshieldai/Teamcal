const { supabase } = require("../config/supabase");

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** POST /api/tracker/:tracker */
async function addEntry(req, res, next) {
  try {
    const { data: entry, error } = await supabase
      .from("tracker_entries")
      .insert({
        user_id: req.user.id,
        tracker: req.params.tracker,
        ts: req.body.ts || Date.now(),
        value: Number(req.body.value),
        meta: req.body.meta || {},
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, entry });
  } catch (err) {
    next(err);
  }
}

/** GET /api/tracker/:tracker */
async function getEntries(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const skip = Number(req.query.skip) || 0;

    const { data: entries, error } = await supabase
      .from("tracker_entries")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("tracker", req.params.tracker)
      .order("ts", { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;
    res.json({ success: true, entries });
  } catch (err) {
    next(err);
  }
}

/** GET /api/tracker/:tracker/today */
async function getToday(req, res, next) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: entries, error } = await supabase
      .from("tracker_entries")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("tracker", req.params.tracker)
      .gte("ts", startOfDay.getTime())
      .order("ts", { ascending: false });

    if (error) throw error;
    const sum = entries.reduce((a, e) => a + Number(e.value), 0);
    res.json({ success: true, entries, sum });
  } catch (err) {
    next(err);
  }
}

/** GET /api/tracker/:tracker/lastn?days=7 */
async function getLastN(req, res, next) {
  try {
    const days = Math.min(Number(req.query.days) || 7, 365);
    const cutoff = Date.now() - days * 86400000;

    const { data: entries, error } = await supabase
      .from("tracker_entries")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("tracker", req.params.tracker)
      .gte("ts", cutoff);

    if (error) throw error;

    const result = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const k = dayKey(d.getTime());
      const day = entries.filter((e) => dayKey(e.ts) === k);
      return { day: k, total: day.reduce((a, b) => a + Number(b.value), 0), count: day.length };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/tracker/:tracker/:id */
async function removeEntry(req, res, next) {
  try {
    await supabase
      .from("tracker_entries")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/tracker/:tracker */
async function clearTracker(req, res, next) {
  try {
    await supabase
      .from("tracker_entries")
      .delete()
      .eq("user_id", req.user.id)
      .eq("tracker", req.params.tracker);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** GET /api/tracker/:tracker/streak?dailyGoal=1 */
async function getStreak(req, res, next) {
  try {
    const dailyGoal = Number(req.query.dailyGoal) || 1;
    const { data: entries, error } = await supabase
      .from("tracker_entries")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("tracker", req.params.tracker);

    if (error) throw error;

    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d.getTime());
      const total = entries.filter((e) => dayKey(e.ts) === k).reduce((a, b) => a + Number(b.value), 0);
      if (total >= dailyGoal) streak++;
      else if (i > 0) break;
    }

    res.json({ success: true, streak });
  } catch (err) {
    next(err);
  }
}

module.exports = { addEntry, getEntries, getToday, getLastN, removeEntry, clearTracker, getStreak };
