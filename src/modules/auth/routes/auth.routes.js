const express = require("express");
const router = express.Router();
const upload = require("../../../middlewares/upload.middleware");
const authController = require("../controllers/auth.controller");
const authMW = require("../../../middlewares/auth.middleware");
const {updateProfile }= require("../controllers/auth.controller");
const userModel = require("../models/user.model");
// Register
router.post(
  "/register",
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "uploadId", maxCount: 1 },
  ]),
  authController.register
);

router.get("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/firebase-login", authController.firebaseLogin);
router.get("/me", authMW, authController.me);
router.post(
  "/update-profile",
  authMW,
  upload.handleUploadError,
  upload.single("profilePic"),
  authController.updateProfile
);
router.get("/all-users", authMW, async (req, res) => {
  try {
    // exclude current user from results
    const users = await userModel.find({ _id: { $ne: req.user.id } }).select(
      "name role profilePic email _id location specialization degree"
    );
    res.json({ success: true, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.delete("/delete-except", authController.deleteAllExcept); // temporary route


module.exports = router;
