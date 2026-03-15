# Data Models

All models are defined in `{BACKEND_DIR}/src/models/`. The backend uses Mongoose with MongoDB.

---

## Documentation Format

Use this format for each model:

```
## ModelName

**File:** `src/models/modelFile.js`
**Collection:** `collectionname`

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `fieldName` | Type | Yes/No | value | Description |

### Instance methods
### Static methods
### Pre-save hooks
### Indexes
### Relationships
```

---

## User

**File:** `src/models/userModel.js`
**Collection:** `users`
**Implemented:** Sprint 2

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | String | Yes | -- | Trimmed |
| `email` | String | Yes | -- | Unique, lowercase, trimmed |
| `password` | String | Yes | -- | Bcrypt hashed (salt 12); `select: false` |
| `role` | String | No | `"customer"` | Enum: `customer`, `admin` |
| `isVerified` | Boolean | No | `false` | Set to `true` after email verification |
| `isActive` | Boolean | No | `true` | Soft-disable accounts without deletion |
| `avatar` | String | No | `null` | Relative URL to uploaded avatar e.g. `/uploads/avatars/avatar-123.jpg` |
| `refreshToken` | String | No | -- | SHA-256 hash of the issued refresh JWT; `select: false` |
| `emailVerificationToken` | String | No | -- | SHA-256 hash of raw verification token; `select: false` |
| `emailVerificationExpiresAt` | Date | No | -- | 24h after registration; `select: false` |
| `passwordResetTokenHash` | String | No | -- | SHA-256 hash of raw reset token; `select: false` |
| `passwordResetExpiresAt` | Date | No | -- | 15 min after forgot-password request; `select: false` |
| `passwordChangedAt` | Date | No | -- | Set on password change (invalidates earlier tokens); `select: false` |
| `loginAttempts` | Number | No | `0` | Failed login counter for brute-force protection; `select: false` |
| `lockUntil` | Date | No | -- | Account lockout expiry (15 min after 5 failures); `select: false` |
| `language` | String | No | `"en"` | User language preference |
| `createdAt` | Date | Auto | -- | Mongoose timestamps |
| `updatedAt` | Date | Auto | -- | Mongoose timestamps |

### Instance Methods

| Method | Signature | Description |
|---|---|---|
| `comparePassword` | `async (candidatePassword) -> boolean` | `bcrypt.compare` against the stored hash |
| `changedPasswordAfter` | `(jwtIat) -> boolean` | Returns `true` if password changed after JWT was issued |
| `isLocked` | `() -> boolean` | Returns `true` if account is currently locked (`lockUntil > now`) |

### Pre-save Hook

If `password` is modified: hash with `bcrypt.hash(password, 12)`. If not a new document, also set `passwordChangedAt = Date.now() - 1000` (ensures new token required after password change).

### toJSON Transform

Adds `id` from `_id`. Removes `_id`, `__v`, and all sensitive fields: `password`, `refreshToken`, `emailVerificationToken`, `emailVerificationExpiresAt`, `passwordResetTokenHash`, `passwordResetExpiresAt`, `passwordChangedAt`, `loginAttempts`, `lockUntil`. This ensures NO sensitive data ever appears in API responses even if fields are present on the document (e.g. after `User.create()`).

### Indexes

| Field(s) | Type | Reason |
|---|---|---|
| `email` | unique | Fast login lookup, uniqueness enforcement |
| `emailVerificationToken` | sparse | Fast verification lookup (null for verified users) |
| `passwordResetTokenHash` | sparse | Fast reset lookup (null when not resetting) |

### Relationships

- Sprint 7+: One-to-many with Order, Cart

### Sprint 3 additions

Avatar upload stored as relative URL in `avatar` field. Served via `GET /uploads/avatars/<filename>`. Old avatar file deleted from disk on profile update. Admin-only user management endpoints added in `userController.js`.

---

## Document your models here

<!-- Copy the format above for each model in your application. Below are common patterns: -->

<!--
## ResourceName

**File:** `src/models/resourceModel.js`
**Collection:** `resources`

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | String | Yes | -- | Trimmed |
| `description` | String | No | -- | |
| `createdBy` | ObjectId | Yes | -- | References: `User` |
| `status` | String | No | `"active"` | Enum: `"active"`, `"inactive"`, `"archived"` |
| `createdAt` | Date | Auto | -- | Mongoose timestamps |
| `updatedAt` | Date | Auto | -- | Mongoose timestamps |

### Indexes

| Fields | Purpose |
|---|---|
| `{ createdBy: 1, status: 1 }` | Fast lookup by creator and status |
| `{ createdAt: -1 }` | Recent-first ordering |

### Relationships

- `createdBy` -> `User`
-->

<!--
## NestedResource (sub-documents)

If your app has deeply nested models (e.g., Course -> Module -> Lesson -> Chapter -> MediaFile),
document each level with its fields, virtuals (virtual populate), and indexes.

Example virtual populate:
**Virtual:** `children` -- virtual populate from `ChildModel` where `parentId` matches, sorted by `order`
-->

<!--
## UserProgress / Analytics

If your app tracks user progress or analytics:

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `userId` | ObjectId | Yes | -- | References: `User` |
| `resourceId` | ObjectId | Yes | -- | References: `Resource` |
| `completedItems` | ObjectId[] | No | `[]` | References: completed sub-items |
| `overallProgress` | Number | No | `0` | Percentage (0-100) |
| `lastAccessedAt` | Date | No | -- | |

**Indexes:** `{ userId: 1, resourceId: 1 }` (unique)
-->

---

## Category

**File:** `src/models/categoryModel.js`
**Collection:** `categories`

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | String | Yes | — | Trimmed |
| `slug` | String | No (auto) | — | Unique; auto-generated from name on save |
| `description` | String | No | `""` | |
| `parent` | ObjectId | No | `null` | Self-reference to `Category` (for subcategories) |
| `image` | String | No | `null` | URL |
| `isActive` | Boolean | No | `true` | |
| `createdAt` | Date | auto | — | Mongoose timestamps |
| `updatedAt` | Date | auto | — | Mongoose timestamps |

### Pre-save hooks
- Generates a URL-safe slug from `name`. Appends `-1`, `-2`, etc. if slug already exists.

### Indexes
- `{ slug: 1 }` — unique
- `{ parent: 1 }` — tree traversal queries

### Relationships
- `parent` → `Category` (self-referencing; null for root categories)

### toJSON transform
Adds `id`, removes `_id` and `__v`.

---

## Product

**File:** `src/models/productModel.js`
**Collection:** `products`

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | String | Yes | — | Trimmed |
| `slug` | String | No (auto) | — | Unique; auto-generated from name |
| `description` | String | No | `""` | |
| `price` | Number | Yes | — | Min: 0 |
| `compareAtPrice` | Number | No | `null` | Original/strikethrough price |
| `category` | ObjectId | No | `null` | References: `Category` |
| `images` | ProductImage[] | No | `[]` | Array of structured image objects (see Sprint 6) |
| `images[].original` | String | Yes | — | URL of the original uploaded file |
| `images[].thumbnail` | String | Yes | — | URL of 150×150 webp variant |
| `images[].medium` | String | Yes | — | URL of 600×600 webp variant |
| `images[].large` | String | Yes | — | URL of 1200×1200 webp variant |
| `stock` | Number | No | `0` | Min: 0 |
| `sku` | String | No | `null` | Unique (sparse — null allowed) |
| `vendor` | ObjectId | Yes | — | References: `User` (the creator) |
| `ratings.average` | Number | No | `0` | 0–5 |
| `ratings.count` | Number | No | `0` | Number of ratings |
| `isActive` | Boolean | No | `true` | False = soft-deleted |
| `attributes` | Map (Mixed) | No | `{}` | Key-value pairs (e.g. color, size) |
| `createdAt` | Date | auto | — | |
| `updatedAt` | Date | auto | — | |

### Pre-save hooks
- Generates URL-safe slug from `name`, handles uniqueness conflicts with counter suffix.

### Indexes
- `{ name: "text", description: "text" }` — full-text search
- `{ category: 1, isActive: 1, price: 1 }` — category-filtered product listing with price sort
- `{ vendor: 1, isActive: 1 }` — vendor's own product list
- `{ isActive: 1, createdAt: -1 }` — default listing (newest active products)
- `{ sku: 1 }` — unique, sparse (nulls allowed)

### Relationships
- `category` → `Category`
- `vendor` → `User`

### toJSON transform
Adds `id`, removes `_id` and `__v`.

---

## Cart

**File:** `src/models/cartModel.js`
**Collection:** `carts`

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `user` | ObjectId (ref: User) | Yes | — | Unique — one cart per user |
| `items` | Array of CartItem | No | `[]` | Embedded sub-documents |
| `items[].product` | ObjectId (ref: Product) | Yes | — | No `_id` on sub-doc |
| `items[].quantity` | Number | Yes | — | min: 1 |
| `items[].price` | Number | Yes | — | min: 0 — snapshot at add time |
| `createdAt` | Date | — | auto | Timestamps |
| `updatedAt` | Date | — | auto | Timestamps |

### Virtuals

| Virtual | Returns | Notes |
|---|---|---|
| `totalPrice` | Number | Sum of `price × quantity` across all items |

### Indexes

| Index | Type | Notes |
|---|---|---|
| `{ user: 1 }` | Unique | Enforced by schema `unique: true` |
| `{ "items.product": 1 }` | Standard | Product-based cart lookups |

### toJSON transform
Adds `id`, removes `_id` and `__v`. Includes `totalPrice` virtual.

---

## Address

**File:** `src/models/addressModel.js`
**Collection:** `addresses`
**Implemented:** Sprint 8

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `user` | ObjectId (ref: User) | Yes | — | Owner of the address |
| `fullName` | String | Yes | — | Trimmed |
| `phone` | String | Yes | — | Trimmed |
| `street` | String | Yes | — | Trimmed |
| `city` | String | Yes | — | Trimmed |
| `state` | String | Yes | — | Trimmed |
| `postalCode` | String | Yes | — | Trimmed |
| `country` | String | No | `"US"` | Trimmed |
| `isDefault` | Boolean | No | `false` | Only one address per user can be default |
| `label` | String | No | `"home"` | Enum: `home`, `work`, `other` |
| `createdAt` | Date | Auto | — | Mongoose timestamps |
| `updatedAt` | Date | Auto | — | Mongoose timestamps |

### Indexes

| Index | Type | Notes |
|---|---|---|
| `{ user: 1 }` | Standard | Fast lookup of a user's addresses |
| `{ user: 1, isDefault: 1 }` | Compound | Efficient default-address lookup |

### Relationships

- Belongs to **User** via `user` field (ObjectId ref)
- Max **5 addresses** per user enforced in `addressController.js`
- First address created is automatically set as default; deleting the default promotes the next-oldest address

### toJSON transform

Adds `id`, removes `_id` and `__v`.

---

## Order

**File:** `src/models/orderModel.js`
**Collection:** `orders`
**Implemented:** Sprint 8

### Sub-schemas

**OrderItem** (embedded in `items[]`):

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `product` | ObjectId (ref: Product) | No | — | Nullable — product may be deleted later |
| `name` | String | Yes | — | Snapshot of product name at order time |
| `quantity` | Number | Yes | — | min: 1 |
| `price` | Number | Yes | — | min: 0 — snapshot of unit price at order time |
| `image` | String | No | — | Snapshot of product thumbnail URL |

**ShippingAddress** (embedded, full snapshot):

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `fullName` | String | Yes | — | — |
| `phone` | String | Yes | — | — |
| `street` | String | Yes | — | — |
| `city` | String | Yes | — | — |
| `state` | String | Yes | — | — |
| `postalCode` | String | Yes | — | — |
| `country` | String | Yes | — | — |

**StatusHistory** (embedded in `statusHistory[]`):

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `status` | String | Yes | — | Enum: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled` |
| `date` | Date | No | `Date.now` | Timestamp of status change |
| `note` | String | No | — | Optional internal note |

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `user` | ObjectId (ref: User) | Yes | — | Order owner |
| `orderNumber` | String | Yes | — | Unique, auto-generated: `ORD-YYYYMMDD-XXXX` (e.g. `ORD-20260306-0001`) |
| `items` | Array of OrderItem | Yes | — | Snapshot of cart items at checkout time |
| `shippingAddress` | ShippingAddress | Yes | — | Embedded snapshot of address at checkout time |
| `paymentMethod` | String | No | `"COD"` | Enum: `COD` (Cash on Delivery — only supported method) |
| `status` | String | No | `"pending"` | Enum: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled` |
| `totalPrice` | Number | Yes | — | min: 0 — sum of all item prices |
| `shippingCost` | Number | No | `0` | min: 0 — free shipping in current implementation |
| `notes` | String | No | — | Optional buyer notes |
| `statusHistory` | Array of StatusHistory | No | `[]` | Audit trail; initial entry added at creation |
| `createdAt` | Date | Auto | — | Mongoose timestamps |
| `updatedAt` | Date | Auto | — | Mongoose timestamps |

### Indexes

| Index | Type | Notes |
|---|---|---|
| `{ user: 1, createdAt: -1 }` | Compound | Fast paginated order history per user |
| `{ status: 1 }` | Standard | Admin order filtering by status |
| `{ createdAt: -1 }` | Standard | Global most-recent-first ordering |
| `orderNumber` | Unique | Enforced by schema `unique: true` |
| `{ orderNumber: 1 }` | Standard | Admin search by order number (Sprint 9) |

### Relationships

- Belongs to **User** via `user` field (ObjectId ref)
- References **Product** via `items[].product` (nullable — product can be deleted after ordering)
- Address is a **snapshot** (embedded) — not a live ref to Address model — preserves shipping info even if address is later deleted

### Business Logic (in `orderController.js`)

- **`placeOrder`**: validates addressId → fetches populated cart → validates all stock upfront → creates Order → decrements stock (parallel) → clears cart. Stock is decremented AFTER `Order.create()` to prevent orphaned stock on creation failure.
- **`generateOrderNumber()`**: counts today's orders via `countDocuments` with date range, formats as `ORD-YYYYMMDD-XXXX` (zero-padded to 4 digits).
- **`cancelOrder`**: only allowed when status is `pending` or `confirmed`. Restores stock via parallel `$inc` operations, appends cancellation entry to `statusHistory`.
- **`getAllOrdersAdmin`** (Sprint 9): paginated list with status/search/date filters, populates user name+email.
- **`getOrderByIdAdmin`** (Sprint 9): single order with populated user, no ownership restriction.
- **`updateOrderStatus`** (Sprint 9): validates transitions via `VALID_TRANSITIONS` map (pending→confirmed→processing→shipped→delivered, cancellation allowed from pending/confirmed). Restores stock on admin cancellation. Requires a note (max 500 chars).
- **`getOrderStats`** (Sprint 9): aggregation pipeline returning total orders/revenue (excl. cancelled), breakdown by status, and daily revenue for configurable period.

### toJSON transform

Adds `id`, removes `_id` and `__v`.

---

## Review

**File:** `src/models/reviewModel.js`
**Collection:** `reviews`
**Implemented:** Sprint 10

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `user` | ObjectId (ref User) | Yes | -- | Who wrote the review |
| `product` | ObjectId (ref Product) | Yes | -- | Which product |
| `order` | ObjectId (ref Order) | Yes | -- | Proof of purchase |
| `rating` | Number | Yes | -- | 1-5 integer |
| `title` | String | Yes | -- | Trimmed, max 100 chars |
| `comment` | String | Yes | -- | Trimmed, max 1000 chars |
| `isVerified` | Boolean | No | `true` | Verified purchase badge |
| `createdAt` | Date | Auto | -- | Mongoose timestamps |
| `updatedAt` | Date | Auto | -- | Mongoose timestamps |

### Indexes

| Index | Type | Purpose |
|---|---|---|
| `{ user: 1, product: 1 }` | Unique compound | One review per user per product |
| `{ product: 1, createdAt: -1 }` | Compound | Product reviews listing, sorted by newest |
| `{ product: 1, rating: 1 }` | Compound | Rating aggregation queries |

### Key patterns

- **Rating aggregation**: On create/update/delete, the controller runs `recalcRatings(productId)` which uses `Review.aggregate()` to compute average and count, then updates `Product.ratings`.
- **Ownership**: Only the review author can update; author or admin can delete.
- **Eligibility gate**: `createReview` checks `Order.findOne({ user, status: "delivered", "items.product": productId })` before allowing review creation.

### toJSON transform

Adds `id`, removes `_id` and `__v`.

---

## Wishlist

**File:** `src/models/wishlistModel.js`
**Collection:** `wishlists`
**Implemented:** Sprint 10

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `user` | ObjectId (ref User) | Yes | -- | Unique — one wishlist per user |
| `items` | Array of subdocs | No | `[]` | Each item: `{ product: ObjectId (ref Product), addedAt: Date }` |
| `createdAt` | Date | Auto | -- | Mongoose timestamps |
| `updatedAt` | Date | Auto | -- | Mongoose timestamps |

### Indexes

| Index | Type | Purpose |
|---|---|---|
| `{ user: 1 }` | Unique | One wishlist per user |
| `{ user: 1, "items.product": 1 }` | Compound | Fast duplicate check |

### Key patterns

- **Upsert**: `addItem` uses `findOne` + create-or-push pattern (not `findOneAndUpdate` with `$addToSet` because we need to check for duplicates and return 409).
- **Population**: `getPopulatedWishlist` selects only display fields: `name slug images price compareAtPrice stock ratings isActive`.

### toJSON transform

Adds `id`, removes `_id` and `__v`.

---

## Settings

**File:** `src/models/settingsModel.js`
**Collection:** `settings`
**Implemented:** Sprint 13+

Singleton document controlling store configuration, homepage layout, SMTP, SEO, legal pages, theming, and more. Only one document exists in the collection; accessed via `findOne({})`.

### Fields

The Settings model is organized into nested objects. Top-level sections are listed below with their nested fields.

#### `store` -- Store Information

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `store.name` | String | No | `"ShopFlow"` | Store display name |
| `store.description` | String | No | `""` | Store description |
| `store.contactEmail` | String | No | `""` | Contact email |
| `store.contactPhone` | String | No | `""` | Contact phone |
| `store.address` | String | No | `""` | Store address |
| `store.currency` | String | No | `"USD"` | Currency code (e.g., USD, EUR, TND) |
| `store.timezone` | String | No | `"UTC"` | Timezone string |
| `store.logo` | String | No | `""` | Logo image URL |
| `store.logoEnabled` | Boolean | No | `true` | Whether to display logo |
| `store.favicon` | String | No | `""` | Favicon URL |
| `store.showcaseMode` | Boolean | No | `false` | Showcase mode (disables checkout) |
| `store.buyNowEnabled` | Boolean | No | `true` | Show/hide Buy Now button on product pages |

#### `orders` -- Order Configuration

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `orders.defaultShippingCost` | Number | No | `0` | Min: 0 |
| `orders.minimumOrderAmount` | Number | No | `0` | Min: 0 |
| `orders.freeShippingThreshold` | Number | No | `0` | Min: 0; 0 = always free |
| `orders.autoCancelPendingDays` | Number | No | `0` | Min: 0; 0 = disabled |

#### `notifications` -- Email Notification Toggles

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `notifications.orderConfirmation` | Boolean | No | `true` | Send order confirmation emails |
| `notifications.orderStatusUpdate` | Boolean | No | `true` | Send status change emails |
| `notifications.welcomeEmail` | Boolean | No | `true` | Send welcome emails |
| `notifications.adminNewOrder` | Boolean | No | `false` | Notify admin on new orders |
| `notifications.adminLowStock` | Boolean | No | `false` | Notify admin on low stock |
| `notifications.adminNotificationEmail` | String | No | `""` | Admin email for notifications |

#### `products` -- Product Configuration

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `products.lowStockThreshold` | Number | No | `10` | Min: 1 |
| `products.maxImagesPerProduct` | Number | No | `10` | Min: 1, Max: 20 |
| `products.reviewsEnabled` | Boolean | No | `true` | Enable/disable reviews |
| `products.defaultSortOrder` | String | No | `"newest"` | Enum: `newest`, `price_asc`, `price_desc`, `rating` |
| `products.productTypes` | [String] | No | `[]` | Array of enabled product type keys |

#### `social` -- Social Media Links

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `social.facebook` | String | No | `""` | Facebook URL |
| `social.instagram` | String | No | `""` | Instagram URL |
| `social.twitter` | String | No | `""` | Twitter/X URL |
| `social.tiktok` | String | No | `""` | TikTok URL |
| `social.youtube` | String | No | `""` | YouTube URL |
| `social.whatsapp` | String | No | `""` | WhatsApp link |

#### `legal` -- Legal Page Content

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `legal.termsAndConditions` | String | No | `""` | HTML/text content |
| `legal.privacyPolicy` | String | No | `""` | HTML/text content |
| `legal.returnPolicy` | String | No | `""` | HTML/text content |
| `legal.shippingPolicy` | String | No | `""` | HTML/text content |

#### `seo` -- SEO Configuration

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `seo.metaTitleTemplate` | String | No | `"%s \| ShopFlow"` | `%s` is replaced by page title |
| `seo.metaDescription` | String | No | `""` | Default meta description |
| `seo.googleAnalyticsId` | String | No | `""` | GA measurement ID |
| `seo.facebookPixelId` | String | No | `""` | Facebook Pixel ID |

#### `maintenance` -- Maintenance Mode

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `maintenance.enabled` | Boolean | No | `false` | Enable maintenance mode |
| `maintenance.message` | String | No | `"We're currently performing maintenance..."` | Displayed to visitors |

#### `homepage` -- Homepage Layout

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `homepage.template` | String | No | `"classic"` | Active theme template ID |
| `homepage.mode` | String | No | `"dynamic"` | Enum: `dynamic`, `hardcoded` (legacy) |
| `homepage.sections` | Object | No | -- | Boolean flags for each section key (e.g., `hero: true`, `newsletter: false`) |
| `homepage.sectionOrder` | [String] | No | `["hero", "valuePropositions", ...]` | Ordered array of section keys |
| `homepage.slides` | [Object] | No | `[]` | Hero slides: `{ title, subtitle, ctaText, ctaLink, imageUrl, type, videoUrl, posterUrl }` |
| `homepage.announcement` | Object | No | -- | `{ enabled, text, link, bgColor, textColor, dismissible }` |
| `homepage.promoBanner` | Object | No | -- | `{ title, subtitle, ctaText, ctaLink, imageUrl, countdownEnd }` |
| `homepage.featuredProducts` | Object | No | -- | `{ title, mode, sortBy, limit, productIds }` |
| `homepage.collections` | Object | No | -- | `{ title, limit, categoryIds, displayMode }` |
| `homepage.newArrivals` | Object | No | -- | `{ title, limit }` |
| `homepage.testimonials` | Object | No | -- | `{ title, mode, items: [{ name, quote, location, rating, avatar }] }` |
| `homepage.brandStory` | Object | No | -- | `{ title, body, ctaText, ctaLink, imageUrl, imagePosition }` |
| `homepage.trustBar` | Object | No | -- | `{ items: [{ icon, title, description }] }` |
| `homepage.newsletter` | Object | No | -- | `{ title, subtitle, placeholder, buttonText, bgColor, textColor }` |
| `homepage.instagram` | Object | No | -- | `{ username, images: [{ url, link }] }` |
| `homepage.valuePropositions` | Object | No | -- | `{ items: [{ icon, title, description }] }` |
| `homepage.partners` | Object | No | -- | `{ items: [{ imageUrl, link, name }] }` |
| `homepage.popup` | Object | No | -- | `{ enabled, title, body, ctaText, ctaLink, imageUrl, trigger, delay, scrollPercent, frequency }` |
| `homepage.announcementText` | String | No | `""` | Legacy field |

#### `header` -- Header Configuration

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `header.enabled` | Boolean | No | `true` | Show/hide header |
| `header.variant` | String | No | `"classic"` | Enum: `classic`, `minimal`, `centered`, `bold`, `elegant`, `zen`, `playful`, `tech`, `artisan`, `magazine` |
| `header.mode` | String | No | `"dynamic"` | Enum: `dynamic`, `hardcoded` |

#### `footer` -- Footer Configuration

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `footer.enabled` | Boolean | No | `true` | Show/hide footer |
| `footer.variant` | String | No | `"luxury"` | Enum: `luxury`, `minimal`, `columns`, `bold`, `elegant`, `zen`, `playful`, `tech`, `artisan`, `magazine` |
| `footer.mode` | String | No | `"dynamic"` | Enum: `dynamic`, `hardcoded` |

#### `emailTemplates` -- Customizable Email Subjects

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `emailTemplates.orderConfirmationSubject` | String | No | `"Commande confirmée — #{{orderNumber}}"` | Supports `{{orderNumber}}` placeholder |
| `emailTemplates.orderShippedSubject` | String | No | `"Commande expédiée — #{{orderNumber}}"` | |
| `emailTemplates.orderDeliveredSubject` | String | No | `"Commande livrée — #{{orderNumber}}"` | |
| `emailTemplates.orderCancelledSubject` | String | No | `"Commande annulée — #{{orderNumber}}"` | |
| `emailTemplates.welcomeSubject` | String | No | `"Bienvenue sur {{shopName}}..."` | Supports `{{shopName}}` |
| `emailTemplates.verificationSubject` | String | No | `"Vérifiez votre adresse email {{shopName}}"` | |
| `emailTemplates.passwordResetSubject` | String | No | `"Réinitialisez votre mot de passe {{shopName}}"` | |

#### `smtp` -- SMTP Configuration

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `smtp.host` | String | No | `""` | SMTP server hostname |
| `smtp.port` | Number | No | `587` | SMTP port |
| `smtp.secure` | Boolean | No | `false` | Use TLS |
| `smtp.user` | String | No | `""` | SMTP username |
| `smtp.pass` | String | No | `""` | Encrypted before storage; masked as `"••••••••"` in toJSON |
| `smtp.fromName` | String | No | `"ShopFlow"` | Sender display name |
| `smtp.fromEmail` | String | No | `""` | Sender email address |

#### `typography` -- Font Settings

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `typography.headingFont` | String | No | `""` | Google Font name for headings |
| `typography.bodyFont` | String | No | `""` | Google Font name for body text |
| `typography.baseFontSize` | Number | No | `16` | Min: 14, Max: 20 (px) |
| `typography.headingLetterSpacing` | Number | No | `0.18` | Letter spacing (em) |
| `typography.headingTextTransform` | String | No | `"uppercase"` | Enum: `uppercase`, `none` |

#### `colorPalette` -- Color Theme

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `colorPalette.preset` | String | No | `"classic"` | Preset name |
| `colorPalette.bg` | String | No | `"#FFFFFF"` | Background color (hex) |
| `colorPalette.bgAlt` | String | No | `"#F7F5F3"` | Alternate background (hex) |
| `colorPalette.text` | String | No | `"#1C1C1C"` | Text color (hex) |
| `colorPalette.textMuted` | String | No | `"#71717A"` | Muted text (hex) |
| `colorPalette.dark` | String | No | `"#1C1C1C"` | Dark color (hex) |
| `colorPalette.accentText` | String | No | `"#FFFFFF"` | Accent text color (hex) |
| `colorPalette.border` | String | No | `"#E5E5E5"` | Border color (hex) |
| `colorPalette.sale` | String | No | `"#DC2626"` | Sale price color (hex) |

### toJSON transform

Adds `id`, removes `_id` and `__v`. Masks SMTP password as `"••••••••"` if set, `""` if empty.

### Key patterns

- **Singleton**: accessed via `findOne({})` and `findOneAndUpdate({}, { $set: updates }, { upsert: true })`.
- **Caching**: `settings:global` key with 5-minute TTL, invalidated on every `PUT /api/settings`.
- **Partial updates**: uses `$set` with dot notation (e.g., `"store.name": "New Name"`) so only changed fields are overwritten.
- **Encryption**: SMTP password is encrypted with AES-256-CBC before storage; decrypted on read for email sending.

---

## Contact

**File:** `src/models/contactModel.js`
**Collection:** `contacts`

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | String | Yes | -- | Trimmed |
| `email` | String | Yes | -- | Trimmed, lowercase |
| `subject` | String | Yes | -- | Trimmed |
| `message` | String | Yes | -- | Contact form message body |
| `status` | String | No | `"new"` | Enum: `new`, `read`, `replied` |
| `createdAt` | Date | Auto | -- | Mongoose timestamps |
| `updatedAt` | Date | Auto | -- | Mongoose timestamps |

### Indexes

| Field(s) | Type | Purpose |
|---|---|---|
| `{ status: 1, createdAt: -1 }` | Compound | Admin listing filtered by status, newest first |

### toJSON transform

Adds `id`, removes `_id` and `__v`.

---

## Coupon

**File:** `src/models/couponModel.js`
**Collection:** `coupons`

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `code` | String | Yes | -- | Unique, uppercase, trimmed |
| `type` | String | Yes | -- | Enum: `percentage`, `fixed` |
| `value` | Number | Yes | -- | Min: 0; max 100 for percentage type |
| `maxDiscount` | Number | No | `0` | Min: 0; cap for percentage discounts; 0 = no cap |
| `minOrderAmount` | Number | No | `0` | Min: 0; minimum order subtotal required |
| `maxUses` | Number | No | `0` | Min: 0; maximum uses allowed; 0 = unlimited |
| `usedCount` | Number | No | `0` | Min: 0; current usage count |
| `expiresAt` | Date | No | `null` | Expiration date; null = never expires |
| `isActive` | Boolean | No | `true` | Soft-disable without deletion |
| `createdAt` | Date | Auto | -- | Mongoose timestamps |
| `updatedAt` | Date | Auto | -- | Mongoose timestamps |

### Indexes

| Field(s) | Type | Purpose |
|---|---|---|
| `{ code: 1 }` | Standard | Fast lookup by coupon code |
| `{ isActive: 1, expiresAt: 1 }` | Compound | Active coupon queries with expiry check |

### Key patterns

- **Validation**: `validateCoupon` controller checks expiry, usage limit, minimum order amount, then calculates discount (percentage capped by maxDiscount, or fixed amount capped at subtotal).
- **Usage tracking**: `buyNow` controller increments `usedCount` via `$inc` when a coupon is applied.

### toJSON transform

Adds `id`, removes `_id` and `__v`.

---

## FAQ

**File:** `src/models/faqModel.js`
**Collection:** `faqs`

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `question` | String | Yes | -- | Trimmed |
| `answer` | String | Yes | -- | Supports rich text / HTML |
| `order` | Number | No | `0` | Sort order; lower = first |
| `isActive` | Boolean | No | `true` | Only active FAQs shown publicly |
| `createdAt` | Date | Auto | -- | Mongoose timestamps |
| `updatedAt` | Date | Auto | -- | Mongoose timestamps |

### Indexes

| Field(s) | Type | Purpose |
|---|---|---|
| `{ isActive: 1, order: 1 }` | Compound | Public FAQ listing sorted by order |

### Key patterns

- **Reorder**: Bulk `updateOne` operations set `order = index` for each ID in the submitted array.
- **Auto-order**: On create, if no order is provided, assigns `maxOrder + 1`.

### toJSON transform

Adds `id`, removes `_id` and `__v`.

---

## Subscriber

**File:** `src/models/subscriberModel.js`
**Collection:** `subscribers`

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `email` | String | Yes | -- | Unique, lowercase, trimmed; regex-validated format |
| `subscribedAt` | Date | No | `Date.now` | When the subscription was created/reactivated |
| `isActive` | Boolean | No | `true` | False = unsubscribed (soft delete) |
| `source` | String | No | `"homepage"` | Enum: `homepage`, `checkout`, `footer` |
| `createdAt` | Date | Auto | -- | Mongoose timestamps |
| `updatedAt` | Date | Auto | -- | Mongoose timestamps |

### Indexes

| Field(s) | Type | Purpose |
|---|---|---|
| `{ email: 1 }` | Unique | Prevent duplicate subscriptions |

### Key patterns

- **Reactivation**: If a previously unsubscribed email re-subscribes, `isActive` is set back to `true` and `subscribedAt` is refreshed.
- **Soft delete**: Unsubscribing sets `isActive: false` rather than deleting the document.
- **Race condition**: Duplicate key error (code 11000) is caught and returns 409.

### toJSON transform

Adds `id`, removes `_id` and `__v`.

---

## Redirect

**File:** `src/models/redirectModel.js`
**Collection:** `redirects`

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `from` | String | Yes | -- | Unique, trimmed; source URL path |
| `to` | String | Yes | -- | Trimmed; destination URL path |
| `type` | Number | No | `301` | Enum: `301` (permanent), `302` (temporary) |
| `isActive` | Boolean | No | `true` | Only active redirects are resolved |
| `source` | String | No | `"manual"` | Enum: `manual`, `slug-change`; how the redirect was created |
| `createdAt` | Date | Auto | -- | Mongoose timestamps |
| `updatedAt` | Date | Auto | -- | Mongoose timestamps |

### Indexes

| Field(s) | Type | Purpose |
|---|---|---|
| `{ from: 1, isActive: 1 }` | Compound | Fast lookup of active redirects by source path |

### Key patterns

- **Auto-creation**: When a product or category slug changes, a redirect from the old slug to the new slug is created with `source: "slug-change"`.
- **Uniqueness**: The `from` field has a unique constraint; duplicate source paths return 409.

### toJSON transform

Adds `id`, removes `_id` and `__v`.
