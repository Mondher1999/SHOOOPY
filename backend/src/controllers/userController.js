import path from "path";
import fs from "fs";
import User from "../models/userModel.js";
import logger from "../utils/logger.js";
import { escapeRegex } from "../utils/sanitize.js";
import { AVATARS_DIR } from "../config/multer.js";

const VALID_OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const VALID_ROLES = ["customer", "admin"];
const VALID_LANGUAGES = ["en"];

// ─── Self: Get my profile ────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    // Re-fetch via Mongoose (not lean) so toJSON strips sensitive fields
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error("getProfile error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Self: Update profile ────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const updates = {};

    if (req.body.name?.trim()) updates.name = req.body.name.trim();
    if (req.body.email?.trim()) updates.email = req.body.email.trim().toLowerCase();
    if (req.body.language && VALID_LANGUAGES.includes(req.body.language)) {
      updates.language = req.body.language;
    }

    // Avatar upload handling
    if (req.file) {
      updates.avatar = `/uploads/avatars/${req.file.filename}`;

      // Delete previous avatar file to avoid orphaned files
      const current = await User.findById(req.user._id).select("avatar").lean();
      if (current?.avatar) {
        try {
          const filename = path.basename(current.avatar);
          const oldPath = path.join(AVATARS_DIR, filename);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (unlinkErr) {
          logger.warn("Could not delete old avatar:", unlinkErr.message);
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: "No fields to update" });
    }

    // Reject if email is already taken by another account
    if (updates.email && updates.email !== req.user.email) {
      const conflict = await User.findOne({ email: updates.email, _id: { $ne: req.user._id } }).lean();
      if (conflict) return res.status(409).json({ success: false, error: "Email already in use" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error("updateProfile error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Self: Change password ───────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword)
      return res.status(400).json({ success: false, error: "Missing required field: currentPassword" });
    if (!newPassword)
      return res.status(400).json({ success: false, error: "Missing required field: newPassword" });
    if (newPassword.length < 8)
      return res.status(400).json({ success: false, error: "New password must be at least 8 characters" });
    if (currentPassword === newPassword)
      return res.status(400).json({ success: false, error: "New password must differ from current password" });

    // Select password explicitly — field has select: false
    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const valid = await user.comparePassword(currentPassword);
    if (!valid)
      return res.status(400).json({ success: false, error: "Current password is incorrect" });

    // Assignment triggers bcrypt hash in the pre-save hook
    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, data: { message: "Password changed successfully" } });
  } catch (error) {
    logger.error("changePassword error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Self: Delete account (soft-delete) ─────────────────────────────────────
export const deleteAccount = async (req, res) => {
  try {
    // Soft-delete: deactivate + invalidate session
    await User.findByIdAndUpdate(req.user._id, {
      isActive: false,
      refreshToken: null,
    });
    res.status(200).json({ success: true, data: { message: "Account deleted successfully" } });
  } catch (error) {
    logger.error("deleteAccount error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Admin: List all users (paginated + searchable) ──────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search?.trim();

    const query = {};
    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    logger.error("getAllUsers error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Admin: Get single user by ID ────────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!VALID_OBJECT_ID.test(id))
      return res.status(400).json({ success: false, error: "Invalid user ID" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error("getUserById error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Admin: Update user role ─────────────────────────────────────────────────
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!VALID_OBJECT_ID.test(id))
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    if (!role || !VALID_ROLES.includes(role))
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
      });

    const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error("updateUserRole error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Admin: Ban/unban user ───────────────────────────────────────────────────
export const banUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!VALID_OBJECT_ID.test(id))
      return res.status(400).json({ success: false, error: "Invalid user ID" });

    // Prevent admins from banning themselves
    if (id === req.user._id.toString())
      return res.status(400).json({ success: false, error: "Cannot ban your own account" });

    const target = await User.findById(id).lean();
    if (!target) return res.status(404).json({ success: false, error: "User not found" });

    const willBan = target.isActive;
    const updateFields = { isActive: !willBan };

    // When banning: invalidate session by clearing refresh token
    if (willBan) updateFields.refreshToken = null;

    const user = await User.findByIdAndUpdate(id, updateFields, { new: true });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error("banUser error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
