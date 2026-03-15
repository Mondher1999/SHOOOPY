import { useMemo } from "react";
import type { ProductImage } from "@/types";

/**
 * Filters and prioritises product images based on selected variant options.
 *
 * - Images whose `variantMap` **matches** the selection come first.
 * - Images with **no tags** (or no opinion on the selected keys) follow.
 * - Images that **conflict** with the selection are hidden.
 * - Falls back to the full list if the filter would produce an empty result.
 */
export function useVariantFilteredImages(
  images: ProductImage[],
  selectedOptions?: Record<string, string | string[]>,
): ProductImage[] {
  return useMemo(() => {
    if (!selectedOptions || Object.keys(selectedOptions).length === 0) return images;

    // Build a map of active single-value selections
    const activeSelections: Record<string, string> = {};
    for (const [key, val] of Object.entries(selectedOptions)) {
      if (typeof val === "string" && val) activeSelections[key] = val;
    }
    if (Object.keys(activeSelections).length === 0) return images;

    const matching: ProductImage[] = [];
    const untagged: ProductImage[] = [];

    for (const img of images) {
      const map = img.variantMap;
      if (!map || Object.keys(map).length === 0) {
        untagged.push(img);
        continue;
      }

      let conflicts = false;
      let matches = false;
      for (const [attrKey, selectedVal] of Object.entries(activeSelections)) {
        const imgVal = map[attrKey];
        if (imgVal !== undefined) {
          if (imgVal === selectedVal) {
            matches = true;
          } else {
            conflicts = true;
            break;
          }
        }
      }

      if (conflicts) continue;
      if (matches) {
        matching.push(img);
      } else {
        untagged.push(img);
      }
    }

    const result = [...matching, ...untagged];
    return result.length > 0 ? result : images;
  }, [images, selectedOptions]);
}
