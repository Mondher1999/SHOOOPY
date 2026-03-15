"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Plus, MoreHorizontal, AlertCircle, Download, Upload, Search } from "lucide-react";
import { getAllProductsAPI, deleteProductAPI } from "@/services/product-service";
import { getAllCategoriesAPI } from "@/services/category-service";
import type { Product, Category } from "@/types";
import type { PaginationInfo } from "@/types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { CategoryPills } from "@/components/admin/CategoryPills";
import axiosInstance from "@/utils/axiosInstance";
import logger from "@/lib/logger";

export default function AdminProductsPage() {
  const { t } = useTranslation(["products", "common"]);
  const { toast } = useToast();
  const formatPrice = useFormatPrice();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // Load categories for filter dropdown
  useEffect(() => {
    getAllCategoriesAPI()
      .then((res) => setCategories(res.data))
      .catch((err) => logger.error("loadCategories failed:", err));
  }, []);

  const fetchProducts = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getAllProductsAPI({
          page,
          limit: 20,
          search: debouncedSearch || undefined,
          category: categoryFilter || undefined,
        });
        setProducts(res.data.products);
        setPagination(res.data.pagination);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : t("common:errors.generic");
        setError(msg);
        logger.error("getAllProducts failed:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, categoryFilter, t]
  );

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProductAPI(deleteTarget.id);
      toast({ title: t("products:actions.successDeleted") });
      setDeleteTarget(null);
      fetchProducts(pagination.page);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common:errors.generic");
      toast({ title: msg, variant: "destructive" });
      logger.error("deleteProduct failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataTableColumn<Product>[] = [
    {
      key: "name",
      header: t("products:columns.name"),
      render: (row) => (
        <div className="leading-tight">
          <p className="font-medium truncate max-w-[280px]">{row.name}</p>
          {row.sku && <p className="text-[11px] text-polaris-text-subdued mt-0.5">{row.sku}</p>}
        </div>
      ),
    },
    {
      key: "category",
      header: t("products:columns.category"),
      render: (row) => (
        <span className="text-sm text-polaris-text-subdued">
          {row.category?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "price",
      header: t("products:columns.price"),
      render: (row) => (
        <div>
          <span className="font-medium">{formatPrice(row.price)}</span>
          {row.compareAtPrice && (
            <span className="text-xs text-polaris-text-subdued line-through ml-1">
              {formatPrice(row.compareAtPrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: t("products:columns.stock"),
      render: (row) => {
        const variant = row.stock === 0 ? "destructive" : row.stock <= 5 ? "warning" : "success";
        return (
          <Badge variant={variant}>
            {row.stock > 0
              ? `${row.stock} ${t("products:status.inStock")}`
              : t("products:status.outOfStock")}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: t("products:columns.status"),
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "secondary"}>
          {row.isActive ? t("products:status.active") : t("products:status.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("products:columns.actions")}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/products/${row.id}/edit`}>
                {t("products:actions.edit")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteTarget(row)}
            >
              {t("products:actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleExportCSV = async () => {
    try {
      const res = await axiosInstance.get("/export/products", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: t("common:errors.generic"), variant: "destructive" });
      logger.error("exportCSV failed:", err);
    }
  };

  const handleImportCSV = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await axiosInstance.post("/export/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast({ title: t("products:importSuccess", { count: res.data.data.imported }) });
        fetchProducts(1);
      } catch (err) {
        toast({ title: t("common:errors.generic"), variant: "destructive" });
        logger.error("importCSV failed:", err);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-polaris-text">{t("products:title")}</h1>
          <p className="text-sm text-polaris-text-subdued mt-1">{t("products:subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 12px", fontSize: "13px", fontWeight: 500, color: "#202223", background: "#FFFFFF", backgroundColor: "#FFFFFF", border: "1px solid #C9CCCF", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}
            className="hover:bg-polaris-surface-hovered transition-colors"
          >
            <Download style={{ width: "14px", height: "14px" }} />
            {t("products:exportCSV")}
          </button>
          <button
            type="button"
            onClick={handleImportCSV}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 12px", fontSize: "13px", fontWeight: 500, color: "#202223", background: "#FFFFFF", backgroundColor: "#FFFFFF", border: "1px solid #C9CCCF", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}
            className="hover:bg-polaris-surface-hovered transition-colors"
          >
            <Upload style={{ width: "14px", height: "14px" }} />
            {t("products:importCSV")}
          </button>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("products:addButton")}
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="ml-2 text-sm">{error}</p>
        </Alert>
      )}

      <Card>
        {/* Search bar */}
        <div style={{ position: "relative", padding: "16px", paddingBottom: "12px", maxWidth: "420px" }}>
          <Search style={{ position: "absolute", left: "28px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "rgba(138,138,138,1)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("products:searchPlaceholder")}
            aria-label={t("products:searchPlaceholder")}
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

        {/* Category filter pills */}
        {categories.length > 0 && (
          <CategoryPills
            categories={categories}
            activeId={categoryFilter}
            allLabel={t("products:filterCategory")}
            onChange={setCategoryFilter}
          />
        )}

        {/* Table + Pagination */}
        <DataTable
          columns={columns}
          data={products}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={(page) => fetchProducts(page)}
          emptyMessage={t("products:empty")}
          embedded
          className="px-4 pb-4"
        />
      </Card>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <h2 className="text-base font-semibold text-polaris-text mb-2">{t("products:actions.confirmDelete")}</h2>
          {deleteTarget && (
            <p className="text-sm text-polaris-text-subdued mb-4">
              {t("products:actions.confirmDeleteMessage", { name: deleteTarget.name })}
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
              {isDeleting ? t("common:actions.loading") : t("products:actions.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
