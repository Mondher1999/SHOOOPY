"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  getCouponsAPI,
  createCouponAPI,
  updateCouponAPI,
  deleteCouponAPI,
} from "@/services/coupon-service";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import logger from "@/lib/logger";
import type { Coupon, PaginationInfo } from "@/types";

export default function AdminCouponsPage() {
  const { t } = useTranslation("admin");
  const { toast } = useToast();
  const formatPrice = useFormatPrice();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form state
  const [form, setForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: 0,
    maxDiscount: 0,
    minOrderAmount: 0,
    maxUses: 0,
    expiresAt: "",
    isActive: true,
  });

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCouponsAPI({ page, limit: 20, search: search || undefined });
      setCoupons(res.data.coupons);
      setPagination(res.data.pagination);
    } catch (err) {
      logger.error("fetchCoupons error:", err);
      toast({ title: t("coupons.errorLoading"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, t, toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openCreateDialog = () => {
    setEditingCoupon(null);
    setForm({ code: "", type: "percentage", value: 0, maxDiscount: 0, minOrderAmount: 0, maxUses: 0, expiresAt: "", isActive: true });
    setDialogOpen(true);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      maxDiscount: coupon.maxDiscount,
      minOrderAmount: coupon.minOrderAmount,
      maxUses: coupon.maxUses,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
      isActive: coupon.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingCoupon) {
        await updateCouponAPI(editingCoupon.id, {
          ...form,
          expiresAt: form.expiresAt || null,
        } as Partial<Coupon>);
        toast({ title: t("coupons.updated") });
      } else {
        await createCouponAPI({
          ...form,
          expiresAt: form.expiresAt || null,
        });
        toast({ title: t("coupons.created") });
      }
      setDialogOpen(false);
      fetchCoupons();
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || t("coupons.errorSaving");
      toast({ title: errorMsg, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCouponAPI(id);
      toast({ title: t("coupons.deleted") });
      fetchCoupons();
    } catch {
      toast({ title: t("coupons.errorDeleting"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-polaris-text">{t("coupons.title")}</h1>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-1" /> {t("coupons.addCoupon")}
        </Button>
      </div>

      <Card>
        {/* Search */}
        <div style={{ position: "relative", padding: "16px", paddingBottom: "12px", maxWidth: "420px" }}>
          <Search style={{ position: "absolute", left: "28px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "rgba(138,138,138,1)" }} />
          <input
            type="text"
            placeholder={t("coupons.searchPlaceholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: "100%", boxSizing: "border-box", height: "36px", paddingLeft: "34px", paddingRight: "12px", fontSize: "13px", borderRadius: "8px", border: "1px solid rgba(227,227,227,1)", background: "#FFFFFF", color: "rgba(48,48,48,1)", outline: "none" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(26,26,26,1)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(26,26,26,0.08)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(138,138,138,1)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-t border-polaris-border bg-polaris-surface-hovered text-polaris-text-subdued">
                <th className="px-4 py-3 text-left font-medium">{t("coupons.code")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("coupons.type")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("coupons.value")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("coupons.used")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("coupons.status")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("coupons.expires")}</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-polaris-border-subdued">
                    <td colSpan={7} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                  </tr>
                ))
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-polaris-text-subdued">
                    {t("coupons.empty")}
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-polaris-border-subdued hover:bg-polaris-surface-hovered transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-polaris-text">{coupon.code}</td>
                    <td className="px-4 py-3 capitalize text-polaris-text">{coupon.type}</td>
                    <td className="px-4 py-3 text-polaris-text">
                      {coupon.type === "percentage" ? `${coupon.value}%` : formatPrice(coupon.value)}
                    </td>
                    <td className="px-4 py-3 text-polaris-text">
                      {coupon.usedCount}{coupon.maxUses > 0 ? `/${coupon.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={coupon.isActive ? "success" : "secondary"}>
                        {coupon.isActive ? t("coupons.active") : t("coupons.inactive")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-polaris-text-subdued">
                      {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : t("coupons.never")}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(coupon)} aria-label={t("coupons.edit")}>
                        <Pencil className="h-4 w-4 text-polaris-text" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)} aria-label={t("coupons.delete")}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-polaris-border">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              {t("coupons.prev")}
            </Button>
            <span className="flex items-center text-sm text-polaris-text-subdued">
              {page} / {pagination.pages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>
              {t("coupons.next")}
            </Button>
          </div>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? t("coupons.editCoupon") : t("coupons.addCoupon")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("coupons.code")}</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("coupons.type")}</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "percentage" | "fixed" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t("coupons.percentage")}</SelectItem>
                    <SelectItem value="fixed">{t("coupons.fixedAmount")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("coupons.value")}</Label>
                <Input type="number" min={0} value={form.value} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("coupons.maxDiscount")}</Label>
                <Input type="number" min={0} value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>{t("coupons.minOrder")}</Label>
                <Input type="number" min={0} value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("coupons.maxUses")}</Label>
                <Input type="number" min={0} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>{t("coupons.expiresAt")}</Label>
                <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} />
              <Label>{t("coupons.active")}</Label>
            </div>
            <Button onClick={handleSave} className="w-full">{t("coupons.save")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
