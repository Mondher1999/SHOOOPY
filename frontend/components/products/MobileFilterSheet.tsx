"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ProductFilters } from "@/components/products/ProductFilters";
import { cn } from "@/lib/utils";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import type { CategoryNode, FilterState } from "@/types";

interface MobileFilterSheetProps {
  categories: CategoryNode[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  maxPriceLimit?: number;
  className?: string;
}

export function MobileFilterSheet({
  categories,
  filters,
  onFiltersChange,
  maxPriceLimit,
  className,
}: MobileFilterSheetProps) {
  const { t } = useTranslation("products");
  const [open, setOpen] = useState(false);
  const theme = useActiveTheme();

  const activeCount = [
    filters.category,
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.inStock,
    filters.onSale,
    filters.rating,
  ].filter(Boolean).length;

  return (
    <div className={cn("lg:hidden", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn("gap-1.5 cursor-pointer", theme.btnOutline)}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        {t("catalog.filtersLabel")}
        {activeCount > 0 && (
          <Badge className={cn("text-xs h-5 px-1.5 rounded-full ml-0.5", theme.badgeBg, theme.badgeText)}>
            {activeCount}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className={cn("w-full sm:max-w-sm overflow-y-auto", theme.pageBg)}>
          <SheetHeader>
            <SheetTitle className={cn("flex items-center gap-2", theme.text, theme.headingClass)}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              {t("catalog.filtersLabel")}
              {activeCount > 0 && (
                <Badge className={cn("text-xs h-5 px-1.5 rounded-full", theme.badgeBg, theme.badgeText)}>
                  {activeCount}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {t("catalog.filterSheetDescription")}
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 py-4">
            <ProductFilters
              categories={categories}
              filters={filters}
              onFiltersChange={(f) => {
                onFiltersChange(f);
              }}
              maxPriceLimit={maxPriceLimit}
            />
          </div>

          {activeCount > 0 && (
            <div className={cn("px-6 py-4 border-t mt-auto", theme.border)}>
              <Button
                variant="ghost"
                className={cn("w-full cursor-pointer", theme.btnPrimary)}
                onClick={() => setOpen(false)}
              >
                {t("catalog.showResults")}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
