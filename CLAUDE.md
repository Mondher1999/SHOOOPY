# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Identity

ShopFlow is a full-stack e-commerce platform for Cash on Delivery orders. Roles: `customer`, `admin`. Languages: EN/FR. The frontend is Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui (`frontend/`). The backend is Express.js + MongoDB/Mongoose (`backend/`). Each directory has its own `CLAUDE.md` — read those before making changes.

## Commands

```bash
# Frontend (frontend/)
cd frontend
npm run dev      # Dev server — localhost:3002, connects to backend at localhost:5001
npm run build    # Production build
npm run lint     # ESLint

# Backend (backend/)
cd backend
npm run dev      # Nodemon dev server — localhost:5001
npm start        # Production server
curl http://localhost:5001/health  # Verify backend is running
```

No test framework is configured. Testing is manual (curl for API, browser for UI). Set up Jest + Supertest (backend) and Jest + React Testing Library (frontend) when ready.

## Code Standards

### Module System
Backend uses **ESM** (`"type": "module"` in package.json). Always `import` with `.js` extensions — never `require()`.

### Logging
Use `logger` everywhere — never `console.log`. Backend: `src/utils/logger.js`. Frontend: `lib/logger.ts`.

### Error Handling
Every backend controller must follow this exact structure:

```js
export const handlerName = async (req, res) => {
  try {
    const { field } = req.body;
    if (!field) return res.status(400).json({ success: false, error: "Missing required field: field" });
    const result = await Model.findById(req.params.id).lean();
    if (!result) return res.status(404).json({ success: false, error: "Resource not found" });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("handlerName error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
```

### Input Validation
- `escapeRegex()` from `utils/sanitize.js` for ALL `$regex` queries (ReDoS prevention)
- `assertWithin()` + `validateFileId()` for ALL file path operations (path traversal prevention)
- `/^[0-9a-fA-F]{24}$/.test(id)` before any `findById()` call (CastError prevention)

### Authentication
All mutating routes (POST/PUT/PATCH/DELETE) need `protect` middleware. Role gates use `restrictTo()`. Always import from `src/middlewares/auth.js`.

### i18n
All user-facing strings must use `t()` from `useTranslation`. Add keys to ALL language files (EN + FR). Never leave a namespace incomplete.

### Naming Conventions
| Context | Convention | Example |
|---|---|---|
| React components | PascalCase | `ItemCard.tsx` |
| Hooks/utilities | camelCase | `useAuth.ts` |
| Services | kebab-case | `item-service.ts` |
| Backend files | camelCase | `authController.js` |
| Mongoose models | PascalCase export | `User`, `Product` |
| Route prefixes | kebab-case | `/products` |

## Architecture

### Backend (Express.js + MongoDB)
MVC under `backend/src/`: `models/` → `controllers/` → `routes/` → `middlewares/` → `utils/`. Entry point: `server.js`.

**Middleware chain order** (server.js):
1. `correlationId` — injects `X-Request-Id` header for log tracing
2. `helmet()` — HTTP security headers
3. `cors()` — origin: `FRONTEND_URL` or `localhost:3002`, credentials: true
4. `globalLimiter` — **500 req/15min** per IP (returns 429 JSON)
5. `express.json({ limit: "1mb" })` + `express.urlencoded`
6. `morgan("dev")` — HTTP logging (dev only)
7. Static `/uploads` — with path traversal guard
8. Route mounting

**Rate limits (actual values):**
- Global: 500 req/15min
- Auth routes (`/api/auth`): 50 req/15min

**Route prefix table:**
| Prefix | File |
|---|---|
| `/api/health` | `healthRoutes.js` |
| `/api/auth` | `authRoutes.js` |
| `/api/users` | `userRoutes.js` |
| `/api/categories` | `categoryRoutes.js` |
| `/api/products` | `productRoutes.js` |
| `/api/upload` | `uploadRoutes.js` |
| `/api/cart` | `cartRoutes.js` |
| `/api/addresses` | `addressRoutes.js` |
| `/api/orders` | `orderRoutes.js` |
| `/api/reviews` | `reviewRoutes.js` |
| `/api/wishlist` | `wishlistRoutes.js` |
| `/api/dashboard` | `dashboardRoutes.js` |
| `/api/settings` | `settingsRoutes.js` |
| `/api/contact` | `contactRoutes.js` |
| `/api/coupons` | `couponRoutes.js` |
| `/api/faq` | `faqRoutes.js` |
| `/api/subscribers` | `subscriberRoutes.js` |
| `/api/shipping` | `shippingRoutes.js` |
| `/api/redirects` | `redirectRoutes.js` |
| `/api/export` | `exportRoutes.js` |

**In-memory cache** (`utils/cache.js`): TTL-based, `delByPrefix()` for parameterized key invalidation. Auto-invalidated on writes.

### Frontend (Next.js 14 App Router)

**App Router layout:**
```
app/
  (store)/        # Public storefront — layout has Header + Footer
    page.tsx      # Homepage (resolves template from settings)
    products/     # Listing + [slug] detail
    categories/   # Listing + [slug] detail
    cart/
    checkout/     # + /success
    wishlist/
    contact/, faq/, privacy/, terms/, shipping-policy/, refund-policy/
  admin/          # Admin panel — separate layout
    page.tsx      # Dashboard with KPIs + charts
    products/, categories/, orders/, users/, settings/, coupons/, faq/, contacts/, redirects/
  dashboard/      # Customer dashboard
    orders/, profile/, wishlist/
  auth/           # Login/register
  maintenance/
```

**Two API patterns (both required, do not mix up):**
- `utils/axiosInstance.ts` — Axios + auto Bearer injection + 401 refresh mutex. Use for auth-critical flows.
- `lib/api.ts` (`fetchAPI`) — native fetch wrapper. Use for general data fetches and FormData uploads.
- Never use raw `fetch()` or bare `axios`.

**State management** — React Context only:
| Context | Purpose |
|---|---|
| `AuthContext` | User auth state, login/logout/register |
| `CartContext` | Cart items, merge on login |
| `WishlistContext` | `Set<string>` of product IDs for O(1) lookup |
| `SettingsContext` | Site settings singleton — loaded once on mount |
| `ThemeContext` | Active homepage template |
| `LoadingContext` | Global loading spinner |

**Services** (`frontend/services/`): One file per domain, use `axiosInstance` or `fetchAPI`. Never call API directly from components.

### Cross-Stack Data Flow
Feature implementation order: **Model → Controller → Route → Frontend Service → UI Component → i18n keys**

### Settings System
- Backend: `Settings` model is a singleton (`findOne({})` / `findOneAndUpdate` with `$set` dot notation for partial updates)
- Cache key: `settings:global`, 5-min TTL, invalidated on every PUT
- Special endpoints: `GET /api/settings/product-types-catalog` (full 20-type catalog, 10-min cache), `GET /api/settings/product-types` (enabled only, 5-min cache)
- Frontend: `SettingsContext` makes one API call on mount; all components consume it — no redundant fetches

### Theme System (Homepage Templates)
- Registry: `THEMES` object in `HomepageSections.tsx` — `Record<string, ThemeConfig>`
- `ThemeConfig`: `{ label, description, thumbnail?, editable, defaultOrder, components, defaultHidden? }`
- `homepage.template` stored as a free string in `Settings.homepage` — no enum (allows adding new themes without backend changes)
- Backward compat: `homepage.mode === "hardcoded"` resolves to `"classic"` via `lib/resolveTemplate.ts`
- `editable: true` themes show content panels in admin; `editable: false` show only section order/visibility
- To add a new theme: create section components → import → add entry to `THEMES`

### Currency System
- `frontend/lib/currency.ts`: `CURRENCIES` array (15 currencies), `formatPrice(amount, code)`, `getCurrency(code)`
- `useFormatPrice` hook (`frontend/hooks/useFormatPrice.ts`): reads `settings.store.currency` from `SettingsContext`, returns memoized `formatPrice(amount)` function
- ALL price displays use `useFormatPrice()` — no hardcoded `$` or `DT`

### Product Type System
- 20 types defined in `backend/src/constants/productTypeCatalog.js` (clothing, shoes, electronics, jewelry, bags, beauty, watches, etc.)
- Enabled types stored in `Settings.products.productTypes`
- `Product.productType` links to a catalog type; `Product.attributes` is a Map for both typed + legacy free-form key-value pairs
- `DynamicAttributeField` component in `ProductForm` renders 5 attribute input types (multi-select, select, text, number, boolean)

## Response Format (Backend — Mandatory)
```js
res.status(200).json({ success: true, data: result });
res.status(201).json({ success: true, data: created });
res.status(400).json({ success: false, error: "Missing required field: name" });
res.status(401).json({ success: false, error: "Not authenticated" });
res.status(403).json({ success: false, error: "Not authorized" });
res.status(404).json({ success: false, error: "Resource not found" });
res.status(500).json({ success: false, error: "Something went wrong" });
```

## Roles & User Flow
- `customer`: registers → email verification → browse products → add to cart → checkout (COD) → track orders
- `admin`: full access — user management, product CRUD, order management, dashboard analytics, settings

## Forbidden Patterns

| Pattern | Alternative |
|---|---|
| `console.log` | `logger` from utils/logger |
| `eval()` / `Function()` | JSON.parse, Map lookup |
| `$where` in MongoDB | Standard query operators ($eq, $in, $regex) |
| Hardcoded API URLs | `axiosInstance` or `fetchAPI` |
| Hardcoded user-facing strings | `t()` from `useTranslation` |
| `any` in TypeScript | Proper interfaces in `types/` |
| Inline styles | Tailwind classes + `cn()` |
| Raw user input in file paths | `validateFileId()` + `assertWithin()` |
| Raw user input in `$regex` | `escapeRegex()` from utils/sanitize |
| Missing `protect` middleware | Always add `protect` on non-public routes |
| `dangerouslySetInnerHTML` | Safe text rendering |
| `require()` in backend | `import` with `.js` extension |
| `{ message: "..." }` response | `{ success: true/false, data/error }` |

## Key Documentation
- `frontend/CLAUDE.md` — Frontend coding rules, component structure, import order, styling rules
- `backend/CLAUDE.md` — Backend coding rules, controller pattern, route protection, query conventions
- `docs/SETUP.md` — Environment variables (complete list), deployment steps, nginx config
- `docs/API.md` — All API endpoints with request/response shapes
- `docs/DATA-MODELS.md` — All Mongoose schemas with fields and relationships

## Environment Variables
See `docs/SETUP.md` for the complete list. Backend needs: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, SMTP config, `FRONTEND_URL`. Frontend needs: vars in `.env.local`.

## Deployment
PM2 + nginx. Frontend port 3002, backend port 5001. nginx proxies `/api/*` to backend.

## Custom Commands

| Category | Commands |
|---|---|
| **`/dev/`** | `frontend`, `backend`, `fullstack`, `api`, `db`, `auth`, `i18n`, `upload`, `designer`, `docs`, `test` |
| **`/ops/`** | `review`, `security`, `audit`, `qa`, `perf`, `debug`, `refactor`, `deploy`, `accessibility` |
| **`/workflow/`** | `build`, `feature`, `fix`, `endpoint`, `component`, `translate`, `release` |

## Git Workflow
Branch naming: `feature/short-description`, `fix/short-description`, `refactor/short-description`. Commit messages: imperative mood, max 72 chars, focus on *why*.
