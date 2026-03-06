"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CategoryNode, ProductQueryParams } from "@/types";

interface FilterState {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
}

interface ProductFiltersProps {
  categories: CategoryNode[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  maxPriceLimit?: number;
  className?: string;
}

const RATING_OPTIONS = [4, 3, 2, 1] as const;

function CategoryTreeItem({
  node,
  selected,
  onSelect,
  depth = 0,
}: {
  node: CategoryNode;
  selected: string | undefined;
  onSelect: (id: string | undefined) => void;
  depth?: number;
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
              <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
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
            isSelected && "font-semibold text-primary"
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

  const activeCount = [
    filters.category,
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.inStock,
    filters.rating,
  ].filter(Boolean).length;

  const priceRange: [number, number] = [
    filters.minPrice ?? 0,
    filters.maxPrice ?? maxPriceLimit,
  ];

  return (
    <aside
      className={cn("space-y-5", className)}
      aria-label={t("catalog.filtersLabel")}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          <h2 className="font-semibold text-sm">{t("catalog.filtersLabel")}</h2>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {activeCount}
            </Badge>
          )}
        </div>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2 text-muted-foreground"
            onClick={() => onFiltersChange({})}
          >
            <X className="h-3 w-3 mr-1" aria-hidden="true" />
            {t("catalog.clearFilters")}
          </Button>
        )}
      </div>

      <Separator />

      {/* Category Filter */}
      {categories.length > 0 && (
        <section aria-labelledby="filter-category-heading">
          <h3 id="filter-category-heading" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {t("catalog.filterCategory")}
          </h3>
          <ul className="space-y-0.5">
            {categories.map((cat) => (
              <CategoryTreeItem
                key={cat.id}
                node={cat}
                selected={filters.category}
                onSelect={(id) => onFiltersChange({ ...filters, category: id })}
              />
            ))}
          </ul>
        </section>
      )}

      <Separator />

      {/* Price Range */}
      <section aria-labelledby="filter-price-heading">
        <h3 id="filter-price-heading" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {t("catalog.filterPrice")}
        </h3>
        <Slider
          min={0}
          max={maxPriceLimit}
          step={1}
          value={priceRange}
          onValueChange={([min, max]) =>
            onFiltersChange({
              ...filters,
              minPrice: min > 0 ? min : undefined,
              maxPrice: max < maxPriceLimit ? max : undefined,
            })
          }
          aria-label={t("catalog.filterPrice")}
          className="mb-3"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}{priceRange[1] >= maxPriceLimit && "+"}</span>
        </div>
      </section>

      <Separator />

      {/* Rating Filter */}
      <section aria-labelledby="filter-rating-heading">
        <h3 id="filter-rating-heading" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {t("catalog.filterRating")}
        </h3>
        <div className="space-y-1.5" role="radiogroup" aria-labelledby="filter-rating-heading">
          {RATING_OPTIONS.map((stars) => {
            const isSelected = filters.rating === stars;
            return (
              <button
                key={stars}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    rating: isSelected ? undefined : stars,
                  })
                }
                className={cn(
                  "flex items-center gap-1.5 w-full text-left text-sm py-1 px-1 rounded hover:bg-muted transition-colors",
                  isSelected && "font-semibold text-primary"
                )}
              >
                <span aria-hidden="true">{"★".repeat(stars)}{"☆".repeat(4 - stars)}</span>
                <span className="text-xs text-muted-foreground">{t("catalog.filterRatingAndUp", { stars })}</span>
              </button>
            );
          })}
        </div>
      </section>

      <Separator />

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
          <span className="text-sm">{t("catalog.filterStock")}</span>
        </label>
      </section>
    </aside>
  );
}
