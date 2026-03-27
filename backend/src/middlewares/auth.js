import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/userModel.js";
import logger from "../utils/logger.js";
import cache from "../utils/cache.js";

/**
 * protect — Verify JWT access token, attach req.user.
 * Import ONLY from this file — do not create alternate auth middleware.
 * Uses 30s in-memory cache to avoid DB hit on every request.
 * Invalidate via cache.del(`auth:user:${userId}`) on password change, deactivation, role change.
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const userCacheKey = `auth:user:${decoded.id}`;
    let user = cache.get(userCacheKey);
    if (!user) {
      user = await User.findById(decoded.id).lean();
      if (user) cache.set(userCacheKey, user, 30);
    }
    if (!user) return res.status(401).json({ success: false, error: "User no longer exists" });
    if (!user.isActive) return res.status(401).json({ success: false, error: "Account deactivated" });

    // Reject tokens issued before the last password change
    if (user.passwordChangedAt) {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAt) {
        return res.status(401).json({ success: false, error: "Session expired. Please log in again." });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn("protect middleware:", error.message);
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

/**
 * restrictTo — Role-based access gate.
 * Usage: router.delete("/:id", protect, restrictTo("admin"), handler)
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }
    next();
  };
};
