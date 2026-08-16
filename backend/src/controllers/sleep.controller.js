const { supabase } = require("../config/supabase");

// Typical adult sleep-architecture split, applied to the tracked duration since
// no wearable/sensor data is available to measure real stages.
const STAGE_SPLIT = { awake: 0.08, light: 0.5, rem: 0.22, deep: 0.2 };

function computeStages(durationHours) {
  const totalMin = Math.max(0, durationHours) * 60;
  return {
    awake: Math.round(totalMin * STAGE_SPLIT.awake),
    light: Math.round(totalMin * STAGE_SPLIT.light),
    rem: Math.round(totalMin * STAGE_SPLIT.rem),
    deep: Math.round(totalMin * STAGE_SPLIT.deep),
  };
}

async function getGoalHours(userId) {
  const { data: user } = await supabase.from("users").select("goal_sleep_hours").eq("id", userId).single();
  return user?.goal_sleep_hours || 8;
}

/** GET /api/sleep/active */
async function getActive(req, res, next) {
  try {
    const { data: sleep, error } = await supabase
      .from("sleep_logs")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("active", true)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    res.json({ success: true, sleep: sleep || null });
  } catch (err) {
    next(err);
  }
}

/** POST /api/sleep/start */
async function startSleep(req, res, next) {
  try {
    await supabase.from("sleep_logs").update({ active: false }).eq("user_id", req.user.id).eq("active", true);

    const { data: sleep, error } = await supabase
      .from("sleep_logs")
      .insert({ user_id: req.user.id, started_at: Date.now(), active: true })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, sleep });
  } catch (err) {
    next(err);
  }
}

/** POST /api/sleep/stop */
async function stopSleep(req, res, next) {
  try {
    const { data: sleep, error: fetchErr } = await supabase
      .from("sleep_logs")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("active", true)
      .single();
    if (fetchErr && fetchErr.code !== "PGRST116") throw fetchErr;
    if (!sleep) return res.status(404).json({ success: false, message: "No active sleep session" });

    const endedAt = Date.now();
    const durationHours = Math.round(((endedAt - sleep.started_at) / 3_600_000) * 100) / 100;
    const goalHours = await getGoalHours(req.user.id);
    const score = Math.max(0, Math.min(100, Math.round((durationHours / goalHours) * 100)));
    const stages = computeStages(durationHours);

    const { data: updated, error } = await supabase
      .from("sleep_logs")
      .update({ ended_at: endedAt, duration_hours: durationHours, score, stages, active: false })
      .eq("id", sleep.id)
      .select()
      .single();
    if (error) throw error;

    await supabase.from("tracker_entries").insert({
      user_id: req.user.id,
      tracker: "sleep",
      ts: sleep.started_at,
      value: durationHours,
      meta: { score, stages },
    });

    res.json({ success: true, sleep: updated });
  } catch (err) {
    next(err);
  }
}

/** GET /api/sleep/history?limit=50 */
async function getHistory(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const { data: history, error } = await supabase
      .from("sleep_logs")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("active", false)
      .order("started_at", { ascending: false })
      .range(0, limit - 1);
    if (error) throw error;
    res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
}

/** GET /api/sleep/analytics?days=14 */
async function getAnalytics(req, res, next) {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 90);
    const cutoff = Date.now() - days * 86400000;

    const { data: logs, error } = await supabase
      .from("sleep_logs")
      .select("started_at, duration_hours")
      .eq("user_id", req.user.id)
      .eq("active", false)
      .gte("started_at", cutoff);
    if (error) throw error;

    const daily = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toDateString();
      const hours = (logs || [])
        .filter((l) => new Date(l.started_at).toDateString() === key)
        .reduce((s, l) => s + (Number(l.duration_hours) || 0), 0);
      return { day: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, hours: Math.round(hours * 10) / 10 };
    });

    const nights = (logs || []).length;
    const avg = nights ? Math.round((daily.reduce((s, d) => s + d.hours, 0) / days) * 10) / 10 : 0;
    const best = daily.length ? Math.max(...daily.map((d) => d.hours)) : 0;

    const goalHours = await getGoalHours(req.user.id);
    const debt = Math.max(0, Math.round((goalHours * 7 - daily.slice(-7).reduce((s, d) => s + d.hours, 0)) * 10) / 10);

    res.json({ success: true, analytics: { daily, avg, best, nights, debt, goalHours } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/sleep/alarm */
async function getAlarmPrefs(req, res, next) {
  try {
    const { data: user, error } = await supabase.from("users").select("sleep_alarm_prefs").eq("id", req.user.id).single();
    if (error) throw error;
    res.json({ success: true, prefs: user.sleep_alarm_prefs });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/sleep/alarm */
async function updateAlarmPrefs(req, res, next) {
  try {
    const { data: user } = await supabase.from("users").select("sleep_alarm_prefs").eq("id", req.user.id).single();
    const merged = { ...(user?.sleep_alarm_prefs || {}), ...req.body };
    const { data: updated, error } = await supabase
      .from("users")
      .update({ sleep_alarm_prefs: merged })
      .eq("id", req.user.id)
      .select("sleep_alarm_prefs")
      .single();
    if (error) throw error;
    res.json({ success: true, prefs: updated.sleep_alarm_prefs });
  } catch (err) {
    next(err);
  }
}

/** GET /api/sleep/insights — rule-based off the user's real sleep + steps data, no AI call. */
async function getInsights(req, res, next) {
  try {
    const cutoff = Date.now() - 14 * 86400000;
    const { data: sleepLogs } = await supabase
      .from("sleep_logs")
      .select("started_at, duration_hours, score")
      .eq("user_id", req.user.id)
      .eq("active", false)
      .gte("started_at", cutoff);
    const { data: stepEntries } = await supabase
      .from("tracker_entries")
      .select("ts, value")
      .eq("user_id", req.user.id)
      .eq("tracker", "steps")
      .gte("ts", cutoff);

    const insights = [];
    const logs = sleepLogs || [];
    const steps = stepEntries || [];

    if (logs.length >= 2 && steps.length >= 2) {
      const dayKey = (ts) => new Date(ts).toDateString();
      const stepsByDay = new Map(steps.map((s) => [dayKey(s.ts), Number(s.value)]));
      const activeNights = [];
      const inactiveNights = [];
      for (const log of logs) {
        const priorDay = new Date(log.started_at);
        priorDay.setDate(priorDay.getDate() - 1);
        const daySteps = stepsByDay.get(dayKey(priorDay.getTime())) || 0;
        (daySteps >= 8000 ? activeNights : inactiveNights).push(log.score || 0);
      }
      if (activeNights.length && inactiveNights.length) {
        const avgActive = activeNights.reduce((a, b) => a + b, 0) / activeNights.length;
        const avgInactive = inactiveNights.reduce((a, b) => a + b, 0) / inactiveNights.length;
        const diff = Math.round(avgActive - avgInactive);
        if (diff > 0) {
          insights.push({
            title: 'Your best sleep score follows a walk',
            icon: 'trending-up',
            description: `Nights after 8k+ steps → ${diff}pt higher score.`,
          });
        }
      }
    }

    if (logs.length >= 3) {
      // Compare average duration for nights started before 22:30 vs at/after 22:30.
      const beforeTarget = logs.filter((l) => {
        const h = new Date(l.started_at).getHours();
        const m = new Date(l.started_at).getMinutes();
        return h < 22 || (h === 22 && m <= 30);
      });
      const afterTarget = logs.filter((l) => !beforeTarget.includes(l));
      if (beforeTarget.length && afterTarget.length) {
        const avgBefore = beforeTarget.reduce((s, l) => s + (l.duration_hours || 0), 0) / beforeTarget.length;
        const avgAfter = afterTarget.reduce((s, l) => s + (l.duration_hours || 0), 0) / afterTarget.length;
        if (avgBefore > avgAfter) {
          insights.push({
            title: 'Try 21:45 lights out',
            icon: 'moon',
            description: `You get ${Math.round((avgBefore - avgAfter) * 60)} more minutes of sleep going to bed earlier.`,
          });
        }
      }
    }

    if (!insights.length) {
      insights.push({
        title: 'Log a few nights to unlock insights',
        icon: 'moon',
        description: 'Track at least 3 nights of sleep and your step count to see personalized patterns here.',
      });
    }

    res.json({ success: true, insights: insights.slice(0, 3) });
  } catch (err) {
    next(err);
  }
}

module.exports = { getActive, startSleep, stopSleep, getHistory, getAnalytics, getAlarmPrefs, updateAlarmPrefs, getInsights };
