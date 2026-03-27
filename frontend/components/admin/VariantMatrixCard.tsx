"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Grid3X3, RefreshCw, Package, Layers, ToggleLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { COLOR_MAP, isColorAttr } from "@/lib/colorMap";
import type { ProductVariant, ProductTypeCatalog } from "@/types";

type VariantMode = "none" | "simple" | "advanced";

interface VariantMatrixCardProps {
  productType: string;
  typeCatalog: ProductTypeCatalog;
  dynamicAttrs: Record<string, string | string[]>;
  variantMode: VariantMode;
  variants: ProductVariant[];
  onVariantModeChange: (mode: VariantMode) => void;
  onVariantsChange: (variants: ProductVariant[]) => void;
}

/**
 * Generates the Cartesian product of multi-select attributes with >1 value.
 */
function generateCombinations(axes: Record<string, string[]>): Record<string, string>[] {
  const keys = Object.keys(axes);
  if (keys.length === 0) return [];

  const result: Record<string, string>[] = [];
  const values = keys.map((k) => axes[k]);

  function recurse(depth: number, current: Record<string, string>) {
    if (depth === keys.length) {
      result.push({ ...current });
      return;
    }
    for (const val of values[depth]) {
      current[keys[depth]] = val;
      recurse(depth + 1, current);
    }
  }

  recurse(0, {});
  return result;
}

function comboKey(combo: Record<string, string>): string {
  const sorted = Object.keys(combo)
    .sort()
    .reduce<Record<string, string>>((acc, k) => {
      acc[k] = combo[k];
      return acc;
    }, {});
  return JSON.stringify(sorted);
}

/**
 * Generates per-option variants for simple mode.
 * Each unique option value gets its own variant with a single-key optionCombo.
 */
function generateSimpleVariants(
  axes: Record<string, string[]>,
  existing: ProductVariant[]
): ProductVariant[] {
  const existingMap = new Map<string, ProductVariant>();
  for (const v of existing) {
    existingMap.set(comboKey(v.optionCombo), v);
  }

  const variants: ProductVariant[] = [];
  for (const [attrKey, values] of Object.entries(axes)) {
    for (const val of values) {
      const combo = { [attrKey]: val };
      const key = comboKey(combo);
      const ex = existingMap.get(key);
      if (ex) {
        variants.push({ ...ex, optionCombo: combo });
      } else {
        variants.push({
          _id: `temp_${Math.random().toString(36).slice(2, 10)}`,
          optionCombo: combo,
          stock: 0,
          sku: null,
          enabled: true,
        });
      }
    }
  }
  return variants;
}

export default function VariantMatrixCard({
  productType,
  typeCatalog,
  dynamicAttrs,
  variantMode,
  variants,
  onVariantModeChange,
  onVariantsChange,
}: VariantMatrixCardProps) {
  const { t } = useTranslation("products");
  const [bulkStock, setBulkStock] = useState("");
  const [pendingMode, setPendingMode] = useState<VariantMode | null>(null);

  const typeDef = typeCatalog[productType];

  // Find multi-select attributes with >1 selected value — these become variant axes
  const variantAxes = useMemo(() => {
    if (!typeDef) return {};
    const axes: Record<string, string[]> = {};
    for (const attr of typeDef.attributes) {
      if (attr.type !== "multi-select") continue;
      const val = dynamicAttrs[attr.key];
      if (Array.isArray(val) && val.length > 1) {
        axes[attr.key] = val;
      }
    }
    return axes;
  }, [typeDef, dynamicAttrs]);

  const axisKeys = Object.keys(variantAxes);
  const hasAxes = axisKeys.length > 0;

  const combinationCount = useMemo(() => {
    if (!hasAxes) return 0;
    return Object.values(variantAxes).reduce((acc, vals) => acc * vals.length, 1);
  }, [variantAxes, hasAxes]);

  const totalStock = useMemo(() => {
    if (variantMode === "advanced") {
      return variants.filter((v) => v.enabled).reduce((sum, v) => sum + v.stock, 0);
    }
    return variants.reduce((sum, v) => sum + v.stock, 0);
  }, [variants, variantMode]);

  // ── Mode switching with confirmation ──
  const handleModeChange = useCallback(
    (newMode: VariantMode) => {
      if (newMode === variantMode) return;

      // If there are existing variants and switching away, confirm
      if (variants.length > 0 && variantMode !== "none") {
        setPendingMode(newMode);
        return;
      }

      // Direct switch (no data to lose)
      applyModeChange(newMode);
    },
    [variantMode, variants]
  );

  const applyModeChange = useCallback(
    (newMode: VariantMode) => {
      setPendingMode(null);
      onVariantModeChange(newMode);

      if (newMode === "none") {
        onVariantsChange([]);
      } else if (newMode === "simple") {
        onVariantsChange(generateSimpleVariants(variantAxes, []));
      } else if (newMode === "advanced") {
        // Generate Cartesian combos
        const combos = generateCombinations(variantAxes);
        onVariantsChange(
          combos.map((combo) => ({
            _id: `temp_${Math.random().toString(36).slice(2, 10)}`,
            optionCombo: combo,
            stock: 0,
            sku: null,
            enabled: true,
          }))
        );
      }
    },
    [variantAxes, onVariantModeChange, onVariantsChange]
  );

  const confirmModeSwitch = useCallback(() => {
    if (pendingMode) applyModeChange(pendingMode);
  }, [pendingMode, applyModeChange]);

  const cancelModeSwitch = useCallback(() => {
    setPendingMode(null);
  }, []);

  // ── Generate / Regenerate for advanced mode ──
  const handleGenerate = useCallback(() => {
    const combos = generateCombinations(variantAxes);
    const existingMap = new Map<string, ProductVariant>();
    for (const v of variants) {
      existingMap.set(comboKey(v.optionCombo), v);
    }

    const newVariants: ProductVariant[] = combos.map((combo) => {
      const key = comboKey(combo);
      const existing = existingMap.get(key);
      if (existing) {
        return { ...existing, optionCombo: combo };
      }
      return {
        _id: `temp_${Math.random().toString(36).slice(2, 10)}`,
        optionCombo: combo,
        stock: 0,
        sku: null,
        enabled: true,
      };
    });

    onVariantsChange(newVariants);
  }, [variantAxes, variants, onVariantsChange]);

  // ── Regenerate for simple mode ──
  const handleRegenerateSimple = useCallback(() => {
    onVariantsChange(generateSimpleVariants(variantAxes, variants));
  }, [variantAxes, variants, onVariantsChange]);

  // ── Shared handlers ──
  const handleVariantStockChange = useCallback(
    (index: number, stock: number) => {
      const updated = [...variants];
      updated[index] = { ...updated[index], stock: Math.max(0, stock) };
      onVariantsChange(updated);
    },
    [variants, onVariantsChange]
  );

  const handleVariantSkuChange = useCallback(
    (index: number, sku: string) => {
      const updated = [...variants];
      updated[index] = { ...updated[index], sku: sku || null };
      onVariantsChange(updated);
    },
    [variants, onVariantsChange]
  );

  const handleVariantEnabledChange = useCallback(
    (index: number, enabled: boolean) => {
      const updated = [...variants];
      updated[index] = { ...updated[index], enabled };
      onVariantsChange(updated);
    },
    [variants, onVariantsChange]
  );

  const handleBulkSetStock = useCallback(() => {
    const stockVal = parseInt(bulkStock);
    if (isNaN(stockVal) || stockVal < 0) return;
    const updated = variants.map((v) => ({ ...v, stock: stockVal }));
    onVariantsChange(updated);
    setBulkStock("");
  }, [bulkStock, variants, onVariantsChange]);

  const handleBulkEnableAll = useCallback(() => {
    onVariantsChange(variants.map((v) => ({ ...v, enabled: true })));
  }, [variants, onVariantsChange]);

  const handleBulkDisableAll = useCallback(() => {
    onVariantsChange(variants.map((v) => ({ ...v, enabled: false })));
  }, [variants, onVariantsChange]);

  if (!typeDef) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Grid3X3 className="h-4 w-4" aria-hidden="true" />
            {t("variants.title")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAxes && (
          <p className="text-sm text-muted-foreground">
            {t("variants.noMultiSelectAxes")}
          </p>
        )}

        {hasAxes && (
          <>
            {/* 3-mode segmented control */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg" role="radiogroup" aria-label={t("variants.title")}>
              <ModeButton
                mode="none"
                current={variantMode}
                onClick={handleModeChange}
                icon={<ToggleLeft className="h-3.5 w-3.5" aria-hidden="true" />}
                label={t("variants.modeNone")}
              />
              <ModeButton
                mode="simple"
                current={variantMode}
                onClick={handleModeChange}
                icon={<Layers className="h-3.5 w-3.5" aria-hidden="true" />}
                label={t("variants.modeSimple")}
              />
              <ModeButton
                mode="advanced"
                current={variantMode}
                onClick={handleModeChange}
                icon={<Grid3X3 className="h-3.5 w-3.5" aria-hidden="true" />}
                label={t("variants.modeAdvanced")}
              />
            </div>

            {/* Confirm dialog for mode switch with existing data */}
            {pendingMode && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 space-y-2">
                <p className="text-sm font-medium text-destructive">
                  {t("variants.switchModeWarning")}
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="destructive" size="sm" onClick={confirmModeSwitch}>
                    {t("common:actions.confirm")}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={cancelModeSwitch}>
                    {t("common:actions.cancel")}
                  </Button>
                </div>
              </div>
            )}

            {/* ── SIMPLE MODE: per-option stock editor ── */}
            {variantMode === "simple" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateSimple}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                    {variants.length > 0 ? t("variants.regenerate") : t("variants.generate")}
                  </Button>
                </div>

                {variants.length > 0 && (
                  <>
                    {/* Group variants by attribute key */}
                    {axisKeys.map((attrKey) => {
                      const attrVariants = variants.filter((v) => {
                        const keys = Object.keys(v.optionCombo);
                        return keys.length === 1 && keys[0] === attrKey;
                      });
                      if (attrVariants.length === 0) return null;

                      const attrLabel = t(`typeAttrs.${attrKey}`, { defaultValue: attrKey });

                      return (
                        <div key={attrKey} className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {attrLabel}
                          </p>
                          <div className="space-y-1.5">
                            {attrVariants.map((variant) => {
                              const val = Object.values(variant.optionCombo)[0];
                              const globalIdx = variants.indexOf(variant);
                              const colorVal = isColorAttr(attrKey) ? COLOR_MAP[val] : null;

                              return (
                                <div
                                  key={variant._id}
                                  className="flex items-center gap-3 rounded-lg border px-3 py-2"
                                >
                                  {colorVal && (
                                    <span
                                      className="h-4 w-4 rounded-full border border-border flex-shrink-0"
                                      style={{ backgroundColor: colorVal }}
                                      aria-hidden="true"
                                    />
                                  )}
                                  <span className="text-sm font-medium flex-1 min-w-0 truncate">
                                    {val}
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <Input
                                      type="number"
                                      min="0"
                                      value={variant.stock}
                                      onChange={(e) => handleVariantStockChange(globalIdx, parseInt(e.target.value) || 0)}
                                      className="h-8 text-xs w-20"
                                      aria-label={t("variants.simpleStockLabel", { value: val })}
                                    />
                                    <span className="text-xs text-muted-foreground">{t("variants.units")}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Total stock summary */}
                    <div className="flex items-center gap-2 text-sm pt-2 border-t">
                      <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span className="text-muted-foreground">{t("variants.totalStock")}:</span>
                      <span className="font-semibold">{totalStock}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── ADVANCED MODE: full combination matrix ── */}
            {variantMode === "advanced" && (
              <div className="space-y-4">
                {/* Generate / Regenerate button */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                    {variants.length > 0 ? t("variants.regenerate") : t("variants.generate")}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {t("variants.combinationCount", { count: combinationCount })}
                  </span>
                  {combinationCount > 50 && (
                    <Badge variant="destructive" className="text-xs">
                      {t("variants.tooManyCombinations")}
                    </Badge>
                  )}
                </div>

                {/* Variant table */}
                {variants.length > 0 && (
                  <>
                    {/* Bulk actions */}
                    <div className="flex items-center gap-2 flex-wrap border-b pb-3">
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min="0"
                          value={bulkStock}
                          onChange={(e) => setBulkStock(e.target.value)}
                          placeholder={t("variants.bulkSetStock")}
                          className="w-28 h-8 text-xs"
                        />
                        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={handleBulkSetStock}>
                          {t("variants.applyAll")}
                        </Button>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={handleBulkEnableAll}>
                        {t("variants.bulkEnableAll")}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={handleBulkDisableAll}>
                        {t("variants.bulkDisableAll")}
                      </Button>
                    </div>

                    {/* Summary */}
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span className="text-muted-foreground">{t("variants.totalStock")}:</span>
                      <span className="font-semibold">{totalStock}</span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-2.5 px-3 font-medium">{t("variants.columnCombo")}</th>
                            <th className="text-left py-2.5 px-3 font-medium w-32">{t("variants.columnSku")}</th>
                            <th className="text-left py-2.5 px-3 font-medium w-24">{t("variants.columnStock")}</th>
                            <th className="text-center py-2.5 px-3 font-medium w-20">{t("variants.columnEnabled")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variants.map((variant, idx) => (
                            <tr
                              key={variant._id}
                              className={cn(
                                "border-t",
                                !variant.enabled && "opacity-50 bg-muted/30"
                              )}
                            >
                              <td className="py-2 px-3">
                                <div className="flex flex-wrap gap-1.5">
                                  {Object.entries(variant.optionCombo).map(([attrKey, attrVal]) => {
                                    const colorVal = isColorAttr(attrKey) ? COLOR_MAP[attrVal] : null;
                                    return (
                                      <Badge key={attrKey} variant="secondary" className="flex items-center gap-1.5 text-xs">
                                        {colorVal && (
                                          <span
                                            className="h-3 w-3 rounded-full border border-border flex-shrink-0"
                                            style={{ backgroundColor: colorVal }}
                                            aria-hidden="true"
                                          />
                                        )}
                                        {attrVal}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  type="text"
                                  value={variant.sku ?? ""}
                                  onChange={(e) => handleVariantSkuChange(idx, e.target.value)}
                                  placeholder="SKU"
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  type="number"
                                  min="0"
                                  value={variant.stock}
                                  onChange={(e) => handleVariantStockChange(idx, parseInt(e.target.value) || 0)}
                                  className="h-8 text-xs w-20"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <Switch
                                  checked={variant.enabled}
                                  onCheckedChange={(checked) => handleVariantEnabledChange(idx, checked)}
                                  aria-label={`${t("variants.columnEnabled")} ${Object.values(variant.optionCombo).join(" + ")}`}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* NONE mode: show nothing — admin uses global stock input */}
            {variantMode === "none" && (
              <p className="text-sm text-muted-foreground">
                {t("variants.noneDescription")}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Mode Button (segmented control item) ─────────────────────────────────────

interface ModeButtonProps {
  mode: VariantMode;
  current: VariantMode;
  onClick: (mode: VariantMode) => void;
  icon: React.ReactNode;
  label: string;
}

function ModeButton({ mode, current, onClick, icon, label }: ModeButtonProps) {
  const isActive = mode === current;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      onClick={() => onClick(mode)}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
