"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { SearchBar } from "@/components/layout/SearchBar";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";

import { useShowcase } from "@/hooks/useShowcase";
import { StoreLogo } from "@/components/layout/StoreLogo";
import { NavDropdown } from "@/components/layout/NavDropdown";
import { useNavigation } from "@/hooks/useNavigation";

export function TechHeader() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const { totalItems: wishlistCount } = useWishlist();
  const { totalItems: cartCount, openDrawer } = useCart();
  const isShowcase = useShowcase();
  const navItems = useNavigation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#0A0A0F] border-b border-[#00FF88]/20">
        <div className="flex h-[56px] items-center px-6 lg:px-10 max-w-[1600px] mx-auto">

          {/* LEFT -- logo */}
          <Link
            href="/"
            className="text-[16px] font-mono font-bold tracking-[0.2em] uppercase whitespace-nowrap text-[#00FF88] hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.5)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F] rounded mr-10"
          >
            <StoreLogo imgHeight="h-8" />
          </Link>

          {/* CENTER -- inline nav links */}
          <nav
            className="hidden lg:flex items-center gap-7 flex-1"
            aria-label={t("nav.mainNav")}
          >
            {navItems.map((item) =>
              item.children.length > 0 ? (
                <NavDropdown
                  key={item.id}
                  buttonContent={<>{item.label} <ChevronDown className="w-3 h-3" /></>}
                  buttonClassName="text-[11px] font-mono tracking-[0.1em] uppercase whitespace-nowrap text-white/50 hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.4)] transition-all duration-200 flex items-center gap-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F] rounded"
                  menuClassName="bg-[#0A0A0F] border border-[#00FF88]/20 shadow-[0_0_12px_rgba(0,255,136,0.1)] rounded py-2 min-w-[180px]"
                >
                  <Link href={item.href} className="block px-4 py-2 text-[11px] font-mono tracking-[0.1em] uppercase text-white/50 hover:text-[#00FF88] hover:bg-[#00FF88]/5 transition-all focus:outline-none focus-visible:bg-[#00FF88]/5" role="menuitem" tabIndex={-1} {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {item.label}
                  </Link>
                  {item.children.map((child) => (
                    <Link key={child.id} href={child.href} className="block px-4 py-2 text-[11px] font-mono tracking-[0.1em] uppercase text-white/50 hover:text-[#00FF88] hover:bg-[#00FF88]/5 transition-all focus:outline-none focus-visible:bg-[#00FF88]/5" role="menuitem" tabIndex={-1} {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {child.label}
                    </Link>
                  ))}
                </NavDropdown>
              ) : (
                <Link
                  key={item.id}
                  href={item.href}
                  className="text-[11px] font-mono tracking-[0.1em] uppercase whitespace-nowrap text-white/50 hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.4)] transition-all duration-200"
                  {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* RIGHT -- icons */}
          <div className="flex items-center gap-5 ml-auto">
            <LanguageSwitcher />

            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="text-white/50 hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.4)] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F] rounded"
              aria-label={t("search.ariaLabel")}
            >
              {searchOpen
                ? <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
                : <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
              }
            </button>

            <Link
              href="/wishlist"
              className="relative text-white/50 hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.4)] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F] rounded"
              aria-label={t("nav.wishlist")}
            >
              <Heart className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {user && wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-[14px] min-w-[14px] rounded-full text-[9px] flex items-center justify-center font-mono font-bold bg-[#00FF88] text-[#0A0A0F] px-0.5" aria-hidden="true">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {!isShowcase && (
              <button
                onClick={openDrawer}
                className="relative text-white/50 hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.4)] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F] rounded"
                aria-label={t("nav.cart")}
              >
                <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-[14px] min-w-[14px] rounded-full text-[9px] flex items-center justify-center font-mono font-bold bg-[#00FF88] text-[#0A0A0F] px-0.5" aria-hidden="true">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <Link
                href="/dashboard/profile"
                className="text-white/50 hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.4)] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F] rounded"
                aria-label={t("nav.account")}
              >
                <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="hidden lg:block text-[11px] font-mono tracking-[0.1em] uppercase whitespace-nowrap text-white/50 hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.4)] transition-all duration-200"
              >
                {t("nav.signIn")}
              </Link>
            )}

            <button
              className="lg:hidden text-white/50 hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.4)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F] rounded ml-1"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            >
              {mobileOpen
                ? <X className="w-5 h-5" strokeWidth={1.5} />
                : <Menu className="w-5 h-5" strokeWidth={1.5} />
              }
            </button>
          </div>
        </div>

        {/* Search panel */}
        {searchOpen && (
          <div className="border-t border-[#00FF88]/20 bg-[#0A0A0F] animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <div className="max-w-2xl mx-auto px-6 py-4">
              <SearchBar />
            </div>
          </div>
        )}

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#00FF88]/20 bg-[#0A0A0F] animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <nav className="px-6 py-6 space-y-5" aria-label={t("nav.mainNav")}>
              {navItems.map((item) => (
                <div key={item.id}>
                  <Link
                    href={item.href}
                    className="block text-[12px] font-mono tracking-[0.18em] uppercase text-white/50 hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.4)] transition-all"
                    onClick={() => setMobileOpen(false)}
                    {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {item.label}
                  </Link>
                  {item.children.length > 0 && (
                    <div className="ml-4 mt-3 space-y-3">
                      {item.children.map((child) => (
                        <Link key={child.id} href={child.href} className="block text-[11px] font-mono tracking-[0.14em] uppercase text-white/30 hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.4)] transition-all" onClick={() => setMobileOpen(false)} {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {!user && (
                <Link
                  href="/auth/login"
                  className="block text-[12px] font-mono tracking-[0.18em] uppercase text-white/50 hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.4)] transition-all border-t border-[#00FF88]/20 pt-5"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.signIn")}
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
