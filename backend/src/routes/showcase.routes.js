const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getUserShowcase,
  getCurrentUserShowcase,
  createSection,
  updateSection,
  deleteSection,
  addItem,
  updateItem,
  deleteItem,
  reorderItems,
} = require("../controllers/showcase.controller");

const router = express.Router();

// Public route: get any user's published showcase
router.get("/:userId", getUserShowcase);

// Protected routes (auth required)
router.use(protect);

// Get current user's showcase (all sections, published and unpublished)
router.get("/", getCurrentUserShowcase);
router.post("/sections", createSection);
router.put("/sections/:id", updateSection);
router.delete("/sections/:id", deleteSection);
router.post("/items", addItem);
router.put("/items/:id", updateItem);
router.delete("/items/:id", deleteItem);
router.put("/reorder", reorderItems);

module.exports = router;
