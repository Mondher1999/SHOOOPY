"use client";

import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import type { ProductQueryParams } from "@/types";

type SortValue = NonNullable<ProductQueryParams["sort"]>;

interface ProductSortProps {
  value: SortValue | undefined;
  onChange: (value: SortValue) => void;
}

const SORT_OPTIONS: { value: SortValue; labelKey: string }[] = [
  { value: "newest", labelKey: "catalog.sortNewest" },
  { value: "price_asc", labelKey: "catalog.sortPriceAsc" },
  { value: "price_desc", labelKey: "catalog.sortPriceDesc" },
  { value: "rating", labelKey: "catalog.sortTopRated" },
];

export function ProductSort({ value, onChange }: ProductSortProps) {
  const { t } = useTranslation("products");
  const theme = useActiveTheme();
  return (
    <Select value={value ?? "newest"} onValueChange={(v) => onChange(v as SortValue)}>
      <SelectTrigger className={cn("w-40", theme.border, theme.text, theme.bodyClass)} aria-label={t("catalog.sortLabel")} suppressHydrationWarning>
        <SelectValue placeholder={t("catalog.sortLabel")} />
      </SelectTrigger>
      <SelectContent className={cn(theme.surface, theme.border)}>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className={cn(theme.text)}>
            {t(opt.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
