// src/modules/job/routes/job.routes.js
const express = require("express");
const router = express.Router();
const jobCtrl = require("../controllers/job.controller");
const auth = require("../../../middlewares/auth.middleware");
const upload = require("../../../middlewares/upload.middleware");

// 🩺 Doctor-only job creation
router.post("/create", auth, jobCtrl.createJob);

// 🧠 Doctor Dashboard
router.get("/my", auth, jobCtrl.getMyJobs);
router.get("/my-applicants", auth, jobCtrl.getMyApplicants);

// 💾 Saved + Apply Routes
router.get("/saved/all", auth, jobCtrl.getSavedJobs);
router.post("/:id/save", auth, jobCtrl.saveJob);

// 📨 Apply (with resume upload to Cloudinary)
router.post("/:id/apply", auth, upload.single("resume"), jobCtrl.applyJob);

// 🏷️ Update application status (doctor only)
router.patch("/update-status/:id", auth, jobCtrl.updateApplicantStatus);

// 🌍 Public routes
router.get("/", jobCtrl.listJobs);
router.get("/:id", jobCtrl.getJob);

module.exports = router;
