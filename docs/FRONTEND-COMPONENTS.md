# Frontend Components and Services

All frontend code lives in `{FRONTEND_DIR}/`. It is a Next.js 14 App Router application written in TypeScript.

---

## 1. Page Routes

<!-- Document all your pages here -->

| URL | File | Auth Required | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | No | Root page (redirect or landing) |
| `/auth` | `app/auth/page.tsx` | No | Login form |
| `/dashboard` | `app/dashboard/page.tsx` | Authenticated + role-dependent | Main application dashboard |
| `/reset-password` | `app/reset-password/page.tsx` | No | Password reset form -- reads `token` and `email` from URL query params |
| `/change-password` | `app/change-password/page.tsx` | Authenticated | Form to change password while logged in |
| `/products` | `app/(store)/products/page.tsx` | No | Public product catalog with filters, sort, pagination, grid/list toggle |
| `/products/search` | `app/(store)/products/search/page.tsx` | No | Full-text search results page |
| `/products/[slug]` | `app/(store)/products/[slug]/page.tsx` | No | Product detail with image gallery, related products, breadcrumbs |
| `/categories` | `app/(store)/categories/page.tsx` | No | Category grid (top-level categories only) |
| `/categories/[slug]` | `app/(store)/categories/[slug]/page.tsx` | No | Category-filtered product listing with subcategory sidebar |

The root layout (`app/layout.tsx`) wraps the entire app with `ClientProviders`, which includes `AuthProvider` and `LoadingProvider`.

### Protected route flow

The `ProtectedRoute` component (used on pages that require auth) enforces this decision tree:

1. If auth is still loading -- show spinner
2. If no user -- redirect to `/auth`
3. Role-specific checks -- redirect based on user validation status or role
4. Otherwise -- render the page

<!-- Customize the ProtectedRoute checks for your app's user flow -->

---

## 2. Auth and Session

### AuthContext (`contexts/AuthContext.tsx`)

Provides the global authentication state. Access via the `useAuth()` hook.

**Import:**
```ts
import { useAuth } from "@/contexts/AuthContext"
const { user, loading, login, logout, refreshUser } = useAuth()
```

**User object shape:**
```ts
interface User {
  id: string
  email: string
  name: string
  role: string                  // Your role enum values
  // Add project-specific user fields here
}
```

**Context functions:**

| Function | Signature | Description |
|---|---|---|
| `login` | `async (email: string, password: string) -> Promise<User>` | Calls `authService.login()`, stores tokens in `localStorage`, updates Axios default headers, sets user state |
| `logout` | `async () -> Promise<void>` | Calls `authService.logout()`, removes tokens from `localStorage`, sets user to `null` |
| `refreshUser` | `async () -> Promise<void>` | Re-fetches `GET /auth/me` and updates user state -- useful after profile updates |

**Initialization:** On mount, reads `accessToken` from `localStorage`. If found, calls `GET /auth/me` to rehydrate the session. Has a 10-second abort timeout on this request.

### LoadingContext (`contexts/LoadingContext.tsx`)

Provides global loading state. Access via the `useLoading()` hook.

```ts
import { useLoading } from "@/contexts/LoadingContext"
const { isLoading, startLoading, stopLoading } = useLoading()
```

| Function | Description |
|---|---|
| `startLoading()` | Sets `isLoading = true` immediately |
| `stopLoading()` | Sets `isLoading = false` after a 500 ms debounce (prevents flicker) |

---

## 3. API Layer

### `utils/axiosInstance.ts` -- Axios with automatic token refresh

**When to use:** For requests that should automatically retry on 401 (token expiry), especially from `AuthContext` itself or wherever you need the mutex-protected refresh behavior.

```ts
import api from "@/utils/axiosInstance"

// GET request (token injected automatically from localStorage)
const res = await api.get("/auth/me")

// POST request
const res = await api.post("/auth/login", { email, password })
```

The instance resolves to `http://localhost:{BACKEND_PORT}` in development, `/api` in production.

On a 401 response, the interceptor:
1. Checks `isRefreshing` (module-level mutex)
2. If another refresh is in progress, queues this request in `failedQueue` and waits
3. If no refresh is in progress: sets `isRefreshing = true`, calls `POST /auth/refresh`, stores the new token, retries all queued requests, sets `isRefreshing = false`
4. If refresh fails: clears both tokens from `localStorage` and rejects all queued requests

### `lib/api.ts` -- `fetchAPI()` with native fetch

**When to use:** For data-fetching service functions, especially when uploading `FormData` (avoids content-type header conflicts with Axios).

```ts
import { fetchAPI } from "@/lib/api"

// GET
const data = await fetchAPI("/resources")

// POST with JSON body
const data = await fetchAPI("/resources", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Example" }),
})

// POST with FormData (Content-Type not set manually -- let browser handle it)
const data = await fetchAPI("/resources", {
  method: "POST",
  body: formData,
})
```

`fetchAPI` reads `accessToken` from `localStorage` and adds it as `Authorization: Bearer <token>`. It throws an `Error` with the backend's `error` message if `response.ok` is `false`. It does **not** automatically refresh expired tokens.

---

## 4. Service Functions

### `services/authService.ts`

Uses `axiosInstance`.

| Function | Params | Returns | Description |
|---|---|---|---|
| `login` | `(email: string, password: string)` | `Promise<{ user, accessToken, refreshToken }>` | POST /auth/login, stores tokens in localStorage, sets Axios default header |
| `refreshToken` | `()` | `Promise<{ accessToken, refreshToken }>` | POST /auth/refresh using stored refresh token, updates localStorage |
| `logout` | `()` | `Promise<void>` | POST /auth/logout, removes tokens from localStorage |

### Document your services here

<!-- Copy this pattern for each service file in your project -->

<!--
### `services/{resource}-service.ts`

Uses `fetchAPI`.

| Function | Params | Returns | Description |
|---|---|---|---|
| `fetchAll` | `()` | `Promise<Resource[]>` | GET /resources |
| `fetchById` | `(id: string)` | `Promise<Resource>` | GET /resources/:id |
| `create` | `(data: CreateInput)` | `Promise<Resource>` | POST /resources |
| `update` | `(id: string, data: UpdateInput)` | `Promise<Resource>` | PUT /resources/:id |
| `remove` | `(id: string)` | `Promise<void>` | DELETE /resources/:id |
-->

---

## 5. Chunked File Upload (`lib/chunkUploader.ts`)

Used for uploading large files (especially videos) without timing out. Chunks are sent sequentially and assembled server-side.

### Constants

```ts
const CHUNK_SIZE = 5 * 1024 * 1024  // 5 MB per chunk
```

### Main function: `uploadFileInChunks`

```ts
async function uploadFileInChunks(
  file: File,
  parentId: string,
  onProgress?: (progress: UploadProgress) => void,
  fileIndex?: number,    // default: 0
  totalFiles?: number    // default: 1
): Promise<UploadedFile>
```

**Step-by-step flow:**

1. **Calculate chunks:** `totalChunks = Math.ceil(file.size / CHUNK_SIZE)`
2. **Generate fileId:** `file-${Date.now()}-${Math.random().toString(36).substring(7)}`
3. **Sanitize filename:** Removes invalid characters, removes leading dots
4. **Upload each chunk (loop):**
   - Slice the file: `file.slice(chunkIndex * CHUNK_SIZE, end)`
   - Build `FormData` with: `chunk`, `chunkIndex`, `totalChunks`, `fileId`, `fileName`, `originalFileName`
   - Call `POST /upload/chunk` with `Authorization: Bearer <token>` header
   - **Retry logic:** Up to 3 retries on failure, with exponential backoff (1s, 2s, 3s delays)
   - Call `onProgress` callback with current progress percentages
5. **Finalize:** After all chunks are uploaded, call `POST /upload/complete`
6. **Return:** `UploadedFile` object

### Progress callback interface

```ts
interface UploadProgress {
  fileName: string
  fileIndex: number       // Which file (0-based) in a multi-file upload
  totalFiles: number
  chunkIndex: number      // Current chunk (0-based)
  totalChunks: number
  fileProgress: number    // 0-100 for current file
  overallProgress: number // 0-100 across all files
}
```

### Return type

```ts
interface UploadedFile {
  id: string
  name: string            // Storage filename with fileId prefix
  originalName: string    // Original filename from the File object
  type: string            // File type category
  url: string             // Relative URL: /uploads/courses/...
  size: number            // Bytes
  mimeType: string
  uploadedAt: Date
}
```

### Multi-file upload: `uploadMultipleFilesInChunks`

```ts
async function uploadMultipleFilesInChunks(
  files: File[],
  fileParentMap: Record<string, string>,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedFile[]>
```

Iterates files sequentially (not in parallel). Deduplicates by `${file.name}|${file.size}` signature. Individual file failures do not abort the whole batch.

---

## 6. Logger (`lib/logger.ts`)

A conditional console wrapper that suppresses non-error output in production.

```ts
import logger from "@/lib/logger"

logger.info("Component mounted")         // Only outputs in development
logger.warn("Unexpected value", value)   // Only outputs in development
logger.error("Request failed", error)    // Always outputs (all environments)
logger.debug("Raw data:", rawData)       // Only outputs in development
```

**Usage:** Import `logger` instead of using `console.log` directly so that verbose debug output is automatically silenced in production.

---

## 7. i18n Custom Hook

The i18n system uses `react-i18next`. The standard hook is `useTranslation` from the library:

```ts
import { useTranslation } from "react-i18next"

function MyComponent() {
  const { t, i18n } = useTranslation("common")
  return <p>{t("welcome")}</p>
}
```

To change language programmatically:
```ts
import i18n from "@/lib/i18n"
i18n.changeLanguage("zh")
```

The selected language is persisted in `localStorage` under the key `i18nextLng`.

---

## Document your components here

<!-- Use this section to document project-specific components, organized by feature area -->

<!--
## Feature Area (e.g., Dashboard Tabs)

### ComponentName

**File:** `components/feature/ComponentName.tsx`

**Props:**
```ts
interface ComponentNameProps {
  prop1: string
  prop2: () => void
}
```

**Description:** What the component does.

**States:** Loading (skeleton), Empty (empty state message), Error (error display), Success (data display)

**i18n:** Uses `useTranslation("namespace")` or inline translations.
-->

<!--
## TypeScript Types

### `types/ResourceName.ts`

```ts
interface Resource {
  id: string
  name: string
  // ...fields
}
```
-->

---

## Sprint 5 — Product Catalog & Search Components

### ProductCard (`components/products/ProductCard.tsx`)

**Props:**
```ts
interface ProductCardProps {
  product: Product
  view: "grid" | "list"
  className?: string
}
```

**Description:** Renders a product in either grid or list layout. Shows image (lazy-loaded), name, rating stars, price, compare-at price with discount %, stock badge, and an "Add to Cart" stub button (disabled — wired in Sprint 7). Exports `ProductCardSkeleton` for loading states.

**States:** Skeleton via `ProductCardSkeleton`, Success via product data.

**i18n:** Uses `useTranslation("products")` — keys under `catalog.card.*`.

---

### ProductFilters (`components/products/ProductFilters.tsx`)

**Props:**
```ts
interface ProductFiltersProps {
  categories: CategoryNode[]
  filters: { category?: string; minPrice?: number; maxPrice?: number; inStock?: boolean; rating?: number }
  onFiltersChange: (filters: ProductFiltersProps["filters"]) => void
}
```

**Description:** Sidebar filter panel with: recursive `CategoryTreeItem` (expandable subcategories), dual-thumb price range Slider (0–10000), radio-group star rating buttons, in-stock Checkbox. Active filter count badge + clear-all button.

**i18n:** Uses `useTranslation("products")` — keys under `catalog.filters.*`.

---

### ProductSort (`components/products/ProductSort.tsx`)

**Props:**
```ts
interface ProductSortProps {
  value: "newest" | "price_asc" | "price_desc" | "rating" | undefined
  onChange: (value: SortValue) => void
}
```

**Description:** shadcn Select dropdown with 4 sort options. Defaults to "newest" label when no value selected.

**i18n:** Uses `useTranslation("products")` — keys under `catalog.sort.*`.

---

### ImageGallery (`components/products/ImageGallery.tsx`)

**Props:**
```ts
interface ImageGalleryProps {
  images: string[]
  productName: string
  className?: string
}
```

**Description:** Main image (large) + thumbnail strip (`role="tablist"`). Prev/Next navigation buttons. Error fallback renders `ImageOff` icon. Exports `ImageGallerySkeleton` for loading.

**i18n:** Uses `useTranslation("products")` — keys under `catalog.images.*`.

---

### RelatedProducts (`components/products/RelatedProducts.tsx`)

**Props:**
```ts
interface RelatedProductsProps {
  categoryId: string
  currentProductId: string
}
```

**Description:** Client component. Fetches up to 5 products in the same category, filters out the current product, displays up to 4 in a 2-col/4-col responsive grid using `ProductCard`.

**i18n:** Uses `useTranslation("products")` — key `catalog.related.*`.

---

### SearchBar (`components/layout/SearchBar.tsx`)

**Props:** None (self-contained; reads search query from the input and navigates to `/products/search?q=`)

**Description:** Debounced (300ms) search input with suggestions dropdown. Uses `searchProductsAPI` for typeahead. Keyboard-accessible (Escape closes dropdown, ArrowDown/Up navigates suggestions). `role="search"`, `aria-expanded`, `aria-autocomplete="list"`.

**i18n:** Uses `useTranslation("common")` — keys under `search.*`.

---

### Header (`components/layout/Header.tsx`)

**Props:** None (reads `useAuth` internally)

**Description:** Sticky site header with logo, desktop nav (Products, Categories), SearchBar, Cart icon stub, Sign In or user avatar (from `useAuth`). Responsive — shows hamburger on mobile.

**i18n:** Uses `useTranslation("common")` — keys under `nav.*`.

---

### Breadcrumb (`components/ui/breadcrumb.tsx`)

**Props:**
```ts
interface BreadcrumbItem {
  label: string
  href?: string
}
interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}
```

**Description:** Semantic `<nav aria-label="Breadcrumb">` + `<ol>`. Home icon on first item, ChevronRight separators, `aria-current="page"` on the last item. Current item is not a link.
