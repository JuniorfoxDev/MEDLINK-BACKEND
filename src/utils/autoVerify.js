// src/utils/autoVerify.js
const User = require("../modules/auth/models/user.model");
const nodemailer = require("nodemailer");

async function patternCheck(user) {
  const id = user.registrationNumber || user.instituteIdNumber;
  if (!id) return { ok: false, reason: "No ID provided" };
  const regexes = [
    /^[A-Z]{2,4}-?\d{3,6}$/, // e.g. DOC-12345
    /^[0-9]{6,12}$/, // pure digits (college/staff ids)
  ];
  const ok = regexes.some((r) => r.test(id));
  return { ok, reason: ok ? "Valid ID pattern" : "Invalid ID pattern" };
}

async function fileCheck(user) {
  if (!user.uploadId) return { ok: false, reason: "Missing ID upload" };
  const ok = /\.(jpg|jpeg|png|pdf)$/i.test(user.uploadId);
  return { ok, reason: ok ? "File type valid" : "Invalid file type" };
}

async function emailHeuristic(user) {
  const email = user.email || "";
  if (/@(edu|ac)\./i.test(email))
    return { ok: true, reason: "Educational domain" };
  if (/@(hospital|clinic|health|med)/i.test(email))
    return { ok: true, reason: "Medical domain" };
  return { ok: false, reason: "Generic email domain" };
}

async function sendResultMail(user, status, reasons) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: user.email,
    subject: `MediLink Account Verification: ${status.toUpperCase()}`,
    html: `
      <h3>Hello ${user.name},</h3>
      <p>Your account verification status: <b>${status.toUpperCase()}</b>.</p>
      <p>Checks:</p>
      <ul>${reasons.map((r) => `<li>${r}</li>`).join("")}</ul>
      <p>Regards,<br/>MediLink Verification System</p>
    `,
  });
}

module.exports = async function autoVerify(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const checks = await Promise.all([
    patternCheck(user),
    fileCheck(user),
    emailHeuristic(user),
  ]);

  const passed = checks.filter((c) => c.ok).length;
  let status = "pending";
  if (passed >= 2) status = "verified";
  else if (passed === 0) status = "rejected";

  user.verificationStatus = status;
  user.isVerified = status === "verified";
  user.verificationHistory = user.verificationHistory || [];
  user.verificationHistory.push({
    at: new Date(),
    result: status,
    reason: checks.map((c) => `${c.ok ? "✅" : "❌"} ${c.reason}`).join(" | "),
  });

  await user.save();

  // send mail async
  setImmediate(() =>
    sendResultMail(
      user,
      status,
      checks.map((c) => c.reason)
    )
  );

  return status;
};
