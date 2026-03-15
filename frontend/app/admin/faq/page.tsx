"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  getAllFAQsAPI,
  createFAQAPI,
  updateFAQAPI,
  deleteFAQAPI,
  reorderFAQsAPI,
} from "@/services/faq-service";
import logger from "@/lib/logger";
import type { FAQ } from "@/types";

export default function AdminFAQPage() {
  const { t } = useTranslation("admin");
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", isActive: true });

  const fetchFaqs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllFAQsAPI();
      setFaqs(res.data);
    } catch (err) {
      logger.error("fetchFaqs error:", err);
      toast({ title: t("faq.errorLoading"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const openCreateDialog = () => {
    setEditingFaq(null);
    setForm({ question: "", answer: "", isActive: true });
    setDialogOpen(true);
  };

  const openEditDialog = (faq: FAQ) => {
    setEditingFaq(faq);
    setForm({ question: faq.question, answer: faq.answer, isActive: faq.isActive });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast({ title: t("faq.requiredFields"), variant: "destructive" });
      return;
    }
    try {
      if (editingFaq) {
        await updateFAQAPI(editingFaq.id, form);
        toast({ title: t("faq.updated") });
      } else {
        await createFAQAPI(form);
        toast({ title: t("faq.created") });
      }
      setDialogOpen(false);
      fetchFaqs();
    } catch {
      toast({ title: t("faq.errorSaving"), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFAQAPI(id);
      toast({ title: t("faq.deleted") });
      fetchFaqs();
    } catch {
      toast({ title: t("faq.errorDeleting"), variant: "destructive" });
    }
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    const newFaqs = [...faqs];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newFaqs.length) return;
    [newFaqs[index], newFaqs[targetIndex]] = [newFaqs[targetIndex], newFaqs[index]];
    setFaqs(newFaqs);
    try {
      await reorderFAQsAPI(newFaqs.map((f) => f.id));
    } catch {
      toast({ title: t("faq.errorReorder"), variant: "destructive" });
      fetchFaqs();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-polaris-text">{t("faq.title")}</h1>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-1" /> {t("faq.addFaq")}
        </Button>
      </div>

      {/* FAQ List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))
        ) : faqs.length === 0 ? (
          <p className="text-center text-polaris-text-subdued py-8">{t("faq.empty")}</p>
        ) : (
          faqs.map((faq, index) => (
            <div key={faq.id} className="bg-polaris-surface border border-polaris-border rounded-lg shadow-polaris p-4 flex items-start gap-3">
              <div className="flex flex-col gap-1 mt-1">
                <button
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  className="text-polaris-icon-subdued hover:text-polaris-text disabled:opacity-30 cursor-pointer"
                  aria-label={t("faq.moveUp")}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm text-polaris-text">{faq.question}</h3>
                  {!faq.isActive && (
                    <Badge variant="secondary">{t("faq.inactive")}</Badge>
                  )}
                </div>
                <p className="text-sm text-polaris-text-subdued line-clamp-2">{faq.answer}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(faq)} aria-label={t("faq.edit")}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(faq.id)} aria-label={t("faq.delete")}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFaq ? t("faq.editFaq") : t("faq.addFaq")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("faq.question")}</Label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
            </div>
            <div>
              <Label>{t("faq.answer")}</Label>
              <Textarea rows={5} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} />
              <Label>{t("faq.active")}</Label>
            </div>
            <Button onClick={handleSave} className="w-full">{t("faq.save")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
