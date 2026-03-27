"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Search,
  User,
  Package,
  MapPin,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAllUsersAPI } from "@/services/user-service";
import { searchProductsAPI, getProductByIdAPI } from "@/services/product-service";
import type { SlimProduct } from "@/services/product-service";
import type { AuthUser } from "@/services/auth-service";
import {
  createOrderAdminAPI,
  getUserAddressesAdminAPI,
} from "@/services/order-service";
import type { AddressItem } from "@/services/order-service";
import { getProductTypeCatalogAPI } from "@/services/settings-service";
import { VariantSelector } from "@/components/products/VariantSelector";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useSettings } from "@/contexts/SettingsContext";
import { calcTTC } from "@/lib/tva";
import logger from "@/lib/logger";
import type { Product } from "@/types";
import type { ProductTypeCatalog } from "@/types";

// ─── Types ──────────────────────────────────────────────────────────────────
interface OrderLineItem {
  product: Product;
  quantity: number;
  selectedOptions?: Record<string, string | string[]>;
}

interface ManualAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const EMPTY_ADDRESS: ManualAddress = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "-",
  country: "-",
};

export default function CreateOrderPage() {
  const { t } = useTranslation("admin");
  const router = useRouter();
  const formatPrice = useFormatPrice();
  const { settings } = useSettings();

  // ── Customer selection ──────────────────────────────────────────────────
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<AuthUser[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<AuthUser | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);
  const customerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Product selection ──────────────────────────────────────────────────
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<SlimProduct[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderLineItem[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productRef = useRef<HTMLDivElement>(null);
  const productTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Pending product (variant config before adding) ─────────────────────
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [pendingOptions, setPendingOptions] = useState<Record<string, string | string[]>>({});
  const [pendingQty, setPendingQty] = useState(1);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [typeCatalog, setTypeCatalog] = useState<ProductTypeCatalog | null>(null);

  // ── Address selection ──────────────────────────────────────────────────
  const [savedAddresses, setSavedAddresses] = useState<AddressItem[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [manualAddress, setManualAddress] = useState<ManualAddress>(EMPTY_ADDRESS);

  // ── Order details ──────────────────────────────────────────────────────
  const [notes, setNotes] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [freeShipping, setFreeShipping] = useState(true);
  const [shippingCostInput, setShippingCostInput] = useState("");
  const [shippingInitialized, setShippingInitialized] = useState(false);

  // ── Submit state ──────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Initialize shipping cost from settings ─────────────────────────────
  useEffect(() => {
    if (shippingInitialized || !settings) return;
    const cost = settings?.orders?.defaultShippingCost ?? 0;
    if (cost > 0) {
      setFreeShipping(false);
      setShippingCostInput(String(cost));
    } else {
      setFreeShipping(true);
      setShippingCostInput("");
    }
    setShippingInitialized(true);
  }, [settings, shippingInitialized]);

  // ── Close dropdowns on outside click ───────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
      if (productRef.current && !productRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Customer search (debounced) ────────────────────────────────────────
  useEffect(() => {
    if (customerTimer.current) clearTimeout(customerTimer.current);
    if (!customerSearch.trim()) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    customerTimer.current = setTimeout(async () => {
      setCustomerLoading(true);
      try {
        const res = await getAllUsersAPI({ search: customerSearch, limit: 8 });
        setCustomerResults(res.data.users);
        setShowCustomerDropdown(true);
      } catch (err) {
        logger.error("Customer search error:", err);
      } finally {
        setCustomerLoading(false);
      }
    }, 400);
    return () => { if (customerTimer.current) clearTimeout(customerTimer.current); };
  }, [customerSearch]);

  // ── Product search (debounced) ─────────────────────────────────────────
  useEffect(() => {
    if (productTimer.current) clearTimeout(productTimer.current);
    if (!productSearch.trim()) {
      setProductResults([]);
      setShowProductDropdown(false);
      return;
    }
    productTimer.current = setTimeout(async () => {
      setProductLoading(true);
      try {
        const res = await searchProductsAPI(productSearch, 10);
        // Filter out already-added products
        const addedIds = new Set(orderItems.map((i) => i.product.id));
        setProductResults(res.data.products.filter((p) => !addedIds.has(p.id)));
        setShowProductDropdown(true);
      } catch (err) {
        logger.error("Product search error:", err);
      } finally {
        setProductLoading(false);
      }
    }, 400);
    return () => { if (productTimer.current) clearTimeout(productTimer.current); };
  }, [productSearch, orderItems]);

  // ── Fetch product type catalog once on mount ──────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getProductTypeCatalogAPI();
        setTypeCatalog(res.data);
      } catch (err) {
        logger.error("Failed to load product type catalog:", err);
      }
    })();
  }, []);

  // ── Fetch customer addresses when customer changes ─────────────────────
  useEffect(() => {
    if (!selectedCustomer) {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      return;
    }
    (async () => {
      setAddressesLoading(true);
      try {
        const res = await getUserAddressesAdminAPI(selectedCustomer.id);
        setSavedAddresses(res.data);
        // Auto-select default address
        const def = res.data.find((a) => a.isDefault);
        if (def) setSelectedAddressId(def.id);
      } catch (err) {
        logger.error("Fetch addresses error:", err);
        setSavedAddresses([]);
      } finally {
        setAddressesLoading(false);
      }
    })();
  }, [selectedCustomer]);

  // ── Select customer ────────────────────────────────────────────────────
  const handleSelectCustomer = useCallback((user: AuthUser) => {
    setSelectedCustomer(user);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setUseManualAddress(false);
    setManualAddress(EMPTY_ADDRESS);
  }, []);

  // ── Add product to order (fetch full product for variant config) ────────
  const handleAddProduct = useCallback(async (slim: SlimProduct) => {
    setProductSearch("");
    setShowProductDropdown(false);
    setPendingLoading(true);
    try {
      const res = await getProductByIdAPI(slim.id);
      const full = res.data;
      // Check if product has any selectable attributes
      const hasSelectableAttrs =
        full.productType && typeCatalog && typeCatalog[full.productType]
          ? typeCatalog[full.productType].attributes.some(
              (attr) =>
                (attr.type === "multi-select" || attr.type === "select") &&
                full.attributes?.[attr.key] !== undefined &&
                full.attributes?.[attr.key] !== null
            )
          : false;
      if (!hasSelectableAttrs) {
        setOrderItems((prev) => [...prev, { product: full, quantity: 1 }]);
      } else {
        setPendingProduct(full);
        setPendingOptions({});
        setPendingQty(1);
      }
    } catch (err) {
      logger.error("Failed to fetch product:", err);
    } finally {
      setPendingLoading(false);
    }
  }, [typeCatalog]);

  // ── Confirm pending product (add with selected options) ─────────────────
  const handleConfirmPending = useCallback(() => {
    if (!pendingProduct) return;
    const opts = Object.fromEntries(
      Object.entries(pendingOptions).filter(([, v]) =>
        Array.isArray(v) ? v.length > 0 : v !== ""
      )
    );
    setOrderItems((prev) => [
      ...prev,
      {
        product: pendingProduct,
        quantity: pendingQty,
        selectedOptions: Object.keys(opts).length > 0 ? opts : undefined,
      },
    ]);
    setPendingProduct(null);
    setPendingOptions({});
    setPendingQty(1);
  }, [pendingProduct, pendingOptions, pendingQty]);

  // ── Update quantity ────────────────────────────────────────────────────
  const updateQuantity = useCallback((productId: string, delta: number) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  }, []);

  // ── Remove item ────────────────────────────────────────────────────────
  const removeItem = useCallback((productId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  // ── Computed totals ────────────────────────────────────────────────────
  const subtotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + calcTTC(item.product.price, item.product.tva ?? 0) * item.quantity, 0),
    [orderItems]
  );
  const totalItems = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.quantity, 0),
    [orderItems]
  );
  const shippingCostValue = freeShipping ? 0 : (parseFloat(shippingCostInput) || 0);
  const grandTotal = subtotal + shippingCostValue;

  // ── Resolve final address ──────────────────────────────────────────────
  const resolvedAddress = useMemo(() => {
    // If no customer selected, always use manual address
    if (!selectedCustomer) return manualAddress;
    if (useManualAddress) return manualAddress;
    if (selectedAddressId) {
      const addr = savedAddresses.find((a) => a.id === selectedAddressId);
      if (addr) return addr;
    }
    // Customer selected but has no saved addresses → use manual
    if (savedAddresses.length === 0) return manualAddress;
    return null;
  }, [selectedCustomer, useManualAddress, manualAddress, selectedAddressId, savedAddresses]);

  // ── Form validity ──────────────────────────────────────────────────────
  const isFormValid = useMemo(() => {
    if (orderItems.length === 0) return false;
    if (!resolvedAddress) return false;
    const addr = resolvedAddress;
    if (!addr.fullName?.trim() || !addr.phone?.trim() || !addr.street?.trim()) return false;
    return true;
  }, [orderItems, resolvedAddress]);

  // ── Submit order ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isFormValid || !resolvedAddress) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setShowConfirm(false);

    try {
      const res = await createOrderAdminAPI({
        userId: selectedCustomer?.id,
        items: orderItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          ...(item.selectedOptions ? { selectedOptions: item.selectedOptions } : {}),
        })),
        shippingAddress: {
          fullName: resolvedAddress.fullName.trim(),
          phone: resolvedAddress.phone.trim(),
          street: resolvedAddress.street.trim(),
          city: resolvedAddress.city?.trim() || "-",
          state: resolvedAddress.state?.trim() || "-",
          postalCode: resolvedAddress.postalCode?.trim() || "-",
          country: resolvedAddress.country?.trim() || "-",
          label: "label" in resolvedAddress ? (resolvedAddress as AddressItem).label : "home",
        },
        notes: notes.trim() || undefined,
        notifyCustomer: selectedCustomer ? notifyCustomer : false,
        shippingCost: shippingCostValue,
      });

      router.push(`/admin/orders/${res.data.id}`);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setSubmitError(message || t("manualOrder.createError"));
      logger.error("Create order error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Thumbnail helper ──────────────────────────────────────────────────
  const getThumb = (product: { images?: Array<{ thumbnail?: string; original?: string }> }) => {
    const img = product.images?.[0];
    if (!img) return "";
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    const src = img.thumbnail || img.original;
    if (!src) return "";
    return src.startsWith("http") ? src : `${base}${src}`;
  };

  return (
    <div className="space-y-4">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-polaris-surface-hovered transition-colors text-polaris-icon"
          aria-label={t("manualOrder.back")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-polaris-text">
            {t("manualOrder.title")}
          </h1>
          <p className="text-sm text-polaris-text-subdued">
            {t("manualOrder.subtitle")}
          </p>
        </div>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ════════════════ MAIN COLUMN ════════════════ */}
        <div className="lg:col-span-2 space-y-4">

          {/* ── 1. Customer Selection ────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                {t("manualOrder.customer")}
                <span className="text-xs font-normal text-muted-foreground">({t("manualOrder.optional")})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 rounded-lg border border-polaris-border bg-polaris-surface-hovered/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-polaris-text">{selectedCustomer.name}</p>
                      <p className="text-xs text-polaris-text-subdued">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setSavedAddresses([]);
                      setSelectedAddressId(null);
                    }}
                    aria-label={t("manualOrder.changeCustomer")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div ref={customerRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t("manualOrder.searchCustomer")}
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9"
                      aria-label={t("manualOrder.searchCustomer")}
                    />
                  </div>
                  {showCustomerDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {customerLoading ? (
                        <div className="p-3 space-y-2">
                          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                      ) : customerResults.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">{t("manualOrder.noCustomers")}</p>
                      ) : (
                        customerResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                            onClick={() => handleSelectCustomer(user)}
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
                              {user.role}
                            </Badge>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 2. Products ─────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" />
                {t("manualOrder.products")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Product search */}
              <div ref={productRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("manualOrder.searchProduct")}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9"
                    aria-label={t("manualOrder.searchProduct")}
                  />
                </div>
                {showProductDropdown && (
                  <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {productLoading ? (
                      <div className="p-3 space-y-2">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                      </div>
                    ) : productResults.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">{t("manualOrder.noProducts")}</p>
                    ) : (
                      productResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                          onClick={() => handleAddProduct(product)}
                        >
                          {product.images?.[0] ? (
                            <img
                              src={getThumb(product)}
                              alt=""
                              className="w-10 h-10 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                          </div>
                          <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Pending product loading */}
              {pendingLoading && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                  <span className="text-sm text-muted-foreground">{t("manualOrder.loadingProduct")}</span>
                </div>
              )}

              {/* Pending product — variant selection before adding to order */}
              {pendingProduct && (
                <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    {pendingProduct.images?.[0] ? (
                      <img
                        src={getThumb(pendingProduct)}
                        alt=""
                        className="w-12 h-12 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pendingProduct.name}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(pendingProduct.price)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingProduct(null)}
                      className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                      aria-label={t("actions.cancel")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <VariantSelector
                    product={pendingProduct}
                    typeCatalog={typeCatalog}
                    selectedOptions={pendingOptions}
                    onOptionChange={(key, val) =>
                      setPendingOptions((prev) => ({ ...prev, [key]: val }))
                    }
                  />

                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPendingQty((q) => Math.max(1, q - 1))}
                        disabled={pendingQty <= 1}
                        className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50"
                        aria-label={t("manualOrder.decreaseQty")}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium tabular-nums">
                        {pendingQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPendingQty((q) => q + 1)}
                        className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-accent transition-colors"
                        aria-label={t("manualOrder.increaseQty")}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <Button size="sm" className="flex-1" onClick={handleConfirmPending}>
                      {t("manualOrder.addToOrder")}
                    </Button>
                  </div>
                </div>
              )}

              {/* Selected items list */}
              {orderItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">{t("manualOrder.noItems")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border">
                  {orderItems.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3">
                      {item.product.images?.[0] ? (
                        <img
                          src={getThumb(item.product)}
                          alt=""
                          className="w-12 h-12 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <p className="text-xs text-muted-foreground truncate">
                            {Object.entries(item.selectedOptions)
                              .filter(([, v]) => v !== "" && !(Array.isArray(v) && v.length === 0))
                              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                              .join(" · ")}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">{formatPrice(calcTTC(item.product.price, item.product.tva ?? 0))}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-accent transition-colors"
                          disabled={item.quantity <= 1}
                          aria-label={t("manualOrder.decreaseQty")}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-accent transition-colors"
                          aria-label={t("manualOrder.increaseQty")}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm font-medium w-20 text-right tabular-nums">
                        {formatPrice(calcTTC(item.product.price, item.product.tva ?? 0) * item.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/10 transition-colors text-destructive/70 hover:text-destructive"
                        aria-label={t("manualOrder.removeItem")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 3. Shipping Address ──────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t("manualOrder.shippingAddress")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {addressesLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : (
                <>
                  {/* Saved addresses (only if a customer is selected and has addresses) */}
                  {selectedCustomer && savedAddresses.length > 0 && !useManualAddress && (
                    <div className="space-y-2">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedAddressId === addr.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{addr.fullName}</span>
                                {addr.isDefault && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {t("manualOrder.default")}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{addr.phone}</p>
                              <p className="text-xs text-muted-foreground">
                                {addr.street}, {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                              </p>
                            </div>
                            {selectedAddressId === addr.id && (
                              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Toggle to manual (only show if customer has saved addresses) */}
                  {selectedCustomer && savedAddresses.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setUseManualAddress(!useManualAddress);
                        if (!useManualAddress) setSelectedAddressId(null);
                      }}
                      className="w-full"
                    >
                      {useManualAddress
                        ? t("manualOrder.useSavedAddress")
                        : t("manualOrder.enterManually")}
                    </Button>
                  )}

                  {/* Manual address form — shown when: no customer, customer has no addresses, or manual toggle on */}
                  {(!selectedCustomer || savedAddresses.length === 0 || useManualAddress) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <Label htmlFor="addr-fullName" className="text-xs">
                          {t("manualOrder.fullName")} *
                        </Label>
                        <Input
                          id="addr-fullName"
                          value={manualAddress.fullName}
                          onChange={(e) => setManualAddress((a) => ({ ...a, fullName: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="addr-phone" className="text-xs">
                          {t("manualOrder.phone")} *
                        </Label>
                        <Input
                          id="addr-phone"
                          value={manualAddress.phone}
                          onChange={(e) => setManualAddress((a) => ({ ...a, phone: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="addr-street" className="text-xs">
                          {t("manualOrder.address")} *
                        </Label>
                        <Input
                          id="addr-street"
                          value={manualAddress.street}
                          onChange={(e) => setManualAddress((a) => ({ ...a, street: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ════════════════ SIDEBAR ════════════════ */}
        <div className="space-y-4">
          {/* Order summary */}
          <Card className="lg:sticky lg:top-[72px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                {t("manualOrder.orderSummary")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Line items */}
              {orderItems.length > 0 && (
                <div className="space-y-1.5 text-sm">
                  {orderItems.map((item) => (
                    <div key={item.product.id} className="flex justify-between">
                      <span className="text-muted-foreground truncate mr-2">
                        {item.product.name} x{item.quantity}
                      </span>
                      <span className="font-medium tabular-nums shrink-0">
                        {formatPrice(calcTTC(item.product.price, item.product.tva ?? 0) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("manualOrder.subtotal")} ({totalItems} {t("manualOrder.items")})
                  </span>
                  <span className="font-medium tabular-nums">{formatPrice(subtotal)}</span>
                </div>

                {/* Shipping row */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("manualOrder.shipping")}</span>
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        id="free-shipping"
                        checked={freeShipping}
                        onCheckedChange={(v) => {
                          setFreeShipping(!!v);
                          if (v) setShippingCostInput("");
                        }}
                      />
                      <label htmlFor="free-shipping" className="text-xs text-muted-foreground cursor-pointer select-none">
                        {t("manualOrder.free")}
                      </label>
                    </div>
                  </div>
                  {!freeShipping && (
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      value={shippingCostInput}
                      onChange={(e) => setShippingCostInput(e.target.value)}
                      placeholder="0.000"
                      className="h-8 text-sm"
                      aria-label={t("manualOrder.shipping")}
                    />
                  )}
                  {freeShipping && (
                    <p className="text-right text-sm text-muted-foreground tabular-nums">{t("manualOrder.free")}</p>
                  )}
                  {!freeShipping && shippingCostValue > 0 && (
                    <p className="text-right text-sm tabular-nums">{formatPrice(shippingCostValue)}</p>
                  )}
                </div>

                <div className="flex justify-between text-base font-semibold pt-1 border-t border-border">
                  <span>{t("manualOrder.total")}</span>
                  <span className="tabular-nums">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="order-notes" className="text-xs">
                  {t("manualOrder.notes")}
                </Label>
                <textarea
                  id="order-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  placeholder={t("manualOrder.notesPlaceholder")}
                />
              </div>

              {/* Notify customer — only shown when a customer account is selected */}
              {selectedCustomer && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="notify-customer"
                    checked={notifyCustomer}
                    onCheckedChange={(checked) => setNotifyCustomer(!!checked)}
                  />
                  <Label htmlFor="notify-customer" className="text-sm font-normal flex items-center gap-1.5 cursor-pointer">
                    <Mail className="w-3.5 h-3.5" />
                    {t("manualOrder.notifyCustomer")}
                  </Label>
                </div>
              )}

              {/* Payment method */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-[10px]">COD</Badge>
                <span>{t("manualOrder.paymentCOD")}</span>
              </div>

              {/* Submit */}
              <Button
                className="w-full"
                disabled={!isFormValid || isSubmitting}
                onClick={() => setShowConfirm(true)}
              >
                {isSubmitting ? t("manualOrder.creating") : t("manualOrder.createOrder")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Confirmation dialog ──────────────────────────────────────────── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("manualOrder.confirmTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t("manualOrder.customer")}:</span>{" "}
              {selectedCustomer ? (
                <><span className="font-medium">{selectedCustomer.name}</span> ({selectedCustomer.email})</>
              ) : (
                <span className="font-medium">{t("manualOrder.walkInCustomer")}</span>
              )}
            </p>
            <p>
              <span className="text-muted-foreground">{t("manualOrder.items")}:</span>{" "}
              <span className="font-medium">{totalItems}</span>
            </p>
            <p>
              <span className="text-muted-foreground">{t("manualOrder.total")}:</span>{" "}
              <span className="font-semibold">{formatPrice(grandTotal)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t("manualOrder.confirmDesc")}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isSubmitting}>
              {t("manualOrder.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? t("manualOrder.creating") : t("manualOrder.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
