"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Eye, Package, AlertCircle, ChevronLeft, ChevronRight, Download, Search, Plus } from "lucide-react";
import { getAllOrdersAdminAPI } from "@/services/order-service";
import axiosInstance from "@/utils/axiosInstance";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import logger from "@/lib/logger";
import type { AdminOrder, OrderStatus, PaginationInfo } from "@/types";

const STATUS_TABS: (OrderStatus | "all")[] = [
  "all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled",
];


export default function AdminOrdersPage() {
  const { t } = useTranslation("orders");

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, limit: 20, total: 0, pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const fetchOrders = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAllOrdersAdminAPI({
        page,
        limit: 20,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: debouncedSearch || undefined,
      });
      setOrders(res.data.orders);
      setPagination(res.data.pagination);
    } catch (err) {
      logger.error("fetchAdminOrders error:", err);
      setError(t("errorLoading"));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, debouncedSearch, t]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const handleExportCSV = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await axiosInstance.get("/api/export/orders", {
        params,
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error("exportCSV error:", err);
    }
  };

  const formatPrice = useFormatPrice();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const mon = String(d.getMonth() + 1).padStart(2, "0");
    const yr = d.getFullYear();
    return `${day}/${mon}/${yr}`;
  };

  return (
    <div className="space-y-4">
      {/* ── Page header: title + Export CSV ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-polaris-text">{t("admin.title")}</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders/create"
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("admin.createOrder")}
          </Link>
        {/* Export CSV — explicit white bg prevents blending into #F1F1F1 page background */}
        <button
          type="button"
          onClick={handleExportCSV}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            height: "32px",
            padding: "0 12px",
            fontSize: "13px",
            fontWeight: 500,
            color: "#202223",
            background: "#FFFFFF",
            backgroundColor: "#FFFFFF",
            border: "1px solid #C9CCCF",
            borderRadius: "4px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          className="hover:bg-polaris-surface-hovered transition-colors"
        >
          <Download style={{ width: "14px", height: "14px" }} />
          {t("admin.exportCSV")}
        </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Filter pills — Polaris neutral style (same as CategoryPills) ── */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab;
          return (
            <span
              key={tab}
              role="button"
              tabIndex={0}
              onClick={() => setStatusFilter(tab)}
              onKeyDown={(e) => e.key === "Enter" && setStatusFilter(tab)}
              style={{
                display: "inline-block",
                padding: "4px 12px",
                fontSize: "13px",
                fontWeight: 500,
                borderRadius: "9999px",
                cursor: "pointer",
                userSelect: "none",
                transition: "background-color 0.15s, border-color 0.15s",
                lineHeight: "20px",
                background: isActive ? "hsl(var(--primary))" : "#FFFFFF",
                backgroundColor: isActive ? "hsl(var(--primary))" : "#FFFFFF",
                color: isActive ? "hsl(var(--primary-foreground))" : "#303030",
                border: isActive ? "1px solid hsl(var(--primary))" : "1px solid #C9CCCF",
              }}
            >
              {tab === "all" ? t("admin.all") : t(`status.${tab}`)}
            </span>
          );
        })}
      </div>

      {/* ── Main card: search + table ─────────────────────────────────────── */}
      <Card>
        {/* Search */}
        <div style={{ position: "relative", padding: "16px", paddingBottom: "12px", maxWidth: "420px" }}>
          <Search style={{ position: "absolute", left: "28px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "rgba(138,138,138,1)" }} />
          <input
            type="text"
            placeholder={t("admin.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t("admin.searchPlaceholder")}
            style={{
              width: "100%",
              boxSizing: "border-box",
              height: "36px",
              paddingLeft: "34px",
              paddingRight: "12px",
              fontSize: "13px",
              borderRadius: "8px",
              border: "1px solid rgba(227,227,227,1)",
              background: "#FFFFFF",
              color: "rgba(48,48,48,1)",
              outline: "none",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(26,26,26,1)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(26,26,26,0.08)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(138,138,138,1)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>

        {/* Loading state */}
        {isLoading && orders.length === 0 ? (
          <div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-3.5 border-b border-polaris-border-subdued">
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-polaris-icon-subdued mb-4" />
            <p className="text-sm font-medium text-polaris-text-subdued">{t("admin.empty")}</p>
          </div>
        ) : (
          <>
            {/* Desktop table header */}
            <div
              className="hidden lg:grid gap-3 px-4 py-2 border-y border-polaris-border bg-polaris-surface-hovered text-xs font-semibold text-polaris-text-subdued uppercase tracking-wider"
              style={{ gridTemplateColumns: "260px 1fr 80px 48px 120px 110px 40px" }}
            >
              <div>{t("admin.colOrder")}</div>
              <div>{t("admin.colCustomer")}</div>
              <div>{t("admin.colDate")}</div>
              <div className="text-center">{t("admin.colItems")}</div>
              <div className="text-right">{t("admin.colTotal")}</div>
              <div className="text-center">{t("admin.colStatus")}</div>
              <div />
            </div>

            <div>
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border-b border-polaris-border-subdued last:border-b-0 hover:bg-polaris-surface-hovered transition-colors"
                >
                  {/* Mobile layout */}
                  <div className="lg:hidden p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[13px] font-semibold text-polaris-text">
                        {order.orderNumber}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-polaris-text-subdued">
                      {order.user ? `${order.user.name} \u00B7 ${order.user.email}` : `${t("admin.guest")} \u00B7 ${order.shippingAddress?.fullName || ""}`}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-polaris-text-subdued">{formatDate(order.createdAt)}</span>
                      <span className="text-[13px] font-medium text-polaris-text">{formatPrice(order.totalPrice)}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        {t("admin.viewDetails")}
                      </Link>
                    </Button>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden lg:grid items-center gap-3 px-4 py-2.5" style={{ minHeight: "52px", gridTemplateColumns: "260px 1fr 80px 48px 120px 110px 40px" }}>
                    {/* Order number */}
                    <div className="min-w-0">
                      <span className="font-mono text-[13px] font-semibold leading-5 text-polaris-text">
                        {order.orderNumber}
                      </span>
                    </div>

                    {/* Customer */}
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium leading-5 text-polaris-text truncate" title={order.user?.name || t("admin.guest")}>{order.user?.name || t("admin.guest")}</p>
                      <p className="text-xs leading-4 text-polaris-text-subdued truncate" title={order.user?.email || order.shippingAddress?.fullName || ""}>{order.user?.email || order.shippingAddress?.fullName || ""}</p>
                    </div>

                    {/* Date */}
                    <div className="text-xs text-polaris-text-subdued leading-5 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </div>

                    {/* Items */}
                    <div className="text-center text-[13px] text-polaris-text-subdued leading-5">
                      {order.items.length}
                    </div>

                    {/* Total */}
                    <div className="text-right">
                      <span className="text-[13px] font-medium leading-5 text-polaris-text">
                        {formatPrice(order.totalPrice)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex justify-center">
                      <StatusBadge status={order.status} />
                    </div>

                    {/* View action */}
                    <div className="flex justify-end">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="w-8 h-8 flex items-center justify-center rounded text-polaris-icon-subdued hover:bg-polaris-surface-hovered transition-colors"
                        aria-label={t("admin.viewDetails")}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-polaris-border">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchOrders(pagination.page - 1)}
                  aria-label={t("pagination.prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-polaris-text-subdued">
                  {t("pagination.pageOf", { page: pagination.page, pages: pagination.pages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchOrders(pagination.page + 1)}
                  aria-label={t("pagination.next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
