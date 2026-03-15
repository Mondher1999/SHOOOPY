"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, X, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/SearchBar";
import { CartIcon } from "@/components/cart/CartIcon";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { StoreLogo } from "@/components/layout/StoreLogo";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/hooks/useNavigation";

export function Header() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const navItems = useNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex-shrink-0 font-bold text-xl tracking-tight text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <StoreLogo imgHeight="h-8" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-2" aria-label={t("nav.mainNav")} suppressHydrationWarning>
              {navItems.map((item) =>
                item.children.length > 0 ? (
                  <div key={item.id} className="relative group">
                    <button className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted flex items-center gap-1 cursor-pointer">
                      {item.label}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <div className="absolute left-0 top-full pt-1 hidden group-hover:block z-50">
                      <div className="bg-background border border-border shadow-md rounded-md py-2 min-w-[180px]">
                        <Link href={item.href} className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors" {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                          {item.label}
                        </Link>
                        {item.children.map((child) => (
                          <Link key={child.id} href={child.href} className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    suppressHydrationWarning
                    {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* Search — takes available space */}
            <div className="flex-1 max-w-md hidden sm:block">
              <SearchBar />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Language switcher */}
              <LanguageSwitcher />

              {/* Dark mode toggle */}
              <ThemeToggle />

              {/* Cart icon — opens drawer */}
              <CartIcon />

              {/* Auth */}
              {user ? (
                <Button variant="ghost" size="icon" aria-label={t("nav.account")} asChild>
                  <Link href="/dashboard/profile">
                    <User className="h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <Button size="sm" asChild>
                  <Link href="/auth/login" suppressHydrationWarning>{t("nav.signIn")}</Link>
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen((o) => !o)}
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
                suppressHydrationWarning
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="sm:hidden pb-3">
            <SearchBar />
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav
              className={cn("md:hidden pb-4")}
              aria-label={t("nav.mainNav")}
            >
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                      {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {item.label}
                    </Link>
                    {item.children.length > 0 && (
                      <ul className="ml-4 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <Link href={child.href} className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors" onClick={() => setMobileMenuOpen(false)} {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </header>

      {/* Cart drawer — rendered outside header so it overlays the whole page */}
      <CartDrawer />
    </>
  );
}
