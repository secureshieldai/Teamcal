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
  });

  return io;
}

function emitAssetChange(userId, action, asset) {
  io?.to(`user:${userId}`).emit("earn:asset", { action, asset });
}

function emitStoreCommerceChange(userId, storeId, resource, value) {
  io?.to(`user:${userId}`).emit("store:commerce", { storeId, resource, value });
}

module.exports = { initRealtime, getIo, emitAssetChange, emitStoreCommerceChange };
