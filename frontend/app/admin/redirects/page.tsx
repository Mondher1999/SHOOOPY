"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, AlertCircle, ExternalLink } from "lucide-react";
import {
  getAllRedirectsAPI,
  createRedirectAPI,
  updateRedirectAPI,
  deleteRedirectAPI,
} from "@/services/redirect-service";
import type { RedirectItem } from "@/services/redirect-service";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PolarisStatusBadge } from "@/components/admin/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";

interface RedirectFormState {
  from: string;
  to: string;
  type: 301 | 302;
}

const emptyForm: RedirectFormState = { from: "", to: "", type: 301 };

export default function AdminRedirectsPage() {
  const { t } = useTranslation(["admin", "common"]);
  const { toast } = useToast();

  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RedirectItem | null>(null);
  const [formState, setFormState] = useState<RedirectFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RedirectItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRedirects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAllRedirectsAPI(1, 100);
      setRedirects(res.data.redirects);
    } catch (err) {
      logger.error("fetchRedirects failed:", err);
      setError(t("admin:redirects.error"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRedirects();
  }, [fetchRedirects]);

  const openCreate = () => {
    setEditTarget(null);
    setFormState(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (redirect: RedirectItem) => {
    setEditTarget(redirect);
    setFormState({ from: redirect.from, to: redirect.to, type: redirect.type });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formState.from.trim() || !formState.to.trim()) {
      setFormError(t("admin:redirects.formErrorRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editTarget) {
        await updateRedirectAPI(editTarget.id, formState);
        toast({ title: t("admin:redirects.updated") });
      } else {
        await createRedirectAPI(formState);
        toast({ title: t("admin:redirects.created") });
      }
      setDialogOpen(false);
      fetchRedirects();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setFormError(msg ?? t("common:errors.generic"));
      logger.error("redirectForm submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteRedirectAPI(deleteTarget.id);
      toast({ title: t("admin:redirects.deleted") });
      setDeleteTarget(null);
      fetchRedirects();
    } catch (err) {
      logger.error("deleteRedirect failed:", err);
      toast({ title: t("common:errors.generic"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (redirect: RedirectItem) => {
    try {
      await updateRedirectAPI(redirect.id, { isActive: !redirect.isActive });
      fetchRedirects();
    } catch (err) {
      logger.error("toggleRedirect failed:", err);
      toast({ title: t("common:errors.generic"), variant: "destructive" });
    }
  };

  const inputClasses = cn(
    "w-full h-9 px-3 text-sm rounded border border-[#C9CCCF] bg-polaris-surface text-polaris-text",
    "placeholder:text-polaris-text-subdued",
    "focus:outline-none focus:ring-1 focus:ring-polaris-primary focus:border-polaris-primary"
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-polaris-text">
            {t("admin:redirects.title")}
          </h1>
          <p className="text-sm text-polaris-text-subdued mt-0.5">
            {t("admin:redirects.subtitle")}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded bg-polaris-primary text-white hover:bg-polaris-primary-hovered transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {t("admin:redirects.addButton")}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-polaris-critical-light border border-polaris-critical/20 rounded-lg p-3 flex items-center gap-2 text-sm text-polaris-critical" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-polaris-border bg-polaris-surface-hovered text-polaris-text-subdued">
                <th className="text-left px-4 py-3 font-medium">
                  {t("admin:redirects.colFrom")}
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  {t("admin:redirects.colTo")}
                </th>
                <th className="text-center px-4 py-3 font-medium">
                  {t("admin:redirects.colType")}
                </th>
                <th className="text-center px-4 py-3 font-medium">
                  {t("admin:redirects.colSource")}
                </th>
                <th className="text-center px-4 py-3 font-medium">
                  {t("admin:redirects.colStatus")}
                </th>
                <th className="text-right px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-polaris-border-subdued last:border-0">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3 text-center"><Skeleton className="h-4 w-10 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><Skeleton className="h-4 w-14 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  </tr>
                ))}
              {!isLoading && redirects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-polaris-text-subdued">
                    {t("admin:redirects.empty")}
                  </td>
                </tr>
              )}
              {!isLoading &&
                redirects.map((r) => (
                  <tr key={r.id} className="border-b border-polaris-border-subdued last:border-0 hover:bg-polaris-surface-hovered transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-polaris-text break-all">
                      {r.from}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-polaris-text break-all">
                      <span className="inline-flex items-center gap-1">
                        {r.to}
                        <ExternalLink className="h-3 w-3 text-polaris-icon-subdued" />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-polaris-highlight text-polaris-text">
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-block px-2 py-0.5 text-xs rounded",
                        r.source === "slug-change"
                          ? "bg-polaris-info-light text-polaris-info"
                          : "bg-polaris-highlight text-polaris-text-subdued"
                      )}>
                        {r.source === "slug-change" ? t("admin:redirects.sourceAuto") : t("admin:redirects.sourceManual")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(r)}
                        className="cursor-pointer"
                        aria-label={r.isActive ? t("admin:redirects.deactivate") : t("admin:redirects.activate")}
                      >
                        <PolarisStatusBadge
                          status={r.isActive ? "success" : "inactive"}
                          label={r.isActive ? t("admin:redirects.active") : t("admin:redirects.inactive")}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEdit(r)}
                          className="p-1.5 rounded hover:bg-polaris-surface-hovered transition-colors cursor-pointer"
                          aria-label={t("common:actions.edit")}
                        >
                          <Pencil className="h-3.5 w-3.5 text-polaris-icon" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="p-1.5 rounded hover:bg-polaris-critical-light transition-colors cursor-pointer"
                          aria-label={t("common:actions.delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-polaris-critical" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-polaris-surface border-polaris-border sm:max-w-md">
          <DialogTitle className="text-lg font-semibold text-polaris-text mb-3">
            {editTarget ? t("admin:redirects.editTitle") : t("admin:redirects.createTitle")}
          </DialogTitle>
          {formError && (
            <div className="bg-polaris-critical-light border border-polaris-critical/20 rounded p-2 text-xs text-polaris-critical mb-3" role="alert">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="redirect-from" className="text-sm font-medium text-polaris-text">
                {t("admin:redirects.fromLabel")}
              </Label>
              <input
                id="redirect-from"
                placeholder="/old-path"
                value={formState.from}
                onChange={(e) => setFormState({ ...formState, from: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="redirect-to" className="text-sm font-medium text-polaris-text">
                {t("admin:redirects.toLabel")}
              </Label>
              <input
                id="redirect-to"
                placeholder="/new-path"
                value={formState.to}
                onChange={(e) => setFormState({ ...formState, to: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="redirect-type" className="text-sm font-medium text-polaris-text">
                {t("admin:redirects.typeLabel")}
              </Label>
              <select
                id="redirect-type"
                value={formState.type}
                onChange={(e) => setFormState({ ...formState, type: Number(e.target.value) as 301 | 302 })}
                className={inputClasses}
              >
                <option value={301}>301 — {t("admin:redirects.permanent")}</option>
                <option value={302}>302 — {t("admin:redirects.temporary")}</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-sm rounded border border-[#C9CCCF] text-polaris-text hover:bg-polaris-surface-hovered transition-colors cursor-pointer"
              >
                {t("common:actions.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium rounded bg-polaris-primary text-white hover:bg-polaris-primary-hovered disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmitting ? t("common:actions.saving") : editTarget ? t("common:actions.save") : t("admin:redirects.addButton")}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-polaris-surface border-polaris-border sm:max-w-sm">
          <DialogTitle className="text-lg font-semibold text-polaris-text mb-2">
            {t("admin:redirects.deleteTitle")}
          </DialogTitle>
          <p className="text-sm text-polaris-text-subdued mb-4">
            {t("admin:redirects.deleteMessage", { from: deleteTarget?.from })}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm rounded border border-[#C9CCCF] text-polaris-text hover:bg-polaris-surface-hovered transition-colors cursor-pointer"
            >
              {t("common:actions.cancel")}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium rounded bg-polaris-critical text-white hover:opacity-90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isDeleting ? t("common:actions.deleting") : t("common:actions.delete")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
