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

// ─── Email Templates ────────────────────────────────────────────────────────

export function emailVerificationTemplate(name, verificationUrl) {
  return {
    subject: "Verify your ShopFlow email address",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e293b;">Welcome to ShopFlow, ${name}!</h2>
        <p style="color: #475569;">Please verify your email address to complete registration.</p>
        <a href="${verificationUrl}"
           style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white;
                  text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: 600;">
          Verify Email Address
        </a>
        <p style="color: #94a3b8; font-size: 14px;">
          This link expires in 24 hours. If you didn't create a ShopFlow account, you can ignore this email.
        </p>
        <p style="color: #94a3b8; font-size: 12px;">Or copy this URL: ${verificationUrl}</p>
      </div>
    `,
    text: `Welcome to ShopFlow, ${name}!\n\nVerify your email: ${verificationUrl}\n\nLink expires in 24 hours.`,
  };
}

export function passwordResetTemplate(name, resetUrl) {
  return {
    subject: "Reset your ShopFlow password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e293b;">Password Reset Request</h2>
        <p style="color: #475569;">Hi ${name}, we received a request to reset your ShopFlow password.</p>
        <a href="${resetUrl}"
           style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white;
                  text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: 600;">
          Reset Password
        </a>
        <p style="color: #94a3b8; font-size: 14px;">
          This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
        </p>
        <p style="color: #94a3b8; font-size: 12px;">Or copy this URL: ${resetUrl}</p>
      </div>
    `,
    text: `Hi ${name},\n\nReset your ShopFlow password: ${resetUrl}\n\nLink expires in 15 minutes.`,
  };
}
