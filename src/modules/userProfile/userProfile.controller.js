const UserProfile = require("../userProfile/userProfile.model");

// GET /api/profile/:userId
exports.getByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await UserProfile.findOne({ user: userId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    return res.json(profile);
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Error fetching profile" });
  }
};

// PATCH /api/profile  (update own profile) - protected
exports.updateMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    const update = req.body;

    const profile = await UserProfile.findOneAndUpdate(
      { user: userId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!profile) return res.status(404).json({ message: "Profile not found" });
    return res.json({ message: "Profile updated", profile });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Error updating profile" });
  }
};
