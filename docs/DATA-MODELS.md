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
