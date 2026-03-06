"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { searchProductsAPI, SlimProduct } from "@/services/product-service";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";

const DEBOUNCE_MS = 300;

export function SearchBar({ className }: { className?: string }) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SlimProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
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
      <form onSubmit={handleSubmit} role="search" aria-label={t("search.ariaLabel")}>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
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
            autoComplete="off"
          />
          {(loading || query) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {loading ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  onClick={clear}
                  className="text-muted-foreground hover:text-foreground transition-colors"
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
          role="listbox"
          aria-label={t("search.suggestionsLabel")}
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground text-center">
              {t("search.noResults", { query })}
            </p>
          ) : (
            <ul>
              {suggestions.map((product) => (
                <li key={product.id} role="option" aria-selected={false}>
                  <Link
                    href={`/products/${product.slug}`}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors focus:outline-none focus:bg-muted"
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt=""
                        aria-hidden="true"
                        className="h-10 w-10 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex-shrink-0" aria-hidden="true" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                    </div>
                  </Link>
                </li>
              ))}
              <li className="border-t">
                <Link
                  href={`/products/search?q=${encodeURIComponent(query)}`}
                  className="block px-3 py-2 text-sm text-primary hover:bg-muted transition-colors focus:outline-none focus:bg-muted"
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
