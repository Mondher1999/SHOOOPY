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
| `createdAt` | Date | Auto | -- | Mongoose timestamps |
| `updatedAt` | Date | Auto | -- | Mongoose timestamps |

### Instance Methods

| Method | Signature | Description |
|---|---|---|
| `comparePassword` | `async (candidatePassword) -> boolean` | `bcrypt.compare` against the stored hash |
| `changedPasswordAfter` | `(jwtIat) -> boolean` | Returns `true` if password changed after JWT was issued |

### Pre-save Hook

If `password` is modified: hash with `bcrypt.hash(password, 12)`. If not a new document, also set `passwordChangedAt = Date.now() - 1000` (ensures new token required after password change).

### toJSON Transform

Adds `id` from `_id`. Removes `_id`, `__v`, and all sensitive fields: `password`, `refreshToken`, `emailVerificationToken`, `emailVerificationExpiresAt`, `passwordResetTokenHash`, `passwordResetExpiresAt`, `passwordChangedAt`. This ensures NO sensitive data ever appears in API responses even if fields are present on the document (e.g. after `User.create()`).

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
