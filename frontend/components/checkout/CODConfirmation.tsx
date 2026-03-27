"use client";

import { useState } from "react";
import { Banknote, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import { cn } from "@/lib/utils";

interface CODConfirmationProps {
  onPlaceOrder: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  /** Formatted total amount, e.g. "$29.99". If omitted, the amount line is hidden. */
  total?: string;
}

export function CODConfirmation({ onPlaceOrder, isLoading, error, total }: CODConfirmationProps) {
  const { t } = useTranslation("checkout");
  const theme = useActiveTheme();
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) return;
    onPlaceOrder();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Payment method card */}
      <Card className={cn("mb-4 border", theme.surface, theme.border)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0", theme.accentBg)}>
              <Banknote className={cn("h-5 w-5", theme.accent)} aria-hidden="true" />
            </div>
            <div>
              <p className={cn("font-semibold", theme.text)}>{t("cod.methodTitle")}</p>
              <p className={cn("text-sm", theme.textMuted)}>{t("cod.methodDesc")}</p>
            </div>
          </div>

          <div className={cn("h-px w-full my-4", theme.separator)} />

          <p className={cn("text-sm", theme.textMuted)}>{t("cod.note")}</p>
        </CardContent>
      </Card>

      {/* Order total reminder */}
      {total && (
        <div className="flex justify-between items-center mb-4 px-1">
          <span className={cn("font-medium", theme.text)}>{t("cod.amountDue")}</span>
          <span className={cn("text-xl font-bold", theme.text)}>{total}</span>
        </div>
      )}

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
          <Label htmlFor="cod-terms" className={cn("text-sm leading-snug cursor-pointer", theme.text)}>
            {t("cod.termsLabel")}
          </Label>
          <p id="cod-terms-desc" className={cn("text-xs mt-0.5", theme.textMuted)}>
            {t("cod.termsDesc")}
          </p>
        </div>
      </div>

      <Button
        type="submit"
        className={cn("w-full", theme.btnPrimary)}
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
