"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { searchProductsAPI, SlimProduct } from "@/services/product-service";
import { cn } from "@/lib/utils";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import logger from "@/lib/logger";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const DEBOUNCE_MS = 300;

export function SearchBar({ className }: { className?: string }) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const formatPrice = useFormatPrice();
  const theme = useActiveTheme();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SlimProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await searchProductsAPI(q.trim(), 5);
      setSuggestions(res.data.products);
      setOpen(true);
    } catch (err) {
      logger.error("SearchBar suggestions error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/products/search?q=${encodeURIComponent(query.trim())}`);
  };

  // Total navigable items: suggestions + "view all" link at the end
  const totalItems = suggestions.length > 0 ? suggestions.length + 1 : 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open && suggestions.length > 0) setOpen(true);
      setActiveIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && open) {
      e.preventDefault();
      const items = containerRef.current?.querySelectorAll<HTMLElement>('[role="option"] a, [data-search-viewall]');
      items?.[activeIndex]?.click();
    }
  };

  const clear = () => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit} role="search" aria-label={t("search.ariaLabel")} suppressHydrationWarning>
        <div className="relative">
          <Search
            className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none", theme.textMuted)}
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={t("search.placeholder")}
            className="pl-9 pr-9"
            aria-label={t("search.placeholder")}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-controls={open ? "search-results" : undefined}
            aria-activedescendant={open && activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
            autoComplete="off"
            suppressHydrationWarning
          />
          {(loading || query) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {loading ? (
                <Loader2 className={cn("h-4 w-4 animate-spin", theme.textMuted)} aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  onClick={clear}
                  className={cn("transition-colors", theme.textMuted)}
                  aria-label={t("search.clear")}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </form>

      {/* Suggestion Dropdown */}
      {open && (
        <div
          id="search-results"
          role="listbox"
          aria-label={t("search.suggestionsLabel")}
          className={cn("absolute top-full left-0 right-0 z-50 mt-1 rounded-md border shadow-lg max-h-80 overflow-y-auto", theme.surface, theme.border)}
        >
          {suggestions.length === 0 ? (
            <p className={cn("p-3 text-sm text-center", theme.textMuted)}>
              {t("search.noResults", { query })}
            </p>
          ) : (
            <ul>
              {suggestions.map((product, idx) => (
                <li key={product.id} id={`search-result-${idx}`} role="option" aria-selected={activeIndex === idx}>
                  <Link
                    href={`/products/${product.slug}`}
                    className={cn("flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors focus:outline-none focus:bg-muted", activeIndex === idx && "bg-muted")}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {product.images[0] ? (
                      <img
                        src={product.images[0].thumbnail?.startsWith("http") ? product.images[0].thumbnail : `${BASE_URL}${product.images[0].thumbnail}`}
                        alt=""
                        aria-hidden="true"
                        className="h-10 w-10 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className={cn("h-10 w-10 rounded flex-shrink-0", theme.surface)} aria-hidden="true" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium truncate", theme.text)}>{product.name}</p>
                      <p className={cn("text-xs", theme.textMuted)}>{formatPrice(product.price)}</p>
                    </div>
                  </Link>
                </li>
              ))}
              <li id={`search-result-${suggestions.length}`} role="option" aria-selected={activeIndex === suggestions.length} className={cn("border-t", theme.border)}>
                <Link
                  href={`/products/search?q=${encodeURIComponent(query)}`}
                  data-search-viewall
                  className={cn("block px-3 py-2 text-sm hover:bg-muted transition-colors focus:outline-none focus:bg-muted", theme.accent, activeIndex === suggestions.length && "bg-muted")}
                  onClick={() => setOpen(false)}
                >
                  {t("search.viewAll", { query })}
                </Link>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
