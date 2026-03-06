import mongoose from "mongoose";
import Review from "../models/reviewModel.js";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import logger from "../utils/logger.js";

// Validate ObjectId format
const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ─── Recalculate product rating aggregation ──────────────────────────────────
async function recalcRatings(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: null,
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const average = stats.length > 0 ? Math.round(stats[0].average * 10) / 10 : 0;
  const count = stats.length > 0 ? stats[0].count : 0;

  await Product.findByIdAndUpdate(productId, {
    ratings: { average, count },
  });
}

// ─── POST /api/reviews ───────────────────────────────────────────────────────
export const createReview = async (req, res) => {
  try {
    const { product: productId, rating, title, comment } = req.body;

    // Validate required fields
    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: product, rating, title, comment",
      });
    }

    if (!isObjectId(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product ID format" });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({ success: false, error: "Rating must be an integer between 1 and 5" });
    }

    if (title.trim().length < 3 || title.trim().length > 100) {
      return res.status(400).json({ success: false, error: "Title must be between 3 and 100 characters" });
    }

    if (comment.trim().length < 10 || comment.trim().length > 1000) {
      return res.status(400).json({ success: false, error: "Comment must be between 10 and 1000 characters" });
    }

    // Check product exists
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // Check for delivered order containing this product
    const deliveredOrder = await Order.findOne({
      user: req.user._id,
      status: "delivered",
      "items.product": productId,
    }).lean();

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        error: "You can only review products from delivered orders",
      });
    }

    // Check duplicate review
    const existing = await Review.findOne({ user: req.user._id, product: productId }).lean();
    if (existing) {
      return res.status(409).json({ success: false, error: "You have already reviewed this product" });
    }

    // Create review
    const review = await Review.create({
      user: req.user._id,
      product: productId,
      order: deliveredOrder._id,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      isVerified: true,
    });

    // Recalculate product ratings
    await recalcRatings(product._id);

    // Populate user for response (no .lean() — toJSON adds `id`)
    const populated = await Review.findById(review._id)
      .populate("user", "name avatar");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    // Duplicate key error (race condition on unique index)
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: "You have already reviewed this product" });
    }
    logger.error("createReview error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/reviews/product/:productId ─────────────────────────────────────
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isObjectId(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product ID format" });
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Sort
    const sortOptions = {
      "-createdAt": { createdAt: -1 },
      "createdAt": { createdAt: 1 },
      "-rating": { rating: -1 },
      "rating": { rating: 1 },
    };
    const sort = sortOptions[req.query.sort] || { createdAt: -1 };

    const [reviews, total, distribution] = await Promise.all([
      Review.find({ product: productId })
        .populate("user", "name avatar")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ product: productId }),
      Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),
    ]);

    // Build rating distribution (1-5)
    const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
      const found = distribution.find((d) => d._id === star);
      return { rating: star, count: found ? found.count : 0 };
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        ratingDistribution,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("getProductReviews error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/reviews/eligibility/:productId ─────────────────────────────────
export const checkEligibility = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isObjectId(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product ID format" });
    }

    // Check if user has a delivered order with this product
    const deliveredOrder = await Order.findOne({
      user: req.user._id,
      status: "delivered",
      "items.product": productId,
    }).lean();

    // Check if user already reviewed (no .lean() — toJSON adds `id`)
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId,
    });

    res.status(200).json({
      success: true,
      data: {
        canReview: !!deliveredOrder && !existingReview,
        hasDeliveredOrder: !!deliveredOrder,
        existingReview: existingReview || null,
      },
    });
  } catch (error) {
    logger.error("checkEligibility error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── PUT /api/reviews/:id ────────────────────────────────────────────────────
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid review ID format" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, error: "Review not found" });
    }

    // Ownership check
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Not authorized to update this review" });
    }

    const { rating, title, comment } = req.body;

    if (rating !== undefined) {
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({ success: false, error: "Rating must be an integer between 1 and 5" });
      }
      review.rating = rating;
    }

    if (title !== undefined) {
      if (title.trim().length < 3 || title.trim().length > 100) {
        return res.status(400).json({ success: false, error: "Title must be between 3 and 100 characters" });
      }
      review.title = title.trim();
    }

    if (comment !== undefined) {
      if (comment.trim().length < 10 || comment.trim().length > 1000) {
        return res.status(400).json({ success: false, error: "Comment must be between 10 and 1000 characters" });
      }
      review.comment = comment.trim();
    }

    await review.save();

    // Recalculate product ratings
    await recalcRatings(review.product);

    const populated = await Review.findById(review._id)
      .populate("user", "name avatar");

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    logger.error("updateReview error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── DELETE /api/reviews/:id ─────────────────────────────────────────────────
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid review ID format" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, error: "Review not found" });
    }

    // Ownership check (or admin)
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Not authorized to delete this review" });
    }

    const productId = review.product;
    await review.deleteOne();

    // Recalculate product ratings
    await recalcRatings(productId);

    res.status(200).json({ success: true, data: null });
  } catch (error) {
    logger.error("deleteReview error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
