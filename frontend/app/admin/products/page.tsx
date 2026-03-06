"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Plus, MoreHorizontal, AlertCircle } from "lucide-react";
import { getAllProductsAPI, deleteProductAPI } from "@/services/product-service";
import { getAllCategoriesAPI } from "@/services/category-service";
import type { Product, Category } from "@/types";
import type { PaginationInfo } from "@/types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";

export default function AdminProductsPage() {
  const { t } = useTranslation(["products", "common"]);
  const { toast } = useToast();

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
        <div>
          <p className="font-medium truncate max-w-[200px]">{row.name}</p>
          {row.sku && <p className="text-xs text-muted-foreground">{row.sku}</p>}
        </div>
      ),
    },
    {
      key: "category",
      header: t("products:columns.category"),
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.category?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "price",
      header: t("products:columns.price"),
      render: (row) => (
        <div>
          <span className="font-medium">${row.price.toFixed(2)}</span>
          {row.compareAtPrice && (
            <span className="text-xs text-muted-foreground line-through ml-1">
              ${row.compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: t("products:columns.stock"),
      render: (row) => (
        <Badge variant={row.stock > 0 ? "success" : "destructive"}>
          {row.stock > 0
            ? `${row.stock} — ${t("products:status.inStock")}`
            : t("products:status.outOfStock")}
        </Badge>
      ),
    },
    {
      key: "status",
      header: t("products:columns.status"),
      render: (row) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? t("products:status.active") : t("products:status.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("products:columns.actions"),
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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("products:title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("products:subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-2" />
            {t("products:addButton")}
          </Link>
        </Button>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={categoryFilter === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter("")}
          >
            {t("products:filterCategory")}
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={categoryFilter === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="ml-2 text-sm">{error}</p>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => fetchProducts(page)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("products:searchPlaceholder")}
        emptyMessage={t("products:empty")}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-2">{t("products:actions.confirmDelete")}</h2>
          {deleteTarget && (
            <p className="text-sm text-muted-foreground mb-4">
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
