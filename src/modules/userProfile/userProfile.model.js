const mongoose = require('mongoose');
const userProfileSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  role: { type: String, enum: ["doctor", "student", "other"] },
  // common
  bio: { type: String, maxlength: 500 },  
  headline: { type: String, maxlength: 500 },
  profilePic: { type: String, default: " " },
  location: { type: String },
  skills: [{ type: String }],
  // Doctor
  specialization: { type: String, trim: true },
  experienceYears: { type: Number, min: 0 },

  // Student
  university: { type: String, trim: true },
  degree: { type: String, trim: true },
  yearOfStudy: { type: Number, min: 1, max: 12 },

  // Staff
  department: { type: String, trim: true },
  position: { type: String, trim: true },
},
{timeStamps: true});
userProfileSchema.pre("validate",function (next) {
  //  if (this.role === "doctor" && !this.specialization) {
  //    // return next(new Error("specialization is required for role=doctor"));
  //    return next(); // allow saving without specialization
  //  }
  if (this.role === "student" && (!this.university || !this.degree)) {
    return next(new Error("university and degree are required for role=student"));
  }
  if (this.role === "staff" && (!this.department || !this.position)) {
    return next(new Error("department and position are required for role=staff"));
  }
  next();
})
module.exports = mongoose.model("UserProfile",userProfileSchema);