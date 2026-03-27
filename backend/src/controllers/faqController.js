import FAQ from "../models/faqModel.js";
import logger from "../utils/logger.js";

const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ─── GET /api/faq (public) ──────────────────────────────────────────────────
export const getPublicFAQs = async (_req, res) => {
  try {
    const faqs = await FAQ.find({ isActive: true }).sort({ order: 1 }).lean();
    res.status(200).json({
      success: true,
      data: faqs.map((f) => ({ ...f, id: f._id.toString() })),
    });
  } catch (error) {
    logger.error("getPublicFAQs error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/faq/admin (admin) ─────────────────────────────────────────────
export const getAllFAQs = async (_req, res) => {
  try {
    const faqs = await FAQ.find({}).sort({ order: 1 }).lean();
    res.status(200).json({
      success: true,
      data: faqs.map((f) => ({ ...f, id: f._id.toString() })),
    });
  } catch (error) {
    logger.error("getAllFAQs error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/faq (admin) ──────────────────────────────────────────────────
export const createFAQ = async (req, res) => {
  try {
    const { question, answer, order: faqOrder } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, error: "Missing required fields: question, answer" });
    }
    if (String(answer).length > 10000) {
      return res.status(400).json({ success: false, error: "Answer must not exceed 10000 characters" });
    }

    // Auto-assign order if not provided
    let orderNum = parseInt(faqOrder);
    if (isNaN(orderNum)) {
      const maxFaq = await FAQ.findOne({}).sort({ order: -1 }).lean();
      orderNum = maxFaq ? maxFaq.order + 1 : 0;
    }

    const faq = await FAQ.create({
      question: question.trim(),
      answer: String(answer).trim(),
      order: orderNum,
    });

    res.status(201).json({ success: true, data: faq });
  } catch (error) {
    logger.error("createFAQ error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── PUT /api/faq/:id (admin) ───────────────────────────────────────────────
export const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid FAQ ID" });
    }

    const faq = await FAQ.findById(id);
    if (!faq) {
      return res.status(404).json({ success: false, error: "FAQ not found" });
    }

    if (req.body.question !== undefined) faq.question = String(req.body.question).trim();
    if (req.body.answer !== undefined) {
      if (String(req.body.answer).length > 10000) {
        return res.status(400).json({ success: false, error: "Answer must not exceed 10000 characters" });
      }
      faq.answer = String(req.body.answer).trim();
    }
    if (req.body.order !== undefined) faq.order = parseInt(req.body.order) || 0;
    if (req.body.isActive !== undefined) faq.isActive = Boolean(req.body.isActive);

    await faq.save();
    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    logger.error("updateFAQ error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── DELETE /api/faq/:id (admin) ────────────────────────────────────────────
export const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid FAQ ID" });
    }

    const faq = await FAQ.findByIdAndDelete(id);
    if (!faq) {
      return res.status(404).json({ success: false, error: "FAQ not found" });
    }

    res.status(200).json({ success: true, data: null });
  } catch (error) {
    logger.error("deleteFAQ error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── PUT /api/faq/reorder (admin) ───────────────────────────────────────────
export const reorderFAQs = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ success: false, error: "orderedIds must be a non-empty array" });
    }

    // Validate all IDs
    for (const id of orderedIds) {
      if (!isObjectId(id)) {
        return res.status(400).json({ success: false, error: `Invalid FAQ ID: ${id}` });
      }
    }

    // Bulk update order
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    }));

    await FAQ.bulkWrite(bulkOps);

    const faqs = await FAQ.find({}).sort({ order: 1 }).lean();
    res.status(200).json({
      success: true,
      data: faqs.map((f) => ({ ...f, id: f._id.toString() })),
    });
  } catch (error) {
    logger.error("reorderFAQs error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
