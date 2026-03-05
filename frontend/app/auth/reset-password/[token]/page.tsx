"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPasswordAPI } from "@/services/auth-service";
import logger from "@/lib/logger";

const resetSchema = z
  .object({
    password: z.string().min(8, "validation.passwordMinLength"),
    confirmPassword: z.string().min(1, "validation.confirmPasswordRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwordsMustMatch",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    setServerError(null);
    if (!token) {
      setServerError(t("resetPassword.errorInvalidToken"));
      return;
    }
    try {
      await resetPasswordAPI(token, data.password);
      setSuccess(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setServerError(message || t("resetPassword.errorInvalidToken"));
      logger.error("Reset password error:", error);
    }
  };

  // Success state
  if (success) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <CheckCircle2 className="h-12 w-12 text-green-500" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl text-center">{t("resetPassword.successTitle")}</CardTitle>
          <CardDescription className="text-center">{t("resetPassword.successMessage")}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button onClick={() => router.push("/auth/login")}>{t("resetPassword.signIn")}</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{t("resetPassword.title")}</CardTitle>
        <CardDescription>{t("resetPassword.subtitle")}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {serverError && (
            <Alert variant="destructive" aria-live="polite">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">{t("resetPassword.passwordLabel")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("resetPassword.passwordPlaceholder")}
              autoComplete="new-password"
              aria-describedby={errors.password ? "password-error" : undefined}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {t(errors.password.message as string)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("resetPassword.confirmPasswordLabel")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t("resetPassword.confirmPasswordPlaceholder")}
              autoComplete="new-password"
              aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p id="confirm-error" className="text-sm text-destructive" role="alert">
                {t(errors.confirmPassword.message as string)}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {t("resetPassword.submitting")}
              </>
            ) : (
              t("resetPassword.submitButton")
            )}
          </Button>
          <Link
            href="/auth/forgot-password"
            className="text-center text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            {t("forgotPassword.backToLogin")}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
