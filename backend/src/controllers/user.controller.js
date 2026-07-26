const { supabase } = require("../config/supabase");

/** GET /api/user/profile */
async function getProfile(req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;
    const { password_hash, ...rest } = user;
    res.json({ success: true, user: rest });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/user/profile */
async function updateProfile(req, res, next) {
  try {
    const allowed = [
      "name", "bio", "avatar", "dm_enabled", "age", "height_cm", "weight_kg",
      "gender", "goals", "fasting_plan", "fast_hours", "eat_hours", "onboarding_complete",
    ];
    const patch = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });

    const { data: user, error } = await supabase
      .from("users")
      .update(patch)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    const { password_hash, ...rest } = user;
    res.json({ success: true, user: rest });
  } catch (err) {
    next(err);
  }
}

/** POST /api/user/avatar */
async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const url = `/uploads/${req.file.filename}`;
    await supabase.from("users").update({ avatar: url }).eq("id", req.user.id);
    res.json({ success: true, url });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/user/goals */
async function updateGoals(req, res, next) {
  try {
    const goalFields = {
      goal_fast_hours: req.body.fastHours,
      goal_water_ml: req.body.waterMl,
      goal_steps: req.body.steps,
      goal_sleep_hours: req.body.sleepHours,
      goal_kcal: req.body.kcal,
      goal_protein_g: req.body.proteinG,
      goal_carbs_g: req.body.carbsG,
      goal_fats_g: req.body.fatsG,
      goal_weight_kg: req.body.weightKg,
      goal_focus_areas: req.body.focusAreas,
    };
    Object.keys(goalFields).forEach(k => goalFields[k] === undefined && delete goalFields[k]);

    const { data: user, error } = await supabase
      .from("users")
      .update(goalFields)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, goals: {
      fastHours: user.goal_fast_hours,
      waterMl: user.goal_water_ml,
      steps: user.goal_steps,
      sleepHours: user.goal_sleep_hours,
      kcal: user.goal_kcal,
      proteinG: user.goal_protein_g,
      carbsG: user.goal_carbs_g,
      fatsG: user.goal_fats_g,
      weightKg: user.goal_weight_kg,
      focusAreas: user.goal_focus_areas,
    }});
  } catch (err) {
    next(err);
  }
}

/** GET /api/user/goals */
async function getGoals(req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("goal_fast_hours,goal_water_ml,goal_steps,goal_sleep_hours,goal_kcal,goal_protein_g,goal_carbs_g,goal_fats_g,goal_weight_kg,goal_focus_areas")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;
    res.json({ success: true, goals: {
      fastHours: user.goal_fast_hours,
      waterMl: user.goal_water_ml,
      steps: user.goal_steps,
      sleepHours: user.goal_sleep_hours,
      kcal: user.goal_kcal,
      proteinG: user.goal_protein_g,
      carbsG: user.goal_carbs_g,
      fatsG: user.goal_fats_g,
      weightKg: user.goal_weight_kg,
      focusAreas: user.goal_focus_areas,
    }});
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/user/notifications */
async function updateNotifPrefs(req, res, next) {
  try {
    const notifFields = {
      notif_milestones: req.body.milestones,
      notif_streaks: req.body.streaks,
      notif_hydration: req.body.hydration,
      notif_insights: req.body.insights,
      notif_contests: req.body.contests,
      notif_social: req.body.social,
      notif_commerce: req.body.commerce,
      notif_updates: req.body.updates,
    };
    Object.keys(notifFields).forEach(k => notifFields[k] === undefined && delete notifFields[k]);

    const { data: user, error } = await supabase
      .from("users")
      .update(notifFields)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, notifPrefs: {
      milestones: user.notif_milestones,
      streaks: user.notif_streaks,
      hydration: user.notif_hydration,
      insights: user.notif_insights,
      contests: user.notif_contests,
      social: user.notif_social,
      commerce: user.notif_commerce,
      updates: user.notif_updates,
    }});
  } catch (err) {
    next(err);
  }
}

/** POST /api/user/xp */
async function addXp(req, res, next) {
  try {
    const amount = Number(req.body.amount) || 0;
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "amount must be a positive number" });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("xp, level")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;
    const newXp = (user.xp || 0) + amount;
    const newLevel = 1 + Math.floor(newXp / 500);

    await supabase.from("users").update({ xp: newXp, level: newLevel }).eq("id", req.user.id);
    res.json({ success: true, xp: newXp, level: newLevel });
  } catch (err) {
    next(err);
  }
}

/** POST /api/user/verify */
async function markVerified(req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .update({ verified: true, verified_at: Date.now() })
      .eq("id", req.user.id)
      .select("verified,verified_at")
      .single();

    if (error) throw error;
    res.json({ success: true, verified: user.verified, verifiedAt: user.verified_at });
  } catch (err) {
    next(err);
  }
}

/** POST /api/user/push-token */
async function registerPushToken(req, res, next) {
  try {
    const { token, platform } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "token is required" });

    await supabase
      .from("push_tokens")
      .upsert({ user_id: req.user.id, token, platform: platform || null }, { onConflict: "token" });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function getProfileSummary(req, res, next) {
  try {
    const weekStart = Date.now() - 7 * 86400000;
    const [{ count: posts }, { count: following }, { count: followers }, { data: entries }] = await Promise.all([
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", req.user.id).is("deleted_at", null),
      supabase.from("tracker_entries").select("*", { count: "exact", head: true }).eq("user_id", req.user.id).eq("tracker", "following"),
      supabase.from("tracker_entries").select("*", { count: "exact", head: true }).eq("tracker", "following").contains("meta", { targetId: req.user.id }),
      supabase.from("tracker_entries").select("tracker, value").eq("user_id", req.user.id).in("tracker", ["meals","calories","steps","workouts"]).gte("ts", weekStart),
    ]);
    const total = kind => (entries || []).filter(e => kind.includes(e.tracker)).reduce((n,e)=>n+Number(e.value||0),0);
    res.json({ success: true, summary: { posts: posts || 0, following: following || 0, followers: followers || 0, week: { calories: total(["meals","calories"]), steps: total(["steps"]), workouts: total(["workouts"]) } } });
  } catch (err) { next(err); }
}

module.exports = { getProfile, updateProfile, uploadAvatar, updateGoals, getGoals, updateNotifPrefs, addXp, markVerified, registerPushToken, getProfileSummary };
