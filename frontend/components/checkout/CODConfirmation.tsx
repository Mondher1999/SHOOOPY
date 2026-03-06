"use client";

import { useState } from "react";
import { Banknote, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface CODConfirmationProps {
  onPlaceOrder: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  /** Formatted total amount, e.g. "$29.99" */
  total: string;
}

export function CODConfirmation({ onPlaceOrder, isLoading, error, total }: CODConfirmationProps) {
  const { t } = useTranslation("checkout");
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) return;
    onPlaceOrder();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Payment method card */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Banknote className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold">{t("cod.methodTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("cod.methodDesc")}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <p className="text-sm text-muted-foreground">{t("cod.note")}</p>
        </CardContent>
      </Card>

      {/* Order total reminder */}
      <div className="flex justify-between items-center mb-4 px-1">
        <span className="font-medium">{t("cod.amountDue")}</span>
        <span className="text-xl font-bold">{total}</span>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" role="alert" className="mb-4">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Terms acceptance */}
      <div className="flex items-start gap-3 mb-6">
        <Checkbox
          id="cod-terms"
          checked={accepted}
          onCheckedChange={(v) => setAccepted(v === true)}
          aria-required="true"
          aria-describedby="cod-terms-desc"
        />
        <div>
          <Label htmlFor="cod-terms" className="text-sm leading-snug cursor-pointer">
            {t("cod.termsLabel")}
          </Label>
          <p id="cod-terms-desc" className="text-xs text-muted-foreground mt-0.5">
            {t("cod.termsDesc")}
          </p>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!accepted || isLoading}
        aria-disabled={!accepted || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            {t("cod.placing")}
          </>
        ) : (
          t("cod.placeOrder")
        )}
      </Button>
    </form>
  );
}
