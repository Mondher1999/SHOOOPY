"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { SearchBar } from "@/components/layout/SearchBar";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useShowcase } from "@/hooks/useShowcase";
import { StoreLogo } from "@/components/layout/StoreLogo";
import { useNavigation } from "@/hooks/useNavigation";

export function MagazineHeader() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const { totalItems: wishlistCount } = useWishlist();
  const { totalItems: cartCount, openDrawer } = useCart();
  const isShowcase = useShowcase();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navItems = useNavigation();

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white">
        {/* Row 1 — Utility bar */}
        <div className="h-[28px] bg-white border-b border-black/10">
          <div className="flex h-full items-center px-6 lg:px-10 max-w-[1600px] mx-auto">
            {/* LEFT — language switcher */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            <div className="flex-1" />

            {/* RIGHT — utility icons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className="text-black hover:text-[#E63946] transition-colors duration-200 cursor-pointer focus:outline-none"
                aria-label={t("search.ariaLabel")}
              >
                {searchOpen
                  ? <X className="w-[14px] h-[14px]" strokeWidth={1.5} />
                  : <Search className="w-[14px] h-[14px]" strokeWidth={1.5} />
                }
              </button>

              <Link
                href="/wishlist"
                className="relative text-black hover:text-[#E63946] transition-colors duration-200 cursor-pointer focus:outline-none"
                aria-label={t("nav.wishlist")}
              >
                <Heart className="w-[14px] h-[14px]" strokeWidth={1.5} />
                {user && wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-[14px] min-w-[14px] rounded-full text-[9px] flex items-center justify-center font-medium bg-[#E63946] text-white px-0.5" aria-hidden="true">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {!isShowcase && (
                <button
                  onClick={openDrawer}
                  className="relative text-black hover:text-[#E63946] transition-colors duration-200 cursor-pointer focus:outline-none"
                  aria-label={t("nav.cart")}
                >
                  <ShoppingBag className="w-[14px] h-[14px]" strokeWidth={1.5} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-[14px] min-w-[14px] rounded-full text-[9px] flex items-center justify-center font-medium bg-[#E63946] text-white px-0.5" aria-hidden="true">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </button>
              )}

              {user ? (
                <Link
                  href="/dashboard/profile"
                  className="text-black hover:text-[#E63946] transition-colors duration-200 cursor-pointer focus:outline-none"
                  aria-label={t("nav.account")}
                >
                  <User className="w-[14px] h-[14px]" strokeWidth={1.5} />
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden lg:block text-[10px] font-medium tracking-[0.12em] uppercase whitespace-nowrap text-black hover:text-[#E63946] transition-colors duration-200"
                >
                  {t("nav.signIn")}
                </Link>
              )}

              <button
                className="lg:hidden text-black hover:text-[#E63946] transition-colors cursor-pointer focus:outline-none ml-1"
                onClick={() => setMobileOpen((v) => !v)}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              >
                {mobileOpen
                  ? <X className="w-4 h-4" strokeWidth={1.5} />
                  : <Menu className="w-4 h-4" strokeWidth={1.5} />
                }
              </button>
            </div>
          </div>
        </div>

        {/* Row 2 — Masthead */}
        <div className="h-[56px] bg-white border-t-2 border-b border-black">
          <div className="flex flex-col items-center justify-center h-full px-6 lg:px-10 max-w-[1600px] mx-auto">
            {/* Oversized centered logo */}
            <Link
              href="/"
              className="text-[28px] font-black tracking-[0.05em] uppercase whitespace-nowrap text-black hover:text-[#E63946] transition-colors duration-200 focus:outline-none leading-none"
            >
              <StoreLogo imgHeight="h-9" />
            </Link>

            {/* Nav links below logo */}
            <nav
              className="hidden lg:flex items-center gap-6 mt-0.5"
              aria-label={t("nav.mainNav")}
            >
              {navItems.map((item) =>
                item.children.length > 0 ? (
                  <div key={item.id} className="relative group">
                    <button className="flex items-center gap-1 text-[10px] tracking-[0.16em] uppercase whitespace-nowrap text-black/50 hover:text-[#E63946] transition-colors duration-200 cursor-pointer">
                      {item.label} <ChevronDown className="w-3 h-3" />
                    </button>
                    <div className="absolute left-0 top-full pt-1 hidden group-hover:block z-50">
                      <div className="bg-white border border-gray-200 shadow-md rounded py-2 min-w-[180px]">
                        <Link
                          href={item.href}
                          className="block px-4 py-1.5 text-[10px] tracking-[0.14em] uppercase text-black/50 hover:text-[#E63946] hover:bg-gray-50 transition-colors"
                          {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {item.label}
                        </Link>
                        {item.children.map((child) => (
                          <Link
                            key={child.id}
                            href={child.href}
                            className="block px-4 py-1.5 text-[10px] tracking-[0.14em] uppercase text-black/50 hover:text-[#E63946] hover:bg-gray-50 transition-colors"
                            {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          >
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
                    className="text-[10px] tracking-[0.16em] uppercase whitespace-nowrap text-black/50 hover:text-[#E63946] transition-colors duration-200"
                    {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>
          </div>
        </div>

        {/* Search panel */}
        {searchOpen && (
          <div className="border-t border-black/10 bg-white animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <div className="max-w-2xl mx-auto px-6 py-4">
              <SearchBar />
            </div>
          </div>
        )}

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-black/10 bg-white animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <nav className="px-6 py-6 space-y-5" aria-label={t("nav.mainNav")}>
              {navItems.map((item) => (
                <div key={item.id}>
                  <Link
                    href={item.href}
                    className="block text-[12px] tracking-[0.18em] uppercase text-black/50 hover:text-[#E63946] transition-colors"
                    onClick={() => setMobileOpen(false)}
                    {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {item.label}
                  </Link>
                  {item.children.length > 0 && (
                    <div className="ml-4 mt-3 space-y-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          className="block text-[12px] tracking-[0.18em] uppercase text-black/50 hover:text-[#E63946] transition-colors"
                          onClick={() => setMobileOpen(false)}
                          {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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
                  className="block text-[12px] tracking-[0.18em] uppercase text-black/50 hover:text-[#E63946] transition-colors border-t border-black/10 pt-5"
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
