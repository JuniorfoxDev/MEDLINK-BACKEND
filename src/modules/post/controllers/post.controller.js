const Post = require("../models/post.model");
const User = require("../../auth/models/user.model");
const { sendPushToTokens } = require("../../../utils/notifications");

exports.createPost = async (req, res) => {
  try {
    const { text } = req.body;
    const uploadedMedia = (req.files || []).map((file) => ({
      url: file.path,
      type: file.mimetype.startsWith("video") ? "video" : "image",
    }));

    if (!text && uploadedMedia.length === 0)
      return res.status(400).json({ success: false, message: "Empty post" });

    const newPost = await Post.create({
      author: req.user.id,
      text,
      media: uploadedMedia,
    });

    const populated = await newPost.populate("author", "name email role");

    const io = req.app.get("io");
    io.emit("newPost", populated);

    res.status(201).json({ success: true, post: populated });
  } catch (err) {
    console.error("❌ Create Post Error:", err.message);
    res.status(500).json({ success: false });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name role email")
      .populate("comments.user", "name role")
      .populate("likes", "name role")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name role")
      .populate("likes", "name email role");

    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const userId = req.user.id;
    const alreadyLiked = post.likes.some((u) => u._id.equals(userId));

    if (alreadyLiked)
      post.likes = post.likes.filter((u) => !u._id.equals(userId));
    else post.likes.push(userId);

    await post.save();

    const populated = await Post.findById(post._id)
      .populate("author", "name role")
      .populate("likes", "name role")
      .populate("comments.user", "name role");

    const io = req.app.get("io");
    io.emit("postLiked", {
      postId: populated._id,
      likes: populated.likes.map((u) => ({
        _id: u._id,
        name: u.name,
        role: u.role,
      })),
      likeCount: populated.likes.length,
      likedBy: req.user.id,
    });

    const authorUser = await User.findById(post.author._id);
    if (authorUser?.deviceTokens?.length) {
      sendPushToTokens(authorUser.deviceTokens, {
        title: `${req.user.name} liked your post`,
        body: post.text?.slice(0, 80) || "Someone liked your post",
      });
    }

    res
      .status(200)
      .json({ success: true, liked: !alreadyLiked, post: populated });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ success: false, message: "Empty comment" });

    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    post.comments.push({ user: req.user.id, text });
    await post.save();

    const populated = await Post.findById(post._id)
      .populate("author", "name role")
      .populate("comments.user", "name role")
      .populate("likes", "name role");

    const io = req.app.get("io");
    io.emit("newComment", {
      postId: populated._id,
      comments: populated.comments,
    });

    const authorUser = await User.findById(post.author._id);
    if (authorUser?.deviceTokens?.length) {
      sendPushToTokens(authorUser.deviceTokens, {
        title: `${req.user.name} commented on your post`,
        body: text.slice(0, 80),
      });
    }

    res.status(200).json({ success: true, post: populated });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

exports.getLikes = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "likes",
      "name role"
    );
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    res.status(200).json({ success: true, likes: post.likes });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
exports.deletePost = async (req, res) => {
  try {
    console.log("🗑️ Delete Post Request:", req.params.id);
    console.log("👤 Authenticated user:", req.user);

    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    // ✅ Use req.user.id (not _id)
    if (post.author.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await Post.findByIdAndDelete(req.params.id);

    const io = req.app.get("io");
    io.emit("postDeleted", { postId: req.params.id });

    console.log("✅ Post deleted successfully:", req.params.id);
    res.json({ success: true, message: "Post deleted", postId: req.params.id });
  } catch (err) {
    console.error("❌ Delete post error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};


exports.savePost = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "savedPosts",
      "text media author"
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const postId = req.params.id;
    const alreadySaved = user.savedPosts.some(
      (p) => p._id.toString() === postId
    );

    let saved = false;
    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter(
        (p) => p._id.toString() !== postId
      );
    } else {
      user.savedPosts.push(postId);
      saved = true;
    }

    await user.save();

    const io = req.app.get("io");
    io.emit("postSaved", { userId: req.user.id, postId, saved }); // 🔥 notify all clients

    res.json({
      success: true,
      saved,
      message: saved ? "🔖 Post saved!" : "❌ Removed from saved",
    });
  } catch (err) {
    console.error("❌ Error saving post:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (req.body.text) post.text = req.body.text;

    // Handle media
    if (req.files && req.files.length > 0) {
      const newMedia = req.files.map((f) => ({
        url: `/uploads/${f.filename}`,
        type: f.mimetype.includes("video") ? "video" : "image",
      }));
      post.media = [...post.media, ...newMedia];
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("author", "name role")
      .populate("likes", "name role")
      .populate("comments.user", "name role");

    const io = req.app.get("io"); // ✅ ensure socket available
    io.emit("postUpdated", updatedPost); // 🔥 broadcast update instantly

    res.json({ success: true, post: updatedPost });
  } catch (err) {
    console.error("❌ Update Post Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
