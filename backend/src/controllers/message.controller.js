const { supabase } = require("../config/supabase");
const { notifySafely } = require("../services/notification.service");
const { emitToUser } = require("../realtime");
const { uploadPublicImage, uploadPublicAudio } = require("../services/storage.service");

const REQUEST_LIMIT = 3;

// Canonical ordering so a pair of users maps to exactly one conversation row.
const pair = (a, b) => (a < b ? { user_lo: a, user_hi: b } : { user_lo: b, user_hi: a });
const peerOf = (convo, me) => (convo.user_lo === me ? convo.user_hi : convo.user_lo);

function shapeMessage(row, me) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    mine: row.sender_id === me,
    type: row.type,
    text: row.body || "",
    mediaUrl: row.media_url || null,
    durationMs: row.media_duration_ms || null,
    transcript: row.transcript || null,
    call: row.type === "call" ? { mode: row.call_mode, outcome: row.call_outcome, durationS: row.call_duration_s || 0 } : null,
    read: Boolean(row.read_at),
    createdAt: row.created_at,
    ts: new Date(row.created_at).getTime(),
  };
}

async function findConversation(a, b) {
  const { user_lo, user_hi } = pair(a, b);
  const { data, error } = await supabase
    .from("dm_conversations")
    .select("*")
    .eq("user_lo", user_lo)
    .eq("user_hi", user_hi)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function getOrCreateConversation(initiatorId, otherId) {
  const existing = await findConversation(initiatorId, otherId);
  if (existing) return existing;
  const { user_lo, user_hi } = pair(initiatorId, otherId);
  const { data, error } = await supabase
    .from("dm_conversations")
    .insert({ user_lo, user_hi, initiator_id: initiatorId, status: "pending" })
    .select()
    .single();
  // A concurrent first message may have created the row between our check and insert.
  if (error) {
    if (error.code === "23505") return findConversation(initiatorId, otherId);
    throw error;
  }
  return data;
}

async function unreadCounts(conversationIds, me) {
  if (!conversationIds.length) return {};
  const { data, error } = await supabase
    .from("dm_messages")
    .select("conversation_id")
    .in("conversation_id", conversationIds)
    .neq("sender_id", me)
    .is("read_at", null);
  if (error) throw error;
  const counts = {};
  for (const row of data || []) counts[row.conversation_id] = (counts[row.conversation_id] || 0) + 1;
  return counts;
}

async function usersById(ids) {
  if (!ids.length) return {};
  const { data, error } = await supabase.from("users").select("id,name,avatar").in("id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((u) => [u.id, u]));
}

// GET /api/social/messages/conversations — accepted conversations for the inbox.
async function listConversations(req, res, next) {
  try {
    const me = req.user.id;
    const { data: rows, error } = await supabase
      .from("dm_conversations")
      .select("*")
      .or(`user_lo.eq.${me},user_hi.eq.${me}`)
      .eq("status", "accepted")
      .order("last_message_at", { ascending: false, nullsFirst: false });
    if (error) throw error;

    const peers = (rows || []).map((c) => peerOf(c, me));
    const [people, counts] = await Promise.all([usersById(peers), unreadCounts((rows || []).map((c) => c.id), me)]);

    res.json({
      success: true,
      conversations: (rows || []).map((c) => {
        const peerId = peerOf(c, me);
        return {
          id: c.id,
          user: people[peerId] || { id: peerId, name: "Unknown", avatar: null },
          summary: c.last_message_preview || "",
          lastMessageType: c.last_message_type || "text",
          unreadCount: counts[c.id] || 0,
          status: c.status,
          updatedAt: c.last_message_at || c.updated_at,
        };
      }),
    });
  } catch (e) {
    next(e);
  }
}

// GET /api/social/messages/requests — pending conversations the current user did NOT start.
async function listRequests(req, res, next) {
  try {
    const me = req.user.id;
    const { data: rows, error } = await supabase
      .from("dm_conversations")
      .select("*")
      .or(`user_lo.eq.${me},user_hi.eq.${me}`)
      .eq("status", "pending")
      .neq("initiator_id", me)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const peers = (rows || []).map((c) => peerOf(c, me));
    const people = await usersById(peers);

    res.json({
      success: true,
      requests: (rows || []).map((c) => {
        const peerId = peerOf(c, me);
        return {
          id: c.id,
          user: people[peerId] || { id: peerId, name: "Unknown", avatar: null },
          summary: c.last_message_preview || "",
          messageCount: c.request_message_count,
          messageLimit: REQUEST_LIMIT,
          createdAt: c.created_at,
        };
      }),
    });
  } catch (e) {
    next(e);
  }
}

function conversationMeta(convo, me) {
  const isInitiator = convo.initiator_id === me;
  const pending = convo.status === "pending";
  const messagesRemaining = pending && isInitiator ? Math.max(0, REQUEST_LIMIT - convo.request_message_count) : null;
  return {
    id: convo.id,
    status: convo.status,
    isInitiator,
    messageCount: convo.request_message_count,
    messageLimit: REQUEST_LIMIT,
    messagesRemaining,
    canSend: convo.status !== "blocked" && (!pending || !isInitiator || messagesRemaining > 0),
  };
}

// GET /api/social/messages/:userId — thread with one user; marks their messages read.
async function getMessages(req, res, next) {
  try {
    const me = req.user.id;
    const peerId = req.params.userId;
    const convo = await findConversation(me, peerId);
    if (!convo) return res.json({ success: true, messages: [], conversation: null });

    const { data: rows, error } = await supabase
      .from("dm_messages")
      .select("*")
      .eq("conversation_id", convo.id)
      .order("created_at", { ascending: true });
    if (error) throw error;

    const unreadFromPeer = (rows || []).filter((m) => m.sender_id !== me && !m.read_at);
    if (unreadFromPeer.length) {
      await supabase.from("dm_messages").update({ read_at: new Date().toISOString() }).in("id", unreadFromPeer.map((m) => m.id));
      emitToUser(peerId, "dm:read", { conversationId: convo.id, readerId: me });
    }

    res.json({ success: true, messages: (rows || []).map((m) => shapeMessage(m, me)), conversation: conversationMeta(convo, me) });
  } catch (e) {
    next(e);
  }
}

async function persistMessage(convo, senderId, recipientId, fields) {
  const now = new Date().toISOString();
  const { data: message, error } = await supabase
    .from("dm_messages")
    .insert({ conversation_id: convo.id, sender_id: senderId, ...fields })
    .select()
    .single();
  if (error) throw error;

  const preview =
    fields.type === "image" ? "📷 Photo" : fields.type === "voice" ? "🎤 Voice message" : fields.type === "call" ? "📞 Call" : fields.body || "";
  const patch = { last_message_at: now, last_message_preview: preview.slice(0, 140), last_message_type: fields.type || "text" };

  // First-time sender is still inside the request window: count it and auto-accept
  // once the recipient replies.
  if (convo.status === "pending") {
    if (senderId === convo.initiator_id) patch.request_message_count = convo.request_message_count + 1;
    else patch.status = "accepted";
  }
  await supabase.from("dm_conversations").update(patch).eq("id", convo.id);

  const shaped = shapeMessage(message, senderId);
  emitToUser(recipientId, "dm:message", { conversationId: convo.id, message: shapeMessage(message, recipientId) });
  emitToUser(senderId, "dm:message", { conversationId: convo.id, message: shaped });
  return shaped;
}

function guardSend(convo, me) {
  if (convo.status === "blocked") return { code: 403, message: "This conversation is blocked" };
  if (convo.status === "pending" && convo.initiator_id === me && convo.request_message_count >= REQUEST_LIMIT) {
    return { code: 409, body: { success: false, code: "REQUEST_LIMIT", message: `You can send up to ${REQUEST_LIMIT} messages until your request is accepted.` } };
  }
  return null;
}

// POST /api/social/messages/:userId — text message.
async function sendMessage(req, res, next) {
  try {
    const me = req.user.id;
    const recipientId = req.params.userId;
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ success: false, message: "Message text is required" });
    if (text.length > 4000) return res.status(400).json({ success: false, message: "Message is too long" });
    if (recipientId === me) return res.status(400).json({ success: false, message: "You cannot message yourself" });

    const { data: recipient } = await supabase.from("users").select("id").eq("id", recipientId).maybeSingle();
    if (!recipient) return res.status(404).json({ success: false, message: "User not found" });

    const convo = await getOrCreateConversation(me, recipientId);
    const blocked = guardSend(convo, me);
    if (blocked) return res.status(blocked.code).json(blocked.body || { success: false, message: blocked.message });

    const message = await persistMessage(convo, me, recipientId, { type: "text", body: text });
    notifySafely(recipientId, "message", "New message", text, { actorId: me, entityId: message.id });
    res.status(201).json({ success: true, message });
  } catch (e) {
    next(e);
  }
}

// POST /api/social/messages/:userId/media — image or voice note (multipart: field "file").
async function sendMediaMessage(req, res, next) {
  try {
    const me = req.user.id;
    const recipientId = req.params.userId;
    if (recipientId === me) return res.status(400).json({ success: false, message: "You cannot message yourself" });
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const kind = String(req.body.kind || "").toLowerCase();
    if (!["image", "voice"].includes(kind)) return res.status(400).json({ success: false, message: "kind must be 'image' or 'voice'" });

    const { data: recipient } = await supabase.from("users").select("id").eq("id", recipientId).maybeSingle();
    if (!recipient) return res.status(404).json({ success: false, message: "User not found" });

    const convo = await getOrCreateConversation(me, recipientId);
    const blocked = guardSend(convo, me);
    if (blocked) return res.status(blocked.code).json(blocked.body || { success: false, message: blocked.message });

    const url =
      kind === "image"
        ? await uploadPublicImage("dm", me, req.file)
        : await uploadPublicAudio("dm", me, req.file);
    const durationMs = Number(req.body.durationMs) || null;
    const transcript = kind === "voice" ? String(req.body.transcript || "").trim() || null : null;

    const message = await persistMessage(convo, me, recipientId, {
      type: kind,
      media_url: url,
      media_duration_ms: durationMs,
      transcript,
    });
    notifySafely(recipientId, "message", "New message", kind === "image" ? "📷 Photo" : "🎤 Voice message", { actorId: me, entityId: message.id });
    res.status(201).json({ success: true, message });
  } catch (e) {
    next(e);
  }
}

// POST /api/social/messages/transcribe — voice-to-text (multipart: field "audio").
async function transcribeAudio(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No audio uploaded" });
    let genAI, AI_ENABLED;
    try {
      ({ genAI, AI_ENABLED } = require("./coach.controller"));
    } catch (_e) {
      AI_ENABLED = false;
    }
    if (!AI_ENABLED || !genAI) return res.status(503).json({ success: false, message: "Transcription is not configured" });

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.0-flash" });
    const result = await model.generateContent([
      { inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString("base64") } },
      { text: "Transcribe this voice message verbatim in its original language. Return only the transcript text, with no preamble, quotes or commentary." },
    ]);
    const transcript = (result.response.text() || "").trim();
    res.json({ success: true, transcript });
  } catch (e) {
    next(e);
  }
}

// POST /api/social/messages/:userId/read — mark the peer's messages as read.
async function markRead(req, res, next) {
  try {
    const me = req.user.id;
    const convo = await findConversation(me, req.params.userId);
    if (!convo) return res.json({ success: true });
    await supabase
      .from("dm_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", convo.id)
      .neq("sender_id", me)
      .is("read_at", null);
    emitToUser(req.params.userId, "dm:read", { conversationId: convo.id, readerId: me });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

// POST /api/social/messages/:userId/call — record a finished/ missed call in the thread.
async function logCall(req, res, next) {
  try {
    const me = req.user.id;
    const recipientId = req.params.userId;
    const mode = req.body.mode === "video" ? "video" : "audio";
    const outcome = ["missed", "declined", "no_answer", "ended", "cancelled"].includes(req.body.outcome) ? req.body.outcome : "ended";
    const durationS = Math.max(0, Number(req.body.durationS) || 0);
    if (recipientId === me) return res.status(400).json({ success: false, message: "Invalid call" });

    const convo = await getOrCreateConversation(me, recipientId);
    if (convo.status === "blocked") return res.status(403).json({ success: false, message: "This conversation is blocked" });

    const message = await persistMessage(convo, me, recipientId, {
      type: "call",
      call_mode: mode,
      call_outcome: outcome,
      call_duration_s: durationS,
    });
    res.status(201).json({ success: true, message });
  } catch (e) {
    next(e);
  }
}

// POST /api/social/messages/requests/:userId — recipient acts on a pending request.
async function actOnRequest(req, res, next) {
  try {
    const me = req.user.id;
    const senderId = req.params.userId;
    const action = req.body.action;
    if (!["accept", "decline", "block"].includes(action)) return res.status(400).json({ success: false, message: "Invalid action" });

    const convo = await findConversation(me, senderId);
    if (!convo) return res.status(404).json({ success: false, message: "Message request not found" });

    if (action === "decline") {
      await supabase.from("dm_conversations").delete().eq("id", convo.id);
      return res.json({ success: true, status: "declined" });
    }
    const status = action === "accept" ? "accepted" : "blocked";
    const patch = { status };
    if (action === "block") patch.blocked_by = me;
    await supabase.from("dm_conversations").update(patch).eq("id", convo.id);
    if (action === "accept") {
      await supabase.from("dm_messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", convo.id).neq("sender_id", me).is("read_at", null);
      emitToUser(senderId, "dm:request_accepted", { conversationId: convo.id, byId: me });
    }
    res.json({ success: true, status });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listConversations,
  listRequests,
  getMessages,
  sendMessage,
  sendMediaMessage,
  transcribeAudio,
  markRead,
  logCall,
  actOnRequest,
};
