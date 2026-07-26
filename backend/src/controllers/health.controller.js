const { supabase } = require("../config/supabase");

/** GET /api/health-team */
async function getTeam(req, res, next) {
  try {
    const { data: invites, error } = await supabase
      .from("health_invites")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, invites });
  } catch (err) {
    next(err);
  }
}

/** POST /api/health-team */
async function invite(req, res, next) {
  try {
    const { email, name, role, access = [] } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "email is required" });

    const { data: inv, error } = await supabase
      .from("health_invites")
      .insert({
        user_id: req.user.id,
        email,
        name,
        role,
        access,
        sent_at: Date.now(),
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, invite: inv });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/health-team/:id */
async function updateInvite(req, res, next) {
  try {
    const allowed = ["email", "name", "role", "access", "status", "accepted_at"];
    const patch = Object.fromEntries(
      allowed.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
    );
    if (!Object.keys(patch).length) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }
    const { data: inv, error } = await supabase
      .from("health_invites")
      .update(patch)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!inv) return res.status(404).json({ success: false, message: "Invite not found" });
    res.json({ success: true, invite: inv });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/health-team/:id */
async function removeInvite(req, res, next) {
  try {
    await supabase
      .from("health_invites")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTeam, invite, updateInvite, removeInvite };
