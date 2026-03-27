import Contact from "../models/contactModel.js";
import logger from "../utils/logger.js";
import { sendEmail } from "../utils/sendEmail.js";
import cache from "../utils/cache.js";

const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

/** Escape HTML special chars to prevent XSS in emails */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── POST /api/contacts (public, rate-limited) ──────────────────────────────
export const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, error: "All fields are required: name, email, subject, message" });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: "Invalid email address" });
    }

    if (message.length > 5000) {
      return res.status(400).json({ success: false, error: "Message must be 5000 characters or less" });
    }

    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    });

    // Notify admin (non-blocking)
    const settingsDoc = cache.get("settings:global");
    const adminEmail = settingsDoc?.notifications?.adminNotificationEmail;
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `New Contact Form Submission: ${subject.trim()}`,
        text: `New contact from ${name} (${email}):\n\nSubject: ${subject}\n\n${message}`,
        html: `<div style="font-family:sans-serif;padding:16px;"><h3>New Contact Form Submission</h3><p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p></div>`,
      }).catch(() => {});
    }

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    logger.error("submitContact error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/contacts (admin) ──────────────────────────────────────────────
export const getAllContacts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status && ["new", "read", "replied"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [contacts, total] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Contact.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        contacts: contacts.map((c) => ({ ...c, id: c._id.toString() })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    logger.error("getAllContacts error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/contacts/:id (admin) ──────────────────────────────────────────
export const getContact = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid contact ID" });
    }

    const contact = await Contact.findById(id).lean();
    if (!contact) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }

    res.status(200).json({ success: true, data: { ...contact, id: contact._id.toString() } });
  } catch (error) {
    logger.error("getContact error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── PATCH /api/contacts/:id (admin) ────────────────────────────────────────
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid contact ID" });
    }

    const { status } = req.body;
    if (!status || !["new", "read", "replied"].includes(status)) {
      return res.status(400).json({ success: false, error: "Status must be 'new', 'read', or 'replied'" });
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!contact) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    logger.error("updateContactStatus error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── DELETE /api/contacts/:id (admin) ───────────────────────────────────────
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid contact ID" });
    }

    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }

    res.status(200).json({ success: true, data: null });
  } catch (error) {
    logger.error("deleteContact error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
