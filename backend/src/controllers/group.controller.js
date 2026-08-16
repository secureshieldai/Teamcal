const { supabase } = require("../config/supabase");

/** GET /api/groups — groups the user belongs to */
async function getMyGroups(req, res, next) {
  try {
    const { data: memberships, error: mErr } = await supabase
      .from("group_members")
      .select("group_id, role")
      .eq("user_id", req.user.id);
    if (mErr) throw mErr;

    if (!memberships.length) return res.json({ success: true, groups: [] });

    const ids = memberships.map((m) => m.group_id);
    const roleMap = Object.fromEntries(memberships.map((m) => [m.group_id, m.role]));

    const { data: groups, error } = await supabase
      .from("groups")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const enriched = groups.map((g) => ({ ...g, role: roleMap[g.id] }));
    res.json({ success: true, groups: enriched });
  } catch (err) {
    next(err);
  }
}

/** GET /api/groups/discover — public groups the user hasn't joined yet, most members first */
async function discoverGroups(req, res, next) {
  try {
    const { data: memberships, error: mErr } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", req.user.id);
    if (mErr) throw mErr;

    const joinedIds = memberships.map((m) => m.group_id);

    let query = supabase
      .from("groups")
      .select("*")
      .eq("is_private", false)
      .order("member_count", { ascending: false })
      .limit(20);
    if (joinedIds.length) query = query.not("id", "in", `(${joinedIds.join(",")})`);

    const { data: groups, error } = await query;
    if (error) throw error;

    res.json({ success: true, groups: groups || [] });
  } catch (err) {
    next(err);
  }
}

/** GET /api/groups/:id */
async function getGroup(req, res, next) {
  try {
    const { data: group, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const { data: callerMembership, error: callerError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", req.params.id)
      .eq("user_id", req.user.id)
      .maybeSingle();
    if (callerError) throw callerError;
    if (group.is_private && !callerMembership) {
      return res.status(403).json({ success: false, message: "This group is private" });
    }

    // Fetch members with user info (avatar, name)
    const { data: members } = await supabase
      .from("group_members")
      .select("role, joined_at, user:user_id (id, name, avatar, level, verified)")
      .eq("group_id", req.params.id)
      .order("joined_at", { ascending: true })
      .limit(50);

    res.json({ success: true, group, members: members || [], myRole: callerMembership?.role || null });
  } catch (err) {
    next(err);
  }
}

/** POST /api/groups */
async function createGroup(req, res, next) {
  try {
    const { name, description, cover, isPrivate, meta = {} } = req.body;
    const cleanName = String(name || "").trim();
    if (!cleanName) return res.status(400).json({ success: false, message: "name is required" });
    if (cleanName.length > 120) return res.status(400).json({ success: false, message: "name is too long" });
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) return res.status(400).json({ success: false, message: "meta must be an object" });

    const { data: group, error } = await supabase
      .from("groups")
      .insert({
        name: cleanName,
        description: String(description || "").trim(),
        cover: cover || null,
        metadata: meta,
        is_private: Boolean(isPrivate),
        created_by: req.user.id,
        member_count: 1,
      })
      .select()
      .single();
    if (error) throw error;

    // Add creator as owner
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: req.user.id,
      role: "owner",
    });
    if (memberError) {
      await supabase.from("groups").delete().eq("id", group.id);
      throw memberError;
    }

    res.status(201).json({ success: true, group });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/groups/:id */
async function updateGroup(req, res, next) {
  try {
    // Only owner/admin can update
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", req.params.id)
      .eq("user_id", req.user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const allowed = ["name", "description", "cover", "is_private", "metadata"];
    const patch = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
    if (patch.name !== undefined) {
      patch.name = String(patch.name).trim();
      if (!patch.name || patch.name.length > 120) return res.status(400).json({ success: false, message: "Invalid group name" });
    }
    if (patch.metadata !== undefined && (!patch.metadata || typeof patch.metadata !== "object" || Array.isArray(patch.metadata))) {
      return res.status(400).json({ success: false, message: "metadata must be an object" });
    }

    const { data: group, error } = await supabase
      .from("groups")
      .update(patch)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;

    res.json({ success: true, group });
  } catch (err) {
    next(err);
  }
}

/** POST /api/groups/:id/join */
async function joinGroup(req, res, next) {
  try {
    const { data: group, error: gErr } = await supabase
      .from("groups")
      .select("id, is_private, member_count")
      .eq("id", req.params.id)
      .single();

    if (gErr || !group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    if (group.is_private) {
      return res.status(403).json({ success: false, message: "This group is private" });
    }

    const { data: existing, error: existingError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", group.id)
      .eq("user_id", req.user.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return res.json({ success: true, message: "Already a member" });

    const { error: joinError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: req.user.id, role: "member" });
    if (joinError) throw joinError;

    await supabase
      .from("groups")
      .update({ member_count: (group.member_count || 0) + 1 })
      .eq("id", group.id);

    res.json({ success: true, message: "Joined group" });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/groups/:id/join */
async function leaveGroup(req, res, next) {
  try {
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", req.params.id)
      .eq("user_id", req.user.id)
      .single();

    if (!membership) {
      return res.status(404).json({ success: false, message: "Not a member" });
    }
    if (membership.role === "owner") {
      return res.status(400).json({ success: false, message: "Owner cannot leave. Transfer ownership first." });
    }

    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", req.params.id)
      .eq("user_id", req.user.id);

    const { data: group } = await supabase
      .from("groups")
      .select("member_count")
      .eq("id", req.params.id)
      .single();

    if (group) {
      await supabase
        .from("groups")
        .update({ member_count: Math.max(0, (group.member_count || 1) - 1) })
        .eq("id", req.params.id);
    }

    res.json({ success: true, message: "Left group" });
  } catch (err) {
    next(err);
  }
}

/** GET /api/groups/:id/activity — group post feed */
async function getGroupActivity(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip = Number(req.query.skip) || 0;

    const { data: group, error: groupError } = await supabase.from("groups").select("is_private").eq("id", req.params.id).maybeSingle();
    if (groupError) throw groupError;
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (group.is_private) {
      const { data: membership, error: membershipError } = await supabase.from("group_members").select("role").eq("group_id", req.params.id).eq("user_id", req.user.id).maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership) return res.status(403).json({ success: false, message: "This group is private" });
    }

    const { data: posts, error } = await supabase
      .from("posts")
      .select("*, user:user_id (id, name, avatar, verified)")
      .eq("community", req.params.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;
    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
}

async function updateGroupMember(req,res,next){try{const {data:actor}=await supabase.from("group_members").select("role").eq("group_id",req.params.id).eq("user_id",req.user.id).maybeSingle();if(!actor||!["owner","admin"].includes(actor.role))return res.status(403).json({success:false,message:"Not authorized"});const role=req.body.role;if(!["member","admin"].includes(role))return res.status(400).json({success:false,message:"Invalid member role"});const {data,error}=await supabase.from("group_members").update({role}).eq("group_id",req.params.id).eq("user_id",req.params.userId).select().maybeSingle();if(error)throw error;if(!data)return res.status(404).json({success:false,message:"Member not found"});res.json({success:true,membership:data});}catch(e){next(e)}}
async function removeGroupMember(req,res,next){try{const {data:actor}=await supabase.from("group_members").select("role").eq("group_id",req.params.id).eq("user_id",req.user.id).maybeSingle();if(!actor||!["owner","admin"].includes(actor.role))return res.status(403).json({success:false,message:"Not authorized"});const {data:target}=await supabase.from("group_members").select("role").eq("group_id",req.params.id).eq("user_id",req.params.userId).maybeSingle();if(target?.role==="owner")return res.status(400).json({success:false,message:"Owner cannot be removed"});const {error}=await supabase.from("group_members").delete().eq("group_id",req.params.id).eq("user_id",req.params.userId);if(error)throw error;const {data:group}=await supabase.from("groups").select("member_count").eq("id",req.params.id).single();if(group)await supabase.from("groups").update({member_count:Math.max(1,(group.member_count||1)-1)}).eq("id",req.params.id);res.json({success:true});}catch(e){next(e)}}

module.exports = {
  getMyGroups, discoverGroups, getGroup, createGroup, updateGroup,
  joinGroup, leaveGroup, getGroupActivity,
  updateGroupMember, removeGroupMember,
};
