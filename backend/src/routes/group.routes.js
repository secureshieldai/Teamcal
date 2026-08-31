const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getMyGroups, discoverGroups, getGroupStories, getGroup, createGroup, updateGroup,
  joinGroup, leaveGroup, getGroupActivity,
  updateGroupMember, removeGroupMember,
} = require("../controllers/group.controller");

const router = express.Router();

router.use(protect);

router.get("/", getMyGroups);
router.post("/", createGroup);
router.get("/discover", discoverGroups);
router.get("/stories", getGroupStories);
router.get("/:id", getGroup);
router.patch("/:id", updateGroup);
router.post("/:id/join", joinGroup);
router.delete("/:id/join", leaveGroup);
router.get("/:id/activity", getGroupActivity);
router.patch("/:id/members/:userId", updateGroupMember);
router.delete("/:id/members/:userId", removeGroupMember);

module.exports = router;
