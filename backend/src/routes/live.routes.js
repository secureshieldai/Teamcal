const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createStream, listStreams, getStream, endStream, saveReplay,
  getComments, addComment, deleteComment, pinComment,
  addReaction, joinStream, leaveStream,
  muteViewer, kickViewer, reportStream,
  adminListStreams, adminListReports, adminEndStream,
} = require("../controllers/live.controller");

const router = express.Router();
router.use(protect);

// Discovery
router.get("/", listStreams);

// Admin
router.get("/admin/active", adminListStreams);
router.get("/admin/reports", adminListReports);
router.delete("/admin/:id", adminEndStream);

// Stream lifecycle
router.post("/", createStream);
router.get("/:id", getStream);
router.patch("/:id/end", endStream);
router.patch("/:id/save-replay", saveReplay);

// Viewer presence
router.post("/:id/join", joinStream);
router.post("/:id/leave", leaveStream);

// Comments
router.get("/:id/comments", getComments);
router.post("/:id/comments", addComment);
router.delete("/:id/comments/:commentId", deleteComment);
router.patch("/:id/comments/:commentId/pin", pinComment);

// Reactions
router.post("/:id/reactions", addReaction);

// Moderation
router.post("/:id/mute/:userId", muteViewer);
router.delete("/:id/mute/:userId", kickViewer);
router.post("/:id/report", reportStream);

module.exports = router;
