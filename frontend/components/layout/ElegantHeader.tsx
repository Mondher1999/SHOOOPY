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
import { useNavigation } from "@/hooks/useNavigation";
import { StoreLogo } from "@/components/layout/StoreLogo";

export function ElegantHeader() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const { totalItems: wishlistCount } = useWishlist();
  const { totalItems: cartCount, openDrawer } = useCart();
  const isShowcase = useShowcase();
  const navItems = useNavigation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#E8DDD0]">

        {/* Row 1 — utility bar */}
        <div className="bg-[#2D2A26]">
          <div className="flex h-[32px] items-center justify-end px-6 lg:px-10 max-w-[1600px] mx-auto gap-4">
            <LanguageSwitcher />
            <ThemeToggle />

            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="text-white/70 hover:text-[#C5A467] transition-colors duration-200 cursor-pointer focus:outline-none"
              aria-label={t("search.ariaLabel")}
            >
              {searchOpen
                ? <X className="w-[14px] h-[14px]" strokeWidth={1.5} />
                : <Search className="w-[14px] h-[14px]" strokeWidth={1.5} />
              }
            </button>

            <Link
              href="/wishlist"
              className="relative text-white/70 hover:text-[#C5A467] transition-colors duration-200 cursor-pointer focus:outline-none"
              aria-label={t("nav.wishlist")}
            >
              <Heart className="w-[14px] h-[14px]" strokeWidth={1.5} />
              {user && wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-[14px] min-w-[14px] rounded-full text-[9px] flex items-center justify-center font-medium bg-[#C5A467] text-white px-0.5" aria-hidden="true">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {!isShowcase && (
              <button
                onClick={openDrawer}
                className="relative text-white/70 hover:text-[#C5A467] transition-colors duration-200 cursor-pointer focus:outline-none"
                aria-label={t("nav.cart")}
              >
                <ShoppingBag className="w-[14px] h-[14px]" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-[14px] min-w-[14px] rounded-full text-[9px] flex items-center justify-center font-medium bg-[#C5A467] text-white px-0.5" aria-hidden="true">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <Link
                href="/dashboard/profile"
                className="text-white/70 hover:text-[#C5A467] transition-colors duration-200 cursor-pointer focus:outline-none"
                aria-label={t("nav.account")}
              >
                <User className="w-[14px] h-[14px]" strokeWidth={1.5} />
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="hidden lg:block text-[10px] font-medium tracking-[0.12em] uppercase whitespace-nowrap text-white/70 hover:text-[#C5A467] transition-colors duration-200"
              >
                {t("nav.signIn")}
              </Link>
            )}

            <button
              className="lg:hidden text-white/70 hover:text-[#C5A467] transition-colors cursor-pointer focus:outline-none ml-1"
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

        {/* Row 2 — logo + nav */}
        <div className="bg-[#FAF7F2]">
          <div className="flex h-[52px] items-center justify-center px-6 lg:px-10 max-w-[1600px] mx-auto relative">

            {/* Logo — centered */}
            <Link
              href="/"
              className="text-[20px] font-light tracking-[0.3em] uppercase whitespace-nowrap text-[#2D2A26] hover:text-[#C5A467] transition-colors duration-200 focus:outline-none lg:absolute lg:left-1/2 lg:-translate-x-1/2"
            >
              <StoreLogo imgHeight="h-8" />
            </Link>

            {/* Nav links — left aligned on desktop */}
            <nav
              className="hidden lg:flex items-center gap-0 mr-auto"
              aria-label={t("nav.mainNav")}
            >
              {navItems.map((item, idx) => (
                <span key={item.id} className="flex items-center">
                  {idx > 0 && (
                    <span className="text-[#C5A467]/40 mx-4 text-[11px]">&middot;</span>
                  )}
                  {item.children.length > 0 ? (
                    <div className="relative group">
                      <button
                        className="flex items-center gap-1 text-[11px] tracking-[0.18em] uppercase whitespace-nowrap text-[#2D2A26]/70 hover:text-[#C5A467] transition-colors duration-200 cursor-pointer focus:outline-none"
                      >
                        {item.label}
                        <ChevronDown className="w-3 h-3" strokeWidth={1.5} />
                      </button>
                      <div className="absolute left-0 top-full mt-1 hidden group-hover:block min-w-[180px] bg-white border border-[#e5ddd5] shadow-md rounded z-50">
                        {item.children.map((child) => (
                          <Link
                            key={child.id}
                            href={child.href}
                            {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            className="block px-4 py-2 text-[11px] tracking-[0.12em] uppercase text-[#2D2A26]/70 hover:bg-[#faf7f4] hover:text-[#C5A467] transition-colors duration-200"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="text-[11px] tracking-[0.18em] uppercase whitespace-nowrap text-[#2D2A26]/70 hover:text-[#C5A467] transition-colors duration-200"
                    >
                      {item.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>

        {/* Search panel */}
        {searchOpen && (
          <div className="border-t border-[#E8DDD0] bg-[#FAF7F2] animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <div className="max-w-2xl mx-auto px-6 py-4">
              <SearchBar />
            </div>
          </div>
        )}

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#E8DDD0] bg-[#FAF7F2] animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <nav className="px-6 py-6 space-y-5" aria-label={t("nav.mainNav")}>
              {navItems.map((item) => (
                <div key={item.id}>
                  <Link
                    href={item.href}
                    {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="block text-[12px] tracking-[0.18em] uppercase text-[#2D2A26]/70 hover:text-[#C5A467] transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.children.length > 0 && (
                    <div className="ml-4 mt-2 space-y-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          className="block text-[11px] tracking-[0.14em] uppercase text-[#2D2A26]/60 hover:text-[#C5A467] transition-colors"
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
                  className="block text-[12px] tracking-[0.18em] uppercase text-[#2D2A26]/70 hover:text-[#C5A467] transition-colors border-t border-[#E8DDD0] pt-5"
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
