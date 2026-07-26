const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getMyGroups, getGroup, createGroup, updateGroup,
  joinGroup, leaveGroup, getGroupActivity,
} = require("../controllers/group.controller");

const router = express.Router();

router.use(protect);

router.get("/", getMyGroups);
router.post("/", createGroup);
router.get("/:id", getGroup);
router.patch("/:id", updateGroup);
router.post("/:id/join", joinGroup);
router.delete("/:id/join", leaveGroup);
router.get("/:id/activity", getGroupActivity);

module.exports = router;
