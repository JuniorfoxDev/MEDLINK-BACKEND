const express = require("express");
const router = express.Router();
const upload = require("../../../middlewares/upload.middleware");
const auth = require("../.../../../../middlewares/auth.middleware");
const {
  createPost,
  getAllPosts,
  toggleLike,
  addComment,
  getLikes,
  deletePost,
  updatePost,
  savePost
} = require("../controllers/post.controller");
// const authMiddleware = require("../.../../../../middlewares/auth.middleware");

router.post("/", auth, upload.array("media", 5), createPost);
router.get("/", auth, getAllPosts);
router.post("/:id/like", auth, toggleLike);
router.post("/:id/comment", auth, addComment);
router.get("/:id/likes", auth, getLikes);
router.delete("/:id",auth, deletePost);
router.post("/:id/save", auth, savePost);
router.put("/:id", auth, upload.array("media", 5), updatePost);


module.exports = router;
