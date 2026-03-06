import nodemailer from "nodemailer";
import logger from "./logger.js";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send an email with automatic retry (exponential backoff).
 * Falls back to logging when SMTP is not configured (development convenience).
 */
export async function sendEmail({ to, subject, html, text }, attempt = 1) {
  // Dev fallback: log email if SMTP not configured.
  // WARNING: URLs logged here contain sensitive tokens — configure SMTP before production.
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    logger.warn("[EMAIL STUB — DEV ONLY] SMTP not configured. Configure before production.");
    logger.info(`[EMAIL STUB] To: ${to} | Subject: ${subject}`);
    logger.info(`[EMAIL STUB] ${text}`);
    return { messageId: `stub-${Date.now()}` };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"ShopFlow" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      logger.error(`Failed to send email to ${to} after ${MAX_RETRIES} attempts:`, error.message);
      throw error;
    }
    const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
    logger.warn(`Email attempt ${attempt} failed. Retrying in ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return sendEmail({ to, subject, html, text }, attempt + 1);
  }
}

// ─── Email Templates (re-exported from emailTemplates.js) ───────────────────
// Centralized in emailTemplates.js for consistency. Re-exported here for
// backward-compatible imports in authController.js.
export {
  emailVerificationTemplate,
  passwordResetTemplate,
} from "./emailTemplates.js";
