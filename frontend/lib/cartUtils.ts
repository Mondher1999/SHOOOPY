import type { CartItem } from "@/types";

/**
 * Generates a unique React key for a cart item, accounting for variant selectedOptions.
 * Products with different selectedOptions get different keys even if product.id matches.
 */
export function cartItemKey(item: CartItem): string {
  const opts = item.selectedOptions;
  if (!opts || Object.keys(opts).length === 0) return item.product.id;
  const sorted = Object.keys(opts).sort().reduce<Record<string, string>>((acc, k) => {
    acc[k] = opts[k];
    return acc;
  }, {});
  return `${item.product.id}::${JSON.stringify(sorted)}`;
}
