const express = require("express");
const { protect } = require("../middleware/auth");
const { search, trending, getById } = require("../controllers/recipe.controller");

const router = express.Router();

router.use(protect);

router.get("/search", search);
router.get("/trending", trending);
router.get("/:id", getById);

module.exports = router;
