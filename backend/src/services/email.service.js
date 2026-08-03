const nodemailer = require("nodemailer");
const logger = require("../config/logger");

let transporter;

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    const error = new Error("SMTP email delivery is not configured");
    error.statusCode = 503;
    throw error;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

async function sendVerificationEmail(to, code) {
  const from = process.env.EMAIL_FROM || `TeamCal <${process.env.SMTP_USER}>`;
  try {
    await getTransporter().sendMail({
      from,
      to,
      subject: "Your TeamCal verification code",
      text: `Your TeamCal verification code is ${code}. It expires in 10 minutes.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2>Verify your email</h2><p>Use this code to finish creating your TeamCal account:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. If you did not sign up for TeamCal, you can ignore this email.</p></div>`,
    });
  } catch (cause) {
    if (cause.statusCode === 503) throw cause;
    logger.error("SMTP email delivery failed", { code: cause.code, command: cause.command, responseCode: cause.responseCode });
    const error = new Error("Could not send the verification email. Please try again.");
    error.statusCode = 502;
    throw error;
  }
}

async function sendPasswordResetEmail(to, code) {
  const from = process.env.EMAIL_FROM || `TeamCal <${process.env.SMTP_USER}>`;
  await getTransporter().sendMail({ from, to, subject: "Reset your TeamCal password", text: `Your TeamCal password reset code is ${code}. It expires in 10 minutes.`, html: `<div style="font-family:Arial,sans-serif"><h2>Reset your password</h2><p>Use this code to continue:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes.</p></div>` });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
