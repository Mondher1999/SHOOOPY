"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/SearchBar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/products", label: t("nav.products") },
    { href: "/categories", label: t("nav.categories") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 font-bold text-xl tracking-tight text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            ShopFlow
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-2" aria-label={t("nav.mainNav")}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search — takes available space */}
          <div className="flex-1 max-w-md hidden sm:block">
            <SearchBar />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Cart stub */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("nav.cart")}
              className="relative"
              asChild
            >
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>

            {/* Auth */}
            {user ? (
              <Button variant="ghost" size="icon" aria-label={t("nav.account")} asChild>
                <Link href="/dashboard/profile">
                  <User className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href="/auth/login">{t("nav.signIn")}</Link>
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
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
