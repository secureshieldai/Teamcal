const express = require("express");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { videoUpload } = require("../middleware/upload");
const {
  createPost, uploadPostImage, uploadPostVideo, myPosts, getUserPosts, getFeed, likePost, deletePost, getComments, addComment, deleteComment,
} = require("../controllers/post.controller");

const router = express.Router();

router.use(protect);

router.post("/", createPost);
router.post("/image", upload.single("image"), uploadPostImage);
router.post("/video", videoUpload.single("video"), uploadPostVideo);
router.get("/mine", myPosts);
router.get("/user/:id", getUserPosts);
router.get("/feed", getFeed);
router.post("/:id/like", likePost);
router.get("/:id/comments", getComments);
router.post("/:id/comments", addComment);
router.delete("/:id/comments/:commentId", deleteComment);
router.delete("/:id", deletePost);

module.exports = router;
