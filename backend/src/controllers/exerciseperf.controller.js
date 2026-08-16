const { supabase } = require("../config/supabase");

/** GET /api/exercise-performance/previous?exercises=Name1,Name2 */
async function getPrevious(req, res, next) {
  try {
    const names = String(req.query.exercises || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!names.length) return res.json({ success: true, previous: {} });

    const { data, error } = await supabase
      .from("exercise_performances")
      .select("*")
      .eq("user_id", req.user.id)
      .in("exercise_name", names)
      .order("ts", { ascending: false });
    if (error) throw error;

    const previous = {};
    for (const row of data || []) {
      previous[row.exercise_name] ??= {};
      previous[row.exercise_name][row.set_index] ??= { weight: Number(row.weight), reps: Number(row.reps), ts: row.ts };
    }
    res.json({ success: true, previous });
  } catch (err) {
    next(err);
  }
}

/** POST /api/exercise-performance — body: { exerciseName, setIndex, weight, reps } */
async function logSet(req, res, next) {
  try {
    const { exerciseName, setIndex, weight, reps } = req.body;
    if (!exerciseName) return res.status(400).json({ success: false, message: "exerciseName is required" });

    const { data: entry, error } = await supabase
      .from("exercise_performances")
      .insert({
        user_id: req.user.id,
        exercise_name: String(exerciseName),
        set_index: Number(setIndex) || 1,
        weight: Number(weight) || 0,
        reps: Number(reps) || 0,
        ts: Date.now(),
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, entry });
  } catch (err) {
    next(err);
  }
}

/** GET /api/exercise-performance/records — top personal record per exercise (by weight), top 5. */
async function getRecords(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("exercise_performances")
      .select("exercise_name, weight, reps, ts")
      .eq("user_id", req.user.id)
      .order("weight", { ascending: false });
    if (error) throw error;

    const best = new Map();
    for (const row of data || []) {
      if (!best.has(row.exercise_name)) best.set(row.exercise_name, row);
    }
    const records = Array.from(best.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map((r) => ({ exerciseName: r.exercise_name, weight: Number(r.weight), reps: Number(r.reps), ts: r.ts }));

    res.json({ success: true, records });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPrevious, logSet, getRecords };
