"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import type { CategoryNode, FilterState } from "@/types";

interface ActiveFilterChipsProps {
  filters: FilterState;
  categories: CategoryNode[];
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

export function ActiveFilterChips({
  filters,
  categories,
  onFiltersChange,
  className,
}: ActiveFilterChipsProps) {
  const { t } = useTranslation("products");
  const formatPrice = useFormatPrice();
  const theme = useActiveTheme();

  const findCategoryName = useCallback(
    (id: string, nodes: CategoryNode[]): string | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node.name;
        const found = findCategoryName(id, node.children);
        if (found) return found;
      }
      return undefined;
    },
    []
  );

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.category) {
    const name = findCategoryName(filters.category, categories);
    if (name) {
      chips.push({
        key: "category",
        label: name,
        onRemove: () => onFiltersChange({ ...filters, category: undefined }),
      });
    }
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const parts: string[] = [];
    if (filters.minPrice !== undefined) parts.push(formatPrice(filters.minPrice));
    parts.push("—");
    if (filters.maxPrice !== undefined) parts.push(formatPrice(filters.maxPrice));
    else parts.push("+");
    chips.push({
      key: "price",
      label: parts.join(" "),
      onRemove: () =>
        onFiltersChange({ ...filters, minPrice: undefined, maxPrice: undefined }),
    });
  }

  if (filters.rating !== undefined) {
    chips.push({
      key: "rating",
      label: t("catalog.filterRatingAndUp", { stars: filters.rating }),
      onRemove: () => onFiltersChange({ ...filters, rating: undefined }),
    });
  }

  if (filters.inStock) {
    chips.push({
      key: "inStock",
      label: t("catalog.filterStock"),
      onRemove: () => onFiltersChange({ ...filters, inStock: undefined }),
    });
  }

  if (filters.onSale) {
    chips.push({
      key: "onSale",
      label: t("catalog.filterOnSale"),
      onRemove: () => onFiltersChange({ ...filters, onSale: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      aria-label={t("catalog.activeFilters")}
    >
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className={cn(
            "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer group",
            theme.accentBg, theme.accent
          )}
          aria-label={`${t("catalog.removeFilter")}: ${chip.label}`}
        >
          {chip.label}
          <X
            className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity"
            aria-hidden="true"
          />
        </button>
      ))}
      <button
        type="button"
        onClick={() => onFiltersChange({})}
        className={cn("text-xs transition-colors cursor-pointer underline-offset-2 hover:underline", theme.textMuted, "hover:text-destructive")}
      >
        {t("catalog.clearAll")}
      </button>
    </div>
  );
}
