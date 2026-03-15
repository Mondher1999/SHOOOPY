"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { User, Phone, MapPin, Tag, ShoppingBag, Truck, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { buyNowAPI } from "@/services/order-service";
import { validateCouponAPI } from "@/services/coupon-service";
import logger from "@/lib/logger";
import type { Product } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface BuyNowModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOptions?: Record<string, string | string[]>;
}

interface CouponState {
  code: string;
  discount: number;
}

export function BuyNowModal({ product, open, onOpenChange, selectedOptions }: BuyNowModalProps) {
  const { t } = useTranslation("products");
  const { t: tCheckout } = useTranslation("checkout");
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSettings();
  const formatPrice = useFormatPrice();
  const { toast } = useToast();

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponState | null>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Submit state
  const [placing, setPlacing] = useState(false);

  // Calculations
  const subtotal = product.price;
  const orderSettings = settings?.orders;
  let shippingCost = orderSettings?.defaultShippingCost ?? 0;
  if (orderSettings?.freeShippingThreshold && orderSettings.freeShippingThreshold > 0 && subtotal >= orderSettings.freeShippingThreshold) {
    shippingCost = 0;
  }
  const discount = appliedCoupon?.discount ?? 0;
  const total = subtotal + shippingCost - discount;

  const thumbnail = product.images[0]?.thumbnail
    ? `${BASE_URL}${product.images[0].thumbnail}`
    : "";

  const handleApplyCoupon = useCallback(async () => {
    if (!couponInput.trim()) return;
    setCouponError("");
    setValidatingCoupon(true);
    try {
      const res = await validateCouponAPI(couponInput.trim(), subtotal);
      setAppliedCoupon({ code: res.data.code, discount: res.data.discount });
      setCouponError("");
    } catch (err: unknown) {
      logger.error("BuyNow validateCoupon error:", err);
      const errorMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || tCheckout("orderSummary.couponInvalid");
      setCouponError(errorMsg);
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  }, [couponInput, subtotal, tCheckout]);

  const handleSubmit = useCallback(async () => {
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      toast({ title: t("buyNow.fillAllFields"), variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: t("buyNow.loginRequired"), variant: "destructive" });
      router.push("/auth/login");
      return;
    }

    setPlacing(true);
    try {
      const res = await buyNowAPI({
        productId: product.id,
        quantity: 1,
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        couponCode: appliedCoupon?.code,
        selectedOptions,
      });

      onOpenChange(false);
      router.push(`/checkout/success?orderNumber=${res.data.orderNumber}&orderId=${res.data.id}`);
    } catch (err: unknown) {
      logger.error("BuyNow placeOrder error:", err);
      const errData = (err as { response?: { data?: { error?: string; data?: { outOfStock?: { name: string }[] } } } })?.response?.data;
      if (errData?.data?.outOfStock) {
        const names = errData.data.outOfStock.map((i) => i.name).join(", ");
        toast({ title: t("buyNow.outOfStock", { names }), variant: "destructive" });
      } else {
        toast({ title: errData?.error || t("buyNow.errorPlacing"), variant: "destructive" });
      }
    } finally {
      setPlacing(false);
    }
  }, [fullName, phone, address, user, product.id, appliedCoupon, addItem, onOpenChange, router, toast, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        mobileSheet
        className="max-h-[85dvh] sm:max-h-[90dvh] sm:max-w-xl sm:w-[calc(100%-2rem)] flex flex-col p-0 gap-0"
      >
        <DialogHeader className="px-5 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:pt-5 pb-3 sm:pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg font-semibold text-left">
            {t("buyNow.title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("buyNow.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
          {/* ── Product Info ── */}
          <div className="flex items-start gap-3">
            {thumbnail && (
              <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted border">
                <div className="absolute -top-1 -right-1 z-10 bg-primary text-primary-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                  1
                </div>
                <Image
                  src={thumbnail}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-tight truncate">{product.name}</p>
              {product.category && (
                <p className="text-xs text-muted-foreground mt-0.5">{product.category.name}</p>
              )}
            </div>
            <span className="font-semibold text-sm whitespace-nowrap">{formatPrice(product.price)}</span>
          </div>

          {/* ── Order Summary ── */}
          <div className="rounded-lg border p-3 sm:p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tCheckout("orderSummary.subtotal")}</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tCheckout("orderSummary.shipping")}</span>
              <span className="font-medium">
                {shippingCost === 0 ? tCheckout("orderSummary.freeShipping") : formatPrice(shippingCost)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{tCheckout("orderSummary.discount")}</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>{tCheckout("orderSummary.total")}</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {/* ── Coupon ── */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("buyNow.couponLabel")}</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder={tCheckout("orderSummary.couponPlaceholder")}
                  className="pl-9 h-10"
                  disabled={!!appliedCoupon}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                />
              </div>
              {appliedCoupon ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-3"
                  onClick={() => { setAppliedCoupon(null); setCouponInput(""); }}
                >
                  {tCheckout("orderSummary.removeCoupon")}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-4 font-semibold text-white hover:text-white hover:opacity-90"
                  style={{ backgroundColor: "#000" }}
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponInput.trim()}
                >
                  {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : tCheckout("orderSummary.applyCoupon")}
                </Button>
              )}
            </div>
            {couponError && <p className="text-xs text-destructive mt-1" role="alert">{couponError}</p>}
          </div>

          {/* ── Shipping Option ── */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t("buyNow.shippingOptions")}</label>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="h-5 w-5 rounded-full border-2 border-foreground flex items-center justify-center flex-shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
              </div>
              <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span className="text-sm flex-1">{t("buyNow.homeDelivery")}</span>
              <span className="text-sm font-semibold">
                {shippingCost === 0 ? tCheckout("orderSummary.freeShipping") : formatPrice(shippingCost)}
              </span>
            </div>
          </div>

          {/* ── Customer Form ── */}
          <div className="space-y-3">
            {/* Name */}
            <div>
              <label htmlFor="buyNowName" className="text-sm font-medium mb-1 block">
                {t("buyNow.nameLabel")}<span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="buyNowName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("buyNow.namePlaceholder")}
                  className="pl-9 h-10"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="buyNowPhone" className="text-sm font-medium mb-1 block">
                {t("buyNow.phoneLabel")}<span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="buyNowPhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("buyNow.phonePlaceholder")}
                  className="pl-9 h-10"
                  required
                  autoComplete="tel"
                  type="tel"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="buyNowAddress" className="text-sm font-medium mb-1 block">
                {t("buyNow.addressLabel")}<span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="buyNowAddress"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("buyNow.addressPlaceholder")}
                  className="pl-9 h-10"
                  required
                  autoComplete="street-address"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Submit Button ── */}
        <div className="border-t px-5 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="lg"
            className={cn(
              "w-full h-12 text-sm font-bold uppercase tracking-wide rounded-lg",
              "text-white hover:text-white hover:opacity-90",
              "shadow-lg transition-all duration-200 active:scale-[0.98]",
              "disabled:opacity-100"
            )}
            style={{ backgroundColor: "#000" }}
            disabled={placing || !fullName.trim() || !phone.trim() || !address.trim()}
            onClick={handleSubmit}
          >
            {placing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("buyNow.placing")}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                {t("buyNow.submitButton")} – {formatPrice(total)}
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
