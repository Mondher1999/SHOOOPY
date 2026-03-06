"use client";

import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  return (
    <Select value={value ?? "newest"} onValueChange={(v) => onChange(v as SortValue)}>
      <SelectTrigger className="w-40" aria-label={t("catalog.sortLabel")}>
        <SelectValue placeholder={t("catalog.sortLabel")} />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {t(opt.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
