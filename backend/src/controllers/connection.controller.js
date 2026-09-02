const { supabase } = require("../config/supabase");
const { notifySafely } = require("../services/notification.service");

// ── Follow helpers ───────────────────────────────────────────────────────────
// Follows live in tracker_entries (tracker='following', meta.targetId) — the same
// store toggleFollow uses. A connection request always creates the one-way follow;
// accepting a request creates the reciprocal one.
async function ensureFollow(followerId, targetId) {
  if (!followerId || !targetId || followerId === targetId) return;
  const { data: existing } = await supabase
    .from("tracker_entries")
    .select("id")
    .eq("user_id", followerId)
    .eq("tracker", "following")
    .contains("meta", { targetId })
    .limit(1);
  if (existing?.length) return;
  await supabase
    .from("tracker_entries")
    .insert({ user_id: followerId, tracker: "following", ts: Date.now(), value: 1, meta: { targetId } });
}

// ── Connection lookups ───────────────────────────────────────────────────────
async function findConnection(a, b) {
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .or(`and(requester_id.eq.${a},addressee_id.eq.${b}),and(requester_id.eq.${b},addressee_id.eq.${a})`)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/**
 * Connection state between `me` and `otherId`, from me's point of view.
 * Returned on the public profile so the app can render the right button.
 */
async function connectionStateFor(me, otherId) {
  const row = await findConnection(me, otherId);
  if (!row) return { connectionStatus: "none", connectionId: null };
  if (row.status === "accepted") return { connectionStatus: "connected", connectionId: row.id };
  if (row.status === "declined") {
    // A decline is invisible to the requester (spec: "connection is not created");
    // the addressee simply sees a clean slate too.
    return { connectionStatus: "none", connectionId: row.id };
  }
  // pending
  return {
    connectionStatus: row.requester_id === me ? "pending_outgoing" : "pending_incoming",
    connectionId: row.id,
  };
}

async function usersById(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const { data, error } = await supabase
    .from("users")
    .select("id, name, bio, avatar, verified, level, xp")
    .in("id", unique);
  if (error) throw error;
  return Object.fromEntries((data || []).map((u) => [u.id, u]));
}

// ── Endpoints ────────────────────────────────────────────────────────────────

// POST /api/social/connections/:id  { note? }
// Sends a connection request AND follows the target. If the target already sent
// ME a pending request, this accepts it instead (both directions now follow).
async function sendRequest(req, res, next) {
  try {
    const me = req.user.id;
    const targetId = req.params.id;
    const note = String(req.body.note || "").trim().slice(0, 500);
    if (targetId === me) return res.status(400).json({ success: false, message: "You cannot connect with yourself" });

    const { data: target } = await supabase.from("users").select("id").eq("id", targetId).maybeSingle();
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    // Sending a connection request always follows the person.
    await ensureFollow(me, targetId);

    const existing = await findConnection(me, targetId);

    if (existing?.status === "accepted") {
      return res.json({ success: true, connectionStatus: "connected", connectionId: existing.id });
    }

    // They already asked to connect with me — treat this as an accept.
    if (existing && existing.status === "pending" && existing.addressee_id === me) {
      await supabase
        .from("connections")
        .update({ status: "accepted", responded_at: new Date().toISOString() })
        .eq("id", existing.id);
      await ensureFollow(targetId, me);
      notifySafely(targetId, "connect_accepted", "Connection accepted", "You are now connected.", { actorId: me });
      return res.json({ success: true, connectionStatus: "connected", connectionId: existing.id });
    }

    // My own request already stands.
    if (existing && existing.status === "pending" && existing.requester_id === me) {
      return res.json({ success: true, connectionStatus: "pending_outgoing", connectionId: existing.id });
    }

    // Re-opening a previously declined row, or a brand-new request.
    let row;
    if (existing) {
      const { data, error } = await supabase
        .from("connections")
        .update({ requester_id: me, addressee_id: targetId, status: "pending", note, responded_at: null })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      row = data;
    } else {
      const { data, error } = await supabase
        .from("connections")
        .insert({ requester_id: me, addressee_id: targetId, status: "pending", note })
        .select()
        .single();
      if (error) {
        if (error.code === "23505") {
          const again = await findConnection(me, targetId);
          return res.json({ success: true, connectionStatus: "pending_outgoing", connectionId: again?.id || null });
        }
        throw error;
      }
      row = data;
    }

    notifySafely(
      targetId,
      "connect_request",
      "New connection request",
      note ? `"${note.slice(0, 120)}"` : "Someone wants to connect with you.",
      { actorId: me, entityId: row.id }
    );
    res.status(201).json({ success: true, connectionStatus: "pending_outgoing", connectionId: row.id });
  } catch (e) {
    next(e);
  }
}

// POST /api/social/connections/:id/accept — addressee accepts. Reciprocal follow.
async function acceptRequest(req, res, next) {
  try {
    const me = req.user.id;
    const requesterId = req.params.id;
    const row = await findConnection(me, requesterId);
    if (!row || row.status !== "pending" || row.addressee_id !== me) {
      return res.status(404).json({ success: false, message: "No pending request from this user" });
    }
    await supabase
      .from("connections")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", row.id);
    // Both directions now follow.
    await ensureFollow(me, requesterId);
    await ensureFollow(requesterId, me);
    notifySafely(requesterId, "connect_accepted", "Connection accepted", "You are now connected.", { actorId: me });
    res.json({ success: true, connectionStatus: "connected", connectionId: row.id });
  } catch (e) {
    next(e);
  }
}

// POST /api/social/connections/:id/decline — addressee declines. The follow the
// requester created when they sent the request is left intact (spec).
async function declineRequest(req, res, next) {
  try {
    const me = req.user.id;
    const requesterId = req.params.id;
    const row = await findConnection(me, requesterId);
    if (!row || row.status !== "pending" || row.addressee_id !== me) {
      return res.status(404).json({ success: false, message: "No pending request from this user" });
    }
    await supabase
      .from("connections")
      .update({ status: "declined", responded_at: new Date().toISOString() })
      .eq("id", row.id);
    res.json({ success: true, connectionStatus: "none", connectionId: row.id });
  } catch (e) {
    next(e);
  }
}

// DELETE /api/social/connections/:id — remove a connection or cancel an outgoing
// request. Follows are NOT removed (unfollow is a separate, explicit action).
async function removeConnection(req, res, next) {
  try {
    const me = req.user.id;
    const otherId = req.params.id;
    const row = await findConnection(me, otherId);
    if (!row || (row.requester_id !== me && row.addressee_id !== me)) {
      return res.status(404).json({ success: false, message: "Connection not found" });
    }
    await supabase.from("connections").delete().eq("id", row.id);
    res.json({ success: true, connectionStatus: "none", connectionId: null });
  } catch (e) {
    next(e);
  }
}

// GET /api/social/connections?box=incoming|outgoing|accepted
async function listConnections(req, res, next) {
  try {
    const me = req.user.id;
    const box = ["incoming", "outgoing", "accepted"].includes(req.query.box) ? req.query.box : "accepted";

    let query = supabase.from("connections").select("*").order("created_at", { ascending: false });
    if (box === "incoming") query = query.eq("addressee_id", me).eq("status", "pending");
    else if (box === "outgoing") query = query.eq("requester_id", me).eq("status", "pending");
    else query = query.or(`requester_id.eq.${me},addressee_id.eq.${me}`).eq("status", "accepted");

    const { data: rows, error } = await query;
    if (error) throw error;

    const otherIds = (rows || []).map((r) => (r.requester_id === me ? r.addressee_id : r.requester_id));
    const people = await usersById(otherIds);

    res.json({
      success: true,
      connections: (rows || []).map((r) => {
        const otherId = r.requester_id === me ? r.addressee_id : r.requester_id;
        return {
          id: r.id,
          user: people[otherId] || { id: otherId, name: "Unknown", avatar: null },
          note: r.note || "",
          status: r.status,
          direction: r.requester_id === me ? "outgoing" : "incoming",
          createdAt: r.created_at,
        };
      }),
    });
  } catch (e) {
    next(e);
  }
}

// Accepted-connection user rows, either direction — the "friends" list.
async function acceptedConnectionUserIds(me) {
  const { data, error } = await supabase
    .from("connections")
    .select("requester_id, addressee_id")
    .or(`requester_id.eq.${me},addressee_id.eq.${me}`)
    .eq("status", "accepted");
  if (error) throw error;
  return [...new Set((data || []).map((r) => (r.requester_id === me ? r.addressee_id : r.requester_id)))];
}

module.exports = {
  ensureFollow,
  findConnection,
  connectionStateFor,
  acceptedConnectionUserIds,
  sendRequest,
  acceptRequest,
  declineRequest,
  removeConnection,
  listConnections,
};
