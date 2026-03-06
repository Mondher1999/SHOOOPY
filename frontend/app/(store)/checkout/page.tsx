"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AddressSelector } from "@/components/checkout/AddressSelector";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CODConfirmation } from "@/components/checkout/CODConfirmation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { placeOrderAPI } from "@/services/order-service";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";

// ─── Step definitions ─────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

const STEPS: { id: Step; labelKey: string }[] = [
  { id: 1, labelKey: "checkout.stepAddress" },
  { id: 2, labelKey: "checkout.stepReview" },
  { id: 3, labelKey: "checkout.stepConfirm" },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
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
                <div
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
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
                <span
                  className={cn(
                    "text-xs mt-1 font-medium whitespace-nowrap",
                    isActive ? "text-foreground" : "text-muted-foreground"
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
                    step.id < current ? "bg-primary" : "bg-border"
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

export default function CheckoutPage() {
  const { t } = useTranslation("checkout");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { cart, reload: reloadCart } = useCart();

  const [step, setStep] = useState<Step>(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!authLoading && cart && cart.items.length === 0) {
      router.replace("/cart");
    }
  }, [cart, authLoading, router]);

  const items = cart?.items ?? [];
  const subtotal = cart?.totalPrice ?? 0;
  const total = subtotal; // free shipping

  const handleNext = () => {
    if (step === 1 && !selectedAddressId) return;
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  };

  const handleBack = () => {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
    setPlaceError(null);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) return;
    setIsPlacing(true);
    setPlaceError(null);
    try {
      const res = await placeOrderAPI(selectedAddressId);
      await reloadCart();
      router.push(`/checkout/success?orderNumber=${res.data.orderNumber}&orderId=${res.data.id}`);
    } catch (err: unknown) {
      logger.error("placeOrder error:", err);
      let msg = t("checkout.errorPlacing");
      if (err && typeof err === "object" && "response" in err) {
        const apiErr = err as { response?: { data?: { error?: string; data?: { outOfStock?: { name: string }[] } } } };
        const outOfStock = apiErr.response?.data?.data?.outOfStock;
        if (outOfStock && outOfStock.length > 0) {
          msg = t("checkout.errorOutOfStock", { names: outOfStock.map((i) => i.name).join(", ") });
        } else {
          msg = apiErr.response?.data?.error ?? msg;
        }
      }
      setPlaceError(msg);
    } finally {
      setIsPlacing(false);
    }
  };

  // Don't render until auth resolves (avoids flash)
  if (authLoading || !user) return null;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">{t("checkout.title")}</h1>

      <StepIndicator current={step} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: step content */}
        <section className="lg:col-span-2" aria-live="polite" aria-atomic="true">
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">{t("checkout.stepAddress")}</h2>
              <AddressSelector
                selectedId={selectedAddressId}
                onSelect={setSelectedAddressId}
              />
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleNext}
                  disabled={!selectedAddressId}
                  size="lg"
                >
                  {t("checkout.continue")}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">{t("checkout.stepReview")}</h2>
              {/* Items review */}
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-center py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("orderSummary.qty", { count: item.quantity })} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handleBack}>
                  {t("checkout.back")}
                </Button>
                <Button onClick={handleNext} size="lg">
                  {t("checkout.continue")}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">{t("checkout.stepConfirm")}</h2>
              <CODConfirmation
                onPlaceOrder={handlePlaceOrder}
                isLoading={isPlacing}
                error={placeError}
                total={`$${total.toFixed(2)}`}
              />
              <Button variant="outline" onClick={handleBack} className="mt-4">
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
    </main>
  );
}
