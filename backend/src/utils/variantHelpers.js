import Product from "../models/productModel.js";

/**
 * Deterministic JSON key for a combo object — used for comparison.
 * Sorts keys alphabetically and stringifies.
 */
export function comboKey(combo) {
  if (!combo) return "{}";
  const plain = combo instanceof Map ? Object.fromEntries(combo) : combo;
  const sorted = Object.keys(plain)
    .sort()
    .reduce((acc, k) => {
      acc[k] = plain[k];
      return acc;
    }, {});
  return JSON.stringify(sorted);
}

/**
 * Resolve the effective variant mode for a product.
 * Handles backward compat: products with hasVariants=true but no variantMode field
 * are treated as "advanced".
 */
export function resolveVariantMode(product) {
  if (product.variantMode) return product.variantMode;
  // Backward compat: old products stored hasVariants as a field
  if (product.variants?.length > 0) return "advanced";
  return "none";
}

/**
 * Find a matching enabled variant for the given selectedOptions (advanced mode).
 * Returns the variant subdocument or null.
 */
export function findVariant(product, selectedOptions) {
  if (!product.variants?.length) return null;
  if (!selectedOptions || Object.keys(selectedOptions).length === 0) return null;

  const targetKey = comboKey(selectedOptions);

  return (
    product.variants.find((v) => {
      if (!v.enabled) return false;
      return comboKey(v.optionCombo) === targetKey;
    }) || null
  );
}

/**
 * Cartesian product of arrays.
 * Input: { color: ["Black", "White"], size: ["S", "M"] }
 * Output: [{ color: "Black", size: "S" }, { color: "Black", size: "M" }, ...]
 */
export function generateCombinations(multiSelectAttrs) {
  const keys = Object.keys(multiSelectAttrs);
  if (keys.length === 0) return [];

  const result = [];
  const values = keys.map((k) => multiSelectAttrs[k]);

  function recurse(depth, current) {
    if (depth === keys.length) {
      result.push({ ...current });
      return;
    }
    for (const val of values[depth]) {
      current[keys[depth]] = val;
      recurse(depth + 1, current);
    }
  }

  recurse(0, {});
  return result;
}

/**
 * For simple mode: find all per-option variants matching selectedOptions.
 * Simple variants have single-key optionCombo (e.g., { color: "Black" }).
 * Returns array of matching variant subdocuments.
 */
export function findSimpleVariants(product, selectedOptions) {
  if (!product.variants?.length) return [];
  if (!selectedOptions || Object.keys(selectedOptions).length === 0) return [];

  return product.variants.filter((v) => {
    const entries = v.optionCombo instanceof Map
      ? [...v.optionCombo.entries()]
      : Object.entries(v.optionCombo);
    if (entries.length !== 1) return false;
    const [key, val] = entries[0];
    return selectedOptions[key] === val;
  });
}

/**
 * Recompute the top-level product stock from variant stocks.
 * Uses $set to update atomically without triggering full save hooks.
 * Mode-aware: advanced sums enabled variants, simple sums all variants.
 */
export async function recomputeProductStock(productId) {
  const product = await Product.findById(productId).select("variantMode variants");
  if (!product) return;

  const mode = resolveVariantMode(product);
  if (mode === "none") return;

  const totalStock = mode === "advanced"
    ? product.variants.filter((v) => v.enabled).reduce((sum, v) => sum + v.stock, 0)
    : product.variants.reduce((sum, v) => sum + v.stock, 0);

  await Product.updateOne({ _id: productId }, { $set: { stock: totalStock } });
}
