"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import type { CategoryNode, FilterState } from "@/types";

interface ProductFiltersProps {
  categories: CategoryNode[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  maxPriceLimit?: number;
  className?: string;
}

function CategoryTreeItem({
  node,
  selected,
  onSelect,
  depth = 0,
  accent,
  textMuted,
}: {
  node: CategoryNode;
  selected: string | undefined;
  onSelect: (id: string | undefined) => void;
  depth?: number;
  accent: string;
  textMuted: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selected === node.id;

  return (
    <li>
      <div className={cn("flex items-center gap-1", depth > 0 && "ml-4")}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="p-0.5 rounded hover:bg-muted transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
            aria-expanded={expanded}
          >
            {expanded ? (
              <ChevronDown className={cn("h-3 w-3", textMuted)} aria-hidden="true" />
            ) : (
              <ChevronRight className={cn("h-3 w-3", textMuted)} aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <button
          type="button"
          onClick={() => onSelect(isSelected ? undefined : node.id)}
          className={cn(
            "flex-1 text-left text-sm py-1 px-1 rounded hover:bg-muted transition-colors",
            isSelected && cn("font-semibold", accent)
          )}
        >
          {node.name}
        </button>
      </div>
      {hasChildren && expanded && (
        <ul className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              selected={selected}
              onSelect={onSelect}
              depth={depth + 1}
              accent={accent}
              textMuted={textMuted}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ProductFilters({
  categories,
  filters,
  onFiltersChange,
  maxPriceLimit = 1000,
  className,
}: ProductFiltersProps) {
  const { t } = useTranslation("products");
  const formatPrice = useFormatPrice();
  const theme = useActiveTheme();

  const activeCount = [
    filters.category,
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.inStock,
  ].filter(Boolean).length;

  const committedRange: [number, number] = [
    filters.minPrice ?? 0,
    filters.maxPrice ?? maxPriceLimit,
  ];

  // Local state for smooth slider dragging — only commits to parent on release
  const [localPrice, setLocalPrice] = useState<[number, number]>(committedRange);

  // Sync local state when filters are reset externally (e.g. "Clear all")
  useEffect(() => {
    setLocalPrice(committedRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.minPrice, filters.maxPrice]);

  return (
    <aside
      className={cn("space-y-5", className)}
      aria-label={t("catalog.filtersLabel")}
      suppressHydrationWarning
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className={cn("h-4 w-4", theme.text)} aria-hidden="true" />
          <h2 className={cn("font-semibold text-sm", theme.text, theme.headingClass)} suppressHydrationWarning>{t("catalog.filtersLabel")}</h2>
          {activeCount > 0 && (
            <Badge className={cn("text-xs h-5 px-1.5", theme.badgeBg, theme.badgeText)}>
              {activeCount}
            </Badge>
          )}
        </div>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-6 text-xs px-2", theme.textMuted)}
            onClick={() => onFiltersChange({})}
          >
            <X className="h-3 w-3 mr-1" aria-hidden="true" />
            {t("catalog.clearFilters")}
          </Button>
        )}
      </div>

      <div className={cn("h-px w-full", theme.separator)} />

      {/* Category Filter */}
      {categories.length > 0 && (
        <section aria-labelledby="filter-category-heading">
          <h3 id="filter-category-heading" className={cn("text-xs font-semibold uppercase tracking-wider mb-2", theme.textMuted)}>
            {t("catalog.filterCategory")}
          </h3>
          <ul className="space-y-0.5">
            {categories.map((cat) => (
              <CategoryTreeItem
                key={cat.id}
                node={cat}
                selected={filters.category}
                onSelect={(id) => onFiltersChange({ ...filters, category: id })}
                accent={theme.accent}
                textMuted={theme.textMuted}
              />
            ))}
          </ul>
        </section>
      )}

      <div className={cn("h-px w-full", theme.separator)} />

      {/* Price Range */}
      <section aria-labelledby="filter-price-heading">
        <div className="flex items-center justify-between mb-3">
          <h3 id="filter-price-heading" className={cn("text-xs font-semibold uppercase tracking-wider", theme.textMuted)}>
            {t("catalog.filterPrice")}
          </h3>
          {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
            <button
              type="button"
              onClick={() => onFiltersChange({ ...filters, minPrice: undefined, maxPrice: undefined })}
              className={cn("text-xs transition-colors", theme.textMuted)}
              aria-label="Reset price filter"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Price badges — show live position while dragging */}
        <div className="flex items-center gap-2 mb-4">
          <div className={cn("flex-1 rounded-md px-3 py-1.5 text-center", theme.surface)}>
            <p className={cn("text-[10px] mb-0.5", theme.textMuted)}>{t("catalog.priceMin", { defaultValue: "Min" })}</p>
            <p className={cn("text-sm font-semibold tabular-nums", theme.text)}>{formatPrice(localPrice[0])}</p>
          </div>
          <div className={cn("h-px w-3 flex-shrink-0", theme.separator)} />
          <div className={cn("flex-1 rounded-md px-3 py-1.5 text-center", theme.surface)}>
            <p className={cn("text-[10px] mb-0.5", theme.textMuted)}>{t("catalog.priceMax", { defaultValue: "Max" })}</p>
            <p className={cn("text-sm font-semibold tabular-nums", theme.text)}>
              {formatPrice(localPrice[1])}{localPrice[1] >= maxPriceLimit && "+"}
            </p>
          </div>
        </div>

        <Slider
          min={0}
          max={maxPriceLimit}
          step={Math.max(1, Math.floor(maxPriceLimit / 100))}
          value={localPrice}
          onValueChange={(v) => setLocalPrice(v as [number, number])}
          onValueCommit={([min, max]) =>
            onFiltersChange({
              ...filters,
              minPrice: min > 0 ? min : undefined,
              maxPrice: max < maxPriceLimit ? max : undefined,
            })
          }
          aria-label={t("catalog.filterPrice")}
        />
      </section>

      <div className={cn("h-px w-full", theme.separator)} />

      {/* In Stock Filter */}
      <section aria-labelledby="filter-stock-heading">
        <h3 id="filter-stock-heading" className="sr-only">{t("catalog.filterStock")}</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            id="inStock"
            checked={!!filters.inStock}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, inStock: checked === true ? true : undefined })
            }
          />
          <span className={cn("text-sm", theme.text)}>{t("catalog.filterStock")}</span>
        </label>
      </section>
    </aside>
  );
}
