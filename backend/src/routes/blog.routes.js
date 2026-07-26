const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getMySites, createSite, updateSite, deleteSite,
  getArticles, createArticle, updateArticle, deleteArticle, recordView,
} = require("../controllers/blog.controller");

const router = express.Router();

router.use(protect);

// Sites
router.get("/sites", getMySites);
router.post("/sites", createSite);
router.patch("/sites/:id", updateSite);
router.delete("/sites/:id", deleteSite);

// Articles
router.get("/sites/:blogId/articles", getArticles);
router.get("/articles", getArticles);
router.post("/articles", createArticle);
router.patch("/articles/:id", updateArticle);
router.delete("/articles/:id", deleteArticle);
router.post("/articles/:id/view", recordView);

module.exports = router;
