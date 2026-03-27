"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, User, Phone, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressSelector } from "@/components/checkout/AddressSelector";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CODConfirmation } from "@/components/checkout/CODConfirmation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { placeOrderAPI, guestCheckoutAPI } from "@/services/order-service";
import { useActiveTheme, type ThemeStyles } from "@/hooks/useActiveTheme";
import { cn } from "@/lib/utils";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { calcTTC } from "@/lib/tva";
import { cartItemKey } from "@/lib/cartUtils";
import logger from "@/lib/logger";

// ─── Step definitions ─────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

const STEPS: { id: Step; labelKey: string }[] = [
  { id: 1, labelKey: "checkout.stepAddress" },
  { id: 2, labelKey: "checkout.stepReview" },
  { id: 3, labelKey: "checkout.stepConfirm" },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, theme }: { current: Step; theme: ThemeStyles }) {
  const { t } = useTranslation("checkout");

  return (
    <nav aria-label={t("checkout.stepsLabel")} className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const isDone = step.id < current;
          const isActive = step.id === current;

          return (
            <li key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                  {isActive && (
                    <div className={cn("absolute inset-[-4px] rounded-full", theme.accentBg)} aria-hidden="true" />
                  )}
                  <div
                    aria-current={isActive ? "step" : undefined}
                    className={cn(
                      "relative h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                      isDone
                        ? cn(theme.badgeBg, theme.badgeText)
                        : isActive
                        ? cn(theme.badgeBg, theme.badgeText)
                        : cn(theme.surface, theme.textMuted)
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <span aria-hidden="true">{step.id}</span>
                    )}
                    <span className="sr-only">
                      {t(step.labelKey)}
                      {isDone ? ` (${t("checkout.stepDone")})` : ""}
                      {isActive ? ` (${t("checkout.stepCurrent")})` : ""}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs mt-1 font-medium whitespace-nowrap",
                    isActive ? theme.text : theme.textMuted
                  )}
                  aria-hidden="true"
                >
                  {t(step.labelKey)}
                </span>
              </div>

              {/* Connector line — not after last step */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 -mt-5",
                    step.id < current ? theme.badgeBg : theme.separator
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Guest address form ──────────────────────────────────────────────────────

function GuestAddressForm({
  fullName,
  phone,
  street,
  onFullNameChange,
  onPhoneChange,
  onStreetChange,
  theme,
}: {
  fullName: string;
  phone: string;
  street: string;
  onFullNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onStreetChange: (v: string) => void;
  theme: ThemeStyles;
}) {
  const { t } = useTranslation("checkout");
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="guestFullName" className={cn("text-sm font-medium mb-1 block", theme.text)}>
          {t("checkout.guestNameLabel")}<span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="guestFullName"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder={t("checkout.guestNamePlaceholder")}
            className="pl-10"
            required
            aria-required="true"
            autoComplete="name"
          />
        </div>
      </div>
      <div>
        <label htmlFor="guestPhone" className={cn("text-sm font-medium mb-1 block", theme.text)}>
          {t("checkout.guestPhoneLabel")}<span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="guestPhone"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder={t("checkout.guestPhonePlaceholder")}
            className="pl-10"
            required
            aria-required="true"
            autoComplete="tel"
            type="tel"
          />
        </div>
      </div>
      <div>
        <label htmlFor="guestStreet" className={cn("text-sm font-medium mb-1 block", theme.text)}>
          {t("checkout.guestAddressLabel")}<span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="guestStreet"
            value={street}
            onChange={(e) => onStreetChange(e.target.value)}
            placeholder={t("checkout.guestAddressPlaceholder")}
            className="pl-10"
            required
            aria-required="true"
            autoComplete="street-address"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { t } = useTranslation("checkout");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { cart, guestItems, reload: reloadCart, clearCart } = useCart();
  const { settings } = useSettings();
  const formatPrice = useFormatPrice();
  const theme = useActiveTheme();

  const isGuest = !user;

  const [step, setStep] = useState<Step>(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const orderPlacedRef = useRef(false);
  // Skip the first effect run to allow CartContext to hydrate guest cart from localStorage
  const mountedRef = useRef(false);

  // Guest address form state
  const [guestFullName, setGuestFullName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestStreet, setGuestStreet] = useState("");

  const guestAddressValid = guestFullName.trim() && guestPhone.trim() && guestStreet.trim();

  // Mark mounted after first render — lets CartContext hydrate guest items first
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  // Redirect if cart is empty — but NOT after a successful order (cart is cleared by the order)
  useEffect(() => {
    if (authLoading) return;
    if (!mountedRef.current) return;
    if (orderPlacedRef.current) return;

    if (isGuest) {
      // Guest: check localStorage cart
      if (guestItems.length === 0) {
        router.replace("/cart");
      }
    } else {
      // Authenticated: check server cart
      if (cart && cart.items.length === 0) {
        router.replace("/cart");
      }
    }
  }, [cart, guestItems, isGuest, authLoading, router]);

  const items = cart?.items ?? [];
  const subtotal = cart?.totalPrice ?? 0;
  let shippingCost = settings?.orders?.defaultShippingCost ?? 0;
  const freeThreshold = settings?.orders?.freeShippingThreshold ?? 0;
  if (freeThreshold > 0 && subtotal >= freeThreshold) shippingCost = 0;
  const total = subtotal + shippingCost;

  // Step 1 "continue" is valid if guest has filled address or authenticated has selected address
  const canContinueStep1 = isGuest ? !!guestAddressValid : !!selectedAddressId;

  const handleNext = () => {
    if (step === 1 && !canContinueStep1) return;
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  };

  const handleBack = () => {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
    setPlaceError(null);
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    setPlaceError(null);
    try {
      if (isGuest) {
        // Guest checkout: send cart items from localStorage + inline address
        const guestCartItems = guestItems.map((gi) => ({
          productId: gi.productId,
          quantity: gi.quantity,
          selectedOptions: gi.selectedOptions ?? {},
        }));

        const res = await guestCheckoutAPI({
          items: guestCartItems,
          shippingAddress: {
            fullName: guestFullName.trim(),
            phone: guestPhone.trim(),
            street: guestStreet.trim(),
          },
        });

        orderPlacedRef.current = true;
        // Clear guest cart from localStorage
        await clearCart();
        router.push(`/checkout/success?orderNumber=${res.data.orderNumber}&orderId=${res.data.id}`);
      } else {
        // Authenticated checkout
        if (!selectedAddressId) return;
        const res = await placeOrderAPI(selectedAddressId);
        orderPlacedRef.current = true;
        router.push(`/checkout/success?orderNumber=${res.data.orderNumber}&orderId=${res.data.id}`);
        reloadCart();
      }
    } catch (err: unknown) {
      logger.error("placeOrder error:", err);
      let msg = t("checkout.errorPlacing");
      // Handle both axios errors (authenticated) and fetchAPI errors (guest)
      if (err && typeof err === "object" && "response" in err) {
        const apiErr = err as { response?: { data?: { error?: string; data?: { outOfStock?: { name: string }[] } } } };
        const outOfStock = apiErr.response?.data?.data?.outOfStock;
        if (outOfStock && outOfStock.length > 0) {
          msg = t("checkout.errorOutOfStock", { names: outOfStock.map((i) => i.name).join(", ") });
        } else {
          msg = apiErr.response?.data?.error ?? msg;
        }
      } else if (err instanceof Error) {
        msg = err.message || msg;
      }
      setPlaceError(msg);
    } finally {
      setIsPlacing(false);
    }
  };

  // Don't render until auth check resolves (avoids flash)
  if (authLoading) return null;

  // For guests with empty cart, redirect will handle it
  if (isGuest && guestItems.length === 0 && !orderPlacedRef.current) return null;
  // For authenticated users with empty cart
  if (!isGuest && cart && cart.items.length === 0 && !orderPlacedRef.current) return null;

  return (
    <div className={cn("w-full", theme.pageBg, theme.bodyClass)}>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className={cn("text-2xl font-bold mb-6", theme.text, theme.headingClass)}>{t("checkout.title")}</h1>

        <StepIndicator current={step} theme={theme} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: step content */}
          <section className="lg:col-span-2" aria-live="polite" aria-atomic="true">
            {step === 1 && (
              <div>
                <h2 className={cn("text-lg font-semibold mb-4", theme.text, theme.headingClass)}>{t("checkout.stepAddress")}</h2>
                {isGuest ? (
                  <GuestAddressForm
                    fullName={guestFullName}
                    phone={guestPhone}
                    street={guestStreet}
                    onFullNameChange={setGuestFullName}
                    onPhoneChange={setGuestPhone}
                    onStreetChange={setGuestStreet}
                    theme={theme}
                  />
                ) : (
                  <AddressSelector
                    selectedId={selectedAddressId}
                    onSelect={setSelectedAddressId}
                  />
                )}
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleNext}
                    disabled={!canContinueStep1}
                    size="lg"
                    className={theme.btnPrimary}
                  >
                    {t("checkout.continue")}
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className={cn("text-lg font-semibold mb-4", theme.text, theme.headingClass)}>{t("checkout.stepReview")}</h2>
                {/* Items review */}
                <div className="space-y-3 mb-6">
                  {!isGuest && items.map((item) => (
                    <div
                      key={cartItemKey(item)}
                      className={cn("flex justify-between items-center py-2 border-b last:border-0", theme.border)}
                    >
                      <div>
                        <p className={cn("text-sm font-medium", theme.text)}>{item.product.name}</p>
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <p className={cn("text-xs", theme.textMuted)}>
                            {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(", ")}
                          </p>
                        )}
                        <p className={cn("text-xs", theme.textMuted)}>
                          {t("orderSummary.qty", { count: item.quantity })} × {formatPrice(calcTTC(item.price, item.tva ?? 0))}
                        </p>
                      </div>
                      <span className={cn("text-sm font-semibold", theme.text)}>{formatPrice(calcTTC(item.price, item.tva ?? 0) * item.quantity)}</span>
                    </div>
                  ))}
                  {isGuest && guestItems.map((gi, idx) => (
                    <div
                      key={`${gi.productId}-${idx}`}
                      className={cn("flex justify-between items-center py-2 border-b last:border-0", theme.border)}
                    >
                      <div>
                        <p className={cn("text-sm font-medium", theme.text)}>
                          {t("checkout.guestItemLabel", { id: gi.productId.slice(-6) })}
                        </p>
                        {gi.selectedOptions && Object.keys(gi.selectedOptions).length > 0 && (
                          <p className={cn("text-xs", theme.textMuted)}>
                            {Object.entries(gi.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(", ")}
                          </p>
                        )}
                        <p className={cn("text-xs", theme.textMuted)}>
                          {t("orderSummary.qty", { count: gi.quantity })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="ghost" className={theme.btnOutline} onClick={handleBack}>
                    {t("checkout.back")}
                  </Button>
                  <Button onClick={handleNext} size="lg" className={theme.btnPrimary}>
                    {t("checkout.continue")}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className={cn("text-lg font-semibold mb-4", theme.text, theme.headingClass)}>{t("checkout.stepConfirm")}</h2>
                <CODConfirmation
                  onPlaceOrder={handlePlaceOrder}
                  isLoading={isPlacing}
                  error={placeError}
                  total={isGuest ? undefined : formatPrice(total)}
                />
                <Button variant="ghost" className={cn("mt-4", theme.btnOutline)} onClick={handleBack}>
                  {t("checkout.back")}
                </Button>
              </div>
            )}
          </section>

          {/* Right: order summary (sticky) */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <OrderSummary />
          </aside>
        </div>
      </section>
    </div>
  );
}
