"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, AlertCircle, ChevronRight } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function AdminCategoriesPage() {
  const { t } = useTranslation(["categories", "common"]);
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setCategories(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common:errors.generic");
      setError(msg);
      logger.error("getAllCategories failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = () => {
    setEditTarget(null);
    setFormState(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
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
  };

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

  const getParentName = (cat: Category) => {
    if (!cat.parent) return null;
    const parentId = typeof cat.parent === "string" ? cat.parent : (cat.parent as Category).id;
    return categories.find((c) => c.id === parentId)?.name ?? null;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("categories:title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("categories:subtitle")}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t("categories:addButton")}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="ml-2 text-sm">{error}</p>
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && categories.length === 0 && !error && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>{t("categories:empty")}</p>
          </CardContent>
        </Card>
      )}

      {/* Category list — grouped by parent */}
      {!isLoading && categories.length > 0 && (
        <div className="space-y-3">
          {/* Root categories first */}
          {categories
            .filter((cat) => !cat.parent)
            .map((cat) => {
              const children = categories.filter((c) => {
                const pid = typeof c.parent === "string" ? c.parent : (c.parent as Category)?.id;
                return pid === cat.id;
              });
              return (
                <Card key={cat.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{cat.name}</CardTitle>
                        <Badge variant={cat.isActive ? "success" : "secondary"}>
                          {cat.isActive
                            ? t("categories:status.active")
                            : t("categories:status.inactive")}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(cat)}
                          aria-label={t("categories:actions.edit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(cat)}
                          aria-label={t("categories:actions.delete")}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    )}
                  </CardHeader>

                  {/* Subcategories */}
                  {children.length > 0 && (
                    <CardContent className="pt-0 space-y-2">
                      {children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between pl-4 py-1 border-l-2 border-muted"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{child.name}</span>
                            <Badge
                              variant={child.isActive ? "success" : "secondary"}
                              className="text-xs"
                            >
                              {child.isActive
                                ? t("categories:status.active")
                                : t("categories:status.inactive")}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(child)}
                              aria-label={t("categories:actions.edit")}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(child)}
                              aria-label={t("categories:actions.delete")}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              );
            })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-4">
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

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-2">{t("categories:actions.confirmDelete")}</h2>
          {deleteTarget && (
            <p className="text-sm text-muted-foreground mb-4">
              {t("categories:actions.confirmDeleteMessage", { name: deleteTarget.name })}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
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
