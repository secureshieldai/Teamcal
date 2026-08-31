const { supabase } = require("../config/supabase");

function dayKey(ts, timezoneOffsetMinutes = 0) {
  const d = new Date(Number(ts) - timezoneOffsetMinutes * 60000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
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

function deduplicatedTotal(entries) {
  const imported = entries.filter((entry) => entry.meta?.cumulative);
  const manual = entries.filter((entry) => !entry.meta?.cumulative);
  return manual.reduce((sum, entry) => sum + Number(entry.value), 0) +
    imported.reduce((max, entry) => Math.max(max, Number(entry.value)), 0);
}

/** POST /api/tracker/steps/sync
 * Replaces one imported cumulative total for a local calendar day. Manual step
 * entries remain additive, while repeated device/health syncs are idempotent.
 */
async function syncDailySteps(req, res, next) {
  try {
    const value = Math.max(0, Math.round(Number(req.body.value)));
    const source = String(req.body.source || "device").slice(0, 64);
    const day = String(req.body.day || "");
    const dayStart = Number(req.body.dayStart);
    const dayEnd = Number(req.body.dayEnd);
    if (!Number.isFinite(value) || !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
        !Number.isFinite(dayStart) || !Number.isFinite(dayEnd) || dayEnd <= dayStart ||
        dayEnd - dayStart > 90000000) {
      return res.status(400).json({ success: false, message: "Invalid daily step total" });
    }

    const syncKey = `${source}:${day}`;
    const { data: existing, error: findError } = await supabase
      .from("tracker_entries")
      .select("id")
      .eq("user_id", req.user.id)
      .eq("tracker", "steps")
      .contains("meta", { syncKey })
      .limit(1);
    if (findError) throw findError;

    const payload = {
      user_id: req.user.id,
      tracker: "steps",
      ts: dayStart,
      value,
      meta: { syncKey, source, day, cumulative: true, syncedAt: Date.now() },
    };
    const query = existing?.length
      ? supabase.from("tracker_entries").update(payload).eq("id", existing[0].id)
      : supabase.from("tracker_entries").insert(payload);
    const { data: entry, error } = await query.select().single();
    if (error) throw error;
    res.status(existing?.length ? 200 : 201).json({ success: true, entry, replaced: Boolean(existing?.length) });
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
    const requestedStart = Number(req.query.start);
    const requestedEnd = Number(req.query.end);
    const startOfDay = Number.isFinite(requestedStart) ? requestedStart : new Date().setHours(0, 0, 0, 0);
    const endOfDay = Number.isFinite(requestedEnd) && requestedEnd > startOfDay && requestedEnd - startOfDay <= 90000000
      ? requestedEnd : startOfDay + 86400000;

    const { data: entries, error } = await supabase
      .from("tracker_entries")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("tracker", req.params.tracker)
      .gte("ts", startOfDay)
      .lt("ts", endOfDay)
      .order("ts", { ascending: false });

    if (error) throw error;
    const sum = req.params.tracker === "steps" ? deduplicatedTotal(entries) : entries.reduce((a, e) => a + Number(e.value), 0);
    res.json({ success: true, entries, sum });
  } catch (err) {
    next(err);
  }
}

/** GET /api/tracker/:tracker/lastn?days=7 */
async function getLastN(req, res, next) {
  try {
    const days = Math.min(Number(req.query.days) || 7, 365);
    const timezoneOffsetMinutes = Math.max(-840, Math.min(840, Number(req.query.timezoneOffsetMinutes) || 0));
    const localNow = new Date(Date.now() - timezoneOffsetMinutes * 60000);
    localNow.setUTCHours(0, 0, 0, 0);
    const cutoff = localNow.getTime() + timezoneOffsetMinutes * 60000 - (days - 1) * 86400000;

    const { data: entries, error } = await supabase
      .from("tracker_entries")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("tracker", req.params.tracker)
      .gte("ts", cutoff);

    if (error) throw error;

    const result = Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.now() - timezoneOffsetMinutes * 60000);
      d.setUTCDate(d.getUTCDate() - (days - 1 - i));
      const k = dayKey(d.getTime() + timezoneOffsetMinutes * 60000, timezoneOffsetMinutes);
      const day = entries.filter((e) => dayKey(e.ts, timezoneOffsetMinutes) === k);
      return { day: k, total: req.params.tracker === "steps" ? deduplicatedTotal(day) : day.reduce((a, b) => a + Number(b.value), 0), count: day.length };
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
      const dayEntries = entries.filter((e) => dayKey(e.ts) === k);
      const total = req.params.tracker === "steps" ? deduplicatedTotal(dayEntries) : dayEntries.reduce((a, b) => a + Number(b.value), 0);
      if (total >= dailyGoal) streak++;
      else if (i > 0) break;
    }

    res.json({ success: true, streak });
  } catch (err) {
    next(err);
  }
}

module.exports = { addEntry, syncDailySteps, getEntries, getToday, getLastN, removeEntry, clearTracker, getStreak };
