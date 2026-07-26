const { supabase } = require("../config/supabase");
const { notifySafely } = require("../services/notification.service");

/** GET /api/social/feed?limit=20&skip=0 */
async function getFeed(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip = Number(req.query.skip) || 0;

    const { data: posts, error } = await supabase
      .from("posts")
      .select("*, user:user_id (id, name, avatar, verified, level)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;
    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
}

/** GET /api/social/users?q=name */
async function searchUsers(req, res, next) {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ success: true, users: [] });

    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, avatar, verified, level")
      .ilike("name", `%${q}%`)
      .neq("id", req.user.id)
      .limit(20);

    if (error) throw error;
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

/** GET /api/social/users/:id */
async function getProfile(req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, bio, avatar, verified, level, xp, coins, created_at")
      .eq("id", req.params.id)
      .single();

    if (error || !user) return res.status(404).json({ success: false, message: "User not found" });

    const { count: postCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null);

    res.json({ success: true, user: { ...user, postCount: postCount || 0 } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/social/leaderboard?limit=20 */
async function getLeaderboard(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const scope = req.query.scope || "global";

    if (scope === "teams") {
      const { data: groups, error: groupError } = await supabase.from("groups").select("id, name, avatar, member_count").limit(limit);
      if (groupError) throw groupError;
      const ids = (groups || []).map(g => g.id);
      const { data: members, error: memberError } = ids.length
        ? await supabase.from("group_members").select("group_id, user:user_id (xp)").in("group_id", ids)
        : { data: [], error: null };
      if (memberError) throw memberError;
      const ranked = (groups || []).map(g => ({ id:g.id,name:g.name,avatar:g.avatar,xp:(members||[]).filter(m=>m.group_id===g.id).reduce((n,m)=>n+Number(m.user?.xp||0),0),member_count:g.member_count })).sort((a,b)=>b.xp-a.xp);
      return res.json({ success: true, users: ranked });
    }

    let friendIds = null;
    if (scope === "friends") {
      const { data: links } = await supabase.from("tracker_entries").select("meta").eq("user_id", req.user.id).eq("tracker", "friend");
      friendIds = [req.user.id, ...(links || []).map(x => x.meta?.targetId).filter(Boolean)];
    }

    let query = supabase
      .from("users")
      .select("id, name, avatar, verified, level, xp")
      .order("xp", { ascending: false }).limit(limit);
    if (friendIds) query = query.in("id", friendIds);
    const { data: users, error } = await query;

    if (error) throw error;
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

async function toggleFriend(req, res, next) {
  try {
    const targetId = req.params.id;
    if (targetId === req.user.id) return res.status(400).json({ success: false, message: "You cannot add yourself" });
    const { data: existing } = await supabase.from("tracker_entries").select("id").eq("user_id", req.user.id).eq("tracker", "friend").contains("meta", { targetId }).limit(1);
    if (existing?.length) { await supabase.from("tracker_entries").delete().eq("id", existing[0].id); return res.json({ success: true, friend: false }); }
    const { data: target } = await supabase.from("users").select("id").eq("id", targetId).single();
    if (!target) return res.status(404).json({ success: false, message: "User not found" });
    await supabase.from("tracker_entries").insert({ user_id: req.user.id, tracker: "friend", ts: Date.now(), value: 1, meta: { targetId } });
    notifySafely(targetId, "friend", "New friend", "Someone added you as a friend.", { actorId: req.user.id });
    res.json({ success: true, friend: true });
  } catch (err) { next(err); }
}

async function getFriends(req, res, next) {
  try {
    const { data: links, error } = await supabase.from("tracker_entries").select("meta").eq("user_id", req.user.id).eq("tracker", "friend");
    if (error) throw error; const ids = links.map(x => x.meta?.targetId).filter(Boolean);
    if (!ids.length) return res.json({ success: true, friends: [] });
    const { data: friends, error: userError } = await supabase.from("users").select("id, name, bio, avatar, verified, level, xp, goal_kcal").in("id", ids);
    if (userError) throw userError; res.json({ success: true, friends });
  } catch (err) { next(err); }
}

async function getFriendsProgress(req, res, next) {
  try {
    const { data: links } = await supabase.from("tracker_entries").select("meta").eq("user_id", req.user.id).eq("tracker", "friend");
    const ids = (links || []).map(x => x.meta?.targetId).filter(Boolean); if (!ids.length) return res.json({ success: true, friends: [] });
    const start = new Date(); start.setHours(0,0,0,0);
    const [{ data: users }, { data: entries }] = await Promise.all([
      supabase.from("users").select("id, name, avatar, goal_kcal").in("id", ids),
      supabase.from("tracker_entries").select("user_id, tracker, value, meta").in("user_id", ids).in("tracker", ["meals","calories","steps"]).gte("ts", start.getTime()),
    ]);
    const friends = (users || []).map(user => { const own=(entries||[]).filter(e=>e.user_id===user.id); const calories=own.filter(e=>e.tracker==="meals"||e.tracker==="calories").reduce((n,e)=>n+Number(e.value||0),0); const steps=own.filter(e=>e.tracker==="steps").reduce((n,e)=>n+Number(e.value||0),0); return { id:user.id,name:user.name,avatar:user.avatar,calories,steps,percent:user.goal_kcal?Math.min(100,Math.round(calories/user.goal_kcal*100)):0 }; });
    res.json({ success: true, friends });
  } catch (err) { next(err); }
}

async function toggleFollow(req, res, next) {
  try {
    const targetId = req.params.id; if (targetId === req.user.id) return res.status(400).json({ success: false, message: "You cannot follow yourself" });
    const { data: existing } = await supabase.from("tracker_entries").select("id").eq("user_id", req.user.id).eq("tracker", "following").contains("meta", { targetId }).limit(1);
    if (existing?.length) { await supabase.from("tracker_entries").delete().eq("id", existing[0].id); return res.json({ success: true, following: false }); }
    const { data: target } = await supabase.from("users").select("id").eq("id", targetId).single(); if (!target) return res.status(404).json({ success: false, message: "User not found" });
    await supabase.from("tracker_entries").insert({ user_id: req.user.id, tracker: "following", ts: Date.now(), value: 1, meta: { targetId } });
    notifySafely(targetId, "follow", "New follower", "Someone started following you.", { actorId: req.user.id });
    res.json({ success: true, following: true });
  } catch (err) { next(err); }
}

async function getCreators(req, res, next) {
  try {
    const [{ data: creators, error }, { data: follows }] = await Promise.all([
      supabase.from("users").select("id, name, bio, avatar, verified, level, xp").eq("verified", true).neq("id", req.user.id).order("xp", { ascending: false }).limit(30),
      supabase.from("tracker_entries").select("meta").eq("user_id", req.user.id).eq("tracker", "following"),
    ]);
    if (error) throw error; const followed = new Set((follows || []).map(x => x.meta?.targetId));
    res.json({ success: true, creators: (creators || []).map(x => ({ ...x, following: followed.has(x.id) })) });
  } catch (err) { next(err); }
}

module.exports = { getFeed, searchUsers, getProfile, getLeaderboard, toggleFriend, getFriends, getFriendsProgress, toggleFollow, getCreators };
