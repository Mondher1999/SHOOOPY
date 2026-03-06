# API Reference

Base URL:
- Development: `http://localhost:5000`
- Production: `/api` (nginx reverse proxy)

All protected endpoints require the header:
```
Authorization: Bearer <accessToken>
```

Access tokens are obtained from `POST /auth/login` and stored in `localStorage` as `accessToken`. Expired tokens can be refreshed via `POST /auth/refresh`.

---

## Documentation Format

Use this format for each endpoint:

```
### METHOD /path

**Auth:** `protect` | `protect + restrictTo("role")` | Public

**Params:** (if URL params exist)
**Query:** (if query params exist)
**Body:** (request body shape)

**What it does:** Brief description.

**Response:** `status_code`
{ response shape }

**Errors:** Notable error cases
```

---

## Auth (`/api/auth`)

Auth routes have a stricter rate limit: **10 requests per 15 minutes per IP**.

Tokens are returned in the response body (not cookies) and stored in `localStorage`:
- `accessToken` — short-lived (15 min), sent as `Authorization: Bearer` header
- `refreshToken` — longer-lived (7 days), used to obtain new access tokens

---

### POST /api/auth/register

**Auth:** Public

**Body:**
```json
{
  "name": "string (required)",
  "email": "string (required, unique)",
  "password": "string (required, min 8 characters)"
}
```

**What it does:** Creates a new customer account, sends a verification email, and returns tokens. Registration succeeds even if the verification email fails to send.

**Response:** `201`
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "role": "customer", "isVerified": false, "isActive": true, "createdAt": "...", "updatedAt": "..." },
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

**Errors:** `400` missing/invalid fields, `409` email already registered

---

### POST /api/auth/login

**Auth:** Public

**Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "role": "...", "isVerified": true, "isActive": true, "createdAt": "...", "updatedAt": "..." },
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

**Errors:** `400` missing fields, `401` invalid credentials or account deactivated

---

### POST /api/auth/logout

**Auth:** `protect`

**Body:** None (uses access token from Authorization header to identify user)

**What it does:** Clears the stored refresh token hash from the DB — all existing sessions for that user are invalidated.

**Response:** `200`
```json
{ "success": true, "data": null }
```

---

### GET /api/auth/me

**Auth:** `protect`

**Response:** `200`
```json
{
  "success": true,
  "data": { "id": "...", "name": "...", "email": "...", "role": "...", "isVerified": true, "isActive": true, "createdAt": "...", "updatedAt": "..." }
}
```

**Errors:** `401` not authenticated or token expired

---

### POST /api/auth/refresh-token

**Auth:** Public

**Body:**
```json
{ "refreshToken": "string (required)" }
```

**What it does:** Verifies the JWT refresh token, checks the stored hash in DB, rotates both tokens (old refresh token invalidated).

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

**Errors:** `400` missing token, `401` invalid/expired/reused token

---

### GET /api/auth/verify-email/:token

**Auth:** Public

**Params:** `token` — raw verification token from email URL (64-char hex)

**What it does:** SHA-256 hashes the token, finds user with matching hash and unexpired expiry, marks `isVerified: true`.

**Response:** `200`
```json
{ "success": true, "data": { "message": "Email verified successfully" } }
```

**Errors:** `400` invalid or expired token

---

### POST /api/auth/forgot-password

**Auth:** Public

**Body:**
```json
{ "email": "string (required)" }
```

**What it does:** Generates a reset token (32 random bytes), stores SHA-256 hash with 15-min expiry, emails the raw token URL. Always returns success even if email doesn't exist — prevents user enumeration.

**Response:** `200`
```json
{ "success": true, "data": { "message": "If that email exists, a reset link has been sent" } }
```

**Errors:** `400` missing/invalid email, `500` email sending failure (token rolled back)

---

### POST /api/auth/reset-password/:token

**Auth:** Public

**Params:** `token` — raw reset token from email URL (64-char hex)

**Body:**
```json
{ "password": "string (required, min 8 characters)" }
```

**What it does:** Hashes the token, finds user with matching hash and unexpired expiry, updates password (bcrypt 12 rounds), clears reset token, invalidates all existing refresh tokens.

**Response:** `200`
```json
{ "success": true, "data": { "message": "Password reset successfully. Please log in." } }
```

**Errors:** `400` missing/invalid fields or expired token
```

---

## Sample CRUD Resource (`/resources`)

<!-- This is an example pattern. Copy and adapt for each resource in your API. -->

---

### POST /resources

**Auth:** `protect + restrictTo("admin")`

**Body:**
```json
{
  "name": "string (required)",
  "description": "string",
  "status": "active | inactive"
}
```

**Response:** `201`
```json
{ "success": true, "data": { "id": "...", "name": "...", "description": "...", "status": "active" } }
```

---

### GET /resources

**Auth:** `protect`

**Query:**
| Param | Type | Description |
|---|---|---|
| `page` | number | Pagination page |
| `limit` | number | Results per page |
| `search` | string | Text search |

**Response:** `200`
```json
{ "success": true, "data": [ { "..." } ], "pagination": { "total": 50, "page": 1, "limit": 20, "pages": 3 } }
```

---

### GET /resources/:id

**Auth:** `protect`

**Params:** `id` -- Resource ObjectId

**Response:** `200`
```json
{ "success": true, "data": { "id": "...", "name": "...", "description": "...", "status": "active" } }
```

---

### PUT /resources/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` -- Resource ObjectId

**Body:** Same as POST, all fields optional

**Response:** `200`
```json
{ "success": true, "data": { "..." } }
```

---

### DELETE /resources/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` -- Resource ObjectId

**Response:** `200`
```json
{ "success": true, "message": "Resource deleted successfully" }
```

---

## Upload (`/upload`)

All upload routes require authentication.

---

### POST /upload/chunk

**Auth:** `protect + restrictTo("admin", "{CONTENT_CREATOR_ROLE}")`

**Body:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `chunk` | file | Binary chunk data (max 50 MB) |
| `chunkIndex` | string | Zero-based chunk index |
| `totalChunks` | string | Total number of chunks |
| `fileId` | string | Unique upload session ID (alphanumeric, hyphens, underscores only) |
| `fileName` | string | Sanitized filename |
| `originalFileName` | string | Original filename for reference |

**Response:** `200`
```json
{ "success": true, "message": "Chunk 1/5 uploaded", "chunkIndex": 0 }
```

---

### POST /upload/complete

**Auth:** `protect + restrictTo("admin", "{CONTENT_CREATOR_ROLE}")`

**Body:** `application/json`
```json
{
  "fileName": "string",
  "originalFileName": "string",
  "fileId": "string",
  "totalChunks": "number"
}
```

**Response:** `200`
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": "...",
    "name": "fileId-filename.ext",
    "originalName": "filename.ext",
    "url": "/uploads/courses/fileId-filename.ext",
    "size": 104857600,
    "uploadedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### DELETE /upload/cancel/:fileId

**Auth:** `protect + restrictTo("admin", "{CONTENT_CREATOR_ROLE}")`

**Params:** `fileId` -- Upload session ID (validated: alphanumeric + hyphens + underscores only)

**Response:** `200`
```json
{ "success": true, "message": "Upload cancelled" }
```

---

## Health (`/health`)

### GET /health

**Auth:** Public

**Response:** `200`
```json
{
  "success": true,
  "data": "OK"
}
```

---

## Users (`/api/users`)

**Implemented:** Sprint 3

Avatar images are served as static files at `GET /uploads/avatars/<filename>`.

---

### GET /api/users/profile

**Auth:** `protect`

**What it does:** Returns the authenticated user's profile.

**Response:** `200`
```json
{ "success": true, "data": { "id": "...", "name": "...", "email": "...", "role": "customer", "avatar": "/uploads/avatars/file.jpg", "isVerified": true, "isActive": true, "createdAt": "...", "updatedAt": "..." } }
```

**Errors:** `401` unauthenticated

---

### PUT /api/users/profile

**Auth:** `protect`

**Body:** `multipart/form-data`
```
name    (string, optional)
email   (string, optional)
avatar  (file, optional — JPEG/PNG/WebP/GIF, max 5 MB)
```

**What it does:** Updates name, email, and/or avatar. At least one field required.

**Response:** `200` — updated User object

**Errors:** `400` no fields provided, `409` email already taken, `400` invalid file type/size

---

### PUT /api/users/change-password

**Auth:** `protect`

**Body:**
```json
{ "currentPassword": "string (required)", "newPassword": "string (required, min 8 chars)" }
```

**What it does:** Verifies current password, sets new bcrypt-hashed password. Invalidates existing tokens via `passwordChangedAt`.

**Response:** `200`
```json
{ "success": true, "data": { "message": "Password changed successfully" } }
```

**Errors:** `400` missing fields, `400` wrong current password, `400` same as old password

---

### DELETE /api/users/account

**Auth:** `protect`

**What it does:** Soft-deletes the account (`isActive: false`), invalidates refresh token.

**Response:** `200`
```json
{ "success": true, "data": { "message": "Account deleted successfully" } }
```

---

### GET /api/users

**Auth:** `protect + restrictTo("admin")`

**Query:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Results per page (max 50) |
| `search` | string | — | Search name or email (case-insensitive) |

**What it does:** Returns paginated, searchable list of all users.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "users": [ { "id": "...", "name": "...", "email": "...", "role": "...", "isActive": true, "avatar": null, "createdAt": "..." } ],
    "pagination": { "page": 1, "limit": 10, "total": 42, "pages": 5 }
  }
}
```

**Errors:** `401` unauthenticated, `403` not admin

---

### GET /api/users/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` — MongoDB ObjectId

**What it does:** Returns a single user's full profile.

**Response:** `200` — User object

**Errors:** `400` invalid ObjectId, `401`, `403`, `404` not found

---

### PUT /api/users/:id/role

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` — MongoDB ObjectId

**Body:**
```json
{ "role": "customer" | "admin" }
```

**What it does:** Changes a user's role.

**Response:** `200` — updated User object

**Errors:** `400` invalid role value, `401`, `403`, `404`

---

### PUT /api/users/:id/ban

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` — MongoDB ObjectId

**What it does:** Toggles `isActive`. When banning, also clears `refreshToken` to force logout. Admin cannot ban themselves.

**Response:** `200` — updated User object (isActive reflects new state)

**Errors:** `400` self-ban attempt, `401`, `403`, `404`

---

## Document your endpoints here

<!-- Copy the CRUD pattern above for each resource in your API. Suggested sections: -->

<!-- ## Resource Name (`/route-prefix`) -->
<!-- ### POST /route-prefix -->
<!-- ### GET /route-prefix -->
<!-- ### GET /route-prefix/:id -->
<!-- ### PUT /route-prefix/:id -->
<!-- ### DELETE /route-prefix/:id -->

---

## Error responses

All errors follow this shape:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": ["optional array of detail strings"]
}
```

Common HTTP status codes:

| Code | Meaning |
|---|---|
| 400 | Bad request (missing fields, invalid ID format, validation failure) |
| 401 | Unauthenticated (no token, expired token, invalid token) |
| 403 | Forbidden (valid token but insufficient role) |
| 404 | Resource not found |
| 408 | Request timeout (upload took too long) |
| 409 | Conflict (email already in use, duplicate name) |
| 429 | Too many requests (rate limit exceeded) |
| 500 | Internal server error |

---

## Categories (`/api/categories`)

### GET /api/categories

**Auth:** Public

**What it does:** Returns all active categories as a flat list.

**Response:** `200`
```json
{ "success": true, "data": [{ "id": "...", "name": "Clothing", "slug": "clothing", "description": "...", "parent": null, "image": null, "isActive": true }] }
```

---

### GET /api/categories/tree

**Auth:** Public (cached 5 minutes)

**What it does:** Returns active categories as a nested tree structure. Root categories have a `children` array.

**Response:** `200`
```json
{ "success": true, "data": [{ "id": "...", "name": "Clothing", "children": [{ "id": "...", "name": "T-Shirts", "children": [] }] }] }
```

---

### GET /api/categories/:id

**Auth:** Public

**Params:** `id` — MongoDB ObjectId

**What it does:** Returns a single category by ID, with parent populated.

**Response:** `200`
```json
{ "success": true, "data": { "id": "...", "name": "T-Shirts", "parent": { "id": "...", "name": "Clothing", "slug": "clothing" } } }
```

**Errors:** 400 (invalid ID), 404 (not found)

---

### POST /api/categories

**Auth:** `protect + restrictTo("admin")`

**Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "parent": "ObjectId (optional)",
  "image": "string URL (optional)",
  "isActive": "boolean (optional, default true)"
}
```

**What it does:** Creates a new category. Slug is auto-generated from name.

**Response:** `201`
```json
{ "success": true, "data": { "id": "...", "name": "Clothing", "slug": "clothing" } }
```

**Errors:** 400 (missing name, invalid parent ID), 404 (parent not found), 409 (duplicate name)

---

### PUT /api/categories/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` — MongoDB ObjectId

**Body:** Same fields as POST (all optional)

**What it does:** Updates a category. Re-generates slug if name changes.

**Errors:** 400 (invalid ID, category is own parent), 404 (not found), 409 (duplicate name)

---

### DELETE /api/categories/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` — MongoDB ObjectId

**What it does:** Permanently deletes a category. Blocked if any active products or subcategories reference it.

**Errors:** 400 (invalid ID), 404 (not found), 409 (has products or subcategories)

---

## Products (`/api/products`)

### GET /api/products

**Auth:** Public

**Query:**
- `page` — page number (default: 1)
- `limit` — items per page (default: 20, max: 50)
- `category` — Category ObjectId or slug
- `minPrice` / `maxPrice` — price range filter
- `inStock` — `"true"` to show in-stock only
- `rating` — minimum average rating
- `sort` — `newest` | `price_asc` | `price_desc` | `rating` (default: newest)
- `search` — full-text search on name + description

**What it does:** Returns paginated product list with filters.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "products": [{ "id": "...", "name": "...", "price": 29.99, "category": { "name": "...", "slug": "..." }, "vendor": { "name": "...", "email": "..." } }],
    "pagination": { "page": 1, "limit": 20, "total": 100, "pages": 5 }
  }
}
```

---

### GET /api/products/search

**Auth:** Public

**Query:**
- `q` — search term (required; capped at 200 chars internally); uses MongoDB full-text index on `name + description`
- `limit` — max results to return (default: 5, max: 10)

**What it does:** Returns slim product results scored by text relevance. Intended for typeahead/suggestion use. Returns empty array when `q` is empty.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "products": [{ "id": "...", "name": "...", "slug": "...", "price": 29.99, "images": [], "ratings": { "average": 0, "count": 0 } }]
  }
}
```

---

### GET /api/products/slug/:slug

**Auth:** Public

**Params:** `slug` — URL-friendly string (lowercase alphanumeric + hyphens only)

**What it does:** Returns a single active product by its slug with populated category (including parent) and vendor.

**Response:** `200`
```json
{
  "success": true,
  "data": { "id": "...", "name": "...", "slug": "...", "price": 29.99, "category": { "name": "...", "slug": "...", "parent": "..." }, "vendor": { "name": "...", "email": "..." } }
}
```

**Errors:** 400 (invalid slug format — must be `[a-z0-9-]+`), 404 (not found or soft-deleted)

---

### GET /api/products/:id

**Auth:** Public

**Params:** `id` — MongoDB ObjectId

**What it does:** Returns a single active product with populated category and vendor.

**Errors:** 400 (invalid ID), 404 (not found or soft-deleted)

---

### POST /api/products

**Auth:** `protect` (any authenticated user acts as vendor)

**Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "price": "number (required, ≥ 0)",
  "compareAtPrice": "number (optional)",
  "category": "ObjectId (optional)",
  "images": ["string URL array (optional)"],
  "stock": "number (optional, default 0)",
  "sku": "string (optional, unique)",
  "attributes": { "key": "value" }
}
```

**What it does:** Creates a product. The authenticated user becomes the vendor.

**Response:** `201` with populated category and vendor

**Errors:** 400 (missing name/price, invalid price, invalid category ID), 404 (category not found), 409 (duplicate SKU)

---

### PUT /api/products/:id

**Auth:** `protect` (owner vendor or admin only)

**Params:** `id` — MongoDB ObjectId

**Body:** Same fields as POST (all optional) + `isActive: boolean`

**What it does:** Updates product. Non-owners get 403. Soft-deleted products return 404.

**Errors:** 400 (invalid ID/price), 403 (not owner or admin), 404 (not found), 409 (duplicate SKU)

---

### DELETE /api/products/:id

**Auth:** `protect` (owner vendor or admin only)

**Params:** `id` — MongoDB ObjectId

**What it does:** Soft-deletes the product (sets `isActive: false`). Non-owners get 403.

**Response:** `200`
```json
{ "success": true, "data": { "message": "Product deleted successfully" } }
```

**Errors:** 400 (invalid ID), 403 (not owner or admin), 404 (not found)


---

## Uploads (`/api/uploads`)

All upload routes require `protect + restrictTo("admin")`.

---

### POST /api/uploads/product-images

**Auth:** `protect + restrictTo("admin")`

**Body:** `multipart/form-data`
- `productId` — MongoDB ObjectId (required)
- `files` — image files, up to 10 (required)

**What it does:** Uploads up to 10 product images, processes each into 3 optimised sizes (thumbnail 150×150, medium 600×600, large 1200×1200) as webp, preserves the original. Appends new image objects to `product.images`.

**Response:** `201`
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "original": "/uploads/products/{productId}/img-original.jpg",
        "thumbnail": "/uploads/products/{productId}/img-thumbnail.webp",
        "medium": "/uploads/products/{productId}/img-medium.webp",
        "large": "/uploads/products/{productId}/img-large.webp"
      }
    ]
  }
}
```

**Errors:** 400 (missing productId, invalid productId, no files, wrong file type, file > 5MB, > 10 files), 403 (not owner or admin), 404 (product not found)

---

### DELETE /api/uploads/product-images/:fileId

**Auth:** `protect + restrictTo("admin")`

**Params:** `fileId` — format `{productId}:{originalFilename}` (URL-encoded)

**What it does:** Deletes all 4 image variants (original + thumbnail + medium + large) from disk and removes the image object from `product.images`.

**Response:** `200`
```json
{ "success": true, "data": { "message": "Image deleted successfully" } }
```

**Errors:** 400 (invalid fileId format), 403 (not owner or admin), 404 (product not found, image not found in product)

---

### PATCH /api/uploads/product-images/:productId/reorder

**Auth:** `protect + restrictTo("admin")`

**Params:** `productId` — MongoDB ObjectId

**Body:**
```json
{
  "images": [
    {
      "original": "string",
      "thumbnail": "string",
      "medium": "string",
      "large": "string"
    }
  ]
}
```

**What it does:** Replaces the product's `images` array with the provided ordered array. Used to persist drag-and-drop reordering from the admin UI.

**Response:** `200`
```json
{ "success": true, "data": { "message": "Images reordered successfully" } }
```

**Errors:** 400 (invalid productId, missing images), 403 (not owner or admin), 404 (product not found)


---

## Cart

### GET /api/cart

**Auth:** `protect`

**What it does:** Returns the current user's cart with populated product details. Returns `{ items: [], totalPrice: 0 }` if no cart exists yet.

**Response:**
```json
{ "success": true, "data": { "id": "...", "items": [{ "product": { "id": "...", "name": "...", "slug": "...", "images": [], "stock": 10, "price": 29.99, "isActive": true }, "quantity": 2, "price": 29.99 }], "totalPrice": 59.98 } }
```

---

### POST /api/cart/items

**Auth:** `protect`

**Body:** `{ "productId": "string (ObjectId)", "quantity": "number (integer ≥ 1, default 1)" }`

**What it does:** Adds a product to the cart. If already present, increments quantity. Validates stock availability.

**Errors:** 400 (missing/invalid productId, invalid quantity, exceeds stock), 404 (product not found or inactive)

---

### PUT /api/cart/items/:productId

**Auth:** `protect`

**Params:** `productId` — product ObjectId

**Body:** `{ "quantity": "number (integer ≥ 1)" }`

**What it does:** Sets the exact quantity for a cart item. Validates stock.

**Errors:** 400 (missing/invalid quantity, exceeds stock), 404 (cart not found, item not in cart, product not found)

---

### DELETE /api/cart/items/:productId

**Auth:** `protect`

**Params:** `productId` — product ObjectId

**What it does:** Removes a specific item from the cart.

**Errors:** 400 (invalid productId), 404 (cart not found, item not in cart)

---

### DELETE /api/cart

**Auth:** `protect`

**What it does:** Clears all items from the cart.

**Response:** `{ "success": true, "data": { "message": "Cart cleared" } }`

---

### POST /api/cart/merge

**Auth:** `protect`

**Body:** `{ "items": [{ "productId": "string", "quantity": "number" }] }`

**What it does:** Merges a guest localStorage cart with the server cart on login. Server cart wins on quantity conflicts (higher quantity, capped at stock).

**Errors:** 400 (items not array, invalid productId, invalid quantity)

---

## Addresses (`/api/addresses`)

**Implemented:** Sprint 8

All address routes require authentication. Max 5 addresses per user.

---

### GET /api/addresses

**Auth:** `protect`

**What it does:** Returns all saved delivery addresses for the authenticated user, sorted with default first.

**Response:** `200`
```json
{ "success": true, "data": [{ "id": "...", "user": "...", "fullName": "Jane Doe", "phone": "1234567890", "street": "123 Main St", "city": "New York", "state": "NY", "postalCode": "10001", "country": "US", "isDefault": true, "label": "home", "createdAt": "...", "updatedAt": "..." }] }
```

---

### POST /api/addresses

**Auth:** `protect`

**Body:**
```json
{
  "fullName":   "string (required)",
  "phone":      "string (required)",
  "street":     "string (required)",
  "city":       "string (required)",
  "state":      "string (required)",
  "postalCode": "string (required)",
  "country":    "string (required)",
  "label":      "\"home\" | \"work\" | \"other\" (optional, default: \"home\")"
}
```

**What it does:** Creates a new address. The first address is automatically set as default. Subsequent addresses are not default unless `isDefault: true` is sent. Max 5 per user.

**Response:** `201` — Address object

**Errors:** `400` missing required field, `400` max 5 addresses reached

---

### PUT /api/addresses/:id

**Auth:** `protect`

**Params:** `id` — Address ObjectId

**Body:** Any subset of: `fullName`, `phone`, `street`, `city`, `state`, `postalCode`, `country`, `label`

**What it does:** Updates the specified address. User can only update their own addresses.

**Response:** `200` — updated Address object

**Errors:** `400` invalid ObjectId, `404` address not found (or belongs to another user)

---

### DELETE /api/addresses/:id

**Auth:** `protect`

**Params:** `id` — Address ObjectId

**What it does:** Deletes the address. If the deleted address was the default, the next most recent address is promoted to default.

**Response:** `200`
```json
{ "success": true, "data": { "message": "Address deleted" } }
```

**Errors:** `400` invalid ObjectId, `404` not found

---

### PUT /api/addresses/:id/default

**Auth:** `protect`

**Params:** `id` — Address ObjectId

**What it does:** Sets the specified address as the default, clearing the default flag from all other addresses.

**Response:** `200` — updated Address object (with `isDefault: true`)

**Errors:** `400` invalid ObjectId, `404` not found

---

## Orders (`/api/orders`)

**Implemented:** Sprint 8

All order routes require authentication. Payment method is Cash on Delivery (COD) only.

---

### POST /api/orders

**Auth:** `protect`

**Body:**
```json
{
  "addressId": "string (required — ObjectId of a saved address)",
  "notes":     "string (optional)"
}
```

**What it does:** Places an order from the authenticated user's current cart.

Flow:
1. Validates cart is not empty
2. Validates address belongs to user
3. Checks stock for all cart items — fails with list of out-of-stock items if any
4. Creates order with embedded address + item snapshots
5. Decrements stock for each item
6. Clears the user's cart

Order number format: `ORD-YYYYMMDD-XXXX` (e.g., `ORD-20260306-0001`).

**Response:** `201`
```json
{
  "success": true,
  "data": {
    "id": "...",
    "orderNumber": "ORD-20260306-0001",
    "status": "pending",
    "paymentMethod": "COD",
    "items": [{ "product": "...", "name": "Product Name", "quantity": 2, "price": 29.99, "image": "/uploads/..." }],
    "shippingAddress": { "fullName": "...", "phone": "...", "street": "...", "city": "...", "state": "...", "postalCode": "...", "country": "..." },
    "totalPrice": 59.98,
    "shippingCost": 0,
    "notes": "",
    "statusHistory": [{ "status": "pending", "date": "...", "note": "Order placed" }],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errors:**
- `400` missing `addressId`
- `400` invalid ObjectId format
- `400` cart is empty
- `400` one or more items out of stock (includes `data.outOfStock` array with `{ name, available, requested }`)
- `404` address not found (or belongs to another user)

---

### GET /api/orders/my-orders

**Auth:** `protect`

**Query:** `page` (default: 1), `limit` (default: 10, max: 50)

**What it does:** Returns the authenticated user's order history, sorted newest first with pagination.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": { "page": 1, "limit": 10, "total": 42, "pages": 5 }
  }
}
```

---

### GET /api/orders/:id

**Auth:** `protect`

**Params:** `id` — Order ObjectId

**What it does:** Returns a single order by ID. Users can only access their own orders.

**Response:** `200` — full Order object

**Errors:** `400` invalid ObjectId, `404` not found (or belongs to another user)

---

### PUT /api/orders/:id/cancel

**Auth:** `protect`

**Params:** `id` — Order ObjectId

**What it does:** Cancels an order. Only orders with status `pending` or `confirmed` can be cancelled. Cancellation restores stock for all items in the order. Adds a `cancelled` entry to `statusHistory`.

**Response:** `200` — updated Order object with `status: "cancelled"`

**Errors:**
- `400` invalid ObjectId
- `400` order cannot be cancelled at current status (e.g., already `shipped`)
- `404` not found (or belongs to another user)

---

### GET /api/orders/admin

**Auth:** `protect + restrictTo("admin")`

**Implemented:** Sprint 9

**Query:** `page` (default: 1), `limit` (default: 20, max: 50), `status` (one of: pending, confirmed, processing, shipped, delivered, cancelled), `search` (order number partial match), `startDate` (ISO date), `endDate` (ISO date)

**What it does:** Returns all orders with optional filtering by status, order number search, and date range. Results include populated user name and email. Sorted newest first.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "...",
        "orderNumber": "ORD-20260306-0001",
        "user": { "_id": "...", "name": "John Doe", "email": "john@example.com" },
        "status": "pending",
        "totalPrice": 59.98,
        "items": [...],
        "createdAt": "..."
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 100, "pages": 5 }
  }
}
```

---

### GET /api/orders/admin/:id

**Auth:** `protect + restrictTo("admin")`

**Implemented:** Sprint 9

**Params:** `id` — Order ObjectId

**What it does:** Returns a single order with populated user info (name, email). No ownership check — admin can view any order.

**Response:** `200` — full Order object with populated `user: { _id, name, email }`

**Errors:** `400` invalid ObjectId, `404` not found

---

### PUT /api/orders/admin/:id/status

**Auth:** `protect + restrictTo("admin")`

**Implemented:** Sprint 9

**Params:** `id` — Order ObjectId

**Body:**
```json
{
  "status": "string (required — target status)",
  "note":   "string (required — reason for status change, max 500 chars)"
}
```

**What it does:** Updates order status with validation of allowed transitions. Appends entry to `statusHistory` array. If transitioning to `cancelled`, stock is restored for all items.

Valid transitions:
- `pending` → `confirmed` | `cancelled`
- `confirmed` → `processing` | `cancelled`
- `processing` → `shipped`
- `shipped` → `delivered`
- `delivered` → (none — terminal)
- `cancelled` → (none — terminal)

**Response:** `200` — updated Order with populated user

**Errors:**
- `400` missing `status` or `note`
- `400` note exceeds 500 characters
- `400` invalid status transition (includes allowed transitions in error message)
- `404` not found

---

### GET /api/orders/stats

**Auth:** `protect + restrictTo("admin")`

**Implemented:** Sprint 9

**Query:** `days` (default: 30, max: 365) — period for daily revenue breakdown

**What it does:** Returns aggregated order statistics. Total orders and revenue exclude cancelled orders. Daily revenue is broken down by day for the requested period.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 12500.00,
    "ordersByStatus": {
      "pending": 10,
      "confirmed": 5,
      "processing": 8,
      "shipped": 12,
      "delivered": 100,
      "cancelled": 15
    },
    "dailyRevenue": [
      { "date": "2026-03-01", "revenue": 450.00, "orders": 5 },
      { "date": "2026-03-02", "revenue": 320.00, "orders": 3 }
    ]
  }
}
```
