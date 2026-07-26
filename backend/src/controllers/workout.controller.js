const { supabase } = require("../config/supabase");

/**
 * GET /api/workouts?category=strength&difficulty=intermediate&limit=20&skip=0
 * Returns public workout templates + user's own workouts
 */
async function getWorkouts(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip = Number(req.query.skip) || 0;

    let query = supabase
      .from("workouts")
      .select("*")
      .or(`is_public.eq.true,user_id.eq.${req.user.id}`)
      .order("created_at", { ascending: false });

    if (req.query.category) query = query.eq("category", req.query.category);
    if (req.query.difficulty) query = query.eq("difficulty", req.query.difficulty);

    const { data: workouts, error } = await query.range(skip, skip + limit - 1);
    if (error) throw error;

    res.json({ success: true, workouts });
  } catch (err) {
    next(err);
  }
}

/** GET /api/workouts/today — returns first active public template as "today's workout" */
async function getTodayWorkout(req, res, next) {
  try {
    const { data: workout, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("is_template", true)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    res.json({ success: true, workout: workout || null });
  } catch (err) {
    next(err);
  }
}

/** GET /api/workouts/:id */
async function getWorkout(req, res, next) {
  try {
    const { data: workout, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !workout) {
      return res.status(404).json({ success: false, message: "Workout not found" });
    }
    if (!workout.is_public && workout.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.json({ success: true, workout });
  } catch (err) {
    next(err);
  }
}

/** POST /api/workouts */
async function createWorkout(req, res, next) {
  try {
    const b = req.body;
    const { data: workout, error } = await supabase
      .from("workouts")
      .insert({
        user_id: req.user.id,
        title: b.title,
        subtitle: b.subtitle || "",
        duration: Number(b.duration) || 45,
        difficulty: b.difficulty || "intermediate",
        category: b.category || "strength",
        is_template: Boolean(b.isTemplate),
        is_public: b.isPublic !== false,
        exercises: b.exercises || [],
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, workout });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/workouts/:id */
async function updateWorkout(req, res, next) {
  try {
    const { data: existing } = await supabase
      .from("workouts")
      .select("user_id")
      .eq("id", req.params.id)
      .single();

    if (!existing || existing.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const allowed = ["title", "subtitle", "duration", "difficulty", "category", "is_public", "exercises"];
    const patch = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });

    const { data: workout, error } = await supabase
      .from("workouts")
      .update(patch)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;

    res.json({ success: true, workout });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/workouts/:id */
async function deleteWorkout(req, res, next) {
  try {
    await supabase
      .from("workouts")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** POST /api/workouts/log — log a completed workout session */
async function logWorkout(req, res, next) {
  try {
    const b = req.body;
    const { data: log, error } = await supabase
      .from("workout_logs")
      .insert({
        user_id: req.user.id,
        workout_id: b.workoutId || null,
        title: b.title,
        duration: Number(b.duration) || null,
        exercises: b.exercises || [],
        notes: b.notes || "",
        started_at: b.startedAt || Date.now(),
        ended_at: b.endedAt || Date.now(),
      })
      .select()
      .single();

    if (error) throw error;

    // Award XP for completing a workout
    const { data: user } = await supabase
      .from("users")
      .select("xp, level")
      .eq("id", req.user.id)
      .single();

    if (user) {
      const newXp = (user.xp || 0) + 30;
      await supabase
        .from("users")
        .update({ xp: newXp, level: 1 + Math.floor(newXp / 500) })
        .eq("id", req.user.id);
    }

    // Also record in tracker_entries for streak/progress tracking
    await supabase.from("tracker_entries").insert({
      user_id: req.user.id,
      tracker: "workouts",
      ts: b.startedAt || Date.now(),
      value: 1,
      meta: { workoutId: b.workoutId, title: b.title, duration: b.duration },
    });

    res.status(201).json({ success: true, log });
  } catch (err) {
    next(err);
  }
}

/** GET /api/workouts/history?limit=20&skip=0 */
async function getWorkoutHistory(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = Number(req.query.skip) || 0;

    const { data: logs, error } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", req.user.id)
      .order("started_at", { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getWorkouts, getTodayWorkout, getWorkout,
  createWorkout, updateWorkout, deleteWorkout,
  logWorkout, getWorkoutHistory,
};
