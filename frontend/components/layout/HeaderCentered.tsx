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

export function HeaderCentered() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const { totalItems: wishlistCount } = useWishlist();
  const { totalItems: cartCount, openDrawer } = useCart();
  const isShowcase = useShowcase();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navItems = useNavigation();

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
      <header className="sticky top-0 z-40 w-full bg-white border-b border-[#e8e8e8]">
        {/* ─── Top utility bar ─── */}
        <div className="flex h-[48px] items-center px-6 lg:px-10 max-w-[1600px] mx-auto">
          {/* LEFT — language + search */}
          <div className="flex items-center gap-4 flex-1">
            <LanguageSwitcher />
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="text-[#1c1c1c] hover:text-[#6b6b6b] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              aria-label={t("search.ariaLabel")}
            >
              {searchOpen
                ? <X className="w-[17px] h-[17px]" strokeWidth={1.5} />
                : <Search className="w-[17px] h-[17px]" strokeWidth={1.5} />
              }
            </button>
          </div>

          {/* CENTER — brand name */}
          <Link
            href="/"
            className="font-heading text-[22px] font-normal tracking-[0.30em] uppercase whitespace-nowrap text-[#1c1c1c] hover:text-[#6b6b6b] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            <StoreLogo imgHeight="h-8" />
          </Link>

          {/* RIGHT — icons */}
          <div className="flex items-center gap-5 flex-1 justify-end">
            <Link
              href="/wishlist"
              className="relative text-[#1c1c1c] hover:text-[#6b6b6b] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              aria-label={t("nav.wishlist")}
            >
              <Heart className="w-[17px] h-[17px]" strokeWidth={1.5} />
              {user && wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-[14px] min-w-[14px] rounded-full text-[9px] flex items-center justify-center font-medium bg-[#1c1c1c] text-white px-0.5" aria-hidden="true">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {!isShowcase && (
              <button
                onClick={openDrawer}
                className="relative text-[#1c1c1c] hover:text-[#6b6b6b] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                aria-label={t("nav.cart")}
              >
                <ShoppingBag className="w-[17px] h-[17px]" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-[14px] min-w-[14px] rounded-full text-[9px] flex items-center justify-center font-medium bg-[#1c1c1c] text-white px-0.5" aria-hidden="true">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <Link
                href="/dashboard/profile"
                className="text-[#1c1c1c] hover:text-[#6b6b6b] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                aria-label={t("nav.account")}
              >
                <User className="w-[17px] h-[17px]" strokeWidth={1.5} />
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="hidden lg:block text-[10px] font-medium tracking-[0.12em] uppercase whitespace-nowrap text-[#1c1c1c] hover:text-[#6b6b6b] transition-colors duration-200"
              >
                {t("nav.signIn")}
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden text-[#1c1c1c] hover:text-[#6b6b6b] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded ml-1"
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

        {/* ─── Bottom nav bar (desktop) ─── */}
        <nav
          className="hidden lg:flex items-center justify-center gap-10 h-[36px] border-t border-[#f0f0f0]"
          aria-label={t("nav.mainNav")}
        >
          {navItems.map((item) =>
            item.children.length > 0 ? (
              <NavDropdown
                key={item.id}
                buttonContent={<>{item.label} <ChevronDown className="w-3 h-3" /></>}
                buttonClassName="flex items-center gap-1 text-[11px] font-medium tracking-[0.18em] uppercase whitespace-nowrap text-[#1c1c1c] hover:text-[#6b6b6b] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                menuClassName="bg-white border border-gray-200 shadow-md rounded-md py-2 min-w-[180px]"
              >
                <Link href={item.href} className="block px-4 py-1.5 text-[11px] tracking-[0.14em] uppercase text-[#1c1c1c] hover:text-[#6b6b6b] hover:bg-gray-50 transition-colors focus:outline-none focus-visible:bg-gray-50" role="menuitem" tabIndex={-1} {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {item.label}
                </Link>
                {item.children.map((child) => (
                  <Link key={child.id} href={child.href} className="block px-4 py-1.5 text-[11px] tracking-[0.14em] uppercase text-[#1c1c1c] hover:text-[#6b6b6b] hover:bg-gray-50 transition-colors focus:outline-none focus-visible:bg-gray-50" role="menuitem" tabIndex={-1} {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {child.label}
                  </Link>
                ))}
              </NavDropdown>
            ) : (
              <Link
                key={item.id}
                href={item.href}
                className="text-[11px] font-medium tracking-[0.18em] uppercase whitespace-nowrap text-[#1c1c1c] hover:text-[#6b6b6b] transition-colors duration-200"
                {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Search panel */}
        {searchOpen && (
          <div className="border-t border-[#e8e8e8] bg-white animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <div className="max-w-2xl mx-auto px-6 py-4">
              <SearchBar />
            </div>
          </div>
        )}

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#e8e8e8] bg-white animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <nav className="px-6 py-6 space-y-5" aria-label={t("nav.mainNav")}>
              {navItems.map((item) => (
                <div key={item.id}>
                  <Link
                    href={item.href}
                    className="block text-[12px] tracking-[0.18em] uppercase text-[#1c1c1c] hover:text-[#6b6b6b] transition-colors"
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
                          className="block text-[12px] tracking-[0.18em] uppercase text-[#1c1c1c] hover:text-[#6b6b6b] transition-colors"
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
                  className="block text-[12px] tracking-[0.18em] uppercase text-[#1c1c1c] hover:text-[#6b6b6b] transition-colors border-t border-[#e8e8e8] pt-5"
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
