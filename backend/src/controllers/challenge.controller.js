const { supabase } = require("../config/supabase");

/**
 * GET /api/challenges?tab=discover&limit=20&skip=0
 * tab: discover | my | completed
 */
async function getChallenges(req, res, next) {
  try {
    const tab = req.query.tab || "discover";
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip = Number(req.query.skip) || 0;

    let query;

    if (tab === "my") {
      // challenges the user has joined
      const { data: memberships, error: mErr } = await supabase
        .from("challenge_members")
        .select("challenge_id, current_day, completed")
        .eq("user_id", req.user.id)
        .eq("completed", false);
      if (mErr) throw mErr;

      const ids = memberships.map((m) => m.challenge_id);
      if (!ids.length) return res.json({ success: true, challenges: [], total: 0 });

      const { data: challenges, error } = await supabase
        .from("challenges")
        .select("*")
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Attach current_day from membership
      const memberMap = Object.fromEntries(memberships.map((m) => [m.challenge_id, m]));
      const enriched = challenges.map((c) => ({ ...c, current_day: memberMap[c.id]?.current_day || 0 }));
      return res.json({ success: true, challenges: enriched, total: enriched.length });
    }

    if (tab === "completed") {
      const { data: memberships, error: mErr } = await supabase
        .from("challenge_members")
        .select("challenge_id")
        .eq("user_id", req.user.id)
        .eq("completed", true);
      if (mErr) throw mErr;

      const ids = memberships.map((m) => m.challenge_id);
      if (!ids.length) return res.json({ success: true, challenges: [], total: 0 });

      const { data: challenges, error } = await supabase
        .from("challenges")
        .select("*")
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return res.json({ success: true, challenges, total: challenges.length });
    }

    // discover — all public active challenges
    const { data: challenges, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("status", "active")
      .eq("is_public", true)
      .order("joined_count", { ascending: false })
      .range(skip, skip + limit - 1);
    if (error) throw error;

    const { count } = await supabase
      .from("challenges")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .eq("is_public", true);

    res.json({ success: true, challenges, total: count || 0 });
  } catch (err) {
    next(err);
  }
}

/** GET /api/challenges/featured */
async function getFeatured(req, res, next) {
  try {
    const { data: challenge, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("is_featured", true)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    res.json({ success: true, challenge: challenge || null });
  } catch (err) {
    next(err);
  }
}

/** GET /api/challenges/:id */
async function getChallenge(req, res, next) {
  try {
    const { data: challenge, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !challenge) {
      return res.status(404).json({ success: false, message: "Challenge not found" });
    }

    // check if current user is a member
    const { data: membership } = await supabase
      .from("challenge_members")
      .select("current_day, completed, joined_at")
      .eq("challenge_id", req.params.id)
      .eq("user_id", req.user.id)
      .single();

    res.json({ success: true, challenge, membership: membership || null });
  } catch (err) {
    next(err);
  }
}

/** POST /api/challenges */
async function createChallenge(req, res, next) {
  try {
    const b = req.body;
    const { data: challenge, error } = await supabase
      .from("challenges")
      .insert({
        created_by: req.user.id,
        title: b.title,
        description: b.description || "",
        photo: b.photo || null,
        icon: b.icon || "trophy-outline",
        icon_color: b.iconColor || "#FF6A2B",
        duration_days: Number(b.durationDays) || 7,
        total_days: Number(b.totalDays) || Number(b.durationDays) || 7,
        is_featured: Boolean(b.isFeatured),
        is_public: b.isPublic !== false,
        starts_at: b.startsAt || Date.now(),
        ends_at: b.endsAt || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-join creator
    await supabase.from("challenge_members").insert({
      challenge_id: challenge.id,
      user_id: req.user.id,
    });
    await supabase.from("challenges").update({ joined_count: 1 }).eq("id", challenge.id);

    res.status(201).json({ success: true, challenge });
  } catch (err) {
    next(err);
  }
}

/** POST /api/challenges/:id/join */
async function joinChallenge(req, res, next) {
  try {
    const { data: challenge, error: cErr } = await supabase
      .from("challenges")
      .select("id, joined_count, status")
      .eq("id", req.params.id)
      .single();

    if (cErr || !challenge) {
      return res.status(404).json({ success: false, message: "Challenge not found" });
    }
    if (challenge.status !== "active") {
      return res.status(400).json({ success: false, message: "Challenge is not active" });
    }

    // Upsert membership
    const { error: mErr } = await supabase
      .from("challenge_members")
      .upsert({ challenge_id: challenge.id, user_id: req.user.id }, { onConflict: "challenge_id,user_id" });
    if (mErr) throw mErr;

    // Increment joined_count
    await supabase
      .from("challenges")
      .update({ joined_count: (challenge.joined_count || 0) + 1 })
      .eq("id", challenge.id);

    res.json({ success: true, message: "Joined challenge" });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/challenges/:id/join */
async function leaveChallenge(req, res, next) {
  try {
    await supabase
      .from("challenge_members")
      .delete()
      .eq("challenge_id", req.params.id)
      .eq("user_id", req.user.id);

    const { data: challenge } = await supabase
      .from("challenges")
      .select("joined_count")
      .eq("id", req.params.id)
      .single();

    if (challenge) {
      await supabase
        .from("challenges")
        .update({ joined_count: Math.max(0, (challenge.joined_count || 1) - 1) })
        .eq("id", req.params.id);
    }

    res.json({ success: true, message: "Left challenge" });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/challenges/:id/progress */
async function updateProgress(req, res, next) {
  try {
    const currentDay = Number(req.body.currentDay);
    const { data: challenge } = await supabase
      .from("challenges")
      .select("total_days")
      .eq("id", req.params.id)
      .single();

    const completed = challenge && currentDay >= challenge.total_days;

    const { data: membership, error } = await supabase
      .from("challenge_members")
      .update({ current_day: currentDay, completed })
      .eq("challenge_id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, membership });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getChallenges, getFeatured, getChallenge,
  createChallenge, joinChallenge, leaveChallenge, updateProgress,
};
