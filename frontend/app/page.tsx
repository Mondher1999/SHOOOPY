"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { t } = useTranslation("common");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <section
        aria-labelledby="hero-heading"
        className="flex flex-col items-center gap-6 text-center max-w-2xl"
      >
        <h1
          id="hero-heading"
          className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
        >
          {t("home.heading")}
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl">
          {t("home.description")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="min-w-[160px]" asChild>
            <Link href="/products">{t("home.shopNow")}</Link>
          </Button>
          <Button variant="outline" size="lg" className="min-w-[160px]" asChild>
            <Link href="/categories">{t("home.browseCategories")}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
