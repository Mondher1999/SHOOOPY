"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import logger from "@/lib/logger";

const loginSchema = z.object({
  email: z.string().min(1, "validation.emailRequired").email("validation.emailInvalid"),
  password: z.string().min(1, "validation.passwordRequired"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const { t } = useTranslation("auth");
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      router.push(redirectTo);
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { error?: string }; status?: number } };
      const serverMsg = axiosErr?.response?.data?.error || "";
      const status = axiosErr?.response?.status;

      let translated: string;
      if (status === 429 && serverMsg.includes("Account locked")) {
        const minutesMatch = serverMsg.match(/(\d+)\s*minute/);
        translated = t("login.errorAccountLocked", { minutes: minutesMatch?.[1] || "15" });
      } else if (status === 429) {
        translated = t("login.errorTooManyAttempts");
      } else if (serverMsg === "Account deactivated") {
        translated = t("login.errorAccountDeactivated");
      } else {
        translated = t("login.errorInvalidCredentials");
      }

      setServerError(translated);
      logger.error("Login failed:", error);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
        <CardDescription>{t("login.subtitle")}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {serverError && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t("login.emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("login.emailPlaceholder")}
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("login.passwordLabel")}</Label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder={t("login.passwordPlaceholder")}
              autoComplete="current-password"
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
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {t("login.submitting")}
              </>
            ) : (
              t("login.submitButton")
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              {t("login.signUp")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
