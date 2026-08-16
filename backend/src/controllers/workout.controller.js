const { supabase } = require("../config/supabase");
const { uploadPublicImage } = require("../services/storage.service");
const { model, AI_ENABLED } = require("./coach.controller");

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
        scheduled_days: b.scheduledDays || [],
        rest_days: b.restDays || [],
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
    if (req.body.scheduledDays !== undefined) patch.scheduled_days = req.body.scheduledDays;
    if (req.body.restDays !== undefined) patch.rest_days = req.body.restDays;

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

function weekStartKey(ts) {
  const d = new Date(ts);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** GET /api/workouts/history/weekly?weeks=4 */
async function getWeeklyHistory(req, res, next) {
  try {
    const weeks = Math.min(Math.max(Number(req.query.weeks) || 4, 1), 26);

    const { data: myWorkouts, error: workoutsError } = await supabase
      .from("workouts")
      .select("scheduled_days")
      .eq("user_id", req.user.id);
    if (workoutsError) throw workoutsError;
    const planned = (myWorkouts || []).reduce((n, w) => n + (Array.isArray(w.scheduled_days) ? w.scheduled_days.length : 0), 0);

    const currentWeekStart = weekStartKey(Date.now());
    const oldestWeekStart = new Date(currentWeekStart);
    oldestWeekStart.setUTCDate(oldestWeekStart.getUTCDate() - (weeks - 1) * 7);

    const { data: logs, error: logsError } = await supabase
      .from("workout_logs")
      .select("started_at, duration")
      .eq("user_id", req.user.id)
      .gte("started_at", oldestWeekStart.getTime());
    if (logsError) throw logsError;

    const result = Array.from({ length: weeks }, (_, i) => {
      const start = new Date(currentWeekStart);
      start.setUTCDate(start.getUTCDate() - (weeks - 1 - i) * 7);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 7);
      const weekLogs = (logs || []).filter((l) => l.started_at >= start.getTime() && l.started_at < end.getTime());
      const minutes = weekLogs.reduce((n, l) => n + (Number(l.duration) || 0), 0);
      return {
        weekStart: start.toISOString().slice(0, 10),
        planned,
        done: weekLogs.length,
        minutes,
        kcal: Math.round(minutes * 8),
        percent: planned > 0 ? Math.round((weekLogs.length / planned) * 100) : 0,
      };
    }).reverse();

    res.json({ success: true, weeks: result });
  } catch (err) {
    next(err);
  }
}

const SCAN_COACH_TEMPLATES = {
  legs: { name: "Legs Focus", muscles: ["Quads", "Glutes", "Hamstrings"], exercises: [
    { name: "Barbell squat", sets: 4, reps: 8, restSeconds: 90, muscles: ["Quads", "Glutes", "Hamstrings", "Core", "Lower back"] },
    { name: "Romanian deadlift", sets: 3, reps: 10, restSeconds: 75, muscles: ["Hamstrings", "Glutes", "Lower back"] },
    { name: "Walking lunges", sets: 3, reps: 12, restSeconds: 60, muscles: ["Quads", "Glutes", "Hamstrings", "Calves"] },
    { name: "Leg press", sets: 3, reps: 12, restSeconds: 60, muscles: ["Quads", "Glutes", "Hamstrings"] },
    { name: "Calf raises", sets: 4, reps: 15, restSeconds: 45, muscles: ["Calves"] },
  ], scheduledDays: ["Sun", "Wed"] },
  chest: { name: "Chest Focus", muscles: ["Chest", "Triceps", "Shoulders"], exercises: [
    { name: "Bench press", sets: 4, reps: 8, restSeconds: 90, muscles: ["Chest", "Triceps", "Shoulders"] },
    { name: "Incline dumbbell press", sets: 3, reps: 10, restSeconds: 75, muscles: ["Chest", "Shoulders"] },
    { name: "Push-ups", sets: 3, reps: 0, restSeconds: 60, muscles: ["Chest", "Triceps"] },
    { name: "Cable flys", sets: 3, reps: 12, restSeconds: 60, muscles: ["Chest"] },
  ], scheduledDays: ["Tue", "Fri"] },
  core: { name: "Core Focus", muscles: ["Core"], exercises: [
    { name: "Plank", sets: 3, reps: 0, restSeconds: 45, muscles: ["Core"] },
    { name: "Hanging leg raise", sets: 3, reps: 10, restSeconds: 60, muscles: ["Core"] },
    { name: "Cable crunch", sets: 3, reps: 15, restSeconds: 60, muscles: ["Core"] },
    { name: "Russian twists", sets: 3, reps: 20, restSeconds: 45, muscles: ["Core"] },
  ], scheduledDays: ["Thu", "Sun"] },
  cardio: { name: "Cardio Focus", muscles: ["Cardio"], exercises: [
    { name: "Warm-up jog", sets: 1, reps: 0, restSeconds: 0, muscles: ["Cardio"] },
    { name: "Intervals", sets: 6, reps: 0, restSeconds: 60, muscles: ["Cardio"] },
    { name: "Cooldown", sets: 1, reps: 0, restSeconds: 0, muscles: ["Cardio"] },
  ], scheduledDays: ["Sat", "Tue"] },
};

function fallbackScanCoachPlan() {
  const routines = Object.values(SCAN_COACH_TEMPLATES).map((t) => ({
    name: t.name,
    exercises: t.exercises,
    scheduledDays: t.scheduledDays,
    durationMin: 45,
  }));
  return {
    timelineWeeksMin: 8,
    timelineWeeksMax: 12,
    weeklySessions: 4,
    dailyCalories: 2200,
    restDaysPerWeek: 2,
    routines,
  };
}

/**
 * POST /api/workouts/scan-coach/generate
 * Multipart: optional `photo` (stored for the user's own before/after reference —
 * not analyzed for body composition; the plan is generated from the text goals only).
 */
async function scanCoachGenerate(req, res, next) {
  try {
    const bodyAreas = String(req.body.bodyAreas || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const goals = String(req.body.goals || "").trim();

    let photoUrl = null;
    if (req.file) {
      photoUrl = await uploadPublicImage("scan-coach", req.user.id, req.file);
    }

    let plan = null;
    if (AI_ENABLED && goals) {
      try {
        const prompt = `You are Blaze, an expert AI fitness coach inside the TeamCal app. A user wants a training plan.
Body areas they want to focus on: ${bodyAreas.length ? bodyAreas.join(", ") : "full body"}.
Their goals in their own words: "${goals}".
Return ONLY valid JSON (no markdown fences) with this exact shape:
{"timelineWeeksMin":8,"timelineWeeksMax":12,"weeklySessions":4,"dailyCalories":2200,"restDaysPerWeek":2,"routines":[{"name":"Legs Focus","exercises":[{"name":"Barbell squat","sets":4,"reps":8,"restSeconds":90,"muscles":["Quads","Glutes"]}],"scheduledDays":["Sun","Wed"],"durationMin":45}]}
Provide 2-4 routines that together cover their goals and focus areas. Be realistic and safe — no extreme calorie or timeline claims. Keep timelineWeeksMin/Max between 6 and 16.`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.routines) && parsed.routines.length) plan = parsed;
      } catch {
        plan = null;
      }
    }
    if (!plan) plan = fallbackScanCoachPlan();

    res.json({ success: true, photoUrl, plan });
  } catch (err) {
    next(err);
  }
}

const RECOMMENDATION_TAG_COLOR = { Volume: "blue", Recovery: "purple", Nutrition: "green", Movement: "blue" };

/** GET /api/workouts/recommendations — rule-based off the user's real data, no AI call. */
async function getRecommendations(req, res, next) {
  try {
    const { data: user } = await supabase.from("users").select("goal_sleep_hours, goal_protein_g, goal_steps").eq("id", req.user.id).single();
    const cutoff = Date.now() - 7 * 86400000;

    const { data: entries } = await supabase
      .from("tracker_entries")
      .select("tracker, value, ts, meta")
      .eq("user_id", req.user.id)
      .gte("ts", cutoff)
      .in("tracker", ["workouts", "sleep", "steps", "meals"]);
    const rows = entries || [];

    const workoutDays = new Set(rows.filter((r) => r.tracker === "workouts").map((r) => new Date(r.ts).toDateString())).size;
    const sleepEntries = rows.filter((r) => r.tracker === "sleep");
    const avgSleep = sleepEntries.length ? sleepEntries.reduce((n, r) => n + Number(r.value), 0) / sleepEntries.length : null;
    const stepEntries = rows.filter((r) => r.tracker === "steps");
    const avgSteps = stepEntries.length ? stepEntries.reduce((n, r) => n + Number(r.value), 0) / stepEntries.length : 0;
    const mealEntries = rows.filter((r) => r.tracker === "meals");
    const avgProtein = mealEntries.length
      ? mealEntries.reduce((n, r) => n + (Number(r.meta?.protein) || 0), 0) / 7
      : 0;

    const goalSleep = user?.goal_sleep_hours || 8;
    const goalSteps = user?.goal_steps || 8000;

    const insights = [];
    insights.push(
      workoutDays < 3
        ? { title: "Build consistency first", tag: "Volume", description: "Aim for 3 completed sessions this week before adding intensity." }
        : { title: "Progress your training volume", tag: "Volume", description: "You're consistent — add a set to your main lift each week." }
    );
    insights.push(
      avgSleep === null || avgSleep < goalSleep
        ? { title: "Prioritise sleep before intensity", tag: "Recovery", description: `Recovery drives adaptation. Hit ${goalSleep}h sleep before increasing volume.` }
        : { title: "Recovery looks solid", tag: "Recovery", description: "Your sleep is on track — a good base for harder training blocks." }
    );
    insights.push(
      avgProtein < 100
        ? { title: "Increase daily protein", tag: "Nutrition", description: "Target 1.6g/kg body weight to support your training block." }
        : { title: "Protein intake looks good", tag: "Nutrition", description: "Keep spreading protein across meals for better recovery." }
    );
    insights.push(
      avgSteps < goalSteps
        ? { title: `Bump daily steps to ${Math.round(goalSteps / 1000)}k`, tag: "Movement", description: "Baseline movement improves recovery and calorie balance." }
        : { title: "Daily movement looks great", tag: "Movement", description: "Steps are on target — keep it up alongside your training." }
    );

    res.json({ success: true, insights: insights.map((i) => ({ ...i, tagColor: RECOMMENDATION_TAG_COLOR[i.tag] || "blue" })) });
  } catch (err) {
    next(err);
  }
}

/** POST /api/workouts/progress/photo — multipart `photo`, logs a weekly transformation photo. */
async function uploadProgressPhoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const url = await uploadPublicImage("progress", req.user.id, req.file);
    const now = new Date();
    const jan1 = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((now - jan1) / 86400000 + jan1.getUTCDay() + 1) / 7);
    const { data: entry, error } = await supabase
      .from("tracker_entries")
      .insert({ user_id: req.user.id, tracker: "progress-photos", ts: Date.now(), value: 1, meta: { photo: url, week: `${now.getUTCFullYear()}-W${week}` } })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, entry });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getWorkouts, getTodayWorkout, getWorkout,
  createWorkout, updateWorkout, deleteWorkout,
  logWorkout, getWorkoutHistory, getWeeklyHistory,
  scanCoachGenerate, getRecommendations, uploadProgressPhoto,
};
