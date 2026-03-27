"use client";

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { COLOR_MAP, isColorAttr } from "@/lib/colorMap";

interface SelectedOptionsSummaryProps {
  selectedOptions: Record<string, string | string[]>;
}

/**
 * Compact summary bar showing selected variant options above the "Add to Cart" button.
 * Displays color swatches inline for color values.
 */
export function SelectedOptionsSummary({ selectedOptions }: SelectedOptionsSummaryProps) {
  const { t } = useTranslation("products");

  // Filter to only show options with values
  const entries = Object.entries(selectedOptions).filter(([, v]) => {
    if (typeof v === "string") return v.length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return false;
  });

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2 rounded-md bg-muted/50 border border-border/50">
      {entries.map(([key, rawValue]) => {
        const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
        const label = t(`typeAttrs.${key}`, { defaultValue: key });
        const colorHex = isColorAttr(key) ? COLOR_MAP[value] : null;
        const isGradient = colorHex?.includes("gradient") || colorHex?.includes("conic");

        return (
          <Badge key={key} variant="secondary" className="text-xs gap-1.5 py-1 px-2.5">
            <span className="text-muted-foreground">{label}:</span>
            {colorHex && (
              <span
                className="inline-block h-3 w-3 rounded-full border border-border/50 flex-shrink-0"
                style={{
                  background: isGradient ? colorHex : undefined,
                  backgroundColor: !isGradient ? colorHex : undefined,
                }}
                aria-hidden="true"
              />
            )}
            <span className="font-semibold">{t(`typeAttrOptions.${value}`, { defaultValue: value })}</span>
          </Badge>
        );
      })}
    </div>
  );
}
