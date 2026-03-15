"use client";

import { HeaderSwitcher } from "@/components/layout/HeaderSwitcher";
import { FooterSwitcher } from "@/components/home/FooterSwitcher";
import { ThemeInjector } from "@/components/providers/ThemeInjector";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { PromoPopup } from "@/components/home/PromoPopup";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ThemeInjector />
      <HeaderSwitcher />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <FooterSwitcher />
      <ScrollToTop />
      <PromoPopup />
    </div>
  );
}
