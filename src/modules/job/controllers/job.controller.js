// src/modules/job/controllers/job.controller.js

const Job = require("../models/job.model");
const Application = require("../models/application.model");
const User = require("../../auth/models/user.model");
const nodemailer = require("nodemailer");

// ✉️ Setup Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 🧩 Email notification helper
const sendApplicationEmail = async ({ to, job, applicant, resumeUrl }) => {
  const html = `
    <div style="font-family:sans-serif;line-height:1.6;color:#333">
      <h3>Hello Dr. ${to.name || "Doctor"},</h3>
      <p><b>${applicant.name}</b> (${
    applicant.email
  }) has applied for your job: <b>${job.title}</b></p>
      <p>Applicant Role: ${applicant.role || "N/A"}</p>
      ${
        resumeUrl
          ? `<p>📎 <a href="${resumeUrl}" target="_blank">View Resume</a></p>`
          : ""
      }
      <p>Login to MediLink Dashboard to review all applicants.</p>
      <hr />
      <p>Best Regards,<br />MediLink Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: to.email,
    subject: `New Application for ${job.title}`,
    html,
  });
};

// =========================
// 🩺 Create Job (Doctor only)
// =========================
exports.createJob = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can post jobs" });
    }

    const { title, hospital, location, type, description, tags } = req.body;
    if (!title || !hospital)
      return res
        .status(400)
        .json({ message: "Title and hospital are required" });

    const job = await Job.create({
      title,
      hospital,
      location,
      type,
      description,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      postedBy: req.user.id,
    });

    res.status(201).json({ success: true, job });
  } catch (err) {
    console.error("❌ Job creation failed:", err);
    next(err);
  }
};

// =========================
// 🌍 Get all jobs
// =========================
exports.listJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find()
      .populate("postedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, jobs });
  } catch (err) {
    next(err);
  }
};

// =========================
// 📄 Get single job
// =========================
exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "postedBy",
      "name email role"
    );
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json({ success: true, job });
  } catch (err) {
    next(err);
  }
};

// =========================
// 🧾 Apply for a job (with resume + email)
// =========================
exports.applyJob = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Login required" });

    const job = await Job.findById(req.params.id).populate("postedBy");
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Prevent duplicate application
    const alreadyApplied = await Application.findOne({
      job: job._id,
      applicant: req.user.id,
    });
    if (alreadyApplied)
      return res.status(400).json({ message: "Already applied to this job" });

    // Cloudinary resume path
    const resumeUrl = req.file ? req.file.path : null;
    const { coverLetter } = req.body;

    // Save application
    const application = await Application.create({
      job: job._id,
      applicant: req.user.id,
      coverLetter,
      resume: resumeUrl,
      status: "applied",
    });

    // Notify doctor
    const applicant = await User.findById(req.user.id).select(
      "name email role"
    );
    const doctor = await User.findById(job.postedBy._id).select("name email");

    sendApplicationEmail({
      to: doctor,
      job,
      applicant,
      resumeUrl,
    }).catch((err) => console.error("📧 Email failed:", err.message));

    // Emit socket update (optional)
    const io = req.app.get("io");
    if (io)
      io.emit("newApplicant", { jobId: job._id, applicant: applicant.name });

    res.status(201).json({
      success: true,
      message: "Applied successfully!",
      application,
    });
  } catch (err) {
    console.error("❌ Apply job failed:", err);
    next(err);
  }
};

// =========================
// ⭐ Save / Unsave Job
// =========================
exports.saveJob = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const jobId = req.params.id;
    const index = user.savedJobs.findIndex((id) => id.toString() === jobId);

    if (index > -1) {
      user.savedJobs.splice(index, 1);
      await user.save();
      return res.json({ success: true, saved: false });
    } else {
      user.savedJobs.push(jobId);
      await user.save();
      return res.json({ success: true, saved: true });
    }
  } catch (err) {
    next(err);
  }
};

// =========================
// 💼 Get Saved Jobs
// =========================
exports.getSavedJobs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("savedJobs");
    res.json({ success: true, savedJobs: user.savedJobs || [] });
  } catch (err) {
    next(err);
  }
};

// =========================
// 🧠 Doctor Dashboard: My Jobs
// =========================
exports.getMyJobs = async (req, res, next) => {
  try {
    if (req.user.role !== "doctor")
      return res.status(403).json({ message: "Access restricted to doctors" });

    const jobs = await Job.find({ postedBy: req.user.id })
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, jobs });
  } catch (err) {
    next(err);
  }
};

// =========================
// 🧑‍⚕️ Doctor’s Job Applicants (Fixed)
// =========================
exports.getMyApplicants = async (req, res, next) => {
  try {
    if (req.user.role !== "doctor") {
      return res
        .status(403)
        .json({ message: "Only doctors can view applicants" });
    }

    // 1️⃣ Find all jobs posted by this doctor
    const jobs = await Job.find({ postedBy: req.user.id }).select(
      "_id title hospital location"
    );
    if (!jobs.length) return res.json({ success: true, jobs: [] });

    const jobIds = jobs.map((j) => j._id);

    // 2️⃣ Find applications linked to these jobs
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate("applicant", "name email role profilePic")
      .populate("job", "title hospital location")
      .sort({ createdAt: -1 });

    // 3️⃣ Group by job
    const jobMap = {};
    jobs.forEach((job) => {
      jobMap[job._id] = {
        _id: job._id,
        title: job.title,
        hospital: job.hospital,
        location: job.location,
        applicants: [],
      };
    });

    applications.forEach((app) => {
      const jId = app.job._id.toString();
      if (jobMap[jId]) {
        jobMap[jId].applicants.push({
          _id: app._id,
          name: app.applicant?.name,
          email: app.applicant?.email,
          role: app.applicant?.role,
          profilePic: app.applicant?.profilePic,
          resume: app.resume,
          appliedAt: app.createdAt,
          status: app.status,
        });
      }
    });

    // 4️⃣ Format response
    const result = Object.values(jobMap).map((job) => ({
      ...job,
      totalApplicants: job.applicants.length,
    }));

    res.json({ success: true, jobs: result });
  } catch (err) {
    console.error("❌ getMyApplicants failed:", err);
    next(err);
  }
};

// =========================
// 🏷️ Update Applicant Status (Doctor Only)
// =========================
exports.updateApplicantStatus = async (req, res, next) => {
  try {
    const { id } = req.params; // application ID
    const { status } = req.body;

    if (!["applied", "shortlisted", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const application = await Application.findById(id)
      .populate({
        path: "job",
        select: "postedBy title",
        populate: { path: "postedBy", select: "name email role" },
      })
      .populate("applicant", "name email");

    if (!application)
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });

    if (application.job.postedBy._id.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    application.status = status;
    await application.save();

    const io = req.app.get("io");
    if (io)
      io.emit("statusUpdated", {
        jobId: application.job._id,
        applicant: application.applicant,
        status,
      });

    res.json({
      success: true,
      message: "Status updated successfully",
      application,
    });
  } catch (err) {
    console.error("❌ updateApplicantStatus failed:", err);
    next(err);
  }
};
