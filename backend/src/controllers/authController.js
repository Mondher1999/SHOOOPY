import { randomBytes, createHash } from "crypto";
import User from "../models/userModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import {
  sendEmail,
  emailVerificationTemplate,
  passwordResetTemplate,
} from "../utils/sendEmail.js";
import logger from "../utils/logger.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Issue tokens and persist hashed refresh token
async function issueTokens(userId) {
  const accessToken = generateAccessToken(userId);
  const rawRefreshToken = generateRefreshToken(userId);
  await User.findByIdAndUpdate(userId, { refreshToken: hashToken(rawRefreshToken) });
  return { accessToken, refreshToken: rawRefreshToken };
}

// ─── Controllers ────────────────────────────────────────────────────────────

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name) return res.status(400).json({ success: false, error: "Missing required field: name" });
    if (!email) return res.status(400).json({ success: false, error: "Missing required field: email" });
    if (!EMAIL_REGEX.test(email)) return res.status(400).json({ success: false, error: "Invalid email address" });
    if (!password) return res.status(400).json({ success: false, error: "Missing required field: password" });
    if (password.length < 8) return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });

    const existing = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (existing) return res.status(409).json({ success: false, error: "Email already registered" });

    // Generate email verification token
    const rawVerificationToken = randomBytes(32).toString("hex");
    const verificationTokenHash = hashToken(rawVerificationToken);
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await User.create({
      name: name.trim(),
      email,
      password,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpiresAt: verificationExpiry,
    });

    const { accessToken, refreshToken } = await issueTokens(user._id);

    // Send verification email (non-blocking — don't fail registration on email error)
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email/${rawVerificationToken}`;
    const emailTemplate = emailVerificationTemplate(user.name, verificationUrl);
    sendEmail({ to: user.email, ...emailTemplate }).catch((err) => {
      logger.warn("Verification email failed:", err.message);
    });

    res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
  } catch (error) {
    logger.error("register error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ success: false, error: "Missing required field: email" });
    if (!password) return res.status(400).json({ success: false, error: "Missing required field: password" });

    // Select password explicitly (field has select: false)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) return res.status(401).json({ success: false, error: "Invalid email or password" });
    if (!user.isActive) return res.status(401).json({ success: false, error: "Account deactivated" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, error: "Invalid email or password" });

    const { accessToken, refreshToken } = await issueTokens(user._id);

    // Strip password from response
    const userObj = user.toJSON();

    res.status(200).json({ success: true, data: { user: userObj, accessToken, refreshToken } });
  } catch (error) {
    logger.error("login error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// POST /api/auth/logout  (requires protect middleware)
export const logout = async (req, res) => {
  try {
    // Clear the stored refresh token hash — invalidates future refresh attempts
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.status(200).json({ success: true, data: null });
  } catch (error) {
    logger.error("logout error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// GET /api/auth/verify-email/:token
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ success: false, error: "Verification token is required" });

    const tokenHash = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid or expired verification link" });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, data: { message: "Email verified successfully" } });
  } catch (error) {
    logger.error("verifyEmail error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Missing required field: email" });
    if (!EMAIL_REGEX.test(email)) return res.status(400).json({ success: false, error: "Invalid email address" });

    // Always return success — don't reveal if email exists (prevents user enumeration)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (!user) {
      return res.status(200).json({ success: true, data: { message: "If that email exists, a reset link has been sent" } });
    }

    const rawResetToken = randomBytes(32).toString("hex");
    const resetTokenHash = hashToken(rawResetToken);
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await User.findByIdAndUpdate(user._id, {
      passwordResetTokenHash: resetTokenHash,
      passwordResetExpiresAt: resetExpiry,
    });

    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${rawResetToken}`;
    const emailTemplate = passwordResetTemplate(user.name, resetUrl);

    try {
      await sendEmail({ to: user.email, ...emailTemplate });
    } catch (emailError) {
      // Roll back the reset token if email fails — don't leave a dead token in DB
      await User.findByIdAndUpdate(user._id, {
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      });
      logger.error("Password reset email failed:", emailError.message);
      return res.status(500).json({ success: false, error: "Failed to send reset email. Please try again." });
    }

    res.status(200).json({ success: true, data: { message: "If that email exists, a reset link has been sent" } });
  } catch (error) {
    logger.error("forgotPassword error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) return res.status(400).json({ success: false, error: "Reset token is required" });
    if (!password) return res.status(400).json({ success: false, error: "Missing required field: password" });
    if (password.length < 8) return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });

    const tokenHash = hashToken(token);

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid or expired reset link" });
    }

    // Update password — pre-save hook will hash it and set passwordChangedAt
    user.password = password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.refreshToken = undefined; // Invalidate all existing sessions
    await user.save();

    res.status(200).json({ success: true, data: { message: "Password reset successfully. Please log in." } });
  } catch (error) {
    logger.error("resetPassword error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// POST /api/auth/refresh-token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: rawToken } = req.body;
    if (!rawToken) return res.status(400).json({ success: false, error: "Refresh token is required" });

    // Verify JWT signature first
    let decoded;
    try {
      decoded = verifyRefreshToken(rawToken);
    } catch {
      return res.status(401).json({ success: false, error: "Invalid refresh token" });
    }

    // Check the hashed token matches what's in the DB (rotation validation)
    const tokenHash = hashToken(rawToken);
    const user = await User.findOne({ _id: decoded.id, refreshToken: tokenHash }).lean();
    if (!user) return res.status(401).json({ success: false, error: "Refresh token reuse or revocation detected" });
    if (!user.isActive) return res.status(401).json({ success: false, error: "Account deactivated" });

    // Rotate both tokens
    const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user._id);

    res.status(200).json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (error) {
    logger.error("refreshToken error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// GET /api/auth/me  (requires protect middleware)
export const getMe = async (req, res) => {
  try {
    // Use document (not lean) so toJSON transform applies — exposes id, hides _id/__v
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error("getMe error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
