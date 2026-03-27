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

export function PlayfulHeader() {
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
      <header className="sticky top-0 z-40 w-full">
        {/* Gradient top strip */}
        <div className="h-[3px] bg-gradient-to-r from-[#7C3AED] to-[#EC4899]" />

        {/* Main row */}
        <div className="bg-[#F8F7FF] border-b border-[#E8E5F7]">
          <div className="flex h-[56px] items-center px-6 lg:px-10 max-w-[1600px] mx-auto">

            {/* LEFT -- logo */}
            <Link
              href="/"
              className="text-[18px] font-semibold tracking-[0.1em] uppercase whitespace-nowrap text-[#7C3AED] hover:text-[#6D28D9] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded mr-10"
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
                    buttonClassName="text-[11px] font-medium tracking-[0.12em] uppercase whitespace-nowrap text-[#4B4869] hover:text-[#7C3AED] transition-colors duration-200 flex items-center gap-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                    menuClassName="bg-white border border-purple-100 shadow-md rounded-lg py-2 min-w-[180px]"
                  >
                    <Link href={item.href} className="block px-4 py-2 text-sm text-[#1c1c1c] hover:bg-purple-50 transition-colors focus:outline-none focus-visible:bg-purple-50" role="menuitem" tabIndex={-1} {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {item.label}
                    </Link>
                    {item.children.map((child) => (
                      <Link key={child.id} href={child.href} className="block px-4 py-2 text-sm text-[#1c1c1c] hover:bg-purple-50 transition-colors focus:outline-none focus-visible:bg-purple-50" role="menuitem" tabIndex={-1} {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {child.label}
                      </Link>
                    ))}
                  </NavDropdown>
                ) : (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="text-[11px] font-medium tracking-[0.12em] uppercase whitespace-nowrap text-[#4B4869] hover:text-[#7C3AED] transition-colors duration-200"
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
                className="text-[#4B4869] hover:text-[#7C3AED] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                aria-label={t("search.ariaLabel")}
              >
                {searchOpen
                  ? <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  : <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
                }
              </button>

              <Link
                href="/wishlist"
                className="relative text-[#4B4869] hover:text-[#7C3AED] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                aria-label={t("nav.wishlist")}
              >
                <Heart className="w-[18px] h-[18px]" strokeWidth={1.5} />
                {user && wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-[14px] min-w-[14px] rounded-full text-[9px] flex items-center justify-center font-medium bg-[#7C3AED] text-white px-0.5" aria-hidden="true">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {!isShowcase && (
                <button
                  onClick={openDrawer}
                  className="relative text-[#4B4869] hover:text-[#7C3AED] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  aria-label={t("nav.cart")}
                >
                  <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-[14px] min-w-[14px] rounded-full text-[9px] flex items-center justify-center font-medium bg-[#7C3AED] text-white px-0.5" aria-hidden="true">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </button>
              )}

              {user ? (
                <Link
                  href="/dashboard/profile"
                  className="text-[#4B4869] hover:text-[#7C3AED] transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  aria-label={t("nav.account")}
                >
                  <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden lg:block text-[11px] font-medium tracking-[0.12em] uppercase whitespace-nowrap text-[#4B4869] hover:text-[#7C3AED] transition-colors duration-200"
                >
                  {t("nav.signIn")}
                </Link>
              )}

              <button
                className="lg:hidden text-[#4B4869] hover:text-[#7C3AED] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded ml-1"
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
            <div className="border-t border-[#E8E5F7] bg-[#F8F7FF] animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <div className="max-w-2xl mx-auto px-6 py-4">
                <SearchBar />
              </div>
            </div>
          )}

          {/* Mobile nav */}
          {mobileOpen && (
            <div className="lg:hidden border-t border-[#E8E5F7] bg-[#F8F7FF] animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <nav className="px-6 py-6 space-y-5" aria-label={t("nav.mainNav")}>
                {navItems.map((item) => (
                  <div key={item.id}>
                    <Link
                      href={item.href}
                      className="block text-[12px] tracking-[0.18em] uppercase text-[#4B4869] hover:text-[#7C3AED] transition-colors"
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
                            className="block text-[12px] tracking-[0.18em] uppercase text-[#4B4869]/70 hover:text-[#7C3AED] transition-colors"
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
                    className="block text-[12px] tracking-[0.18em] uppercase text-[#4B4869] hover:text-[#7C3AED] transition-colors border-t border-[#E8E5F7] pt-5"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("nav.signIn")}
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
