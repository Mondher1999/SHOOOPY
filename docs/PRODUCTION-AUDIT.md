# ShopFlow Production Audit Report

**Date**: 2026-03-17
**Scope**: Full-stack audit (frontend + backend) — 380+ source files (281 frontend, 99 backend)
**Auditors**: 10 specialized agents (security x2, code review x2, performance x2, i18n, accessibility, SEO, QA)

---

## Executive Summary

| Domain | Critical | High | Medium | Low | Info | Total |
|---|---|---|---|---|---|---|
| **Backend Security** | 1 | 3 | 4 | 1 | 1 | **10** |
| **Frontend Security** | 1 | 4 | 5 | 2 | — | **12** |
| **Backend Code Review** | 4 | 5 | 10 | 5 | — | **24** |
| **Frontend Code Review** | 1 | 6 | 10 | 6 | — | **23** |
| **Backend Performance** | 3 | 9 | 10 | 6 | — | **28** |
| **Frontend Performance** | 4 | 7 | 6 | 4 | — | **21** |
| **i18n / Translations** | 3 | 6 | 4 | 3 | — | **16** |
| **Accessibility (WCAG)** | 3 | 7 | 8 | 3 | — | **21** |
| **SEO** | 5 | 6 | 5 | 4 | — | **20** |
| **QA / Bug Detection** | 3 | 4 | 4 | 1 | — | **12** |
| **TOTAL** | **28** | **57** | **66** | **35** | **1** | **187** |

### Verdict: NOT PRODUCTION-READY

The codebase has strong foundational patterns (consistent error handling, input sanitization, zero `any` types, proper JWT architecture, good ARIA awareness on forms). However, **28 critical issues** must be resolved before production deployment. The most impactful gap is that **SEO infrastructure exists but is entirely disconnected** — `lib/seo.tsx` defines all structured data helpers but zero pages import them.

---

## TOP 15 MUST-FIX BEFORE PRODUCTION

### 1. [CRITICAL] Order Status Transitions Not Enforced
**File**: `backend/src/controllers/orderController.js:29-36, 671-724`
**Found by**: Security, Code Review, QA
**Impact**: Admin can set any order to any status (e.g., `cancelled` → `delivered`), creating phantom inventory and breaking the order state machine.
**Fix**: Add `VALID_TRANSITIONS` check before status update:
```js
const allowed = VALID_TRANSITIONS[order.status];
if (!allowed || !allowed.includes(status))
  return res.status(400).json({ success: false, error: `Cannot transition from "${order.status}" to "${status}"` });
```

### 2. [CRITICAL] `note.trim()` Crashes on Undefined
**File**: `backend/src/controllers/orderController.js:705`
**Found by**: Code Review, QA
**Impact**: Admin status update without `note` field crashes with TypeError (500 error). Blocks all order processing.
**Fix**: Change to `note: (note || "").trim()`

### 3. [CRITICAL] Order Number Race Condition
**File**: `backend/src/controllers/orderController.js:121-136`
**Found by**: Code Review, Performance, QA
**Impact**: Concurrent orders on the same day generate duplicate order numbers → 500 error, lost order.
**Fix**: Use atomic counter with `findOneAndUpdate` + `$inc`, or catch error 11000 and retry up to 3 times.

### 4. [CRITICAL] BuyNow Missing TVA in Order Items
**File**: `backend/src/controllers/orderController.js:394-406`
**Found by**: Code Review, QA
**Impact**: Buy Now orders omit `tva` field and compute HT pricing. 19% revenue loss on all Buy Now orders.
**Fix**: Add `tva: item.tva || 0` to order items and use TTC calculation matching `placeOrder`.

### 5. [CRITICAL] No `generateMetadata()` on Product/Category Pages
**File**: `frontend/app/(store)/products/[slug]/page.tsx`, `products/page.tsx`, `categories/[slug]/page.tsx`
**Found by**: SEO
**Impact**: Every product page shares the same generic title "ShopFlow — Cash on Delivery Shopping". Products cannot rank individually. Devastating for e-commerce SEO.
**Fix**: Add `generateMetadata()` using `serverFetchProduct()` from `lib/server-api.ts` (already exists, unused). Return dynamic title, description, OG tags, canonical.

### 6. [CRITICAL] Product Pages Are 100% Client-Rendered
**File**: `frontend/app/(store)/products/[slug]/page.tsx` + `ProductDetailClient.tsx`
**Found by**: SEO, Performance
**Impact**: Crawlers receive empty HTML shells. All product data fetched client-side in `useEffect`. Zero indexable content on the most important e-commerce pages.
**Fix**: Fetch product data in the server component (page.tsx) and pass as `initialProduct` prop (the prop already exists on ProductDetailClient line 44-46).

### 7. [CRITICAL] JSON-LD Structured Data Built But Never Rendered
**File**: `frontend/lib/seo.tsx` (defined) → zero imports anywhere
**Found by**: SEO
**Impact**: No rich results in Google (no price/availability/rating cards). The `productSchema()`, `organizationSchema()`, `websiteSchema()`, `breadcrumbSchema()`, and `<JsonLd>` component all exist — just never imported.
**Fix**: Import and render in product pages, category pages, and root layout.

### 8. [CRITICAL] CSP Allows unsafe-eval in Production
**File**: `frontend/middleware.ts:27`
**Found by**: Security, SEO
**Impact**: CSP provides zero XSS protection. Also hardcoded to `localhost:5001`.
**Fix**: Remove `unsafe-eval` in production, use nonce-based CSP, use env vars for API origin.

### 9. [CRITICAL] All 10 Homepage Themes Eagerly Loaded
**File**: `frontend/components/home/HomepageSections.tsx:1-131`
**Found by**: Performance
**Impact**: ~9,900+ lines of theme code loaded for every visitor when only 1 theme is active. 50-100KB+ unnecessary gzipped JS.
**Fix**: Use `next/dynamic` per theme (pattern exists in `HeaderSwitcher.tsx`).

### 10. [CRITICAL] Dropdown Menus Keyboard-Inaccessible in All 10 Headers
**File**: All `frontend/components/layout/*Header.tsx`
**Found by**: Accessibility
**Impact**: All desktop navigation dropdowns use CSS `group-hover:block` only. No keyboard-based opening mechanism. Keyboard users and screen reader users cannot access any category sub-navigation.
**Fix**: Replace hover with controlled state toggled on click/Enter/Space, add `aria-expanded`, `aria-haspopup`, Escape to close. Consider shadcn/ui `NavigationMenu`.

### 11. [CRITICAL] Focus Indicators Removed in 9 of 10 Header Themes
**File**: All themed `*Header.tsx` except `Header.tsx`
**Found by**: Accessibility
**Impact**: 61 instances of `focus:outline-none` without `focus-visible` replacement. Keyboard users cannot see where focus is on any themed header.
**Fix**: Replace `focus:outline-none` with `focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.

### 12. [CRITICAL] No Skip Navigation Link
**File**: `frontend/app/(store)/layout.tsx`
**Found by**: Accessibility
**Impact**: Keyboard users must tab through 15+ header elements on every page to reach content.
**Fix**: Add visually-hidden-until-focused `<a href="#main-content">` as first child of layout.

### 13. [CRITICAL] `VALID_LANGUAGES` Only Includes "en"
**File**: `backend/src/controllers/userController.js:10`
**Found by**: Code Review, i18n
**Impact**: Users cannot save French language preference. Bilingual email templates always render in English.
**Fix**: Change to `const VALID_LANGUAGES = ["en", "fr"]`

### 14. [CRITICAL] Context Providers Not Memoized
**Files**: `AuthContext.tsx`, `CartContext.tsx`, `WishlistContext.tsx`, `SettingsContext.tsx`
**Found by**: Performance
**Impact**: Every context update cascades through 7-level provider chain. Every product card, header, footer re-renders on any auth/cart/settings change.
**Fix**: Wrap all context values in `useMemo`, callbacks in `useCallback`.

### 15. [CRITICAL] Checkout OrderSummary Ignores Free Shipping Threshold
**File**: `frontend/components/checkout/OrderSummary.tsx:63`
**Found by**: QA
**Impact**: Customer sees wrong (higher) total when they qualify for free shipping. Backend charges correctly but UI shows wrong price.
**Fix**: Add threshold check: `if (threshold > 0 && subtotal >= threshold) shippingCost = 0`

---

## SECURITY FINDINGS

### Backend Security (10 findings)

| # | Severity | File | Issue |
|---|---|---|---|
| 1 | CRITICAL | orderController.js:29-36 | Order status transitions not enforced |
| 2 | HIGH | orderController.js:705 | `note.trim()` crash on undefined |
| 3 | HIGH | exportController.js:6-35 | CSV injection — no `escapeCSV()` on products/orders export |
| 4 | HIGH | settingsController.js:803-863 | Settings upload missing `assertWithin()` path traversal guard |
| 5 | MEDIUM | server.js:44-49 | CORS fallback to `http://localhost:3002` in production |
| 6 | MEDIUM | server.js:80-83 | Static files missing explicit `dotfiles: 'deny'` |
| 7 | MEDIUM | settingsController.js:16 | Weak encryption key fallback `"default-dev-key-change-me"` |
| 8 | MEDIUM | productRoutes.js:24-26 | Product CRUD allows any authenticated user (not just admin) |
| 9 | LOW | settingsRoutes.js:17-28 | Settings upload accepts SVG (can contain embedded JS) |
| 10 | INFO | utils/cache.js | In-memory cache has no size limit |

**Verified Working**: bcrypt(12), SHA-256 token hashing, token rotation, account lockout, user enumeration prevention, `escapeRegex()` on all `$regex`, ObjectId validation, Helmet, rate limiting, timing-safe webhook verification, no `console.log`/`eval`/`$where`/`require()`.

### Frontend Security (12 findings)

| # | Severity | File | Issue |
|---|---|---|---|
| 1 | CRITICAL | axiosInstance.ts, AuthContext.tsx | JWT tokens in localStorage (XSS exfiltration risk) |
| 2 | HIGH | AnalyticsScripts.tsx:26,45 | Analytics ID injection → stored XSS on every page |
| 3 | HIGH | middleware.ts:27 | CSP allows `unsafe-inline` + `unsafe-eval` |
| 4 | HIGH | middleware.ts:29,31 | CSP hardcoded to localhost → breaks production |
| 5 | HIGH | admin/layout.tsx:22-29 | Admin route protection is client-side only |
| 6 | MEDIUM | lib/api.ts:28-33 | `fetchAPI` has no token refresh → silent auth failures |
| 7 | MEDIUM | admin/settings/page.tsx | File uploads missing client-side validation |
| 8 | MEDIUM | dashboard/profile/page.tsx | Avatar upload missing size validation |
| 9 | MEDIUM | next.config.mjs:9-17 | Remote images only allow localhost |
| 10 | MEDIUM | admin/orders/page.tsx:71-78 | Raw `fetch()` bypasses axiosInstance |
| 11 | LOW | lib/seo.tsx:130 | JSON-LD `dangerouslySetInnerHTML` (safe pattern, minor hardening needed) |
| 12 | LOW | checkout/page.tsx:123 | Login redirect parameter ignored |

**Verified Working**: No `eval`/`document.write`/`innerHTML`, proper Zod validation on all forms, token refresh mutex, `safeHref()` validation, `ThemeInjector` color validation.

---

## CODE REVIEW FINDINGS

### Backend Code Review (24 findings)

| # | Severity | Category | Issue |
|---|---|---|---|
| 1 | CRITICAL | Data Integrity | Order status transitions defined but not enforced |
| 2 | CRITICAL | Error Handling | `note.trim()` crash on undefined |
| 3 | CRITICAL | Race Condition | `generateOrderNumber()` duplicate numbers |
| 4 | CRITICAL | Financial | `buyNow` TVA missing → 19% revenue loss |
| 5 | HIGH | Data Integrity | Stock decrement/restore not in MongoDB transaction |
| 6 | HIGH | i18n | `VALID_LANGUAGES = ["en"]` — FR blocked |
| 7 | HIGH | Maintainability | `settingsController.js` is 700+ line single function |
| 8 | HIGH | Security | CSV export missing injection protection |
| 9 | HIGH | Data Integrity | CSV import uses naive `split(",")` |
| 10 | MEDIUM | Data Integrity | `buyNow` populate excludes `tva` and `variantMode` |
| 11 | MEDIUM | Performance | `updateProduct` returns Mongoose doc instead of lean |
| 12 | MEDIUM | Validation | `getCategoryBySlug` doesn't validate slug format |
| 13 | MEDIUM | Performance | `checkEligibility` uses non-lean query |
| 14 | MEDIUM | Validation | `submitContact` doesn't trim `message` |
| 15 | MEDIUM | Feature Parity | `placeOrder` doesn't support coupon codes (only `buyNow` does) |
| 16 | MEDIUM | Hardcoded | Hardcoded `$` in coupon error message |
| 17 | MEDIUM | Sync I/O | `fs.existsSync`/`mkdirSync` in export controller |
| 18 | MEDIUM | Duplication | `decrypt` function duplicated in settingsController + webhookController |
| 19 | MEDIUM | Consistency | Non-standard response format in a few controllers |
| 20 | LOW | Inconsistency | Route prefix mismatch: `/api/uploads` vs `/api/upload` in docs |
| 21 | LOW | Inconsistency | Health route at `/health` instead of `/api/health` |
| 22 | LOW | Performance | `getProfile`/`getUserById` skip `.lean()` |
| 23 | LOW | Naming | Inconsistent variable naming in a few controllers |
| 24 | LOW | Dead code | Unused imports in some controllers |

### Frontend Code Review (23 findings)

| # | Severity | Category | Issue |
|---|---|---|---|
| 1 | CRITICAL | Memory Leak | `useToast` re-subscribes on every state change |
| 2 | HIGH | Standards | Raw `fetch()` in admin orders export (bypasses axiosInstance) |
| 3 | HIGH | Performance | `wishlistIds` Set not wrapped in `useMemo` → cascading re-renders |
| 4 | HIGH | UX | BuyNowModal form not using react-hook-form + Zod |
| 5 | HIGH | React | Checkout uses `item.product.id` as key — duplicates for variants |
| 6 | HIGH | UX | Guest cart calculates `totalPrice` without TVA |
| 7 | HIGH | Standards | 808+ inline styles violating Tailwind-only rule |
| 8 | MEDIUM | Maintainability | Admin settings: 3,372-line monolith |
| 9 | MEDIUM | Standards | Multiple forms without react-hook-form |
| 10 | MEDIUM | Error Handling | Missing `error.tsx` error boundaries |
| 11 | MEDIUM | Error Handling | Missing `not-found.tsx` for custom 404 |
| 12 | MEDIUM | Standards | Hardcoded "DT" currency in 8 homepage components |
| 13 | MEDIUM | Rendering | 44 of 57 pages are `"use client"` — almost no Server Components |
| 14 | MEDIUM | Standards | Import order violations in some files |
| 15 | MEDIUM | Standards | `cn()` not used for conditional classes in some components |
| 16 | MEDIUM | TypeScript | Loose typing in a few service functions |
| 17 | LOW | Performance | `ProductCard` not memoized in 12+ item lists |
| 18 | LOW | Standards | Missing loading states in some admin pages |
| 19 | LOW | Standards | Missing empty states in some admin pages |
| 20 | LOW | Naming | Some service functions don't follow naming conventions |
| 21 | LOW | Dead code | Unused imports in a few components |
| 22 | LOW | Comments | TODO comments left in production code |
| 23 | LOW | Consistency | Inconsistent error handling patterns |

**Verified Working**: Zero `any` types, zero `@ts-ignore`, proper logger usage (no `console.log`), consistent `{ success, data/error }` response format across backend.

---

## PERFORMANCE FINDINGS

### Backend Performance (28 findings)

**Top 5 by Impact:**

| # | Severity | Issue | Impact |
|---|---|---|---|
| 1 | CRITICAL | N+1 in stock decrement: 4 DB roundtrips per order item | 10-item order = 40 DB operations |
| 2 | CRITICAL | `computeShippingCost()` ignores existing settings cache | Unnecessary DB hit on every order |
| 3 | CRITICAL | Order number race condition (`countDocuments` not atomic) | Duplicate numbers under concurrent load |
| 4 | HIGH | `protect` middleware queries DB on every authenticated request | Highest-volume query in app — adds 1-5ms to every endpoint |
| 5 | HIGH | `getProductBySlug` (hottest endpoint) has zero caching | Every product page view = 3 DB queries |

**Other Notable Findings:**
- `searchProducts` uses `$regex` instead of existing text index (full collection scan on every keystroke)
- `getAllCategories` has no cache (called on every product listing page)
- `placeOrder` fetches same products 3 times
- Export endpoints load entire collections into memory
- `importProducts` creates products one-by-one in a loop
- Missing compound indexes for admin order search and review eligibility
- No MongoDB connection pool configuration
- In-memory cache has no eviction → unbounded memory growth

### Frontend Performance (21 findings)

**Top 5 by Impact:**

| # | Severity | Issue | Impact |
|---|---|---|---|
| 1 | CRITICAL | All 10 homepage themes eagerly imported | 50-100KB+ unnecessary gzipped JS per visitor |
| 2 | CRITICAL | `unoptimized` prop on 20+ `next/image` instances | No WebP conversion, no responsive sizing — 3-5x bandwidth waste |
| 3 | CRITICAL | 44 of 57 pages are `"use client"` — no SSR | Crawlers see empty HTML, huge JS payloads, poor LCP |
| 4 | CRITICAL | WishlistContext creates new Set every render | Cascading re-renders on every context change |
| 5 | HIGH | Recharts (~200KB) eagerly imported in admin dashboard | Admin dashboard 200KB heavier than needed |

**Other Notable Findings:**
- All 4 context providers lack `useMemo` on values → full tree re-renders
- `ProductCard` not memoized but rendered in 12+ item lists
- Admin settings page is 3,372-line monolith (code-split candidate)
- Multiple `<img>` tags instead of `next/image`
- Missing `next.config.mjs` optimizations (optimizePackageImports, poweredByHeader)
- No image format optimization configured (missing `formats: ['image/avif', 'image/webp']`)

---

## i18n / TRANSLATION FINDINGS

### Summary
- **Namespaces checked**: 11 (common, auth, dashboard, products, categories, cart, checkout, orders, reviews, wishlist, admin)
- **75+ keys** with EN/FR parity mismatches
- **14 hardcoded strings** in components
- **0 placeholder mismatches** (all `{{variable}}` names consistent)
- **1 key** missing from both EN and FR (`landing.collections.showMore`)
- **1 typo**: FR checkout has `browsProducts` instead of `browseProducts`

### Critical Gaps (P0 — Broken UI)

| Namespace | Missing From | Count | Impact |
|---|---|---|---|
| **wishlist** | EN | 9 keys | EN users see raw key strings for entire enhanced wishlist page |
| **checkout** | EN | 5 coupon keys | EN users see key strings in BuyNow modal coupon flow |
| **orders** | FR | 8 admin shipping keys | FR admin panel shows key strings for shipping management |

### High Gaps (P1 — Visible to Users)

| Namespace | Missing From | Count | Impact |
|---|---|---|---|
| products | EN | 28 catalog + 4 SEO keys | Filter labels, lightbox, trust badges show key strings |
| products | EN | ~241 typeAttrOptions | Attribute translations (colors, materials) — EN shows raw values |
| common | FR | 8 landing.values keys | Vitrine theme "Why Choose Us" shows EN fallback |
| categories | EN | 4 keys | Cascade delete warning, catalog subtitle show key strings |
| dashboard | EN | 2 keys | Continue shopping, same-password error show key strings |
| cart | EN | 2 keys | Showcase mode shows key strings |
| checkout | EN | 2 showcase keys | Showcase mode shows key strings |
| orders | EN | 26 shipping section keys | FR reorganized keys under `shipping.*` but EN lacks them |

### Hardcoded Strings (14 instances)

| File | String | Severity |
|---|---|---|
| `dashboard/orders/page.tsx:88` | `"Your orders will appear here once you place one."` | HIGH |
| `hooks/useLandingProduct.tsx:62` | `"Failed to load product"` | MEDIUM |
| `layout/ArtisanHeader.tsx:35` | `"Handcrafted with love"` | LOW |
| `layout/ScrollToTop.tsx:21` | `aria-label="Scroll to top"` | MEDIUM |
| `dashboard/layout.tsx:84,174` | `aria-label="Close/Open menu"` | MEDIUM |
| `products/ProductFilters.tsx:189` | `aria-label="Reset price filter"` | MEDIUM |
| `app/layout.tsx:11-12` | Root metadata title + description | MEDIUM |
| `admin/settings/page.tsx` (various) | Placeholders, icon labels | LOW |

### Namespace Parity Table

| Namespace | EN Keys | FR Keys | Status |
|---|---|---|---|
| common | ~528 | ~520 | EN has 8 extra |
| auth | 84 | 84 | Perfect |
| dashboard | 79 | 82 | FR has 3 extra |
| products | 308 | ~577 | FR has ~269 extra |
| categories | 61 | 65 | FR has 4 extra |
| cart | 42 | 44 | FR has 2 extra |
| checkout | 85 | 93 | FR has 8 extra |
| orders | 107 | 126 | Structural mismatch |
| reviews | 41 | 41 | Perfect |
| wishlist | 15 | 24 | FR has 9 extra |
| admin | 858 | 858 | Perfect |

---

## ACCESSIBILITY FINDINGS (WCAG 2.1 AA)

### Summary
- **Total findings: 21** — Critical: 3 | High: 7 | Medium: 8 | Low: 3
- **WCAG 2.1 AA Compliance: PARTIAL**

### Critical (3)

| # | WCAG | Issue | Files | Impact |
|---|---|---|---|---|
| 1 | 2.1.1 | Dropdown menus keyboard-inaccessible (CSS hover only) | All 10 `*Header.tsx` | Keyboard/screen reader users blocked from category navigation |
| 2 | 2.4.7 | Focus indicators removed in 9 header themes (61 instances of `focus:outline-none` without `focus-visible` replacement) | All themed `*Header.tsx` | Sighted keyboard users cannot see focus position |
| 3 | 2.4.1 | No skip-to-content link | `(store)/layout.tsx` | Keyboard users tab through 15+ header elements on every page |

### High (7)

| # | WCAG | Issue | Files |
|---|---|---|---|
| 4 | 3.1.2 | Hardcoded English "Handcrafted with love" in ArtisanHeader | `ArtisanHeader.tsx:35` |
| 5 | 1.4.3 | BuyNowModal inline `style={{ backgroundColor: "#000" }}` — disabled state indistinguishable | `BuyNowModal.tsx:318,417` |
| 6 | 4.1.2 | ReviewForm Dialog missing `DialogDescription` | `ReviewForm.tsx:100-105` |
| 7 | 1.3.1 | VariantSelector groups lack `role="group"` and `aria-labelledby` | `VariantSelector.tsx:171-195` |
| 8 | 2.5.5 | Cart drawer quantity buttons 24x24px (below 44px minimum) | `CartDrawer.tsx:163-191` |
| 9 | 3.3.1 | BuyNowModal form lacks `aria-describedby` on errors, `aria-required` | `BuyNowModal.tsx:347-401` |
| 10 | 4.1.2 | SearchBar listbox lacks `aria-controls`, `aria-activedescendant`, arrow key navigation | `SearchBar.tsx:98-131` |

### Medium (8)

| # | Issue | Files |
|---|---|---|
| 11 | Hardcoded English "Collapse"/"Expand" aria-labels | `ProductFilters.tsx:50` |
| 12 | Themed headers use hardcoded hex with low-contrast opacity (`/50`, `/70`) | All `*Header.tsx` |
| 13 | Mobile menus not focus-trapped, no Escape to close | All themed headers |
| 14 | Nested `<main>` landmarks (checkout adds `<main>` inside layout's `<main>`) | `checkout/page.tsx:181` |
| 15 | Checkout success uses raw `<img>` without dimensions | `checkout/success/page.tsx:128-132` |
| 16 | Password strength indicator uses dynamic Tailwind class (may not work at build) | `register/page.tsx:172-179` |
| 17 | Server error alerts use `aria-live="polite"` instead of `role="alert"` | `login/page.tsx:66`, `register/page.tsx:118` |
| 18 | BuyNowModal quantity buttons 24x24px | `BuyNowModal.tsx:228-244` |

### Low (3)

| # | Issue | Files |
|---|---|---|
| 19 | ImageGallery prev/next buttons 32x32px | `ImageGallery.tsx:83-101` |
| 20 | ReviewForm rating label not associated with RatingStars | `ReviewForm.tsx:110-111` |
| 21 | BuyNowModal coupon label not linked via `htmlFor` | `BuyNowModal.tsx:291-302` |

### Positive Observations
- Forms (Login, Register, AddressSelector) have excellent ARIA: `htmlFor`/`id`, `aria-describedby`, `aria-invalid`, `role="alert"` on errors
- Icon-only buttons consistently have `aria-label` with translated strings throughout the codebase
- Cart drawer: proper dialog semantics via Sheet, `<ul>/<li>` list, `aria-live` on quantity
- Checkout step indicator: `aria-current="step"`, `sr-only` descriptive text, semantic `<nav>/<ol>/<li>`
- ImageGallery: correct `role="tablist"`/`role="tab"`/`aria-selected` pattern
- AddressSelector: proper `role="radiogroup"` with `role="radio"` and `aria-checked`
- Mobile menu toggle: correct `aria-expanded` toggling across all headers

---

## SEO FINDINGS

### Summary
- **Total findings: 20** — Critical: 5 | High: 6 | Medium: 5 | Low: 4
- **Key insight**: SEO infrastructure exists in `lib/seo.tsx` and `lib/server-api.ts` but is **completely disconnected** from the rendering pipeline. Zero imports of SEO helpers anywhere.

### Critical (5)

| # | Issue | Files | Impact |
|---|---|---|---|
| 1 | No `generateMetadata()` on product detail page | `products/[slug]/page.tsx` | Every product shares generic title — cannot rank individually |
| 2 | Product pages are 100% CSR (useEffect + Axios) | `products/[slug]/page.tsx` + `ProductDetailClient.tsx` | Crawlers see empty HTML shell |
| 3 | No JSON-LD structured data rendered anywhere | `lib/seo.tsx` defined but 0 imports | No rich results (price, rating, availability) in Google |
| 4 | No `generateMetadata()` on product listing | `products/page.tsx` | "/products" page — key landing page — has generic metadata |
| 5 | No `generateMetadata()` on category pages | `categories/[slug]/page.tsx`, `categories/page.tsx` | Category SEO pillars have no unique metadata |

### High (6)

| # | Issue | Files | Impact |
|---|---|---|---|
| 6 | Homepage is `"use client"` with no SSR | `(store)/page.tsx` | Highest-authority page served as empty shell to crawlers |
| 7 | No `generateMetadata()` on categories listing | `categories/page.tsx` | Generic metadata |
| 8 | No canonical tags on any page | All store pages | Duplicate content risk, ranking signal dilution |
| 9 | No OpenGraph or Twitter Card tags | All store pages | Poor social sharing CTR |
| 10 | No HSTS header | `middleware.ts` | HTTPS ranking signal weakened |
| 11 | All `<Image>` use `unoptimized` + no format config | `next.config.mjs`, 20+ components | No WebP/AVIF, impacts LCP significantly |

### Medium (5)

| # | Issue | Files |
|---|---|---|
| 12 | robots.txt Sitemap URL hardcoded to `shopflow.com` but seo.tsx defaults to `omegadistribution.tn` | `public/robots.txt`, `lib/seo.tsx` |
| 13 | robots.txt missing Disallow for `/cart`, `/wishlist` | `public/robots.txt` |
| 14 | `SITE_URL` fallback is wrong domain (`omegadistribution.tn`) | `lib/seo.tsx:13-14` |
| 15 | Store logo uses raw `<img>` (above fold, every page) | `StoreLogo.tsx:30-34` |
| 16 | Review avatars use raw `<img>` | `ReviewSection.tsx:93-96` |

### Low (4)

| # | Issue | Files |
|---|---|---|
| 17 | Root layout missing `metadataBase` | `app/layout.tsx` |
| 18 | No default OpenGraph/Twitter in root layout | `app/layout.tsx` |
| 19 | `remotePatterns` only includes localhost | `next.config.mjs` |
| 20 | No `favicon.ico` or `logo.png` in `/public` | `public/` |

### Key Insight
The gap between SEO tooling that exists and its deployment is the single most impactful finding:
- `lib/seo.tsx` — all schema helpers defined, `<JsonLd>` component ready — **0 imports**
- `lib/server-api.ts` — `serverFetchProduct()`, `serverFetchCategoryBySlug()` defined — **only used by `sitemap.ts`**
- Every storefront page is `"use client"` or delegates to a `"use client"` component — **zero SSR**

---

## QA / BUG DETECTION FINDINGS

### Summary
- **Bugs found: 12** — Critical: 3 | High: 4 | Medium: 4 | Low: 1
- **Edge cases not handled: 5**
- **Data flow issues: 3**

### Critical Bugs (3)

| # | Bug | File | Impact |
|---|---|---|---|
| 1 | BuyNow calculates totals without TVA | orderController.js:394-406 | 19% revenue loss on all Buy Now orders |
| 2 | BuyNow populate missing `tva` + `variantMode` | orderController.js:331-334 | TVA defaults to 0, variant stock checks unreliable |
| 3 | `updateOrderStatus` ignores `VALID_TRANSITIONS` | orderController.js:671-724 | Any status → any status, phantom inventory |

### High Bugs (4)

| # | Bug | File | Impact |
|---|---|---|---|
| 4 | `note.trim()` crashes when note is undefined | orderController.js:705 | 500 error blocks all admin status updates |
| 5 | Order number race condition | orderController.js:121-136 | Duplicate numbers → lost orders |
| 6 | BuyNow modal hides cart variants by product ID only | BuyNowModal.tsx:67, orderController.js:337 | User charged for hidden items — pricing integrity |
| 7 | Checkout OrderSummary ignores free shipping threshold | OrderSummary.tsx:63-66 | Displayed total higher than actual charge |

### Medium Bugs (4)

| # | Bug | File | Impact |
|---|---|---|---|
| 8 | Duplicate React keys with variants (`item.product.id`) | checkout/page.tsx:216, OrderSummary.tsx:79 | React rendering bugs |
| 9 | Checkout review doesn't display selectedOptions | checkout/page.tsx:214-227 | Users can't verify variant before ordering |
| 10 | BuyNow modal doesn't reset state on close/reopen | BuyNowModal.tsx:55-58 | Stale quantity, excluded items, form data |
| 11 | Cart stock limit uses global stock, not variant stock | CartDrawer.tsx:75, cart/page.tsx:97 | Misleading UI allows clicks that fail server-side |

### Low Bugs (1)

| # | Bug | File | Impact |
|---|---|---|---|
| 12 | Hardcoded inline styles in BuyNowModal | BuyNowModal.tsx:318,417 | Violates Tailwind-only rule, breaks dark mode |

### Unhandled Edge Cases

1. **BuyNow failure leaves items in cart**: Product added to cart at line 328 but no rollback if order creation fails. User's cart is silently polluted.
2. **Coupon increment without rollback**: `usedCount` incremented before `Order.create`. If order fails, coupon use is permanently consumed.
3. **Guest cart merge silently drops out-of-stock items**: User never informed which items were removed after login.
4. **Auth redirect during checkout loses progress**: Hard redirect to `/auth/login` loses all checkout state (no `?redirect=/checkout`).
5. **Empty cart after failed order + token expiry**: User redirected to `/cart` instead of order confirmation.

### Data Flow Issues

1. **selectedOptions type mismatch**: Frontend allows `string | string[]`, cart service sends `string`, Mongoose uses `Map<string, String>`. BuyNow passes raw type without conversion.
2. **Checkout page total vs OrderSummary sidebar discrepancy**: Main page computes `total = subtotal` (ignoring shipping), sidebar shows `subtotal + shippingCost`. Two different totals on same page.
3. **Order.couponCode/discountAmount in TypeScript but never set by backend**: Impossible to audit coupon usage after order is placed.

---

## WHAT'S DONE WELL

### Security Strengths
- bcrypt with 12 salt rounds, `select: false` on password
- SHA-256 token hashing in DB, proper token rotation
- Account lockout (5 attempts → 15min lock)
- `escapeRegex()` on ALL `$regex` queries (zero ReDoS risk)
- ObjectId validation before every `findById()`
- Timing-safe webhook verification
- User enumeration prevention on forgot-password
- No `eval()`, `Function()`, `$where`, `console.log`, `require()`

### Code Quality Strengths
- Zero `any` types, zero `@ts-ignore` across entire frontend
- Consistent `{ success, data/error }` response format
- Proper `logger` usage everywhere
- All ESM imports with `.js` extensions
- Non-blocking email pattern (`.catch(() => {})`)
- Proper pagination with bounded limits
- Cache invalidation discipline with `delByPrefix()`

### Architecture Strengths
- Clean MVC separation in backend
- Context-based state management (6 contexts, well-separated concerns)
- Dynamic theme system with registry pattern
- Proper Next.js App Router structure with route groups
- `HeaderSwitcher`/`FooterSwitcher` already use dynamic imports correctly
- Sitemap properly generated via `app/sitemap.ts`

### Accessibility Strengths
- Forms (Login, Register, AddressSelector) have excellent ARIA linkage
- Icon-only buttons consistently have `aria-label`
- Cart drawer: proper dialog semantics, `aria-live` on quantity
- ImageGallery: correct `role="tablist"`/`role="tab"` pattern
- AddressSelector: proper `role="radiogroup"` with `role="radio"`
- Default Header has good `focus-visible` pattern (just not replicated to themed variants)

---

## FILE HEAT MAP (Most Issues Per File)

| File | Issues | Domains |
|---|---|---|
| `backend/src/controllers/orderController.js` | 12 | Security, Code Review, Performance, QA |
| `frontend/components/products/BuyNowModal.tsx` | 8 | QA, Accessibility, Code Review |
| `frontend/middleware.ts` | 4 | Security, SEO |
| `frontend/app/(store)/products/[slug]/page.tsx` | 4 | SEO, Performance |
| `frontend/components/checkout/OrderSummary.tsx` | 3 | QA, Code Review |
| `frontend/components/home/HomepageSections.tsx` | 3 | Performance, Code Review |
| `frontend/app/(store)/checkout/page.tsx` | 3 | QA, Accessibility |
| `frontend/next.config.mjs` | 3 | SEO, Performance, Security |
| All `*Header.tsx` (10 files) | 3 each | Accessibility |
| `frontend/lib/seo.tsx` | 2 | SEO (built but unused) |
| `backend/src/controllers/settingsController.js` | 3 | Security, Code Review |

---

## RECOMMENDED FIX PRIORITY

### Sprint A: Critical Blockers (Must-Fix Before Production)
1. Enforce `VALID_TRANSITIONS` in order status updates
2. Fix `note.trim()` crash
3. Fix order number race condition (atomic counter)
4. Fix BuyNow TVA calculation + populate `tva`/`variantMode`
5. Fix checkout OrderSummary free shipping threshold
6. Add `"fr"` to `VALID_LANGUAGES`
7. Fix CSP (remove unsafe-eval, use env vars)
8. Fix duplicate React keys in checkout (use composite key)
9. Fix BuyNow variant exclusion (composite key, not product ID)
10. Fix checkout total discrepancy (page vs sidebar)

### Sprint B: SEO & SSR (Highest ROI)
1. Add `generateMetadata()` to product detail, listing, and category pages
2. Convert product detail page to SSR (pass `initialProduct` from server component)
3. Render JSON-LD structured data (connect `lib/seo.tsx` → pages)
4. Add canonical tags to all store pages
5. Add OpenGraph + Twitter Card metadata
6. Add HSTS header to middleware
7. Remove `unoptimized` from all `<Image>` + configure `formats: ['image/avif', 'image/webp']`
8. Fix `SITE_URL` fallback and robots.txt domain mismatch
9. Add `metadataBase` to root layout

### Sprint C: Accessibility
1. Replace CSS hover dropdowns with keyboard-accessible pattern (all headers)
2. Add `focus-visible:ring-2` to replace `focus:outline-none` (9 header themes)
3. Add skip-to-content link in store layout
4. Add `role="group"` + `aria-labelledby` to VariantSelector
5. Add `DialogDescription` to ReviewForm dialog
6. Add `aria-controls` + arrow key navigation to SearchBar
7. Increase touch targets to 44px (cart buttons, BuyNow buttons)
8. Add `aria-describedby` + `aria-required` to BuyNow form fields
9. Trap focus in mobile menus + add Escape to close

### Sprint D: Security Hardening
1. Move refresh token to httpOnly cookie
2. Add `assertWithin()` to settings file upload
3. Add `escapeCSV()` to product/order exports
4. Validate analytics IDs with strict regex
5. Add admin route protection in Next.js middleware
6. Remove weak encryption key fallback
7. Restrict settings upload MIME types (no SVG)
8. Add `restrictTo("admin")` on product CRUD routes

### Sprint E: Performance Optimization
1. Cache user in `protect` middleware (30s TTL)
2. Cache `getProductBySlug` (60s TTL)
3. Fix `computeShippingCost` to use existing cache
4. Add cache eviction (max size + periodic sweep)
5. Use text index in `searchProducts` (replace `$regex`)
6. Memoize all context provider values (`useMemo`)
7. Dynamic import homepage themes in `HomepageSections.tsx`
8. Dynamic import Recharts in admin dashboard
9. Add `optimizePackageImports` to next.config.mjs

### Sprint F: i18n Completion
1. Add 9 missing EN wishlist keys (P0 — broken UI)
2. Add 5 missing EN checkout coupon keys (P0)
3. Add 8 missing FR orders admin shipping keys (P0)
4. Add ~28 missing EN products catalog keys (P1)
5. Add ~241 EN typeAttrOptions (P1)
6. Sync remaining missing keys across all namespaces
7. Replace 14 hardcoded strings with `t()` calls
8. Fix `browsProducts` typo in FR checkout

### Sprint G: Code Quality
1. Split admin settings page into tab components
2. Add `error.tsx` and `not-found.tsx` to route segments
3. Fix hardcoded "DT" currency in homepage components
4. Add BuyNow modal state reset on close/reopen
5. Add checkout variant display (selectedOptions in review step)
6. Wrap `ProductCard` in `React.memo()`
7. Add MongoDB transactions for stock operations
8. Replace naive CSV parsing with proper library
