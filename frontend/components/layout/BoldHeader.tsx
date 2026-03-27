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

export function BoldHeader() {
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
      <header className="sticky top-0 z-40 w-full bg-[#0F0F0F] border-b-2 border-[#FF3C00]">
        <div className="flex h-[60px] items-center px-6 lg:px-10 max-w-[1600px] mx-auto">

          {/* LEFT — logo */}
          <Link
            href="/"
            className="text-[18px] font-bold tracking-[0.2em] uppercase whitespace-nowrap text-white hover:text-[#FF3C00] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded mr-10"
          >
            <StoreLogo imgHeight="h-8" />
          </Link>

          {/* CENTER — inline nav links */}
          <nav
            className="hidden lg:flex items-center gap-7 flex-1"
            aria-label={t("nav.mainNav")}
          >
            {navItems.map((item) =>
              item.children.length > 0 ? (
                <NavDropdown
                  key={item.id}
                  buttonContent={<>{item.label} <ChevronDown className="w-3 h-3" strokeWidth={2} /></>}
                  buttonClassName="flex items-center gap-1 text-[11px] font-bold tracking-[0.14em] uppercase whitespace-nowrap text-white/70 hover:text-[#FF3C00] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  menuClassName="bg-[#0F0F0F] border border-white/10 rounded-md py-2 min-w-[180px] shadow-xl"
                  menuGap="pt-2"
                >
                  {item.children.map((child) => (
                    <Link key={child.id} href={child.href} className="block px-4 py-2 text-[11px] font-bold tracking-[0.10em] uppercase text-white/70 hover:text-[#FF3C00] hover:bg-white/5 transition-colors duration-200 focus:outline-none focus-visible:bg-white/5" role="menuitem" tabIndex={-1} {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {child.label}
                    </Link>
                  ))}
                </NavDropdown>
              ) : (
                <Link
                  key={item.id}
                  href={item.href}
                  {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="text-[11px] font-bold tracking-[0.14em] uppercase whitespace-nowrap text-white/70 hover:text-[#FF3C00] transition-colors duration-200"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* RIGHT — icons */}
          <div className="flex items-center gap-5 ml-auto">
            <LanguageSwitcher />

            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="text-white/70 hover:text-[#FF3C00] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              aria-label={t("search.ariaLabel")}
            >
              {searchOpen
                ? <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
                : <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
              }
            </button>

            <Link
              href="/wishlist"
              className="relative text-white/70 hover:text-[#FF3C00] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              aria-label={t("nav.wishlist")}
            >
              <Heart className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {user && wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-[14px] min-w-[14px] rounded-full text-[9px] flex items-center justify-center font-medium bg-[#FF3C00] text-white px-0.5" aria-hidden="true">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {!isShowcase && (
              <button
                onClick={openDrawer}
                className="relative text-white/70 hover:text-[#FF3C00] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                aria-label={t("nav.cart")}
              >
                <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-[14px] min-w-[14px] rounded-full text-[9px] flex items-center justify-center font-medium bg-[#FF3C00] text-white px-0.5" aria-hidden="true">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <Link
                href="/dashboard/profile"
                className="text-white/70 hover:text-[#FF3C00] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                aria-label={t("nav.account")}
              >
                <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="hidden lg:block text-[11px] font-bold tracking-[0.12em] uppercase whitespace-nowrap text-white/70 hover:text-[#FF3C00] transition-colors duration-200"
              >
                {t("nav.signIn")}
              </Link>
            )}

            <button
              className="lg:hidden text-white/70 hover:text-[#FF3C00] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded ml-1"
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
          <div className="border-t border-white/10 bg-[#0F0F0F] animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <div className="max-w-2xl mx-auto px-6 py-4">
              <SearchBar />
            </div>
          </div>
        )}

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#0F0F0F] animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <nav className="px-6 py-6 space-y-5" aria-label={t("nav.mainNav")}>
              {navItems.map((item) => (
                <div key={item.id}>
                  <Link
                    href={item.href}
                    {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="block text-[12px] font-bold tracking-[0.18em] uppercase text-white/70 hover:text-[#FF3C00] transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.children.length > 0 && (
                    <div className="mt-2 ml-4 space-y-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          className="block text-[11px] font-bold tracking-[0.14em] uppercase text-white/50 hover:text-[#FF3C00] transition-colors"
                          onClick={() => setMobileOpen(false)}
                        >
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
                  className="block text-[12px] font-bold tracking-[0.18em] uppercase text-white/70 hover:text-[#FF3C00] transition-colors border-t border-white/10 pt-5"
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
