"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { forgotPasswordAPI } from "@/services/auth-service";
import logger from "@/lib/logger";

const forgotSchema = z.object({
  email: z.string().min(1, "validation.emailRequired").email("validation.emailInvalid"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setServerError(null);
    try {
      await forgotPasswordAPI(data.email);
      setSubmitted(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setServerError(message || t("common:errors.generic"));
      logger.error("Forgot password error:", error);
    }
  };

  // Success state
  if (submitted) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <MailCheck className="h-12 w-12 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl text-center">{t("forgotPassword.successTitle")}</CardTitle>
          <CardDescription className="text-center">{t("forgotPassword.successMessage")}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/auth/login" className="text-primary hover:underline text-sm font-medium">
            {t("forgotPassword.backToLogin")}
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{t("forgotPassword.title")}</CardTitle>
        <CardDescription>{t("forgotPassword.subtitle")}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {serverError && (
            <Alert variant="destructive" aria-live="polite">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t("forgotPassword.emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("forgotPassword.emailPlaceholder")}
              autoComplete="email"
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {t(errors.email.message as string)}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {t("forgotPassword.submitting")}
              </>
            ) : (
              t("forgotPassword.submitButton")
            )}
          </Button>
          <Link
            href="/auth/login"
            className="text-center text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            {t("forgotPassword.backToLogin")}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
