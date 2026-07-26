const { supabase } = require("../config/supabase");

/** GET /api/goals */
async function getGoals(req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("goal_fast_hours,goal_water_ml,goal_steps,goal_sleep_hours,goal_kcal,goal_protein_g,goal_carbs_g,goal_fats_g,goal_weight_kg,goal_focus_areas,goals")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;
    res.json({
      success: true,
      targetGoals: {
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
      },
      goals: user.goals,
    });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/goals */
async function updateGoals(req, res, next) {
  try {
    const patch = {};
    if (req.body.fastHours !== undefined) patch.goal_fast_hours = req.body.fastHours;
    if (req.body.waterMl !== undefined) patch.goal_water_ml = req.body.waterMl;
    if (req.body.steps !== undefined) patch.goal_steps = req.body.steps;
    if (req.body.sleepHours !== undefined) patch.goal_sleep_hours = req.body.sleepHours;
    if (req.body.kcal !== undefined) patch.goal_kcal = req.body.kcal;
    if (req.body.proteinG !== undefined) patch.goal_protein_g = req.body.proteinG;
    if (req.body.carbsG !== undefined) patch.goal_carbs_g = req.body.carbsG;
    if (req.body.fatsG !== undefined) patch.goal_fats_g = req.body.fatsG;
    if (req.body.weightKg !== undefined) patch.goal_weight_kg = req.body.weightKg;
    if (req.body.focusAreas !== undefined) patch.goal_focus_areas = req.body.focusAreas;

    const { data: user, error } = await supabase
      .from("users")
      .update(patch)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({
      success: true,
      targetGoals: {
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
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getGoals, updateGoals };
