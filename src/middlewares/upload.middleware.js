const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// ✅ Configure Cloudinary storage dynamically
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Dynamically set folder based on fieldname
    let folder = "medilink_uploads";
    if (file.fieldname === "resume") folder = "medilink_resumes";
    else if (file.fieldname === "profilePic") folder = "medilink_profile_pics";
    else if (file.fieldname === "media") folder = "medilink_posts";

    // Extract file name safely
    const baseName =
      file.originalname?.split(".")[0]?.replace(/[^a-zA-Z0-9-_]/g, "") ||
      "file";

    // Extract extension from MIME type
    const extension =
      file.mimetype && file.mimetype.includes("/")
        ? file.mimetype.split("/")[1]
        : "jpg";

    return {
      folder,
      resource_type: "auto", // auto-detect (image, video, pdf, doc)
      public_id: `${Date.now()}-${baseName}`,
      format: extension,
    };
  },
});

// ✅ File type whitelist
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "video/mp4",
  "video/mpeg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

// ✅ File filter (validate mimetype)
const fileFilter = (req, file, cb) => {
  if (allowedTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `❌ Unsupported file type: ${file.mimetype}. Allowed: images, videos, PDFs, and DOC files.`
      )
    );
  }
};

// ✅ Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB max
    files: 5,
  },
});

// ✅ Graceful error handling middleware
const handleUploadError = (err, req, res, next) => {
  console.error("❌ Upload Error:", err.message);
  return res
    .status(400)
    .json({ success: false, message: `Upload failed: ${err.message}` });
};

module.exports = upload;
module.exports.handleUploadError = handleUploadError;
