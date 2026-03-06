import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import logger from "../utils/logger.js";
import cache from "../utils/cache.js";
const VALID_OBJECT_ID = /^[0-9a-fA-F]{24}$/;

// lean() bypasses the Mongoose toJSON transform that adds `id`.
// This helper adds it back so the frontend can rely on doc.id.
function withId(doc) {
  if (!doc) return doc;
  return { ...doc, id: doc._id?.toString() };
}

// Invalidate all product-related cache keys on any write
function invalidateProductCache() {
  cache.delByPrefix("products:list");
}

// ─── Public: Get all products (paginated, filtered, sorted, searchable) ──────
export const getAllProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const { category, minPrice, maxPrice, inStock, rating, sort, search } = req.query;

    // Check cache for product listings (skip cache when searching — too many permutations)
    if (!search?.trim()) {
      const cacheKey = `products:list:${page}:${limit}:${category || ""}:${minPrice || ""}:${maxPrice || ""}:${inStock || ""}:${rating || ""}:${sort || ""}`;
      const cached = cache.get(cacheKey);
      if (cached) return res.status(200).json({ success: true, data: cached });
    }

    const query = { isActive: true };

    // ── Filter: category (by ID or slug) ──────────────────────────────────
    if (category) {
      if (VALID_OBJECT_ID.test(category)) {
        query.category = category;
      } else {
        // Equality lookup by slug — no regex, no escaping needed
        const cat = await Category.findOne({ slug: category }).select("_id").lean();
        if (cat) query.category = cat._id;
        else query.category = null; // no match → return empty
      }
    }

    // ── Filter: price range ────────────────────────────────────────────────
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice) || 0;
      if (maxPrice) query.price.$lte = parseFloat(maxPrice) || Infinity;
    }

    // ── Filter: in-stock only ──────────────────────────────────────────────
    if (inStock === "true") query.stock = { $gt: 0 };

    // ── Filter: minimum rating ─────────────────────────────────────────────
    if (rating) {
      const minRating = parseFloat(rating);
      if (!isNaN(minRating)) query["ratings.average"] = { $gte: minRating };
    }

    // ── Search: full-text ──────────────────────────────────────────────────
    if (search?.trim()) {
      query.$text = { $search: search.trim() };
    }

    // ── Sort ───────────────────────────────────────────────────────────────
    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { "ratings.average": -1 },
      newest: { createdAt: -1 },
    };
    const sortQuery = sortMap[sort] || sortMap.newest;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("category", "name slug")
        .populate("vendor", "name email")
        .lean(),
      Product.countDocuments(query),
    ]);

    const data = {
      products: products.map(withId),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    // Cache non-search results for 60 seconds
    if (!search?.trim()) {
      const cacheKey = `products:list:${page}:${limit}:${category || ""}:${minPrice || ""}:${maxPrice || ""}:${inStock || ""}:${rating || ""}:${sort || ""}`;
      cache.set(cacheKey, data, 60);
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("getAllProducts error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Public: Get single product by ID ───────────────────────────────────────
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!VALID_OBJECT_ID.test(id))
      return res.status(400).json({ success: false, error: "Invalid product ID" });

    const product = await Product.findOne({ _id: id, isActive: true })
      .populate("category", "name slug")
      .populate("vendor", "name email")
      .lean();

    if (!product) return res.status(404).json({ success: false, error: "Product not found" });

    res.status(200).json({ success: true, data: withId(product) });
  } catch (error) {
    logger.error("getProductById error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Protected: Create product (any authenticated user = vendor) ─────────────
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, compareAtPrice, category, images, stock, sku, attributes } =
      req.body;

    if (!name?.trim())
      return res.status(400).json({ success: false, error: "Missing required field: name" });
    if (price === undefined || price === null || price === "")
      return res.status(400).json({ success: false, error: "Missing required field: price" });

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0)
      return res.status(400).json({ success: false, error: "Price must be a non-negative number" });

    // Validate category if provided
    if (category) {
      if (!VALID_OBJECT_ID.test(category))
        return res.status(400).json({ success: false, error: "Invalid category ID" });
      const catExists = await Category.exists({ _id: category }).lean();
      if (!catExists)
        return res.status(404).json({ success: false, error: "Category not found" });
    }

    const productData = {
      name: name.trim(),
      description: description?.trim() || "",
      price: parsedPrice,
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
      category: category || null,
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      stock: parseInt(stock) || 0,
      sku: sku?.trim() || null,
      vendor: req.user._id,
      attributes: attributes || {},
    };

    const product = await Product.create(productData);
    const populated = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate("vendor", "name email")
      .lean();

    invalidateProductCache();

    res.status(201).json({ success: true, data: withId(populated) });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ success: false, error: "A product with this SKU already exists" });
    logger.error("createProduct error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Protected: Update product (owner vendor or admin) ───────────────────────
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!VALID_OBJECT_ID.test(id))
      return res.status(400).json({ success: false, error: "Invalid product ID" });

    const product = await Product.findOne({ _id: id, isActive: true }).lean();
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });

    // Ownership check: vendor or admin only
    const isOwner = product.vendor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ success: false, error: "Not authorized to update this product" });

    const { name, description, price, compareAtPrice, category, images, stock, sku, attributes, isActive } =
      req.body;

    const updates = {};
    if (name?.trim()) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (price !== undefined) {
      const p = parseFloat(price);
      if (isNaN(p) || p < 0)
        return res.status(400).json({ success: false, error: "Price must be a non-negative number" });
      updates.price = p;
    }
    if (compareAtPrice !== undefined) updates.compareAtPrice = compareAtPrice ? parseFloat(compareAtPrice) : null;
    if (category !== undefined) {
      if (category) {
        if (!VALID_OBJECT_ID.test(category))
          return res.status(400).json({ success: false, error: "Invalid category ID" });
      }
      updates.category = category || null;
    }
    if (Array.isArray(images)) updates.images = images.filter(Boolean);
    if (stock !== undefined) updates.stock = Math.max(0, parseInt(stock) || 0);
    if (sku !== undefined) updates.sku = sku?.trim() || null;
    if (attributes !== undefined) updates.attributes = attributes;
    if (isActive !== undefined) updates.isActive = isActive;

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ success: false, error: "No fields to update" });

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("category", "name slug")
      .populate("vendor", "name email");

    invalidateProductCache();

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ success: false, error: "A product with this SKU already exists" });
    logger.error("updateProduct error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Public: Search products (slim results for suggestions) ─────────────────
export const searchProducts = async (req, res) => {
  try {
    const q = req.query.q?.trim().slice(0, 200); // cap at 200 chars to prevent over-long queries
    if (!q) return res.status(200).json({ success: true, data: { products: [] } });

    const limit = Math.min(10, Math.max(1, parseInt(req.query.limit) || 5));

    // Use text index for relevance-scored search
    const products = await Product.find(
      { $text: { $search: q }, isActive: true },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .select("name slug price images ratings")
      .lean();

    res.status(200).json({ success: true, data: { products: products.map(withId) } });
  } catch (error) {
    logger.error("searchProducts error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Public: Get single product by slug ─────────────────────────────────────
export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    // Slug is alpha-numeric + hyphens only — equality lookup, no regex needed
    if (!slug || !/^[a-z0-9-]+$/.test(slug))
      return res.status(400).json({ success: false, error: "Invalid product slug" });

    const product = await Product.findOne({ slug, isActive: true })
      .populate("category", "name slug parent")
      .populate("vendor", "name email")
      .lean();

    if (!product) return res.status(404).json({ success: false, error: "Product not found" });

    res.status(200).json({ success: true, data: withId(product) });
  } catch (error) {
    logger.error("getProductBySlug error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Protected: Soft-delete product (owner vendor or admin) ──────────────────
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!VALID_OBJECT_ID.test(id))
      return res.status(400).json({ success: false, error: "Invalid product ID" });

    const product = await Product.findOne({ _id: id, isActive: true }).lean();
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });

    // Ownership check: vendor or admin only
    const isOwner = product.vendor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ success: false, error: "Not authorized to delete this product" });

    await Product.findByIdAndUpdate(id, { isActive: false });
    invalidateProductCache();

    res.status(200).json({ success: true, data: { message: "Product deleted successfully" } });
  } catch (error) {
    logger.error("deleteProduct error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
