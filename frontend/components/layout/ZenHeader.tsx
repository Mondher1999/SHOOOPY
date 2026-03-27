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

export function ZenHeader() {
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
      <header className="sticky top-0 z-40 w-full bg-white border-b border-[#eee]">
        <div className="flex h-[52px] items-center px-5 lg:px-8 max-w-[1600px] mx-auto">

          {/* LEFT — logo */}
          <Link
            href="/"
            className="text-[16px] font-extralight tracking-[0.3em] uppercase whitespace-nowrap text-[#111] hover:text-[#111]/70 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded mr-8"
          >
            <StoreLogo imgHeight="h-8" />
          </Link>

          {/* CENTER — inline nav links */}
          <nav
            className="hidden lg:flex items-center gap-6 flex-1"
            aria-label={t("nav.mainNav")}
          >
            {navItems.map((item) =>
              item.children.length > 0 ? (
                <NavDropdown
                  key={item.id}
                  buttonContent={<>{item.label} <ChevronDown className="w-3 h-3" strokeWidth={1} /></>}
                  buttonClassName="text-[10px] font-light tracking-[0.16em] uppercase whitespace-nowrap text-[#111]/50 hover:text-[#111] transition-colors duration-200 flex items-center gap-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  menuClassName="bg-white border border-[#eee] shadow-sm py-2 min-w-[170px]"
                >
                  <Link href={item.href} className="block px-4 py-2 text-[10px] font-light tracking-[0.14em] uppercase text-[#111]/50 hover:text-[#111] hover:bg-[#fafafa] transition-colors focus:outline-none focus-visible:bg-[#fafafa]" role="menuitem" tabIndex={-1} {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {item.label}
                  </Link>
                  {item.children.map((child) => (
                    <Link key={child.id} href={child.href} className="block px-4 py-2 text-[10px] font-light tracking-[0.14em] uppercase text-[#111]/50 hover:text-[#111] hover:bg-[#fafafa] transition-colors focus:outline-none focus-visible:bg-[#fafafa]" role="menuitem" tabIndex={-1} {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {child.label}
                    </Link>
                  ))}
                </NavDropdown>
              ) : (
                <Link
                  key={item.id}
                  href={item.href}
                  className="text-[10px] font-light tracking-[0.16em] uppercase whitespace-nowrap text-[#111]/50 hover:text-[#111] transition-colors duration-200"
                  {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* RIGHT — icons */}
          <div className="flex items-center gap-4 ml-auto">
            <LanguageSwitcher />

            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="text-[#111]/40 hover:text-[#111] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              aria-label={t("search.ariaLabel")}
            >
              {searchOpen
                ? <X className="w-[16px] h-[16px]" strokeWidth={1} />
                : <Search className="w-[16px] h-[16px]" strokeWidth={1} />
              }
            </button>

            <Link
              href="/wishlist"
              className="relative text-[#111]/40 hover:text-[#111] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              aria-label={t("nav.wishlist")}
            >
              <Heart className="w-[16px] h-[16px]" strokeWidth={1} />
              {user && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 h-[12px] min-w-[12px] rounded-full text-[8px] flex items-center justify-center font-medium bg-[#111] text-white px-0.5" aria-hidden="true">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {!isShowcase && (
              <button
                onClick={openDrawer}
                className="relative text-[#111]/40 hover:text-[#111] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                aria-label={t("nav.cart")}
              >
                <ShoppingBag className="w-[16px] h-[16px]" strokeWidth={1} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-[12px] min-w-[12px] rounded-full text-[8px] flex items-center justify-center font-medium bg-[#111] text-white px-0.5" aria-hidden="true">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <Link
                href="/dashboard/profile"
                className="text-[#111]/40 hover:text-[#111] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                aria-label={t("nav.account")}
              >
                <User className="w-[16px] h-[16px]" strokeWidth={1} />
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="hidden lg:block text-[10px] font-light tracking-[0.12em] uppercase whitespace-nowrap text-[#111]/50 hover:text-[#111] transition-colors duration-200"
              >
                {t("nav.signIn")}
              </Link>
            )}

            <button
              className="lg:hidden text-[#111]/40 hover:text-[#111] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded ml-1"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            >
              {mobileOpen
                ? <X className="w-[18px] h-[18px]" strokeWidth={1} />
                : <Menu className="w-[18px] h-[18px]" strokeWidth={1} />
              }
            </button>
          </div>
        </div>

        {/* Search panel */}
        {searchOpen && (
          <div className="border-t border-[#eee] bg-white animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <div className="max-w-2xl mx-auto px-5 py-3">
              <SearchBar />
            </div>
          </div>
        )}

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#eee] bg-white animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <nav className="px-5 py-5 space-y-4" aria-label={t("nav.mainNav")}>
              {navItems.map((item) => (
                <div key={item.id}>
                  <Link
                    href={item.href}
                    className="block text-[11px] font-light tracking-[0.16em] uppercase text-[#111]/50 hover:text-[#111] transition-colors"
                    onClick={() => setMobileOpen(false)}
                    {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {item.label}
                  </Link>
                  {item.children.length > 0 && (
                    <div className="ml-4 mt-3 space-y-3">
                      {item.children.map((child) => (
                        <Link key={child.id} href={child.href} className="block text-[10px] font-light tracking-[0.14em] uppercase text-[#111]/30 hover:text-[#111] transition-colors" onClick={() => setMobileOpen(false)} {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
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
                  className="block text-[11px] font-light tracking-[0.16em] uppercase text-[#111]/50 hover:text-[#111] transition-colors border-t border-[#eee] pt-4"
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
