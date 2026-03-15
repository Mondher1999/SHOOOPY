# E-Commerce Website — Full Sprint Plan

> **Total Estimated Timeline**: 13 Sprints × 2 weeks = ~26 weeks (6.5 months)
> **Team Size**: Solo developer (full-time)
> **Sprint Capacity**: Max 40 story points per sprint
> **Payment Method**: Cash on Delivery (COD) only
> **Tech Stack**: Next.js 14 + Express.js + MongoDB + JWT + Tailwind CSS + shadcn/ui

---

## Table of Contents

1. [Sprint 1 — Project Foundation & Dev Environment](#sprint-1--project-foundation--dev-environment)
2. [Sprint 2 — Authentication System](#sprint-2--authentication-system)
3. [Sprint 3 — User Profiles & Role-Based Access](#sprint-3--user-profiles--role-based-access)
4. [Sprint 4 — Product Data Layer & Admin CRUD](#sprint-4--product-data-layer--admin-crud)
5. [Sprint 5 — Product Catalog & Search](#sprint-5--product-catalog--search)
6. [Sprint 6 — Product Media & Image Management](#sprint-6--product-media--image-management)
7. [Sprint 7 — Shopping Cart](#sprint-7--shopping-cart)
8. [Sprint 8 — Checkout & Cash on Delivery Orders](#sprint-8--checkout--cash-on-delivery-orders)
9. [Sprint 9 — Order Management & Tracking](#sprint-9--order-management--tracking)
10. [Sprint 10 — Reviews, Ratings & Wishlist](#sprint-10--reviews-ratings--wishlist)
11. [Sprint 11 — Admin Dashboard & Email Notifications](#sprint-11--admin-dashboard--email-notifications)
12. [Sprint 12 — Internationalization, Performance & Security Hardening](#sprint-12--internationalization-performance--security-hardening)
13. [Sprint 13 — Testing, CI/CD & Production Deployment](#sprint-13--testing-cicd--production-deployment)

---

## Sprint 1 — Project Foundation & Dev Environment

**Sprint Goal**: Set up the monorepo with working frontend and backend dev servers, database connection, logging, and core security middleware — resulting in a "Hello World" full-stack page.

**Dependencies**: None (first sprint)

### User Stories & Tasks

#### Story 1.1: Project Initialization
> *As a developer, I want the monorepo scaffolded with both frontend and backend projects so that I can begin building features.*

| Task | Story Points |
|------|:---:|
| Create root project structure, fill all CLAUDE.md placeholders across every file | 2 |
| Initialize `backend/` — `npm init`, install Express, Mongoose, Helmet, cors, dotenv, nodemon, morgan | 3 |
| Initialize `frontend/` — `npx create-next-app@14` with TypeScript, Tailwind CSS, ESLint | 3 |
| Install and configure shadcn/ui (button, input, card, dialog, dropdown-menu, toast) | 2 |

**Acceptance Criteria**:
- [ ] `cd backend && npm run dev` starts Express on configured port
- [ ] `cd frontend && npm run dev` starts Next.js on configured port
- [ ] Both package.json files have all required dependencies
- [ ] All `{PLACEHOLDER}` values replaced in CLAUDE.md and docs/

#### Story 1.2: Backend Foundation
> *As a developer, I want the backend entry point, database connection, and security middleware configured so that all future routes inherit these protections.*

| Task | Story Points |
|------|:---:|
| Create `server.js` — Express app with middleware chain (helmet, cors, rate-limit, json parser) | 3 |
| Create `src/config/db.js` — Mongoose connection with retry logic | 2 |
| Create `src/utils/logger.js` — Winston or custom logger (replaces console.log) | 2 |
| Create `src/utils/sanitize.js` — `escapeRegex()`, `validateFileId()`, `assertWithin()` | 2 |
| Create `src/utils/cache.js` — In-memory cache with TTL and auto-invalidation | 2 |
| Add `/health` endpoint returning `{ success: true, data: "OK" }` | 1 |

**Acceptance Criteria**:
- [ ] `curl localhost:{PORT}/health` returns `{ success: true, data: "OK" }`
- [ ] MongoDB connects on startup (logged via logger, not console.log)
- [ ] Helmet, CORS, rate-limiting all active
- [ ] Logger writes to file in production, console in development

#### Story 1.3: Frontend Foundation
> *As a developer, I want the Next.js app shell with layout, providers, and API client utilities ready so that pages can be built immediately.*

| Task | Story Points |
|------|:---:|
| Create root `app/layout.tsx` with metadata, fonts, and `ClientProviders` wrapper | 2 |
| Create `contexts/LoadingContext.tsx` — global loading state | 1 |
| Create `utils/axiosInstance.ts` — Axios with base URL from env, interceptors stub | 2 |
| Create `lib/api.ts` — `fetchAPI` native fetch wrapper for services/FormData | 2 |
| Create `lib/logger.ts` — frontend logger utility | 1 |
| Create landing page `app/page.tsx` — simple hero section confirming app works | 1 |
| Set up `.env.local` with `NEXT_PUBLIC_API_URL` | 1 |
| Create `middleware.ts` with security headers (CSP, X-Frame-Options, etc.) | 2 |

**Acceptance Criteria**:
- [ ] Landing page renders at `localhost:3002`
- [ ] axiosInstance points to backend URL from environment variable
- [ ] Security headers present on all responses (check with browser DevTools)
- [ ] No console.log in any file — only logger

**Sprint Total**: 34 story points

**Deliverable**: A working full-stack "Hello World" — frontend displays a page, backend responds to health check, database connects, security middleware active.

---

## Sprint 2 — Authentication System

**Sprint Goal**: Implement complete JWT authentication (register, login, logout, email verification, password reset) with protected routes on both frontend and backend.

**Dependencies**: Sprint 1 (server, database, utilities)

### User Stories & Tasks

#### Story 2.1: User Model & JWT Utilities
> *As a developer, I want a User model and JWT helper functions so that authentication logic has a solid foundation.*

| Task | Story Points |
|------|:---:|
| Create `models/userModel.js` — name, email, password (bcrypt hash), role, isVerified, verification/reset token fields | 3 |
| Create `utils/jwt.js` — `generateAccessToken()`, `generateRefreshToken()`, `verifyToken()` | 2 |
| Create `utils/sendEmail.js` — Nodemailer wrapper with retry and HTML template support | 3 |

**Acceptance Criteria**:
- [ ] User model validates email uniqueness, hashes password on save
- [ ] JWT tokens generated with correct expiry (access: 15m, refresh: 7d)
- [ ] Emails send in dev (use Mailtrap or Ethereal) and log in test mode

#### Story 2.2: Auth Controllers & Routes
> *As a user, I want to register, verify my email, log in, log out, and reset my password so that my account is secure.*

| Task | Story Points |
|------|:---:|
| Create `controllers/authController.js` — register, login, logout, verifyEmail, forgotPassword, resetPassword, refreshToken | 5 |
| Create `routes/authRoutes.js` — POST endpoints for all auth actions | 2 |
| Create `middlewares/auth.js` — `protect` (JWT verification), `restrictTo()` (role check) | 3 |

**Acceptance Criteria**:
- [ ] `POST /api/auth/register` creates user, sends verification email, returns tokens
- [ ] `POST /api/auth/login` validates credentials, returns access + refresh tokens
- [ ] `POST /api/auth/logout` invalidates refresh token
- [ ] `GET /api/auth/verify-email/:token` marks user as verified
- [ ] `POST /api/auth/forgot-password` sends reset email with token
- [ ] `POST /api/auth/reset-password/:token` updates password
- [ ] `POST /api/auth/refresh-token` returns new access token
- [ ] All responses follow `{ success: true/false, data/error }` format

#### Story 2.3: Frontend Auth Pages
> *As a user, I want registration, login, and password reset pages so that I can manage my account from the browser.*

| Task | Story Points |
|------|:---:|
| Create `contexts/AuthContext.tsx` — user state, login/logout/register functions, token storage | 3 |
| Create `services/auth-service.ts` — API calls for all auth endpoints | 2 |
| Create `app/auth/login/page.tsx` — login form with react-hook-form + Zod validation | 3 |
| Create `app/auth/register/page.tsx` — registration form with password strength indicator | 3 |
| Create `app/auth/forgot-password/page.tsx` — email input to trigger reset | 2 |
| Create `app/auth/reset-password/[token]/page.tsx` — new password form | 2 |
| Add 401 interceptor to `axiosInstance.ts` — auto-refresh with mutex on concurrent 401s | 3 |

**Acceptance Criteria**:
- [ ] User can register, receives verification email, can verify
- [ ] User can login, token stored in localStorage, redirected to dashboard
- [ ] User can reset password via email link
- [ ] 401 responses automatically trigger token refresh (once, with mutex)
- [ ] Form validation shows inline errors (Zod schemas)
- [ ] All user-facing strings ready for i18n (hardcoded OK for now, keys later)

**Sprint Total**: 34 story points

**Deliverable**: Fully working auth flow — register → verify email → login → protected dashboard → logout → forgot/reset password.

---

## Sprint 3 — User Profiles & Role-Based Access

**Sprint Goal**: Users can view and edit their profiles, admins can manage users, and role-based access controls are enforced across all routes.

**Dependencies**: Sprint 2 (auth system, User model, protect middleware)

### User Stories & Tasks

#### Story 3.1: User Profile Backend
> *As a user, I want to view and update my profile (name, email, password, avatar) so that my account information stays current.*

| Task | Story Points |
|------|:---:|
| Create `controllers/userController.js` — getProfile, updateProfile, changePassword, deleteAccount | 3 |
| Create `routes/userRoutes.js` — GET/PUT/DELETE for profile (all protected) | 2 |
| Add avatar upload field to User model + Multer config for profile images | 3 |

**Acceptance Criteria**:
- [ ] `GET /api/users/profile` returns current user data (no password)
- [ ] `PUT /api/users/profile` updates name, email, avatar
- [ ] `PUT /api/users/change-password` requires old password, sets new one
- [ ] `DELETE /api/users/account` soft-deletes the account
- [ ] All routes require `protect` middleware

#### Story 3.2: Admin User Management
> *As an admin, I want to list, search, and manage all users so that I can moderate the platform.*

| Task | Story Points |
|------|:---:|
| Add admin endpoints — getAllUsers (paginated, searchable), getUserById, updateUserRole, banUser | 5 |
| Add `restrictTo("admin")` middleware to admin-only routes | 1 |
| Create seed script to generate admin user for development | 2 |

**Acceptance Criteria**:
- [ ] `GET /api/users?page=1&limit=10&search=john` returns paginated users (admin only)
- [ ] `PUT /api/users/:id/role` changes user role (admin only)
- [ ] `PUT /api/users/:id/ban` toggles user ban status (admin only)
- [ ] Non-admin users get 403 on admin routes

#### Story 3.3: Frontend Profile & User Management
> *As a user, I want to see and edit my profile in the browser, and as an admin, I want a user management page.*

| Task | Story Points |
|------|:---:|
| Create `app/dashboard/profile/page.tsx` — profile view/edit form with avatar upload | 5 |
| Create `app/dashboard/change-password/page.tsx` — password change form | 2 |
| Create `services/user-service.ts` — API calls for profile and admin user management | 2 |
| Create `app/admin/users/page.tsx` — data table with search, pagination, role badges, ban toggle | 5 |
| Create reusable `components/ui/data-table.tsx` — sortable, paginated table component | 3 |
| Create route protection HOC/middleware — redirect unauthenticated users, check roles | 2 |

**Acceptance Criteria**:
- [ ] Profile page shows user info, allows editing name/email/avatar
- [ ] Password change requires current password
- [ ] Admin user page shows all users with search and pagination
- [ ] Admin can change roles and ban users from the UI
- [ ] Non-admin users cannot access `/admin/*` routes (redirected)

**Sprint Total**: 33 story points

**Deliverable**: Complete user management — profile editing, avatar uploads, password changes, admin user panel with search/pagination/role management.

---

## Sprint 4 — Product Data Layer & Admin CRUD

**Sprint Goal**: Build the product model, category system, and admin product management (create, read, update, delete) so that the catalog has data to display.

**Dependencies**: Sprint 3 (user roles, admin access, file uploads)

### User Stories & Tasks

#### Story 4.1: Product & Category Models
> *As a developer, I want Product and Category models with proper relationships so that the catalog has a solid data foundation.*

| Task | Story Points |
|------|:---:|
| Create `models/categoryModel.js` — name, slug, description, parent (self-referencing for subcategories), image, isActive | 3 |
| Create `models/productModel.js` — name, slug, description, price, compareAtPrice, category (ref), images[], stock, sku, vendor (ref to User), ratings, isActive, attributes (Map) | 5 |
| Create database indexes — product name text index, category slug unique, compound indexes for filtering | 2 |

**Acceptance Criteria**:
- [ ] Category model supports nested categories (parent field)
- [ ] Product model references Category and User (vendor)
- [ ] Slug auto-generated from name on save
- [ ] Text index on product name + description for search

#### Story 4.2: Category Management (Admin)
> *As an admin, I want to create, edit, and delete categories so that products are organized.*

| Task | Story Points |
|------|:---:|
| Create `controllers/categoryController.js` — CRUD + getTree (nested structure) | 3 |
| Create `routes/categoryRoutes.js` — public GET, admin-only POST/PUT/DELETE | 2 |
| Cache category tree with auto-invalidation on write | 1 |

**Acceptance Criteria**:
- [ ] `GET /api/categories` returns flat list (public)
- [ ] `GET /api/categories/tree` returns nested category tree (public, cached)
- [ ] `POST /api/categories` creates category (admin only)
- [ ] `PUT /api/categories/:id` updates category (admin only)
- [ ] `DELETE /api/categories/:id` deletes category if no products reference it (admin only)

#### Story 4.3: Product CRUD (Admin/Vendor)
> *As a vendor or admin, I want to create, edit, and delete products so that the catalog stays up to date.*

| Task | Story Points |
|------|:---:|
| Create `controllers/productController.js` — create, update, delete, getById, getAll (with filters, search, sort, pagination) | 5 |
| Create `routes/productRoutes.js` — public GET, protected POST/PUT/DELETE | 2 |
| Implement query builder — filter by category, price range, rating, stock status; sort by price/date/popularity; paginate | 3 |
| Cache invalidation on product create/update/delete | 1 |

**Acceptance Criteria**:
- [ ] `POST /api/products` creates product (vendor/admin only)
- [ ] `PUT /api/products/:id` updates product (owner vendor or admin only)
- [ ] `DELETE /api/products/:id` soft-deletes product (owner vendor or admin only)
- [ ] `GET /api/products?category=x&minPrice=10&maxPrice=50&sort=-price&page=1` works
- [ ] `GET /api/products/:id` returns single product with populated category and vendor

#### Story 4.4: Frontend Admin Product Management
> *As an admin/vendor, I want a product management page to create, edit, and delete products from the browser.*

| Task | Story Points |
|------|:---:|
| Create `services/product-service.ts` — CRUD API calls + query parameter builder | 2 |
| Create `services/category-service.ts` — API calls for categories | 1 |
| Create `app/admin/products/page.tsx` — product data table with filters, search, pagination | 5 |
| Create `app/admin/products/new/page.tsx` — product creation form (react-hook-form + Zod) | 3 |
| Create `app/admin/products/[id]/edit/page.tsx` — product edit form (pre-populated) | 2 |
| Create `app/admin/categories/page.tsx` — category management (tree view, CRUD) | 3 |

**Acceptance Criteria**:
- [ ] Admin can see all products in a paginated table with search
- [ ] Admin/vendor can create a product with all fields (images handled in Sprint 6)
- [ ] Admin/vendor can edit/delete their products
- [ ] Admin can manage categories in a tree view
- [ ] Forms validate all required fields client-side

**Sprint Total**: 38 story points

**Deliverable**: Complete product and category backend with admin CRUD UI — products can be created, listed, searched, filtered, edited, and deleted.

---

## Sprint 5 — Product Catalog & Search (Public)

**Sprint Goal**: Build the public-facing product catalog with category browsing, full-text search, filtering, sorting, and detailed product pages.

**Dependencies**: Sprint 4 (product model, API endpoints, categories)

### User Stories & Tasks

#### Story 5.1: Public Product Listing Page
> *As a customer, I want to browse products with filters and sorting so that I can find what I'm looking for.*

| Task | Story Points |
|------|:---:|
| Create `app/products/page.tsx` — grid/list view toggle, product cards, pagination | 5 |
| Create `components/products/ProductCard.tsx` — image, name, price, rating stars, "Add to Cart" button | 3 |
| Create `components/products/ProductFilters.tsx` — sidebar with category tree, price range slider, rating filter, stock status | 5 |
| Create `components/products/ProductSort.tsx` — sort dropdown (newest, price low-high, price high-low, top rated) | 1 |
| Implement URL-based filter state — filters reflected in query params for shareability | 3 |

**Acceptance Criteria**:
- [ ] Products page loads with paginated grid view
- [ ] Filters update URL query params and refetch products
- [ ] Category filter shows nested tree
- [ ] Price range slider filters by min/max price
- [ ] Sort dropdown changes product order
- [ ] Grid/list view toggle works
- [ ] Pagination shows total count and page numbers

#### Story 5.2: Search Functionality
> *As a customer, I want to search for products by name or description so that I can quickly find specific items.*

| Task | Story Points |
|------|:---:|
| Add search endpoint `GET /api/products/search?q=keyword` — MongoDB text index search with relevance scoring | 3 |
| Create `components/layout/SearchBar.tsx` — search input in header with debounced suggestions | 3 |
| Create `app/products/search/page.tsx` — search results page with filters | 2 |

**Acceptance Criteria**:
- [ ] Search bar appears in site header
- [ ] Typing shows debounced suggestions (300ms delay)
- [ ] Search results page uses same filter/sort components as catalog
- [ ] Empty search shows helpful message

#### Story 5.3: Product Detail Page
> *As a customer, I want to see full product details so that I can decide whether to buy.*

| Task | Story Points |
|------|:---:|
| Create `app/products/[slug]/page.tsx` — product detail with image gallery, description, price, stock, "Add to Cart", breadcrumbs | 5 |
| Create `components/products/ImageGallery.tsx` — main image with thumbnail navigation | 3 |
| Create `components/products/RelatedProducts.tsx` — products from same category | 2 |
| Add breadcrumb component showing category hierarchy | 1 |

**Acceptance Criteria**:
- [ ] Product page shows all details (name, description, price, compare-at price, stock status)
- [ ] Image gallery shows main image + clickable thumbnails
- [ ] Related products section shows 4 similar products
- [ ] Breadcrumbs show: Home > Category > Subcategory > Product Name
- [ ] "Add to Cart" button works (cart built in Sprint 7, button stubs for now)
- [ ] SEO metadata (title, description, OG image) set via Next.js generateMetadata

#### Story 5.4: Category Browse Pages
> *As a customer, I want to browse products by category so that I can explore a specific product type.*

| Task | Story Points |
|------|:---:|
| Create `app/categories/page.tsx` — grid of category cards with images | 2 |
| Create `app/categories/[slug]/page.tsx` — products filtered by category, with subcategory navigation | 2 |

**Acceptance Criteria**:
- [ ] Categories page shows all top-level categories as cards
- [ ] Clicking a category shows its products with subcategory sidebar
- [ ] Breadcrumbs reflect category hierarchy

**Sprint Total**: 38 story points

**Deliverable**: Full public product catalog — browsable, searchable, filterable, with detailed product pages and category navigation.

---

## Sprint 6 — Product Media & Image Management

**Sprint Goal**: Implement image upload, storage, optimization, and gallery management for products so that the catalog has rich visual content.

**Dependencies**: Sprint 4 (product model), Sprint 5 (product detail page, image gallery component)

### User Stories & Tasks

#### Story 6.1: Image Upload Backend
> *As a vendor/admin, I want to upload product images securely so that products have visual content.*

| Task | Story Points |
|------|:---:|
| Create `middlewares/upload.js` — Multer config with disk storage, MIME validation (jpg/png/webp), size limit (5MB), max 10 files | 3 |
| Create `controllers/uploadController.js` — single upload, multiple upload, delete image | 3 |
| Create `routes/uploadRoutes.js` — POST/DELETE endpoints (protected) | 1 |
| Add path traversal protection — `validateFileId()` + `assertWithin()` on all file operations | 2 |
| Serve uploaded files statically from `/uploads/` directory | 1 |

**Acceptance Criteria**:
- [ ] `POST /api/uploads/product-images` accepts up to 10 images per request
- [ ] Only jpg, png, webp accepted; others return 400
- [ ] Files > 5MB rejected
- [ ] Files stored in `uploads/products/{productId}/` directory
- [ ] `DELETE /api/uploads/:fileId` removes file (owner/admin only)
- [ ] Path traversal attacks blocked

#### Story 6.2: Image Optimization
> *As a developer, I want uploaded images automatically resized and optimized so that pages load fast.*

| Task | Story Points |
|------|:---:|
| Install and configure `sharp` for image processing | 1 |
| Create `utils/imageProcessor.js` — resize to multiple sizes (thumbnail: 150x150, medium: 600x600, large: 1200x1200), convert to webp | 3 |
| Generate all sizes on upload, store references in product.images array | 2 |

**Acceptance Criteria**:
- [ ] Each uploaded image produces 3 sizes (thumbnail, medium, large)
- [ ] Images converted to webp format
- [ ] Product images array stores objects: `{ original, thumbnail, medium, large }`
- [ ] Original file preserved alongside optimized versions

#### Story 6.3: Frontend Image Management
> *As a vendor/admin, I want to manage product images (upload, reorder, delete) in the product edit form.*

| Task | Story Points |
|------|:---:|
| Create `components/admin/ImageUploader.tsx` — drag-and-drop multi-image upload with preview and progress | 5 |
| Create `components/admin/ImageSortable.tsx` — drag-to-reorder existing product images | 3 |
| Integrate image uploader into product create/edit forms | 2 |
| Use Next.js `<Image>` component with proper sizes for all product images across the site | 2 |

**Acceptance Criteria**:
- [ ] Drag-and-drop zone accepts multiple images
- [ ] Upload progress shown per image
- [ ] Uploaded images appear as sortable thumbnails
- [ ] Images can be reordered via drag-and-drop (order saved to product)
- [ ] Images can be deleted with confirmation
- [ ] Product cards and detail pages use optimized image sizes (thumbnail for cards, large for detail)

**Sprint Total**: 26 story points

**Deliverable**: Complete image pipeline — upload, validate, optimize, store, serve, and manage product images with a polished admin UI.

---

## Sprint 7 — Shopping Cart

**Sprint Goal**: Build a persistent shopping cart that works for both authenticated and guest users, with real-time stock validation and quantity management.

**Dependencies**: Sprint 5 (product pages with "Add to Cart" buttons)

### User Stories & Tasks

#### Story 7.1: Cart Backend
> *As a customer, I want my cart saved on the server so that it persists across devices when I'm logged in.*

| Task | Story Points |
|------|:---:|
| Create `models/cartModel.js` — user (ref), items: [{ product (ref), quantity, price }], totalPrice (virtual) | 3 |
| Create `controllers/cartController.js` — getCart, addItem (with stock check), updateQuantity, removeItem, clearCart | 5 |
| Create `routes/cartRoutes.js` — all routes protected (authenticated users only) | 1 |
| Add stock validation — prevent adding more than available stock | 1 |

**Acceptance Criteria**:
- [ ] `GET /api/cart` returns user's cart with populated product details
- [ ] `POST /api/cart/items` adds product to cart (checks stock)
- [ ] `PUT /api/cart/items/:productId` updates quantity (checks stock)
- [ ] `DELETE /api/cart/items/:productId` removes item
- [ ] `DELETE /api/cart` clears entire cart
- [ ] Total price auto-calculated

#### Story 7.2: Guest Cart (LocalStorage)
> *As a guest, I want to add products to my cart without logging in so that I can browse and decide before creating an account.*

| Task | Story Points |
|------|:---:|
| Create `contexts/CartContext.tsx` — cart state management, localStorage sync for guests, API sync for authenticated users | 5 |
| Implement cart merge on login — combine localStorage cart with server cart | 3 |

**Acceptance Criteria**:
- [ ] Guest users have a cart stored in localStorage
- [ ] On login, guest cart items merge with existing server cart
- [ ] On logout, server cart clears from state (not deleted on server)
- [ ] Cart state updates optimistically with rollback on error

#### Story 7.3: Cart UI
> *As a customer, I want to view and manage my cart so that I can review items before checkout.*

| Task | Story Points |
|------|:---:|
| Create `components/cart/CartIcon.tsx` — header icon with item count badge | 1 |
| Create `components/cart/CartDrawer.tsx` — slide-out cart panel with item list, quantity +/- buttons, remove, subtotal | 5 |
| Create `app/cart/page.tsx` — full cart page with item details, quantity controls, stock warnings, order summary | 5 |
| Wire "Add to Cart" buttons on ProductCard and product detail page to CartContext | 2 |
| Add toast notifications for cart actions (added, removed, stock limit reached) | 1 |

**Acceptance Criteria**:
- [ ] Cart icon in header shows item count
- [ ] Clicking cart icon opens slide-out drawer with quick view
- [ ] "View Cart" button in drawer navigates to full cart page
- [ ] Quantity adjustable with +/- buttons (respects stock limits)
- [ ] Out-of-stock items flagged with warning
- [ ] Remove button with confirmation
- [ ] Order summary shows subtotal
- [ ] Empty cart shows "Your cart is empty" with "Continue Shopping" link
- [ ] Toast feedback on all cart actions

**Sprint Total**: 32 story points

**Deliverable**: Fully functional shopping cart — add/remove/update items, persistent for logged-in users, localStorage for guests, merge on login, responsive UI with drawer and full-page views.

---

## Sprint 8 — Checkout & Cash on Delivery Orders

**Sprint Goal**: Implement the checkout flow with address management and cash on delivery as the payment method, creating confirmed orders.

**Dependencies**: Sprint 7 (shopping cart), Sprint 2 (authentication — checkout requires login)

### User Stories & Tasks

#### Story 8.1: Address Management Backend
> *As a customer, I want to save and manage delivery addresses so that I can quickly select one during checkout.*

| Task | Story Points |
|------|:---:|
| Create `models/addressModel.js` — user (ref), fullName, phone, street, city, state, postalCode, country, isDefault, label (home/work/other) | 2 |
| Create `controllers/addressController.js` — CRUD + setDefault | 3 |
| Create `routes/addressRoutes.js` — all protected | 1 |

**Acceptance Criteria**:
- [ ] `GET /api/addresses` returns user's saved addresses
- [ ] `POST /api/addresses` creates new address (first one auto-defaults)
- [ ] `PUT /api/addresses/:id` updates address
- [ ] `DELETE /api/addresses/:id` removes address
- [ ] `PUT /api/addresses/:id/default` sets as default
- [ ] Max 5 addresses per user

#### Story 8.2: Order Model & Checkout Backend
> *As a customer, I want to place a Cash on Delivery order so that I can pay when the product arrives.*

| Task | Story Points |
|------|:---:|
| Create `models/orderModel.js` — user (ref), items: [{ product, name, quantity, price, image }], shippingAddress (embedded), paymentMethod: "COD", status (pending/confirmed/processing/shipped/delivered/cancelled), totalPrice, shippingCost, orderNumber (auto-generated), notes, statusHistory: [{ status, date, note }] | 5 |
| Create `controllers/orderController.js` — placeOrder (validate stock → decrement stock → create order → clear cart), getMyOrders, getOrderById, cancelOrder | 5 |
| Create `routes/orderRoutes.js` — protected routes | 1 |
| Implement order number generator — sequential or date-based (e.g., ORD-20260305-0001) | 1 |
| Add stock decrement on order placement + stock restore on cancellation | 2 |

**Acceptance Criteria**:
- [ ] `POST /api/orders` validates all cart items in stock, decrements stock, creates order, clears cart
- [ ] If any item out of stock, order fails with clear error listing which items
- [ ] `GET /api/orders/my-orders` returns paginated order history
- [ ] `GET /api/orders/:id` returns order details (own orders only)
- [ ] `PUT /api/orders/:id/cancel` cancels order (only if status is pending/confirmed), restores stock
- [ ] Order number auto-generated in readable format
- [ ] Status history tracked with timestamps

#### Story 8.3: Frontend Checkout Flow
> *As a customer, I want a multi-step checkout page that lets me select an address, confirm COD payment, and place my order.*

| Task | Story Points |
|------|:---:|
| Create `services/address-service.ts` — API calls for address management | 1 |
| Create `services/order-service.ts` — placeOrder, getMyOrders, getOrderById, cancelOrder | 1 |
| Create `app/checkout/page.tsx` — multi-step checkout: 1) Address selection/creation → 2) Order summary → 3) Confirm (COD) → 4) Success | 8 |
| Create `components/checkout/AddressSelector.tsx` — select from saved addresses or add new | 3 |
| Create `components/checkout/OrderSummary.tsx` — items list, subtotal, shipping, total | 2 |
| Create `components/checkout/CODConfirmation.tsx` — payment method display (Cash on Delivery), terms checkbox, place order button | 2 |
| Create `app/checkout/success/page.tsx` — order confirmation with order number and details | 2 |

**Acceptance Criteria**:
- [ ] Checkout requires authentication (redirect to login if not)
- [ ] Step 1: User selects saved address or creates new one
- [ ] Step 2: Order summary shows all items, quantities, prices, subtotal, shipping, total
- [ ] Step 3: Payment method shows "Cash on Delivery" (no card input), user confirms with checkbox
- [ ] Step 4: On "Place Order", loading state shown, order created, redirected to success page
- [ ] Success page shows order number, estimated delivery, and "Continue Shopping" button
- [ ] If stock runs out during checkout, clear error shown
- [ ] Back button navigates between checkout steps without losing data

**Sprint Total**: 37 story points

**Deliverable**: Complete checkout flow — address management, order summary, COD confirmation, order placement with stock management, success page.

---

## Sprint 9 — Order Management & Tracking

**Sprint Goal**: Build order tracking for customers and order management for admins, with status updates and delivery tracking.

**Dependencies**: Sprint 8 (order model, order placement)

### User Stories & Tasks

#### Story 9.1: Admin Order Management Backend
> *As an admin, I want to view, filter, and update order statuses so that I can process and fulfill orders.*

| Task | Story Points |
|------|:---:|
| Add admin endpoints — getAllOrders (paginated, filterable by status/date/user), updateOrderStatus, addOrderNote | 5 |
| Implement status transition validation — only allow valid transitions (e.g., pending → confirmed → processing → shipped → delivered) | 2 |
| Add order statistics endpoint — total orders, revenue, orders by status, daily/monthly aggregation | 3 |

**Acceptance Criteria**:
- [ ] `GET /api/orders?status=pending&page=1` returns filtered, paginated orders (admin only)
- [ ] `PUT /api/orders/:id/status` updates status with note (admin only)
- [ ] Invalid status transitions return 400 with explanation
- [ ] `GET /api/orders/stats` returns order/revenue aggregations (admin only)
- [ ] Status changes recorded in order's statusHistory array

#### Story 9.2: Customer Order Tracking UI
> *As a customer, I want to see my order history and track individual order status so that I know when to expect delivery.*

| Task | Story Points |
|------|:---:|
| Create `app/dashboard/orders/page.tsx` — order history table with status badges, date, total, actions | 5 |
| Create `app/dashboard/orders/[id]/page.tsx` — order detail with status timeline, items, address, order number | 5 |
| Create `components/orders/StatusTimeline.tsx` — visual progress indicator (pending → confirmed → processing → shipped → delivered) | 3 |
| Add cancel order button (only for pending/confirmed orders) with confirmation dialog | 2 |

**Acceptance Criteria**:
- [ ] Order history page shows all user's orders with status, date, total
- [ ] Order detail shows full timeline with dates for each status change
- [ ] Status timeline component visually shows progress (completed steps highlighted)
- [ ] Cancel button appears only for cancellable orders
- [ ] Cancel confirmation dialog warns about the action

#### Story 9.3: Admin Order Management UI
> *As an admin, I want a dashboard to manage all orders — update statuses, add notes, and view order details.*

| Task | Story Points |
|------|:---:|
| Create `app/admin/orders/page.tsx` — all orders table with status filter tabs, date range picker, search by order number | 5 |
| Create `app/admin/orders/[id]/page.tsx` — order detail with status update dropdown, note input, customer info, items | 5 |
| Add order status change confirmation with required note field | 2 |

**Acceptance Criteria**:
- [ ] Admin sees all orders, filterable by status tabs (All, Pending, Confirmed, Processing, Shipped, Delivered, Cancelled)
- [ ] Admin can search by order number or customer name
- [ ] Admin can update order status with a required note
- [ ] Status update reflects immediately in the UI
- [ ] Order detail shows customer info, shipping address, items, status history with notes

**Sprint Total**: 37 story points

**Deliverable**: Full order lifecycle management — customers track orders with visual timeline, admins manage orders with status updates, notes, and statistics.

---

## Sprint 10 — Reviews, Ratings & Wishlist

**Sprint Goal**: Allow customers to review and rate purchased products and save products to a wishlist for later.

**Dependencies**: Sprint 9 (orders — only delivered orders can be reviewed), Sprint 5 (product pages)

### User Stories & Tasks

#### Story 10.1: Reviews & Ratings Backend
> *As a customer, I want to review products I've purchased so that I can share my experience.*

| Task | Story Points |
|------|:---:|
| Create `models/reviewModel.js` — user (ref), product (ref), order (ref), rating (1-5), title, comment, isVerified (purchased), createdAt | 3 |
| Create `controllers/reviewController.js` — createReview (only if delivered order exists), updateReview, deleteReview, getProductReviews (paginated, sortable) | 5 |
| Create `routes/reviewRoutes.js` — protected POST/PUT/DELETE, public GET | 1 |
| Add rating aggregation — update product's average rating and review count on review create/update/delete | 2 |
| Prevent duplicate reviews (one review per user per product) | 1 |

**Acceptance Criteria**:
- [ ] `POST /api/reviews` creates review (only if user has a delivered order containing the product)
- [ ] `GET /api/products/:id/reviews?sort=-createdAt&page=1` returns paginated reviews
- [ ] One review per user per product enforced
- [ ] Product's `averageRating` and `reviewCount` updated automatically
- [ ] Review marked as "verified purchase"
- [ ] User can update/delete their own review

#### Story 10.2: Wishlist Backend
> *As a customer, I want to save products to a wishlist so that I can buy them later.*

| Task | Story Points |
|------|:---:|
| Create `models/wishlistModel.js` — user (ref), products: [{ product (ref), addedAt }] | 1 |
| Create `controllers/wishlistController.js` — getWishlist, addItem, removeItem, clearWishlist | 3 |
| Create `routes/wishlistRoutes.js` — all protected | 1 |

**Acceptance Criteria**:
- [ ] `GET /api/wishlist` returns user's wishlist with populated product details
- [ ] `POST /api/wishlist/:productId` adds product (no duplicates)
- [ ] `DELETE /api/wishlist/:productId` removes product
- [ ] `DELETE /api/wishlist` clears entire wishlist

#### Story 10.3: Frontend Reviews & Wishlist
> *As a customer, I want to read and write reviews on product pages, and save products to my wishlist.*

| Task | Story Points |
|------|:---:|
| Create `components/products/ReviewSection.tsx` — reviews list with stars, user name, date, verified badge, pagination | 3 |
| Create `components/products/ReviewForm.tsx` — star rating input, title, comment, submit (shown only for eligible users) | 3 |
| Create `components/products/RatingStars.tsx` — reusable star display component (full, half, empty stars) | 1 |
| Add wishlist heart icon to ProductCard and product detail page (toggle on click) | 2 |
| Create `app/dashboard/wishlist/page.tsx` — wishlist grid with product cards and "Remove" button | 3 |
| Create `services/review-service.ts` and `services/wishlist-service.ts` | 1 |

**Acceptance Criteria**:
- [ ] Product page shows reviews section with rating distribution bar chart
- [ ] Review form appears only for users with delivered orders for that product
- [ ] Star rating clickable (1-5 stars)
- [ ] Wishlist heart icon toggles (filled = in wishlist, outline = not)
- [ ] Dashboard wishlist page shows saved products in grid
- [ ] "Add to Cart" available directly from wishlist

**Sprint Total**: 30 story points

**Deliverable**: Product reviews with verified purchase badges, star ratings with aggregation, and personal wishlists with add/remove from any product page.

---

## Sprint 11 — Admin Dashboard & Email Notifications

**Sprint Goal**: Build a comprehensive admin dashboard with analytics and set up transactional email notifications for order lifecycle events.

**Dependencies**: Sprint 9 (order statistics), Sprint 8 (order model)

### User Stories & Tasks

#### Story 11.1: Admin Dashboard
> *As an admin, I want a dashboard overview showing key metrics so that I can monitor platform performance.*

| Task | Story Points |
|------|:---:|
| Create `app/admin/page.tsx` (dashboard) — KPI cards (total revenue, orders today, active users, products count), recent orders table, revenue chart | 8 |
| Create `controllers/dashboardController.js` — aggregation endpoints: revenue (daily/weekly/monthly), top products, orders by status, new users, low stock alerts | 5 |
| Create `components/admin/RevenueChart.tsx` — line chart using Recharts | 3 |
| Create `components/admin/KPICard.tsx` — stat card with icon, value, label, trend indicator | 1 |
| Create `components/admin/LowStockAlert.tsx` — products with stock < 10, with link to edit | 2 |

**Acceptance Criteria**:
- [ ] Dashboard shows: total revenue, total orders, total users, total products
- [ ] Revenue chart shows daily revenue for last 30 days
- [ ] Recent orders table shows last 10 orders with status
- [ ] Top 5 best-selling products shown
- [ ] Low stock alerts displayed prominently
- [ ] All data fetched from dedicated aggregation endpoints
- [ ] Dashboard accessible only to admin role

#### Story 11.2: Email Notification System
> *As a customer, I want to receive email notifications for order events so that I stay informed about my purchases.*

| Task | Story Points |
|------|:---:|
| Create `utils/emailTemplates.js` — HTML email templates: orderConfirmation, orderShipped, orderDelivered, orderCancelled, welcomeEmail, passwordReset (already exists, refactor) | 5 |
| Create `utils/notificationService.js` — send notification by event type, queue emails, handle failures with retry | 3 |
| Integrate notifications into order lifecycle — trigger on status changes | 2 |
| Integrate welcome email on user registration (if not already) | 1 |

**Acceptance Criteria**:
- [ ] Order confirmation email sent on order placement (includes order number, items, total, COD reminder)
- [ ] Shipped email sent when admin updates status to "shipped"
- [ ] Delivered email sent when admin updates status to "delivered"
- [ ] Cancelled email sent on cancellation (by customer or admin)
- [ ] Welcome email sent on registration
- [ ] All emails have responsive HTML design
- [ ] Email failures logged, not thrown to user

#### Story 11.3: Admin Navigation & Layout
> *As an admin, I want a proper admin layout with sidebar navigation so that I can access all management pages easily.*

| Task | Story Points |
|------|:---:|
| Create `components/admin/AdminLayout.tsx` — sidebar with navigation links (Dashboard, Orders, Products, Categories, Users) | 3 |
| Create `components/admin/AdminSidebar.tsx` — collapsible sidebar with icons, active state, mobile responsive | 3 |
| Wrap all `/admin/*` pages with AdminLayout | 1 |

**Acceptance Criteria**:
- [ ] Admin layout has sidebar with links to all admin pages
- [ ] Active page highlighted in sidebar
- [ ] Sidebar collapses to icons on mobile
- [ ] Admin layout only accessible to admin users

**Sprint Total**: 37 story points

**Deliverable**: Admin dashboard with analytics, charts, and KPIs; full email notification system for order lifecycle; polished admin navigation.

---

## Sprint 12 — Internationalization, Performance & Security Hardening

**Sprint Goal**: Add multi-language support (i18n), optimize performance with caching and lazy loading, and harden security across the entire stack.

**Dependencies**: Sprint 11 (all features complete — this sprint polishes them)

### User Stories & Tasks

#### Story 12.1: Internationalization (i18n)
> *As a user, I want the platform in my preferred language so that I can navigate comfortably.*

| Task | Story Points |
|------|:---:|
| Install and configure `i18next` + `react-i18next` in frontend | 2 |
| Create translation namespace files — `common.json`, `auth.json`, `products.json`, `cart.json`, `checkout.json`, `orders.json`, `admin.json` | 5 |
| Replace all hardcoded strings with `t()` calls across every component | 5 |
| Create language switcher component in header/footer | 1 |
| Store language preference in localStorage + user profile | 1 |

**Acceptance Criteria**:
- [ ] All user-facing strings use `t()` function
- [ ] Language switcher toggles between supported languages
- [ ] Language preference persists across sessions
- [ ] No raw key strings visible in UI (all keys have translations)
- [ ] RTL support ready (if applicable)

#### Story 12.2: Performance Optimization
> *As a user, I want the site to load fast so that browsing is smooth and enjoyable.*

| Task | Story Points |
|------|:---:|
| Implement backend response caching — product listings, categories, dashboard stats (with cache invalidation) | 3 |
| Add `React.lazy` + `Suspense` for route-level code splitting on admin pages | 2 |
| Implement image lazy loading with blur placeholders using Next.js `<Image>` | 2 |
| Add MongoDB query optimization — review indexes, add `.lean()` where appropriate, add `.select()` to limit fields | 3 |
| Configure Next.js production optimizations — bundle analyzer, tree shaking verification | 2 |

**Acceptance Criteria**:
- [ ] Product listing API cached, invalidated on product create/update/delete
- [ ] Category tree cached, invalidated on category changes
- [ ] Admin pages code-split (not loaded in customer bundle)
- [ ] All product images use lazy loading with blur placeholders
- [ ] MongoDB queries use indexes (no collection scans for common queries)
- [ ] Bundle size analyzed and no unnecessary large packages included

#### Story 12.3: Security Hardening
> *As a developer, I want the platform secure against common attack vectors so that user data is protected.*

| Task | Story Points |
|------|:---:|
| Audit and test rate limiting — ensure auth routes: 10/15min, global: 100/15min | 1 |
| Verify all user input sanitized — `escapeRegex()` on all `$regex`, ObjectId validation on all ID params | 2 |
| Add CSRF protection for state-changing requests | 2 |
| Review all file upload paths — `assertWithin()` checks, MIME validation | 1 |
| Add request logging with correlation IDs for traceability | 2 |
| Run through OWASP Top 10 checklist for the entire codebase | 2 |
| Add account lockout after 5 failed login attempts (15-minute lockout) | 2 |

**Acceptance Criteria**:
- [ ] Rate limiting active and tested on all routes
- [ ] No unescaped user input in database queries
- [ ] File upload paths validated against directory traversal
- [ ] Failed login attempts tracked, account locked after 5 failures
- [ ] All API requests have correlation ID in logs
- [ ] OWASP Top 10 checklist passed

**Sprint Total**: 36 story points

**Deliverable**: Multi-language support, optimized performance (caching, lazy loading, query optimization), and hardened security (input validation, rate limiting, account lockout, OWASP compliance).

---

## Sprint 13 — Testing, CI/CD & Production Deployment

**Sprint Goal**: Set up testing infrastructure, create critical test suites, configure CI/CD pipeline, and deploy to production.

**Dependencies**: Sprint 12 (all features complete and hardened)

### User Stories & Tasks

#### Story 13.1: Testing Infrastructure & Backend Tests
> *As a developer, I want automated tests so that I can confidently make changes without breaking things.*

| Task | Story Points |
|------|:---:|
| Install and configure Jest + Supertest for backend | 2 |
| Create test database configuration and setup/teardown helpers | 2 |
| Write unit tests for critical utils — jwt.js, sanitize.js, emailTemplates.js | 3 |
| Write integration tests for auth flow — register, login, refresh, reset password | 5 |
| Write integration tests for order flow — add to cart, checkout, cancel | 5 |

**Acceptance Criteria**:
- [ ] `npm test` runs all backend tests
- [ ] Tests use separate test database (not development/production)
- [ ] Auth flow tests cover happy path + error cases (duplicate email, wrong password, expired token)
- [ ] Order flow tests cover happy path + error cases (out of stock, invalid address)
- [ ] All tests pass with > 70% coverage on critical paths

#### Story 13.2: Frontend Tests
> *As a developer, I want frontend component tests so that UI changes don't break user flows.*

| Task | Story Points |
|------|:---:|
| Install and configure Jest + React Testing Library for frontend | 2 |
| Write tests for AuthContext — login/logout state changes | 2 |
| Write tests for CartContext — add/remove/update items, merge on login | 2 |
| Write tests for critical components — ProductCard, CartDrawer, CheckoutForm | 3 |
| Write tests for form validation — login, register, checkout forms | 2 |

**Acceptance Criteria**:
- [ ] `npm test` runs all frontend tests
- [ ] Context providers tested with mock API responses
- [ ] Form validation tested for valid and invalid inputs
- [ ] Components render correctly with mock data

#### Story 13.3: CI/CD Pipeline & Deployment
> *As a developer, I want automated build/test/deploy so that releases are safe and consistent.*

| Task | Story Points |
|------|:---:|
| Create GitHub Actions workflow — lint → test → build on every PR | 3 |
| Create production deployment script — PM2 ecosystem config for backend | 2 |
| Create nginx configuration — proxy `/api/*` to backend, serve frontend | 2 |
| Create `.env.production` template with all required variables documented | 1 |
| Write deployment documentation in `docs/SETUP.md` — step-by-step deploy instructions | 1 |
| Final smoke test — register, browse, add to cart, checkout COD, admin manage order | 2 |

**Acceptance Criteria**:
- [ ] Push to main triggers: lint → test → build pipeline
- [ ] Failed tests block merge
- [ ] PM2 config manages backend process (auto-restart, log rotation)
- [ ] nginx serves frontend on port 3000, proxies /api to backend port
- [ ] SSL configured (Let's Encrypt or provided cert)
- [ ] Smoke test passes: full user journey from registration to delivered order
- [ ] Deployment documentation complete and tested

**Sprint Total**: 36 story points

**Deliverable**: Tested, deployed, production-ready e-commerce platform with CI/CD pipeline, automated tests, and deployment documentation.

---

## Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|:---:|:---:|------------|
| 1 | **Scope creep** — features expand beyond plan | High | High | Strict sprint scope, defer non-essential features to backlog. No feature additions mid-sprint. |
| 2 | **Solo developer burnout** — 26 weeks is a long solo project | Medium | High | Take breaks between sprints. Ship MVP after Sprint 8 (checkout working). Celebrate milestones. |
| 3 | **MongoDB schema redesigns** — models need changes after data exists | Medium | Medium | Design schemas carefully in Sprint 4. Use migration scripts when changes needed. Keep backward compatibility. |
| 4 | **Email deliverability issues** — transactional emails land in spam | Medium | Medium | Use established SMTP providers (SendGrid, Mailgun). Set up SPF/DKIM/DMARC records. Test with mail-tester.com. |
| 5 | **Performance bottlenecks at scale** — queries slow with large datasets | Low | High | Add indexes early (Sprint 4). Use `.lean()` and `.select()`. Implement pagination everywhere. Load test before production. |

---

## Definition of Done (Global Checklist)

Every sprint deliverable must meet ALL of these criteria before being marked complete:

- [ ] **Functional**: All acceptance criteria for every story in the sprint are met
- [ ] **No regressions**: Previously working features still work
- [ ] **Error handling**: All async functions wrapped in try/catch, user-friendly error messages displayed
- [ ] **Input validation**: All user input validated at controller entry, sanitized for DB queries
- [ ] **Auth enforcement**: All mutating routes have `protect` middleware, admin routes have `restrictTo("admin")`
- [ ] **Response format**: All API responses use `{ success: true/false, data/error }` format
- [ ] **Logging**: All errors logged via `logger`, no `console.log` statements
- [ ] **No forbidden patterns**: No `eval()`, no `$where`, no hardcoded URLs, no `any` type, no inline styles
- [ ] **Responsive**: UI works on mobile (375px), tablet (768px), and desktop (1280px+)
- [ ] **Loading states**: All async UI operations show loading indicator
- [ ] **Empty states**: All lists/tables show meaningful empty state when no data
- [ ] **Error states**: All data-fetching components handle and display errors gracefully
- [ ] **Code reviewed**: Self-reviewed against project coding standards before sprint close

---

## Post-Launch Maintenance Plan

After Sprint 13, ongoing maintenance includes:

1. **Monitoring**: PM2 logs, MongoDB Atlas alerts (if cloud), uptime checks
2. **Backups**: Daily MongoDB backups with 30-day retention
3. **Updates**: Monthly dependency updates (`npm audit`, `npm outdated`)
4. **Bug fixes**: Triage incoming bugs, hotfix critical issues immediately
5. **Feature backlog**: Prioritized list of future features (payment gateway integration, vendor dashboard, analytics, etc.)

---

*Generated on 2026-03-05 | Cash on Delivery only | Solo Developer Plan*
