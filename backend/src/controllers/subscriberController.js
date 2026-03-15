import Subscriber from "../models/subscriberModel.js";
import logger from "../utils/logger.js";
import cache from "../utils/cache.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ─── POST /api/subscribers (public) ─────────────────────────────────────────
export const subscribe = async (req, res) => {
  try {
    const { email, source } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ success: false, error: "Missing required field: email" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ success: false, error: "Invalid email address" });
    }

    // Validate source if provided
    const validSources = ["homepage", "checkout", "footer"];
    if (source && !validSources.includes(source)) {
      return res.status(400).json({ success: false, error: "Source must be one of: homepage, checkout, footer" });
    }

    // Check for existing subscriber
    const existing = await Subscriber.findOne({ email: normalizedEmail });

    if (existing) {
      // Reactivate if previously unsubscribed
      if (!existing.isActive) {
        existing.isActive = true;
        existing.subscribedAt = new Date();
        if (source) existing.source = source;
        await existing.save();

        cache.delByPrefix("subscribers:list");

        return res.status(200).json({
          success: true,
          data: { email: existing.email, subscribedAt: existing.subscribedAt },
        });
      }

      return res.status(409).json({ success: false, error: "Email is already subscribed" });
    }

    // Create new subscriber
    const subscriber = await Subscriber.create({
      email: normalizedEmail,
      source: source || "homepage",
    });

    cache.delByPrefix("subscribers:list");

    res.status(201).json({
      success: true,
      data: { email: subscriber.email, subscribedAt: subscriber.subscribedAt },
    });
  } catch (error) {
    // Handle duplicate key race condition
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: "Email is already subscribed" });
    }
    logger.error("subscribe error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/subscribers (admin) ───────────────────────────────────────────
export const listSubscribers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // Check cache
    const cacheKey = `subscribers:list:${page}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, data: cached });
    }

    const filter = { isActive: true };

    const [subscribers, total] = await Promise.all([
      Subscriber.find(filter).sort({ subscribedAt: -1 }).skip(skip).limit(limit).lean(),
      Subscriber.countDocuments(filter),
    ]);

    const result = {
      subscribers: subscribers.map((s) => ({ ...s, id: s._id.toString() })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };

    cache.set(cacheKey, result, 60);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("listSubscribers error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/subscribers/export (admin) ────────────────────────────────────
export const exportSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find({ isActive: true })
      .sort({ subscribedAt: -1 })
      .select("email subscribedAt source")
      .lean();

    // Build CSV — escape cell values to prevent CSV injection
    const escapeCSV = (val) => {
      const str = String(val);
      if (/^[=+\-@\t\r]/.test(str)) return `"'${str.replace(/"/g, '""')}"`;
      if (str.includes(",") || str.includes('"') || str.includes("\n")) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };
    const header = "email,subscribedAt,source";
    const rows = subscribers.map(
      (s) => `${escapeCSV(s.email)},${escapeCSV(s.subscribedAt.toISOString())},${escapeCSV(s.source)}`
    );
    const csv = [header, ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=subscribers.csv");
    res.status(200).send(csv);
  } catch (error) {
    logger.error("exportSubscribers error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── DELETE /api/subscribers/:id (admin, soft delete) ───────────────────────
export const unsubscribe = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid subscriber ID" });
    }

    const subscriber = await Subscriber.findById(id);
    if (!subscriber) {
      return res.status(404).json({ success: false, error: "Subscriber not found" });
    }

    if (!subscriber.isActive) {
      return res.status(400).json({ success: false, error: "Subscriber is already inactive" });
    }

    subscriber.isActive = false;
    await subscriber.save();

    cache.delByPrefix("subscribers:list");

    res.status(200).json({ success: true, data: null });
  } catch (error) {
    logger.error("unsubscribe error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
