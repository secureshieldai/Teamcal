const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { supabase } = require("./config/supabase");

let io;

function getIo() {
  return io;
}

function initRealtime(server) {
  io = new Server(server, {
    path: "/realtime",
    cors: { origin: true, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { data: user, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", decoded.id)
        .single();
      if (error || !user) return next(new Error("Invalid user"));
      socket.userId = user.id;
      next();
    } catch (_error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // Personal room
    socket.join(`user:${socket.userId}`);

    // ── Live streaming rooms ──────────────────────────────────────
    socket.on("live:join_discover", () => {
      socket.join("live:discover");
    });

    socket.on("live:join_stream", ({ streamId }) => {
      if (streamId) socket.join(`live:${streamId}`);
    });

    socket.on("live:leave_stream", ({ streamId }) => {
      if (streamId) socket.leave(`live:${streamId}`);
    });

    // ── Direct messaging ─────────────────────────────────────────
    // Typing indicator: relayed straight to the peer's personal room.
    socket.on("dm:typing", ({ toUserId, typing }) => {
      if (!toUserId) return;
      io.to(`user:${toUserId}`).emit("dm:typing", { fromUserId: socket.userId, typing: Boolean(typing) });
    });

    // ── Call signaling (WebRTC offer/answer/ICE relay) ───────────
    // The server is a blind relay: it only stamps `fromUserId` and
    // forwards to the target user's personal room. Media negotiation
    // happens entirely between the two clients.
    const relayCall = (event) => ({ toUserId, ...rest }) => {
      if (!toUserId) return;
      io.to(`user:${toUserId}`).emit(event, { fromUserId: socket.userId, ...rest });
    };
    socket.on("call:invite", relayCall("call:invite"));
    socket.on("call:accept", relayCall("call:accept"));
    socket.on("call:decline", relayCall("call:decline"));
    socket.on("call:end", relayCall("call:end"));
    socket.on("call:sdp", relayCall("call:sdp"));
    socket.on("call:ice", relayCall("call:ice"));
  });

  return io;
}

/** Emit an event to a single user's personal room (no-op if realtime is down). */
function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}

function emitAssetChange(userId, action, asset) {
  io?.to(`user:${userId}`).emit("earn:asset", { action, asset });
}

function emitStoreCommerceChange(userId, storeId, resource, value) {
  io?.to(`user:${userId}`).emit("store:commerce", { storeId, resource, value });
}

module.exports = { initRealtime, getIo, emitToUser, emitAssetChange, emitStoreCommerceChange };
