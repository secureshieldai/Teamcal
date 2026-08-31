const { supabase } = require("../config/supabase");
const { getIo } = require("../realtime");

// ── helpers ──────────────────────────────────────────────────────────────────

async function notifyFollowers(hostId, streamId, title, avatar, hostName) {
  const { data: followers } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", hostId);
  if (!followers?.length) return;

  const rows = followers.map((f) => ({
    user_id: f.follower_id,
    tracker: "notification",
    ts: Date.now(),
    value: 0,
    meta: {
      type: "live_started",
      title: `${hostName} is live`,
      body: title,
      streamId,
      avatar,
      read: false,
    },
  }));
  await supabase.from("tracker_entries").insert(rows);

  const io = getIo();
  if (io) {
    followers.forEach((f) => {
      io.to(`user:${f.follower_id}`).emit("notification", {
        type: "live_started",
        streamId,
        title: `${hostName} is live`,
        body: title,
        avatar,
      });
    });
  }
}

async function notifyCommunityMembers(communityId, hostId, streamId, title, hostName) {
  if (!communityId) return;
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", communityId)
    .neq("user_id", hostId);
  if (!members?.length) return;

  const rows = members.map((m) => ({
    user_id: m.user_id,
    tracker: "notification",
    ts: Date.now(),
    value: 0,
    meta: {
      type: "live_community",
      title: `Live in your community`,
      body: title,
      streamId,
      read: false,
    },
  }));
  await supabase.from("tracker_entries").insert(rows);

  const io = getIo();
  if (io) {
    members.forEach((m) => {
      io.to(`user:${m.user_id}`).emit("notification", {
        type: "live_community",
        streamId,
        title: `Live in your community`,
        body: title,
      });
    });
  }
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

/** POST /api/live — create / start a stream */
async function createStream(req, res, next) {
  try {
    const { title, description, coverImage, visibility, communityId, allowComments, allowReactions } = req.body;
    if (!String(title || "").trim()) {
      return res.status(400).json({ success: false, message: "title is required" });
    }

    const { data: user } = await supabase.from("users").select("id,name,avatar,verified").eq("id", req.user.id).single();

    // Create stream record
    const { data: stream, error } = await supabase
      .from("live_streams")
      .insert({
        host_id: req.user.id,
        title: String(title).trim(),
        description: String(description || "").trim() || null,
        cover_image: coverImage || null,
        visibility: visibility || "public",
        community_id: communityId || null,
        allow_comments: allowComments !== false,
        allow_reactions: allowReactions !== false,
        status: "live",
        started_at: new Date().toISOString(),
        viewer_count: 0,
        peak_viewers: 0,
        total_viewers: 0,
        comment_count: 0,
        reaction_count: 0,
        new_followers: 0,
      })
      .select()
      .single();
    if (error) throw error;

    // Notify followers
    notifyFollowers(req.user.id, stream.id, stream.title, user?.avatar, user?.name).catch(() => {});
    // Notify community members
    if (communityId) {
      notifyCommunityMembers(communityId, req.user.id, stream.id, stream.title, user?.name).catch(() => {});
    }

    // Broadcast to global live room
    const io = getIo();
    if (io) {
      io.to("live:discover").emit("live:new", {
        id: stream.id,
        title: stream.title,
        hostName: user?.name,
        hostAvatar: user?.avatar,
        coverImage: stream.cover_image,
        viewerCount: 0,
      });
    }

    res.status(201).json({ success: true, stream });
  } catch (err) {
    next(err);
  }
}

/** GET /api/live — list active streams */
async function listStreams(req, res, next) {
  try {
    const { data: streams, error } = await supabase
      .from("live_streams")
      .select("*, host:host_id (id, name, avatar, verified)")
      .eq("status", "live")
      .order("viewer_count", { ascending: false });
    if (error) throw error;
    res.json({ success: true, streams: streams || [] });
  } catch (err) {
    next(err);
  }
}

/** GET /api/live/:id — single stream */
async function getStream(req, res, next) {
  try {
    const { data: stream, error } = await supabase
      .from("live_streams")
      .select("*, host:host_id (id, name, avatar, verified)")
      .eq("id", req.params.id)
      .single();
    if (error || !stream) return res.status(404).json({ success: false, message: "Stream not found" });

    // Visibility check
    if (stream.visibility === "followers") {
      const { data: follow } = await supabase.from("follows").select("id").eq("follower_id", req.user.id).eq("following_id", stream.host_id).maybeSingle();
      if (!follow && stream.host_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "This stream is for followers only" });
      }
    }
    if (stream.visibility === "community" && stream.community_id) {
      const { data: member } = await supabase.from("group_members").select("id").eq("group_id", stream.community_id).eq("user_id", req.user.id).maybeSingle();
      if (!member && stream.host_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "This stream is for community members only" });
      }
    }

    res.json({ success: true, stream });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/live/:id/end — host ends the stream */
async function endStream(req, res, next) {
  try {
    const { data: stream, error: fetchErr } = await supabase.from("live_streams").select("*").eq("id", req.params.id).single();
    if (fetchErr || !stream) return res.status(404).json({ success: false, message: "Stream not found" });
    if (stream.host_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const endedAt = new Date().toISOString();
    const durationSec = Math.floor((Date.now() - new Date(stream.started_at).getTime()) / 1000);

    const { data: updated, error } = await supabase
      .from("live_streams")
      .update({ status: "ended", ended_at: endedAt, duration_seconds: durationSec })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;

    // Notify all viewers the stream ended
    const io = getIo();
    if (io) {
      io.to(`live:${req.params.id}`).emit("live:ended", { streamId: req.params.id });
      io.to("live:discover").emit("live:removed", { streamId: req.params.id });
    }

    res.json({ success: true, stream: updated });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/live/:id/save-replay */
async function saveReplay(req, res, next) {
  try {
    const { save } = req.body;
    const { data: stream } = await supabase.from("live_streams").select("host_id, status").eq("id", req.params.id).single();
    if (!stream) return res.status(404).json({ success: false, message: "Stream not found" });
    if (stream.host_id !== req.user.id) return res.status(403).json({ success: false, message: "Not authorized" });

    const { error } = await supabase.from("live_streams").update({ replay_saved: Boolean(save) }).eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ── comments ─────────────────────────────────────────────────────────────────

/** GET /api/live/:id/comments */
async function getComments(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const { data, error } = await supabase
      .from("live_comments")
      .select("*, user:user_id (id, name, avatar, verified)")
      .eq("stream_id", req.params.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    res.json({ success: true, comments: data || [] });
  } catch (err) {
    next(err);
  }
}

/** POST /api/live/:id/comments */
async function addComment(req, res, next) {
  try {
    const text = String(req.body.text || "").trim();
    if (!text || text.length > 500) return res.status(400).json({ success: false, message: "Invalid comment" });

    const { data: stream } = await supabase.from("live_streams").select("status, allow_comments, host_id").eq("id", req.params.id).single();
    if (!stream || stream.status !== "live") return res.status(400).json({ success: false, message: "Stream is not live" });
    if (!stream.allow_comments) return res.status(403).json({ success: false, message: "Comments are disabled" });

    const { data: user } = await supabase.from("users").select("id, name, avatar, verified").eq("id", req.user.id).single();
    const { data: comment, error } = await supabase
      .from("live_comments")
      .insert({ stream_id: req.params.id, user_id: req.user.id, text })
      .select()
      .single();
    if (error) throw error;

    await supabase.from("live_streams").update({ comment_count: supabase.rpc ? undefined : undefined }).eq("id", req.params.id);
    // increment comment count
    await supabase.rpc("increment_live_field", { stream_id: req.params.id, field_name: "comment_count", amount: 1 }).catch(() => {});

    const payload = { ...comment, user };
    const io = getIo();
    if (io) io.to(`live:${req.params.id}`).emit("live:comment", payload);

    res.status(201).json({ success: true, comment: payload });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/live/:id/comments/:commentId — host deletes comment */
async function deleteComment(req, res, next) {
  try {
    const { data: stream } = await supabase.from("live_streams").select("host_id").eq("id", req.params.id).single();
    const { data: comment } = await supabase.from("live_comments").select("user_id").eq("id", req.params.commentId).single();
    if (!stream || !comment) return res.status(404).json({ success: false, message: "Not found" });

    const isHost = stream.host_id === req.user.id;
    const isOwner = comment.user_id === req.user.id;
    if (!isHost && !isOwner) return res.status(403).json({ success: false, message: "Not authorized" });

    await supabase.from("live_comments").update({ deleted_at: new Date().toISOString() }).eq("id", req.params.commentId);

    const io = getIo();
    if (io) io.to(`live:${req.params.id}`).emit("live:comment_deleted", { commentId: req.params.commentId });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/live/:id/comments/:commentId/pin — host pins a comment */
async function pinComment(req, res, next) {
  try {
    const { data: stream } = await supabase.from("live_streams").select("host_id").eq("id", req.params.id).single();
    if (!stream || stream.host_id !== req.user.id) return res.status(403).json({ success: false, message: "Not authorized" });

    // unpin any existing pin
    await supabase.from("live_comments").update({ pinned: false }).eq("stream_id", req.params.id).eq("pinned", true);
    const { data: comment } = await supabase.from("live_comments").update({ pinned: true }).eq("id", req.params.commentId).select().single();

    const io = getIo();
    if (io) io.to(`live:${req.params.id}`).emit("live:comment_pinned", { commentId: req.params.commentId });

    res.json({ success: true, comment });
  } catch (err) {
    next(err);
  }
}

// ── reactions ─────────────────────────────────────────────────────────────────

/** POST /api/live/:id/reactions */
async function addReaction(req, res, next) {
  try {
    const { data: stream } = await supabase.from("live_streams").select("status, allow_reactions").eq("id", req.params.id).single();
    if (!stream || stream.status !== "live") return res.status(400).json({ success: false, message: "Stream is not live" });
    if (!stream.allow_reactions) return res.status(403).json({ success: false, message: "Reactions are disabled" });

    await supabase.rpc("increment_live_field", { stream_id: req.params.id, field_name: "reaction_count", amount: 1 }).catch(() => {});

    const io = getIo();
    if (io) io.to(`live:${req.params.id}`).emit("live:reaction", { userId: req.user.id, streamId: req.params.id });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ── viewer join/leave ─────────────────────────────────────────────────────────

/** POST /api/live/:id/join */
async function joinStream(req, res, next) {
  try {
    const { data: stream } = await supabase.from("live_streams").select("status, viewer_count, peak_viewers, total_viewers").eq("id", req.params.id).single();
    if (!stream || stream.status !== "live") return res.status(400).json({ success: false, message: "Stream is not live" });

    const newCount = (stream.viewer_count || 0) + 1;
    const newPeak = Math.max(stream.peak_viewers || 0, newCount);
    const newTotal = (stream.total_viewers || 0) + 1;

    await supabase.from("live_streams").update({ viewer_count: newCount, peak_viewers: newPeak, total_viewers: newTotal }).eq("id", req.params.id);

    const io = getIo();
    if (io) {
      io.to(`live:${req.params.id}`).emit("live:viewer_count", { count: newCount });
      io.to("live:discover").emit("live:viewer_update", { streamId: req.params.id, count: newCount });
    }

    res.json({ success: true, viewerCount: newCount });
  } catch (err) {
    next(err);
  }
}

/** POST /api/live/:id/leave */
async function leaveStream(req, res, next) {
  try {
    const { data: stream } = await supabase.from("live_streams").select("status, viewer_count").eq("id", req.params.id).single();
    if (!stream) return res.json({ success: true });

    const newCount = Math.max(0, (stream.viewer_count || 1) - 1);
    await supabase.from("live_streams").update({ viewer_count: newCount }).eq("id", req.params.id);

    const io = getIo();
    if (io) {
      io.to(`live:${req.params.id}`).emit("live:viewer_count", { count: newCount });
      io.to("live:discover").emit("live:viewer_update", { streamId: req.params.id, count: newCount });
    }

    res.json({ success: true, viewerCount: newCount });
  } catch (err) {
    next(err);
  }
}

// ── moderation ────────────────────────────────────────────────────────────────

/** POST /api/live/:id/mute/:userId — host mutes a viewer */
async function muteViewer(req, res, next) {
  try {
    const { data: stream } = await supabase.from("live_streams").select("host_id").eq("id", req.params.id).single();
    if (!stream || (stream.host_id !== req.user.id && req.user.role !== "admin")) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await supabase.from("live_muted_viewers").upsert({ stream_id: req.params.id, user_id: req.params.userId });

    const io = getIo();
    if (io) {
      io.to(`user:${req.params.userId}`).emit("live:muted", { streamId: req.params.id });
      io.to(`live:${req.params.id}`).emit("live:viewer_muted", { userId: req.params.userId });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/live/:id/mute/:userId — host removes a viewer (kick) */
async function kickViewer(req, res, next) {
  try {
    const { data: stream } = await supabase.from("live_streams").select("host_id").eq("id", req.params.id).single();
    if (!stream || (stream.host_id !== req.user.id && req.user.role !== "admin")) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const io = getIo();
    if (io) {
      io.to(`user:${req.params.userId}`).emit("live:kicked", { streamId: req.params.id });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ── reports ───────────────────────────────────────────────────────────────────

/** POST /api/live/:id/report */
async function reportStream(req, res, next) {
  try {
    const { reason } = req.body;
    if (!String(reason || "").trim()) return res.status(400).json({ success: false, message: "reason is required" });

    const { error } = await supabase.from("live_reports").insert({
      stream_id: req.params.id,
      reporter_id: req.user.id,
      reason: String(reason).trim(),
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ── admin ─────────────────────────────────────────────────────────────────────

/** GET /api/live/admin/active — admin: list all live streams */
async function adminListStreams(req, res, next) {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin only" });
    const { data: streams, error } = await supabase
      .from("live_streams")
      .select("*, host:host_id (id, name, avatar)")
      .eq("status", "live")
      .order("started_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, streams: streams || [] });
  } catch (err) {
    next(err);
  }
}

/** GET /api/live/admin/reports — admin: list stream reports */
async function adminListReports(req, res, next) {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin only" });
    const { data, error } = await supabase
      .from("live_reports")
      .select("*, stream:stream_id (id, title, status), reporter:reporter_id (id, name)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json({ success: true, reports: data || [] });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/live/admin/:id — admin force-ends a stream */
async function adminEndStream(req, res, next) {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin only" });
    req.user.role = "admin"; // allow endStream auth check
    return endStream(req, res, next);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createStream, listStreams, getStream, endStream, saveReplay,
  getComments, addComment, deleteComment, pinComment,
  addReaction, joinStream, leaveStream,
  muteViewer, kickViewer, reportStream,
  adminListStreams, adminListReports, adminEndStream,
};
