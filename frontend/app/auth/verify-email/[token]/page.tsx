"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyEmailAPI } from "@/services/auth-service";
import logger from "@/lib/logger";

type VerifyState = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const { t } = useTranslation("auth");
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<VerifyState>("loading");

  useEffect(() => {
    if (!token) {
      setState("error");
      return;
    }
    verifyEmailAPI(token)
      .then(() => setState("success"))
      .catch((error) => {
        logger.error("Email verification failed:", error);
        setState("error");
      });
  }, [token]);

  if (state === "loading") {
    return (
      <Card>
        <CardHeader className="space-y-1 items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
          <CardTitle className="text-2xl">{t("verifyEmail.title")}</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (state === "success") {
    return (
      <Card>
        <CardHeader className="space-y-1 items-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" aria-hidden="true" />
          <CardTitle className="text-2xl text-center">{t("verifyEmail.successTitle")}</CardTitle>
          <CardDescription className="text-center">{t("verifyEmail.successMessage")}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/auth/login">{t("verifyEmail.signIn")}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1 items-center">
        <XCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
        <CardTitle className="text-2xl text-center">{t("verifyEmail.errorTitle")}</CardTitle>
        <CardDescription className="text-center">{t("verifyEmail.errorMessage")}</CardDescription>
      </CardHeader>
      <CardFooter className="justify-center">
        <Button variant="outline" asChild>
          <Link href="/auth/login">{t("verifyEmail.requestNew")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
