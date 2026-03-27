import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import logger from "../utils/logger.js";
import cache from "../utils/cache.js";

const VALID_OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const CATEGORY_TREE_CACHE_KEY = "category:tree";
const CATEGORIES_ALL_CACHE_KEY = "categories:all";
const CATEGORY_CACHE_TTL = 300; // 5 minutes

// lean() bypasses toJSON transform; add id manually for frontend compatibility
function withId(doc) {
  if (!doc) return doc;
  return { ...doc, id: doc._id?.toString() };
}

// Invalidate both category caches
function invalidateCategoryCache() {
  cache.del(CATEGORY_TREE_CACHE_KEY);
  cache.del(CATEGORIES_ALL_CACHE_KEY);
}

// ─── Public: Get all categories (flat list, cached) ──────────────────────────
export const getAllCategories = async (req, res) => {
  try {
    const cached = cache.get(CATEGORIES_ALL_CACHE_KEY);
    if (cached) return res.status(200).json({ success: true, data: cached });

    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .lean();
    const result = categories.map(withId);
    cache.set(CATEGORIES_ALL_CACHE_KEY, result, CATEGORY_CACHE_TTL);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("getAllCategories error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Public: Get category tree (nested structure, cached) ────────────────────
export const getCategoryTree = async (req, res) => {
  try {
    const cached = cache.get(CATEGORY_TREE_CACHE_KEY);
    if (cached) return res.status(200).json({ success: true, data: cached });

    const all = await Category.find({ isActive: true }).sort({ name: 1 }).lean();

    // Build nested tree from flat list
    const map = {};
    all.forEach((cat) => { map[cat._id.toString()] = { ...cat, id: cat._id, children: [] }; });

    const roots = [];
    all.forEach((cat) => {
      const node = map[cat._id.toString()];
      if (cat.parent) {
        const parentKey = cat.parent.toString();
        if (map[parentKey]) {
          map[parentKey].children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    cache.set(CATEGORY_TREE_CACHE_KEY, roots, CATEGORY_CACHE_TTL);
    res.status(200).json({ success: true, data: roots });
  } catch (error) {
    logger.error("getCategoryTree error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Public: Get single category by ID ──────────────────────────────────────
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!VALID_OBJECT_ID.test(id))
      return res.status(400).json({ success: false, error: "Invalid category ID" });

    const category = await Category.findById(id).populate("parent", "name slug").lean();
    if (!category) return res.status(404).json({ success: false, error: "Category not found" });

    res.status(200).json({ success: true, data: withId(category) });
  } catch (error) {
    logger.error("getCategoryById error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Public: Get single category by slug ─────────────────────────────────────
export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug || !/^[a-z0-9-]+$/.test(slug))
      return res.status(400).json({ success: false, error: "Invalid category slug" });

    const category = await Category.findOne({ slug }).populate("parent", "name slug").lean();
    if (!category) return res.status(404).json({ success: false, error: "Category not found" });

    res.status(200).json({ success: true, data: withId(category) });
  } catch (error) {
    logger.error("getCategoryBySlug error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Admin: Create category ──────────────────────────────────────────────────
export const createCategory = async (req, res) => {
  try {
    const { name, description, parent, image, isActive } = req.body;

    if (!name?.trim())
      return res.status(400).json({ success: false, error: "Missing required field: name" });

    // Validate parent ID if provided
    if (parent) {
      if (!VALID_OBJECT_ID.test(parent))
        return res.status(400).json({ success: false, error: "Invalid parent category ID" });
      const parentExists = await Category.exists({ _id: parent }).lean();
      if (!parentExists)
        return res.status(404).json({ success: false, error: "Parent category not found" });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description?.trim() || "",
      parent: parent || null,
      image: image?.trim() || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    // Invalidate tree cache on write
    invalidateCategoryCache();

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ success: false, error: "Category with this name already exists" });
    logger.error("createCategory error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Admin: Update category ──────────────────────────────────────────────────
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!VALID_OBJECT_ID.test(id))
      return res.status(400).json({ success: false, error: "Invalid category ID" });

    const { name, description, parent, image, isActive } = req.body;

    // Prevent category from being its own parent
    if (parent) {
      if (!VALID_OBJECT_ID.test(parent))
        return res.status(400).json({ success: false, error: "Invalid parent category ID" });
      if (parent === id)
        return res.status(400).json({ success: false, error: "Category cannot be its own parent" });
    }

    const updates = {};
    if (name?.trim()) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (parent !== undefined) updates.parent = parent || null;
    if (image !== undefined) updates.image = image?.trim() || null;
    if (isActive !== undefined) updates.isActive = isActive;

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ success: false, error: "No fields to update" });

    const category = await Category.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ success: false, error: "Category not found" });

    invalidateCategoryCache();

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ success: false, error: "Category name already in use" });
    logger.error("updateCategory error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Admin: Delete category (only if no products reference it) ───────────────
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!VALID_OBJECT_ID.test(id))
      return res.status(400).json({ success: false, error: "Invalid category ID" });

    const category = await Category.findById(id).lean();
    if (!category) return res.status(404).json({ success: false, error: "Category not found" });

    // Block deletion if any products reference this category
    const productCount = await Product.countDocuments({ category: id, isActive: true });
    if (productCount > 0)
      return res.status(409).json({
        success: false,
        error: `Cannot delete: ${productCount} product(s) reference this category`,
      });

    // Also block if any subcategories exist
    const childCount = await Category.countDocuments({ parent: id });
    if (childCount > 0)
      return res.status(409).json({
        success: false,
        error: `Cannot delete: ${childCount} subcategory(ies) belong to this category`,
      });

    await Category.findByIdAndDelete(id);
    invalidateCategoryCache();

    res.status(200).json({ success: true, data: { message: "Category deleted successfully" } });
  } catch (error) {
    logger.error("deleteCategory error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
