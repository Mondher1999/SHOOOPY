import Redirect from "../models/redirectModel.js";
import logger from "../utils/logger.js";

const VALID_OBJECT_ID = /^[0-9a-fA-F]{24}$/;

function withId(doc) {
  if (!doc) return doc;
  return { ...doc, id: doc._id?.toString() };
}

// ─── Public: Resolve a redirect by path ─────────────────────────────────────
export const resolveRedirect = async (req, res) => {
  try {
    const from = req.query.from?.trim();
    if (!from)
      return res.status(400).json({ success: false, error: "Missing 'from' query parameter" });

    const redirect = await Redirect.findOne({ from, isActive: true }).lean();
    if (!redirect)
      return res.status(404).json({ success: false, error: "No redirect found" });

    res.status(200).json({ success: true, data: withId(redirect) });
  } catch (error) {
    logger.error("resolveRedirect error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Admin: Get all redirects (paginated) ───────────────────────────────────
export const getAllRedirects = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const [redirects, total] = await Promise.all([
      Redirect.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Redirect.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        redirects: redirects.map(withId),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    logger.error("getAllRedirects error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Admin: Create a redirect ───────────────────────────────────────────────
export const createRedirect = async (req, res) => {
  try {
    const { from, to, type } = req.body;

    if (!from?.trim())
      return res.status(400).json({ success: false, error: "Missing required field: from" });
    if (!to?.trim())
      return res.status(400).json({ success: false, error: "Missing required field: to" });
    if (from.trim() === to.trim())
      return res.status(400).json({ success: false, error: "Source and destination cannot be the same" });

    const redirect = await Redirect.create({
      from: from.trim(),
      to: to.trim(),
      type: type === 302 ? 302 : 301,
      source: "manual",
    });

    res.status(201).json({ success: true, data: redirect });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ success: false, error: "A redirect from this path already exists" });
    logger.error("createRedirect error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Admin: Update a redirect ───────────────────────────────────────────────
export const updateRedirect = async (req, res) => {
  try {
    const { id } = req.params;
    if (!VALID_OBJECT_ID.test(id))
      return res.status(400).json({ success: false, error: "Invalid redirect ID" });

    const { from, to, type, isActive } = req.body;
    const updates = {};
    if (from?.trim()) updates.from = from.trim();
    if (to?.trim()) updates.to = to.trim();
    if (type !== undefined) updates.type = type === 302 ? 302 : 301;
    if (isActive !== undefined) updates.isActive = isActive;

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ success: false, error: "No fields to update" });

    const redirect = await Redirect.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!redirect)
      return res.status(404).json({ success: false, error: "Redirect not found" });

    res.status(200).json({ success: true, data: redirect });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ success: false, error: "A redirect from this path already exists" });
    logger.error("updateRedirect error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Admin: Delete a redirect ───────────────────────────────────────────────
export const deleteRedirect = async (req, res) => {
  try {
    const { id } = req.params;
    if (!VALID_OBJECT_ID.test(id))
      return res.status(400).json({ success: false, error: "Invalid redirect ID" });

    const redirect = await Redirect.findByIdAndDelete(id);
    if (!redirect)
      return res.status(404).json({ success: false, error: "Redirect not found" });

    res.status(200).json({ success: true, data: { message: "Redirect deleted successfully" } });
  } catch (error) {
    logger.error("deleteRedirect error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
