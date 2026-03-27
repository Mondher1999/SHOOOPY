"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import type { ThemeStyles } from "@/hooks/useActiveTheme";
import type { PaginationInfo } from "@/types";

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  /** Override specific theme colors (e.g. for dark-background views) */
  themeOverrides?: Partial<ThemeStyles>;
}

export function Pagination({ pagination, onPageChange, themeOverrides }: PaginationProps) {
  const { t } = useTranslation("products");
  const baseTheme = useActiveTheme();
  const theme = themeOverrides ? { ...baseTheme, ...themeOverrides } : baseTheme;
  const { page, pages, total } = pagination;
  if (pages <= 1) return null;

  const pageNumbers = Array.from({ length: Math.min(pages, 7) }, (_, i) => {
    if (pages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= pages - 3) return pages - 6 + i;
    return page - 3 + i;
  });

  return (
    <nav aria-label={t("catalog.paginationLabel")} className="flex items-center justify-center gap-1 mt-8">
      <span className={cn("text-sm mr-2", theme.textMuted)}>
        {t("catalog.paginationTotal", { total })}
      </span>
      <Button
        variant="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label={t("catalog.prevPage")}
        className={cn(theme.btnOutline)}
      >
        &#8249;
      </Button>
      {pageNumbers.map((n) => (
        <Button
          key={n}
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(n)}
          aria-current={n === page ? "page" : undefined}
          className={cn(
            "w-8",
            n === page
              ? cn(theme.badgeBg, theme.badgeText, "hover:opacity-90")
              : theme.btnOutline
          )}
        >
          {n}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
        aria-label={t("catalog.nextPage")}
        className={cn(theme.btnOutline)}
      >
        &#8250;
      </Button>
    </nav>
  );
}
