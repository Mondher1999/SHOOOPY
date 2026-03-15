"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, AlertCircle, ChevronDown, ChevronRight, EyeOff } from "lucide-react";
import {
  getAllCategoriesAPI,
  createCategoryAPI,
  updateCategoryAPI,
  deleteCategoryAPI,
} from "@/services/category-service";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";

interface CategoryFormState {
  name: string;
  description: string;
  parent: string;
  image: string;
  isActive: boolean;
}

const emptyForm: CategoryFormState = {
  name: "",
  description: "",
  parent: "",
  image: "",
  isActive: true,
};

// ── CategoryListRow ─────────────────────────────────────────────────────────
// Extracted as a standalone component so webpack generates a separate chunk,
// busting browser cache when this file changes (prevents stale rendering).
// Uses inline styles for all critical colors — avoids CSS-variable specificity
// battles inside .admin-polaris (see globals.css Problem 1 notes).
interface RowProps {
  cat: Category;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isLast: boolean;
  onToggleExpand: (id: string) => void;
  onToggleActive: (cat: Category) => void;
  onAddChild: (parentId: string) => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}

function CategoryListRow({
  cat,
  depth,
  hasChildren,
  isExpanded,
  isLast,
  onToggleExpand,
  onToggleActive,
  onAddChild,
  onEdit,
  onDelete,
}: RowProps) {
  const { t } = useTranslation("categories");
  const indentPx = depth * 28;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        minHeight: "52px",
        paddingTop: "8px",
        paddingBottom: "8px",
        paddingRight: "12px",
        paddingLeft: `${12 + indentPx}px`,
        gap: "6px",
        background: "transparent",
        transition: "background-color 0.15s",
      }}
      className={`group hover:bg-polaris-surface-hovered ${isLast ? "" : "border-b border-polaris-border-subdued"}`}
    >
      {/* Expand/collapse chevron — only visible on root categories with children */}
      <button
        type="button"
        onClick={() => hasChildren && onToggleExpand(cat.id)}
        style={{
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          cursor: hasChildren ? "pointer" : "default",
          color: "var(--polaris-icon)",
          background: "none",
          border: "none",
          padding: 0,
          visibility: hasChildren ? "visible" : "hidden",
          borderRadius: "4px",
        }}
        aria-label={isExpanded ? t("tree.collapse") : t("tree.expand")}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        {isExpanded ? (
          <ChevronDown style={{ width: "14px", height: "14px" }} />
        ) : (
          <ChevronRight style={{ width: "14px", height: "14px" }} />
        )}
      </button>

      {/* Eye-off indicator for hidden/inactive categories */}
      <div style={{ width: "16px", flexShrink: 0, display: "flex", justifyContent: "center" }}>
        {!cat.isActive && (
          <EyeOff style={{ width: "13px", height: "13px", color: "var(--polaris-icon-subdued)" }} />
        )}
      </div>

      {/* Name + optional description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "14px",
              fontWeight: depth === 0 ? 500 : 400,
              color: cat.isActive ? "var(--polaris-text)" : "var(--polaris-text-subdued)",
              lineHeight: "20px",
            }}
          >
            {cat.name}
          </span>
          <Badge variant={cat.isActive ? "success" : "secondary"}>
            {cat.isActive ? t("status.active") : t("status.inactive")}
          </Badge>
        </div>
        {cat.description && (
          <p
            style={{
              fontSize: "12px",
              color: "var(--polaris-text-subdued)",
              margin: 0,
              lineHeight: "16px",
              marginTop: "1px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "480px",
            }}
          >
            {cat.description}
          </p>
        )}
      </div>

      {/* Right-side actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
        {/* Active/inactive toggle */}
        <Switch
          checked={cat.isActive}
          onCheckedChange={() => onToggleActive(cat)}
          aria-label={cat.isActive ? t("actions.hidden") : t("actions.visible")}
        />

        {/* Add subcategory */}
        <button
          type="button"
          onClick={() => onAddChild(cat.id)}
          style={{
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            border: "none",
            background: "none",
            color: "var(--polaris-icon)",
            cursor: "pointer",
          }}
          className="hover:bg-polaris-surface-hovered transition-colors"
          title={t("actions.addChild")}
          aria-label={t("actions.addChild")}
        >
          <Plus style={{ width: "13px", height: "13px" }} />
        </button>

        {/* Edit */}
        <button
          type="button"
          onClick={() => onEdit(cat)}
          style={{
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            border: "none",
            background: "none",
            color: "var(--polaris-icon)",
            cursor: "pointer",
          }}
          className="hover:bg-polaris-surface-hovered transition-colors"
          title={t("actions.edit")}
          aria-label={t("actions.edit")}
        >
          <Pencil style={{ width: "13px", height: "13px" }} />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(cat)}
          style={{
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            border: "none",
            background: "none",
            color: "var(--polaris-critical)",
            cursor: "pointer",
          }}
          className="hover:bg-polaris-critical-light transition-colors"
          title={t("actions.delete")}
          aria-label={t("actions.delete")}
        >
          <Trash2 style={{ width: "13px", height: "13px" }} />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCategoriesPage() {
  const { t } = useTranslation(["categories", "common"]);
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [formState, setFormState] = useState<CategoryFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAllCategoriesAPI();
      const cats: Category[] = res.data;
      setCategories(cats);
      // Auto-expand all root categories on first load
      const rootIds = cats.filter((c) => !c.parent).map((c) => c.id);
      setExpandedIds(new Set(rootIds));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common:errors.generic");
      setError(msg);
      logger.error("getAllCategories failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Optimistic toggle: flip locally, call API, revert if it fails
  const handleToggleActive = useCallback(
    async (cat: Category) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
      );
      try {
        await updateCategoryAPI(cat.id, { isActive: !cat.isActive });
      } catch (err) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, isActive: cat.isActive } : c))
        );
        toast({ title: t("common:errors.generic"), variant: "destructive" });
        logger.error("toggleActive failed:", err);
      }
    },
    [toast, t]
  );

  const openCreate = useCallback((parentId = "") => {
    setEditTarget(null);
    setFormState({ ...emptyForm, parent: parentId });
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((cat: Category) => {
    setEditTarget(cat);
    setFormState({
      name: cat.name,
      description: cat.description || "",
      parent: typeof cat.parent === "string" ? cat.parent : (cat.parent as Category)?.id ?? "",
      image: cat.image ?? "",
      isActive: cat.isActive,
    });
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      setFormError(t("categories:validation.nameRequired"));
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        name: formState.name.trim(),
        description: formState.description.trim(),
        parent: formState.parent || null,
        image: formState.image.trim() || null,
        isActive: formState.isActive,
      };
      if (editTarget) {
        await updateCategoryAPI(editTarget.id, payload);
        toast({ title: t("categories:actions.successUpdated") });
      } else {
        await createCategoryAPI(payload);
        toast({ title: t("categories:actions.successCreated") });
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common:errors.generic");
      setFormError(msg);
      logger.error("categoryForm submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCategoryAPI(deleteTarget.id);
      toast({ title: t("categories:actions.successDeleted") });
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common:errors.generic");
      toast({ title: msg, variant: "destructive" });
      logger.error("deleteCategory failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Pre-compute which categories have children (O(n) lookup table)
  const hasChildrenMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    categories.forEach((c) => {
      const pid = typeof c.parent === "string" ? c.parent : (c.parent as Category)?.id;
      if (pid) map[pid] = true;
    });
    return map;
  }, [categories]);

  // Build a flat ordered display list: root → expanded children (depth-first)
  const displayList = useMemo(() => {
    const result: Array<{ cat: Category; depth: number }> = [];
    const addItem = (cat: Category, depth: number) => {
      result.push({ cat, depth });
      if (expandedIds.has(cat.id)) {
        const children = categories.filter((c) => {
          const pid = typeof c.parent === "string" ? c.parent : (c.parent as Category)?.id;
          return pid === cat.id;
        });
        children.forEach((child) => addItem(child, depth + 1));
      }
    };
    categories.filter((c) => !c.parent).forEach((cat) => addItem(cat, 0));
    return result;
  }, [categories, expandedIds]);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-polaris-text">{t("categories:title")}</h1>
          <p className="text-sm text-polaris-text-subdued mt-1">{t("categories:subtitle")}</p>
        </div>
        <Button onClick={() => openCreate()}>
          <Plus className="h-4 w-4 mr-2" />
          {t("categories:addButton")}
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="ml-2 text-sm">{error}</p>
        </Alert>
      )}

      {/* Loading skeletons — mimic the list rows */}
      {isLoading && (
        <div className="bg-polaris-surface border border-polaris-border rounded-lg overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`px-3 py-3.5 ${i < 4 ? "border-b border-polaris-border-subdued" : ""}`}>
              <Skeleton className="h-5 w-48" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && categories.length === 0 && !error && (
        <div className="bg-polaris-surface border border-polaris-border rounded-lg shadow-sm py-12 px-6 text-center">
          <p className="text-sm text-polaris-text-subdued">{t("categories:empty")}</p>
        </div>
      )}

      {/* ── One card per root category ────────────────────────────────── */}
      {!isLoading && displayList.length > 0 && (() => {
        // Split flat displayList into groups by root (depth === 0)
        const groups: Array<typeof displayList> = [];
        displayList.forEach((item) => {
          if (item.depth === 0) groups.push([item]);
          else groups[groups.length - 1]?.push(item);
        });
        return (
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group[0].cat.id}
                className="bg-polaris-surface border border-polaris-border rounded-lg shadow-sm overflow-hidden"
              >
                {group.map(({ cat, depth }, index) => (
                  <CategoryListRow
                    key={cat.id}
                    cat={cat}
                    depth={depth}
                    hasChildren={!!hasChildrenMap[cat.id]}
                    isExpanded={expandedIds.has(cat.id)}
                    isLast={index === group.length - 1}
                    onToggleExpand={toggleExpand}
                    onToggleActive={handleToggleActive}
                    onAddChild={openCreate}
                    onEdit={openEdit}
                    onDelete={(c) => setDeleteTarget(c)}
                  />
                ))}
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Create / Edit Dialog ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent>
          <h2 className="text-base font-semibold text-polaris-text mb-4">
            {editTarget ? t("categories:form.editTitle") : t("categories:form.createTitle")}
          </h2>

          {formError && (
            <Alert variant="destructive" role="alert" className="mb-3">
              <p className="text-sm">{formError}</p>
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="cat-name">
                  {t("categories:form.nameLabel")} <span aria-hidden="true">*</span>
                </Label>
                <Input
                  id="cat-name"
                  placeholder={t("categories:form.namePlaceholder")}
                  aria-required="true"
                  value={formState.name}
                  onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cat-description">{t("categories:form.descriptionLabel")}</Label>
                <Input
                  id="cat-description"
                  placeholder={t("categories:form.descriptionPlaceholder")}
                  value={formState.description}
                  onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cat-parent">{t("categories:form.parentLabel")}</Label>
                <select
                  id="cat-parent"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formState.parent}
                  onChange={(e) => setFormState((s) => ({ ...s, parent: e.target.value }))}
                >
                  <option value="">{t("categories:noParent")}</option>
                  {categories
                    .filter((c) => !editTarget || c.id !== editTarget.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="cat-image">{t("categories:form.imageLabel")}</Label>
                <Input
                  id="cat-image"
                  placeholder={t("categories:form.imagePlaceholder")}
                  value={formState.image}
                  onChange={(e) => setFormState((s) => ({ ...s, image: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cat-isActive"
                  checked={formState.isActive}
                  onChange={(e) => setFormState((s) => ({ ...s, isActive: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="cat-isActive">{t("categories:form.isActiveLabel")}</Label>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                {t("common:actions.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t("categories:form.submitting")
                  : editTarget
                  ? t("categories:form.submitEdit")
                  : t("categories:form.submitCreate")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ──────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <h2 className="text-base font-semibold text-polaris-text mb-2">
            {t("categories:actions.confirmDelete")}
          </h2>
          {deleteTarget && (
            <p className="text-sm text-polaris-text-subdued mb-4">
              {t("categories:actions.confirmDeleteMessage", { name: deleteTarget.name })}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              {t("common:actions.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? t("common:actions.loading") : t("categories:actions.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
