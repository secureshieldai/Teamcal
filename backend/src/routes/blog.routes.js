const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getMySites, createSite, updateSite, deleteSite,
  getArticles, getArticle, createArticle, updateArticle, deleteArticle, recordView, getAnalytics,
} = require("../controllers/blog.controller");

const router = express.Router();

router.use(protect);

// Sites
router.get("/sites", getMySites);
router.post("/sites", createSite);
router.patch("/sites/:id", updateSite);
router.delete("/sites/:id", deleteSite);
router.get("/sites/:id/analytics", getAnalytics);

// Articles
router.get("/sites/:blogId/articles", getArticles);
router.get("/articles", getArticles);
router.get("/articles/:id", getArticle);
router.post("/articles", createArticle);
router.patch("/articles/:id", updateArticle);
router.delete("/articles/:id", deleteArticle);
router.post("/articles/:id/view", recordView);

module.exports = router;
