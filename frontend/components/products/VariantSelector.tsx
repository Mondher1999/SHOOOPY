"use client";

import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_MAP, isColorAttr } from "@/lib/colorMap";
import type { Product, ProductTypeCatalog, ProductTypeAttribute } from "@/types";

interface VariantSelectorProps {
  product: Product;
  typeCatalog?: ProductTypeCatalog | null;
  selectedOptions?: Record<string, string | string[]>;
  onOptionChange?: (key: string, value: string | string[]) => void;
}

export function VariantSelector({
  product,
  typeCatalog,
  selectedOptions,
  onOptionChange,
}: VariantSelectorProps) {
  const { t } = useTranslation("products");

  if (!product.productType || !typeCatalog || !selectedOptions || !onOptionChange) return null;

  const typeDef = typeCatalog[product.productType];
  if (!typeDef) return null;

  // Only show selectable attributes (multi-select and select) that have values in the product
  const selectableAttrs = typeDef.attributes.filter(
    (attr) =>
      (attr.type === "multi-select" || attr.type === "select") &&
      product.attributes[attr.key] !== undefined &&
      product.attributes[attr.key] !== null &&
      (Array.isArray(product.attributes[attr.key])
        ? (product.attributes[attr.key] as string[]).length > 0
        : String(product.attributes[attr.key]).length > 0)
  );

  if (selectableAttrs.length === 0) return null;

  return (
    <div className="space-y-5">
      {selectableAttrs.map((attr) => (
        <AttributeSelector
          key={attr.key}
          attr={attr}
          availableValues={product.attributes[attr.key]}
          selectedValue={selectedOptions[attr.key]}
          onChange={(val) => onOptionChange(attr.key, val)}
          t={t}
        />
      ))}
    </div>
  );
}

// ─── Single Attribute Selector ───────────────────────────────────────────────

interface AttributeSelectorProps {
  attr: ProductTypeAttribute;
  availableValues: string | string[] | number | boolean;
  selectedValue: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  t: (key: string, opts?: Record<string, string>) => string;
}

function AttributeSelector({ attr, availableValues, selectedValue, onChange, t }: AttributeSelectorProps) {
  const label = t(`typeAttrs.${attr.key}`, { defaultValue: attr.label });

  // Normalize available options
  const options: string[] = Array.isArray(availableValues)
    ? availableValues
    : typeof availableValues === "string" && attr.options?.includes(availableValues)
    ? [availableValues]
    : attr.options?.filter((o) => o === String(availableValues)) ?? [];

  if (options.length === 0) return null;

  // For select attributes, only one option can be chosen
  if (attr.type === "select") {
    const current = typeof selectedValue === "string" ? selectedValue : "";
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
          {label}
          {current && (
            <span className="ml-2 font-normal normal-case tracking-normal text-foreground">
              {current}
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <OptionChip
              key={opt}
              label={opt}
              isSelected={current === opt}
              isColor={isColorAttr(attr.key)}
              onClick={() => onChange(opt === current ? "" : opt)}
            />
          ))}
        </div>
      </div>
    );
  }

  // For multi-select, customer picks ONE from the available options (their preferred choice)
  if (attr.type === "multi-select") {
    const current = typeof selectedValue === "string" ? selectedValue : "";
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
          {label}
          {current && (
            <span className="ml-2 font-normal normal-case tracking-normal text-foreground">
              {current}
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <OptionChip
              key={opt}
              label={opt}
              isSelected={current === opt}
              isColor={isColorAttr(attr.key)}
              onClick={() => onChange(opt === current ? "" : opt)}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Option Chip ─────────────────────────────────────────────────────────────

interface OptionChipProps {
  label: string;
  isSelected: boolean;
  isColor: boolean;
  onClick: () => void;
}

function OptionChip({ label, isSelected, isColor, onClick }: OptionChipProps) {
  const colorValue = isColor ? COLOR_MAP[label] : null;
  const isGradient = colorValue?.includes("gradient") || colorValue?.includes("conic");
  const isClear = label === "Clear" || label === "White";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 rounded-lg border-2 px-3.5 py-2.5 text-sm font-medium transition-all cursor-pointer",
        "hover:border-foreground/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "min-h-[44px]",
        isSelected
          ? "border-foreground bg-foreground/5 ring-1 ring-foreground/10"
          : "border-border bg-background"
      )}
      aria-pressed={isSelected}
      aria-label={label}
    >
      {/* Color swatch */}
      {isColor && colorValue && (
        <span
          className={cn(
            "h-5 w-5 rounded-full flex-shrink-0 border",
            isClear ? "border-border" : "border-transparent"
          )}
          style={{
            background: isGradient ? colorValue : undefined,
            backgroundColor: !isGradient ? colorValue : undefined,
          }}
          aria-hidden="true"
        />
      )}

      {/* Label */}
      <span className="uppercase text-xs font-bold tracking-wide">{label}</span>

      {/* Checkmark */}
      {isSelected && (
        <Check className="h-3.5 w-3.5 text-foreground flex-shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}
