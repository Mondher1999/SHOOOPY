# API Reference

Base URL:
- Development: `http://localhost:5001`
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
    "user": { "id": "...", "name": "...", "email": "...", "role": "...", "isVerified": true, "isActive": true, "language": "en", "createdAt": "...", "updatedAt": "..." },
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

**Errors:** `400` missing fields, `401` invalid credentials or account deactivated, `429` account locked (5 failed attempts → 15-minute lockout)

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

## Settings (`/api/settings`)

Settings is a singleton document controlling store configuration, homepage layout, SMTP, SEO, legal pages, and more. Public endpoints are needed for footer, legal pages, and maintenance mode detection.

---

### GET /api/settings

**Auth:** Public (cached 5 minutes)

**What it does:** Returns the full settings document. Creates a default one if none exists. SMTP password is masked as `"••••••••"`.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "id": "...",
    "store": { "name": "ShopFlow", "description": "...", "contactEmail": "...", "currency": "USD", "logo": "...", "favicon": "...", "showcaseMode": false, "logoEnabled": true },
    "orders": { "defaultShippingCost": 0, "minimumOrderAmount": 0, "freeShippingThreshold": 0, "autoCancelPendingDays": 0 },
    "notifications": { "orderConfirmation": true, "orderStatusUpdate": true, "welcomeEmail": true, "adminNewOrder": false, "adminLowStock": false, "adminNotificationEmail": "" },
    "products": { "lowStockThreshold": 10, "maxImagesPerProduct": 10, "reviewsEnabled": true, "defaultSortOrder": "newest", "productTypes": [] },
    "social": { "facebook": "", "instagram": "", "twitter": "", "tiktok": "", "youtube": "", "whatsapp": "" },
    "legal": { "termsAndConditions": "", "privacyPolicy": "", "returnPolicy": "", "shippingPolicy": "" },
    "seo": { "metaTitleTemplate": "%s | ShopFlow", "metaDescription": "", "googleAnalyticsId": "", "facebookPixelId": "" },
    "maintenance": { "enabled": false, "message": "..." },
    "homepage": { "template": "classic", "mode": "dynamic", "sections": {}, "sectionOrder": [], "slides": [], "announcement": {}, "..." : "..." },
    "header": { "enabled": true, "variant": "classic", "mode": "dynamic" },
    "footer": { "enabled": true, "variant": "luxury", "mode": "dynamic" },
    "emailTemplates": { "orderConfirmationSubject": "...", "..." : "..." },
    "smtp": { "host": "", "port": 587, "secure": false, "user": "", "pass": "••••••••", "fromName": "ShopFlow", "fromEmail": "" },
    "typography": { "headingFont": "", "bodyFont": "", "baseFontSize": 16, "headingLetterSpacing": 0.18, "headingTextTransform": "uppercase" },
    "colorPalette": { "preset": "classic", "bg": "#FFFFFF", "bgAlt": "#F7F5F3", "text": "#1C1C1C", "textMuted": "#71717A", "dark": "#1C1C1C", "accentText": "#FFFFFF", "border": "#E5E5E5", "sale": "#DC2626" }
  }
}
```

---

### PUT /api/settings

**Auth:** `protect + restrictTo("admin")`

**Body:** Partial update -- send only the sections/fields to change. Supports: `store`, `orders`, `notifications`, `products`, `social`, `legal`, `seo`, `maintenance`, `homepage`, `navigation`, `header`, `footer`, `emailTemplates`, `smtp`, `typography`, `colorPalette`.

**What it does:** Merges updates into the singleton settings document using `$set` dot notation. Validates all field values (numeric ranges, enum values, hex colors, etc.). Encrypts SMTP password before storage. Invalidates settings cache on success.

**Response:** `200` -- updated Settings object

**Errors:**
- `400` invalid field value (numeric out of range, invalid enum, invalid hex color, empty required field)
- `400` no fields to update

---

### POST /api/settings/upload

**Auth:** `protect + restrictTo("admin")`

**Body:** `multipart/form-data`
- `file` -- image file (max 5 MB, image/* or image/x-icon)
- `field` -- one of: `logo`, `favicon`, `hero-N`, `promo-banner`, `brand-story`, `popup-image`, `testimonial-N`, `partner-N`

**What it does:** Uploads a settings image (logo, favicon, or homepage image). For `logo` and `favicon`, auto-updates the settings document. For other fields, returns the URL for the frontend to include in a subsequent settings update.

**Response:** `200`
```json
{ "success": true, "data": { "url": "/uploads/settings/hero-0.jpg" } }
```
Or for logo/favicon:
```json
{ "success": true, "data": { "id": "...", "store": { "logo": "/uploads/settings/logo.png", "..." : "..." }, "..." : "..." } }
```

**Errors:** `400` no file uploaded, `400` missing `field`, `400` invalid field name

---

### POST /api/settings/test-email

**Auth:** `protect + restrictTo("admin")`

**Body (optional):**
```json
{
  "smtp": {
    "host": "string",
    "port": "number",
    "secure": "boolean",
    "user": "string",
    "pass": "string",
    "fromName": "string",
    "fromEmail": "string"
  }
}
```

**What it does:** Sends a test email using SMTP configuration. If `smtp` is provided in the body, uses those settings (allows testing before saving). If not, reads from the database or falls back to environment variables. Sends to the admin notification email or the requesting user's email.

**Response:** `200`
```json
{ "success": true, "data": { "messageId": "...", "sentTo": "admin@example.com" } }
```

**Errors:** `400` SMTP not configured, `400` SMTP password required/cannot be decrypted, `400` email send failure

---

### GET /api/settings/top-reviews

**Auth:** Public (cached 5 minutes)

**What it does:** Returns up to 3 reviews with rating >= 4, formatted for homepage testimonials section.

**Response:** `200`
```json
{
  "success": true,
  "data": [
    { "name": "John Doe", "quote": "Amazing product!", "location": "", "rating": 5, "avatar": "/uploads/avatars/..." }
  ]
}
```

---

### GET /api/settings/product-types-catalog

**Auth:** Public (cached 10 minutes)

**What it does:** Returns the full product type catalog (all 20 types with their attribute definitions).

**Response:** `200`
```json
{ "success": true, "data": { "clothing": { "label": "Clothing", "attributes": [...] }, "shoes": { "..." : "..." }, "..." : "..." } }
```

---

### GET /api/settings/product-types

**Auth:** Public (cached 5 minutes)

**What it does:** Returns only the admin-enabled product types (subset of catalog based on `settings.products.productTypes`).

**Response:** `200`
```json
{ "success": true, "data": { "clothing": { "label": "Clothing", "attributes": [...] } } }
```

---

## Contacts (`/api/contacts`)

Contact form submissions. Public submission is rate-limited to 5 per 15 minutes per IP.

---

### POST /api/contacts

**Auth:** Public (rate-limited: 5/15min per IP)

**Body:**
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "subject": "string (required)",
  "message": "string (required, max 5000 chars)"
}
```

**What it does:** Creates a contact form submission. Sends a notification email to the admin notification email (non-blocking).

**Response:** `201`
```json
{ "success": true, "data": { "id": "...", "name": "...", "email": "...", "subject": "...", "message": "...", "status": "new", "createdAt": "...", "updatedAt": "..." } }
```

**Errors:** `400` missing required fields, `400` invalid email, `400` message too long, `429` rate limit exceeded

---

### GET /api/contacts

**Auth:** `protect + restrictTo("admin")`

**Query:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Results per page (max 50) |
| `status` | string | -- | Filter by status: `new`, `read`, `replied` |

**What it does:** Returns paginated contact submissions, sorted newest first.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "contacts": [{ "id": "...", "name": "...", "email": "...", "subject": "...", "message": "...", "status": "new", "createdAt": "..." }],
    "pagination": { "page": 1, "limit": 20, "total": 42, "pages": 3 }
  }
}
```

---

### GET /api/contacts/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` -- MongoDB ObjectId

**What it does:** Returns a single contact submission.

**Response:** `200` -- Contact object

**Errors:** `400` invalid ObjectId, `404` not found

---

### PATCH /api/contacts/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` -- MongoDB ObjectId

**Body:**
```json
{ "status": "new | read | replied" }
```

**What it does:** Updates the status of a contact submission.

**Response:** `200` -- updated Contact object

**Errors:** `400` invalid ObjectId, `400` invalid status, `404` not found

---

### DELETE /api/contacts/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` -- MongoDB ObjectId

**What it does:** Permanently deletes a contact submission.

**Response:** `200`
```json
{ "success": true, "data": null }
```

**Errors:** `400` invalid ObjectId, `404` not found

---

## Coupons (`/api/coupons`)

Discount coupon management. Admin CRUD plus authenticated validation endpoint.

---

### POST /api/coupons/validate

**Auth:** `protect`

**Body:**
```json
{
  "code": "string (required)",
  "subtotal": "number (optional -- order subtotal for discount calculation)"
}
```

**What it does:** Validates a coupon code and calculates the discount amount for a given subtotal. Checks expiration, usage limits, and minimum order requirements.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "couponId": "...",
    "code": "SAVE20",
    "type": "percentage",
    "value": 20,
    "discount": 15.00
  }
}
```

**Errors:** `400` missing code, `400` coupon expired, `400` usage limit reached, `400` below minimum order amount, `404` invalid or inactive coupon code

---

### GET /api/coupons

**Auth:** `protect + restrictTo("admin")`

**Query:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Results per page (max 50) |
| `search` | string | -- | Search by coupon code (case-insensitive) |
| `active` | string | -- | `"true"` or `"false"` to filter by active status |

**What it does:** Returns paginated list of coupons, sorted newest first.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "coupons": [{ "id": "...", "code": "SAVE20", "type": "percentage", "value": 20, "maxDiscount": 50, "minOrderAmount": 30, "maxUses": 100, "usedCount": 12, "expiresAt": "...", "isActive": true, "createdAt": "..." }],
    "pagination": { "page": 1, "limit": 20, "total": 10, "pages": 1 }
  }
}
```

---

### POST /api/coupons

**Auth:** `protect + restrictTo("admin")`

**Body:**
```json
{
  "code": "string (required, auto-uppercased)",
  "type": "percentage | fixed (required)",
  "value": "number (required, >= 0; max 100 for percentage)",
  "maxDiscount": "number (optional, default 0 = no cap; for percentage type)",
  "minOrderAmount": "number (optional, default 0)",
  "maxUses": "number (optional, default 0 = unlimited)",
  "expiresAt": "ISO date string (optional)"
}
```

**What it does:** Creates a new coupon. Code is stored uppercased and trimmed.

**Response:** `201` -- Coupon object

**Errors:** `400` missing required fields, `400` invalid type, `400` invalid value, `400` percentage > 100, `409` duplicate code

---

### PUT /api/coupons/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` -- MongoDB ObjectId

**Body:** Any subset of: `code`, `type`, `value`, `maxDiscount`, `minOrderAmount`, `maxUses`, `expiresAt`, `isActive`

**What it does:** Updates a coupon.

**Response:** `200` -- updated Coupon object

**Errors:** `400` invalid ObjectId, `400` invalid type, `404` not found

---

### DELETE /api/coupons/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` -- MongoDB ObjectId

**What it does:** Permanently deletes a coupon.

**Response:** `200`
```json
{ "success": true, "data": null }
```

**Errors:** `400` invalid ObjectId, `404` not found

---

## FAQ (`/api/faq`)

Frequently Asked Questions management with admin ordering support.

---

### GET /api/faq

**Auth:** Public

**What it does:** Returns all active FAQs sorted by `order` field (ascending).

**Response:** `200`
```json
{
  "success": true,
  "data": [
    { "id": "...", "question": "How do I track my order?", "answer": "...", "order": 0, "isActive": true, "createdAt": "...", "updatedAt": "..." }
  ]
}
```

---

### GET /api/faq/admin

**Auth:** `protect + restrictTo("admin")`

**What it does:** Returns all FAQs (including inactive) sorted by `order` field.

**Response:** `200` -- array of all FAQ objects

---

### POST /api/faq

**Auth:** `protect + restrictTo("admin")`

**Body:**
```json
{
  "question": "string (required)",
  "answer": "string (required)",
  "order": "number (optional, auto-assigned if omitted)"
}
```

**What it does:** Creates a new FAQ. If `order` is not provided, assigns the next sequential order value.

**Response:** `201` -- FAQ object

**Errors:** `400` missing `question` or `answer`

---

### PUT /api/faq/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` -- MongoDB ObjectId

**Body:** Any subset of: `question`, `answer`, `order`, `isActive`

**What it does:** Updates a FAQ entry.

**Response:** `200` -- updated FAQ object

**Errors:** `400` invalid ObjectId, `404` not found

---

### PUT /api/faq/reorder

**Auth:** `protect + restrictTo("admin")`

**Body:**
```json
{ "orderedIds": ["id1", "id2", "id3"] }
```

**What it does:** Bulk-updates the `order` field for all listed FAQ entries based on array position (index 0 = order 0, etc.).

**Response:** `200` -- array of all FAQs with updated order

**Errors:** `400` `orderedIds` not a non-empty array, `400` invalid FAQ ID in array

---

### DELETE /api/faq/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` -- MongoDB ObjectId

**What it does:** Permanently deletes a FAQ entry.

**Response:** `200`
```json
{ "success": true, "data": null }
```

**Errors:** `400` invalid ObjectId, `404` not found

---

## Shipping (`/api/shipping`)

Delivery company integration for creating, tracking, and cancelling shipments. All admin endpoints require shipping integration to be enabled and configured in settings.

---

### POST /api/shipping/test-connection

**Auth:** `protect + restrictTo("admin")`

**What it does:** Tests API credentials with the configured delivery company.

**Response:** `200`
```json
{ "success": true, "data": { "provider": "...", "status": "connected" } }
```

**Errors:** `400` shipping not configured, `400` provider could not be initialized, `400` connection test failed

---

### POST /api/shipping/:orderId/send

**Auth:** `protect + restrictTo("admin")`

**Params:** `orderId` -- Order ObjectId

**Body (optional):**
```json
{ "weight": "number (optional, defaults to provider default weight)" }
```

**What it does:** Creates a shipment with the delivery company for the specified order. Stores tracking info (tracking number, URL, estimated delivery) on the order's `shipping` field.

**Response:** `200` -- updated Order object with `shipping` field populated

**Errors:** `400` invalid order ID, `400` shipping not configured, `404` order not found, `409` order already has a shipment

---

### GET /api/shipping/:orderId/track

**Auth:** `protect + restrictTo("admin")`

**Params:** `orderId` -- Order ObjectId

**What it does:** Fetches the latest tracking status from the delivery company API and updates the order's shipping info.

**Response:** `200` -- updated Order object with latest tracking status

**Errors:** `400` invalid order ID, `400` order has no shipment to track, `400` shipping not configured, `404` order not found

---

### POST /api/shipping/:orderId/cancel

**Auth:** `protect + restrictTo("admin")`

**Params:** `orderId` -- Order ObjectId

**What it does:** Cancels a shipment with the delivery company. Updates the carrier status to `"cancelled"`.

**Response:** `200` -- updated Order object

**Errors:** `400` invalid order ID, `400` order has no shipment to cancel, `400` shipping not configured, `404` order not found

---

### POST /api/shipping/webhook

**Auth:** Public (verified by `X-Webhook-Secret` header; rate-limited: 60/min)

**Headers:** `X-Webhook-Secret: <webhook_secret>`

**Body:**
```json
{
  "trackingNumber": "string (required)",
  "status": "string (optional)",
  "statusLabel": "string (optional)",
  "estimatedDelivery": "ISO date (optional)",
  "actualDelivery": "ISO date (optional)"
}
```

**What it does:** Receives status updates from the delivery company. Verifies the webhook secret using timing-safe comparison. Updates the order's shipping fields. Auto-updates order status to `"delivered"` if carrier reports delivery and order is in `"shipped"` status.

**Response:** `200`
```json
{ "success": true, "data": { "matched": true } }
```
Returns `{ "matched": false }` if no order matches the tracking number (not an error).

**Errors:** `400` missing trackingNumber, `401` invalid or missing webhook secret

---

## Subscribers (`/api/subscribers`)

Newsletter subscriber management. Public subscription is rate-limited to 5 per 15 minutes per IP.

---

### POST /api/subscribers

**Auth:** Public (rate-limited: 5/15min per IP)

**Body:**
```json
{
  "email": "string (required, valid email)",
  "source": "homepage | checkout | footer (optional, default: homepage)"
}
```

**What it does:** Subscribes an email to the newsletter. If a previously unsubscribed email is re-submitted, it is reactivated.

**Response:** `201` (new) or `200` (reactivated)
```json
{ "success": true, "data": { "email": "user@example.com", "subscribedAt": "..." } }
```

**Errors:** `400` missing email, `400` invalid email, `400` invalid source, `409` already subscribed, `429` rate limit exceeded

---

### GET /api/subscribers

**Auth:** `protect + restrictTo("admin")`

**Query:** `page` (default 1), `limit` (default 20, max 50)

**What it does:** Returns paginated list of active subscribers, sorted newest first. Cached for 60 seconds.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "subscribers": [{ "id": "...", "email": "...", "subscribedAt": "...", "source": "homepage", "isActive": true }],
    "total": 100,
    "page": 1,
    "pages": 5
  }
}
```

---

### GET /api/subscribers/export

**Auth:** `protect + restrictTo("admin")`

**What it does:** Exports all active subscribers as a CSV file. CSV cells are escaped to prevent injection.

**Response:** `200` -- `text/csv` file download (`subscribers.csv`)

---

### DELETE /api/subscribers/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` -- Subscriber ObjectId

**What it does:** Soft-deletes a subscriber (sets `isActive: false`).

**Response:** `200`
```json
{ "success": true, "data": null }
```

**Errors:** `400` invalid ObjectId, `400` subscriber already inactive, `404` not found

---

## Redirects (`/api/redirects`)

URL redirect management for SEO and slug changes.

---

### GET /api/redirects/resolve

**Auth:** Public

**Query:** `from` -- source path (required)

**What it does:** Looks up an active redirect by source path and returns the destination.

**Response:** `200`
```json
{ "success": true, "data": { "id": "...", "from": "/old-path", "to": "/new-path", "type": 301, "isActive": true, "source": "manual", "createdAt": "..." } }
```

**Errors:** `400` missing `from` query parameter, `404` no redirect found

---

### GET /api/redirects

**Auth:** `protect + restrictTo("admin")`

**Query:** `page` (default 1), `limit` (default 20, max 100)

**What it does:** Returns paginated list of all redirects, sorted newest first.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "redirects": [{ "id": "...", "from": "/old", "to": "/new", "type": 301, "isActive": true, "source": "manual", "createdAt": "..." }],
    "pagination": { "page": 1, "limit": 20, "total": 5, "pages": 1 }
  }
}
```

---

### POST /api/redirects

**Auth:** `protect + restrictTo("admin")`

**Body:**
```json
{
  "from": "string (required, source path)",
  "to": "string (required, destination path)",
  "type": "301 | 302 (optional, default 301)"
}
```

**What it does:** Creates a new redirect. Source is set to `"manual"`.

**Response:** `201` -- Redirect object

**Errors:** `400` missing `from` or `to`, `400` source and destination are the same, `409` redirect from this path already exists

---

### PUT /api/redirects/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` -- Redirect ObjectId

**Body:** Any subset of: `from`, `to`, `type`, `isActive`

**What it does:** Updates a redirect.

**Response:** `200` -- updated Redirect object

**Errors:** `400` invalid ObjectId, `400` no fields to update, `404` not found, `409` duplicate `from` path

---

### DELETE /api/redirects/:id

**Auth:** `protect + restrictTo("admin")`

**Params:** `id` -- Redirect ObjectId

**What it does:** Permanently deletes a redirect.

**Response:** `200`
```json
{ "success": true, "data": { "message": "Redirect deleted successfully" } }
```

**Errors:** `400` invalid ObjectId, `404` not found

---

## Export / Import (`/api/export`)

CSV export and import for products and orders. All routes are admin-only.

---

### GET /api/export/products

**Auth:** `protect + restrictTo("admin")`

**What it does:** Exports all products as a CSV file. Columns: ID, Name, SKU, Price, CompareAtPrice, Stock, Category, IsActive, CreatedAt.

**Response:** `200` -- `text/csv` file download (`products-{timestamp}.csv`)

---

### GET /api/export/orders

**Auth:** `protect + restrictTo("admin")`

**Query:**
| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by order status |
| `startDate` | ISO date | Filter orders created on or after this date |
| `endDate` | ISO date | Filter orders created on or before this date |

**What it does:** Exports orders as a CSV file. Columns: OrderNumber, Customer, Email, Status, ItemsCount, Subtotal, Shipping, Discount, Total, PaymentMethod, Date.

**Response:** `200` -- `text/csv` file download (`orders-{timestamp}.csv`)

---

### POST /api/export/products

**Auth:** `protect + restrictTo("admin")`

**Body:** `multipart/form-data`
- `file` -- CSV file (max 10 MB, must be `.csv`)

**What it does:** Imports products from a CSV file. Required CSV columns: `Name`, `Price`. Optional columns: `Stock`, `SKU`. The authenticated admin user becomes the vendor for all imported products. Processes rows individually and reports both successes and per-row errors.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "imported": 15,
    "errors": [
      { "line": 3, "error": "Invalid price (must be >= 0)" }
    ],
    "products": [
      { "id": "...", "name": "Product Name" }
    ]
  }
}
```

**Errors:** `400` no file uploaded, `400` CSV empty or missing data rows, `400` missing required columns

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
  "productType": "string (optional, must be a valid catalog key e.g. 'clothing', 'shoes')",
  "attributes": { "key": "value" }
}
```

**What it does:** Creates a product. The authenticated user becomes the vendor. If `productType` is provided, it is validated against the product type catalog.

**Response:** `201` with populated category and vendor

**Errors:** 400 (missing name/price, invalid price, invalid category ID, invalid product type), 404 (category not found), 409 (duplicate SKU)

---

### PUT /api/products/:id

**Auth:** `protect` (owner vendor or admin only)

**Params:** `id` — MongoDB ObjectId

**Body:** Same fields as POST (all optional) + `isActive: boolean` + `productType: string | null`

**What it does:** Updates product. Non-owners get 403. Soft-deleted products return 404. If `productType` is provided, it is validated against the product type catalog.

**Errors:** 400 (invalid ID/price, invalid product type), 403 (not owner or admin), 404 (not found), 409 (duplicate SKU)

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
{ "success": true, "data": { "id": "...", "items": [{ "product": { "id": "...", "name": "...", "slug": "...", "images": [], "stock": 10, "price": 29.99, "isActive": true }, "quantity": 2, "price": 29.99, "selectedOptions": { "Color": "Blue", "Size": "M" } }], "totalPrice": 59.98 } }
```

---

### POST /api/cart/items

**Auth:** `protect`

**Body:**
```json
{
  "productId": "string (ObjectId, required)",
  "quantity": "number (integer ≥ 1, default 1)",
  "selectedOptions": "{ key: value } (optional, e.g. { \"Color\": \"Blue\", \"Size\": \"M\" })"
}
```

**What it does:** Adds a product to the cart. Uses **composite identity** (productId + sorted selectedOptions) to determine uniqueness — the same product with different options creates separate line items. If an exact match exists, increments quantity. Validates stock availability.

**Errors:** 400 (missing/invalid productId, invalid quantity, exceeds stock), 404 (product not found or inactive)

---

### PUT /api/cart/items/:productId

**Auth:** `protect`

**Params:** `productId` — product ObjectId

**Body:**
```json
{
  "quantity": "number (integer ≥ 1, required)",
  "selectedOptions": "{ key: value } (optional, for variant disambiguation)"
}
```

**What it does:** Sets the exact quantity for a cart item. When `selectedOptions` is provided, matches the specific variant; otherwise matches the item with empty options. Validates stock.

**Errors:** 400 (missing/invalid quantity, exceeds stock), 404 (cart not found, item not in cart, product not found)

---

### POST /api/cart/items/remove

**Auth:** `protect`

**Body:**
```json
{
  "productId": "string (ObjectId, required)",
  "selectedOptions": "{ key: value } (optional, for variant disambiguation)"
}
```

**What it does:** Removes a specific item from the cart using composite identity matching. Preferred over DELETE because request bodies are unreliable with DELETE across HTTP clients.

**Errors:** 400 (invalid productId), 404 (cart not found, item not in cart)

---

### DELETE /api/cart/items/:productId

**Auth:** `protect`

**Params:** `productId` — product ObjectId

**What it does:** Legacy route — removes the cart item matching the productId with empty options. Use `POST /api/cart/items/remove` for variant-aware removal.

**Errors:** 400 (invalid productId), 404 (cart not found, item not in cart)

---

### DELETE /api/cart

**Auth:** `protect`

**What it does:** Clears all items from the cart.

**Response:** `{ "success": true, "data": { "message": "Cart cleared" } }`

---

### POST /api/cart/merge

**Auth:** `protect`

**Body:**
```json
{
  "items": [
    {
      "productId": "string (ObjectId)",
      "quantity": "number (integer ≥ 1)",
      "selectedOptions": "{ key: value } (optional)"
    }
  ]
}
```

**What it does:** Merges a guest localStorage cart with the server cart on login. Uses composite identity (productId + selectedOptions) for matching. Server cart wins on quantity conflicts (higher quantity, capped at stock).

**Errors:** 400 (items not array, invalid productId, invalid quantity)

---

## Addresses (`/api/addresses`)

**Implemented:** Sprint 8

All address routes require authentication. Max 5 addresses per user.

---

### GET /api/addresses/admin/:userId

**Auth:** `protect + restrictTo("admin")`

**Params:** `userId` — ObjectId of the customer

**What it does:** Returns all saved addresses for the specified user. Used by admin manual order creation to load a customer's addresses.

**Response:** `200`
```json
{ "success": true, "data": [{ "id": "...", "fullName": "...", "phone": "...", "street": "...", "city": "...", "state": "...", "postalCode": "...", "country": "...", "isDefault": true, "label": "home" }] }
```

**Errors:**
- `400` invalid userId format
- `404` user not found

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

### POST /api/orders/buy-now

**Auth:** `protect`

**Body:**
```json
{
  "productId": "string (required, ObjectId)",
  "quantity": "number (optional, default 1)",
  "fullName": "string (required)",
  "phone": "string (required)",
  "address": "string (required)",
  "couponCode": "string (optional)",
  "selectedOptions": "object (optional -- stored in order notes as JSON)"
}
```

**What it does:** Places a single-product order directly, bypassing the cart. Uses inline address fields (not a saved address). If a valid coupon code is provided, applies the discount and increments the coupon's `usedCount`. Shipping address fields `city`, `state`, `postalCode`, and `country` are set to `"-"` since only a free-text address is collected.

**Response:** `201`
```json
{
  "success": true,
  "data": {
    "id": "...",
    "orderNumber": "ORD-20260313-0001",
    "status": "pending",
    "paymentMethod": "COD",
    "items": [{ "product": "...", "name": "Product Name", "quantity": 1, "price": 29.99, "image": "..." }],
    "shippingAddress": { "fullName": "...", "phone": "...", "street": "...", "city": "-", "state": "-", "postalCode": "-", "country": "-" },
    "totalPrice": 29.99,
    "shippingCost": 0,
    "statusHistory": [{ "status": "pending", "date": "...", "note": "Buy Now order placed" }]
  }
}
```

**Errors:**
- `400` missing required fields (`productId`, `fullName`, `phone`, `address`)
- `400` invalid productId format
- `400` item out of stock (includes `data.outOfStock` array)
- `404` product not found or inactive

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

### POST /api/orders/admin

**Auth:** `protect + restrictTo("admin")`

**Body:**
```json
{
  "userId": "string (required — ObjectId of the customer)",
  "items": [
    { "productId": "string (ObjectId)", "quantity": "number (>= 1)" }
  ],
  "shippingAddress": {
    "fullName": "string (required)",
    "phone": "string (required)",
    "street": "string (required)",
    "city": "string (required)",
    "state": "string (required)",
    "postalCode": "string (required)",
    "country": "string (required)",
    "label": "string (optional, default 'home')"
  },
  "notes": "string (optional)",
  "notifyCustomer": "boolean (optional, default false)"
}
```

**What it does:** Creates a manual order on behalf of a customer (phone orders, in-store, etc.). Order starts at `"confirmed"` status (admin-placed, skips pending). Stock is decremented after creation. Optionally sends order confirmation email to the customer.

Flow:
1. Validates all required fields (userId, items, shippingAddress)
2. Verifies customer exists
3. Fetches all products, validates existence + stock
4. Builds order items snapshot with current prices
5. Creates order with `"confirmed"` status
6. Decrements stock
7. Optionally sends email notification

**Response:** `201`
```json
{
  "success": true,
  "data": {
    "id": "...",
    "orderNumber": "ORD-20260315-0001",
    "status": "confirmed",
    "user": { "_id": "...", "name": "...", "email": "..." },
    "items": [{ "product": "...", "name": "...", "quantity": 2, "price": 29.99, "image": "..." }],
    "shippingAddress": { ... },
    "totalPrice": 59.98,
    "statusHistory": [{ "status": "confirmed", "note": "Manual order created by admin" }]
  }
}
```

**Errors:**
- `400` missing required fields (userId, items, shippingAddress fields)
- `400` invalid ObjectId format
- `400` empty items array
- `400` items out of stock (includes `data.outOfStock` array)
- `404` customer not found
- `404` product not found or inactive

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

---

## Reviews (`/api/reviews`)

Implemented in Sprint 10. Reviews require a delivered order to create, and are limited to one per user per product.

---

### GET /api/reviews/product/:productId

**Auth:** Public

**Params:** `productId` — Product ObjectId
**Query:** `page` (default 1), `limit` (default 10, max 50), `sort` (`-createdAt`, `createdAt`, `-rating`, `rating`)

**What it does:** Returns paginated reviews for a product with rating distribution.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "...",
        "user": { "id": "...", "name": "John Doe", "avatar": "/uploads/avatars/..." },
        "product": "...",
        "order": "...",
        "rating": 5,
        "title": "Excellent product",
        "comment": "Really loved this product...",
        "isVerified": true,
        "createdAt": "2026-03-06T...",
        "updatedAt": "2026-03-06T..."
      }
    ],
    "ratingDistribution": [
      { "rating": 5, "count": 12 },
      { "rating": 4, "count": 8 },
      { "rating": 3, "count": 3 },
      { "rating": 2, "count": 1 },
      { "rating": 1, "count": 0 }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 24, "pages": 3 }
  }
}
```

---

### GET /api/reviews/eligibility/:productId

**Auth:** `protect`

**What it does:** Checks if the authenticated user can review a product (has delivered order + no existing review).

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "canReview": true,
    "hasDeliveredOrder": true,
    "existingReview": null
  }
}
```

---

### POST /api/reviews

**Auth:** `protect`

**Body:**
```json
{
  "product": "productId (required)",
  "rating": "integer 1-5 (required)",
  "title": "string 3-100 chars (required)",
  "comment": "string 10-1000 chars (required)"
}
```

**What it does:** Creates a review for a product. Requires a delivered order. One review per user per product. Automatically recalculates product rating aggregation.

**Response:** `201`

**Errors:** `400` missing/invalid fields, `403` no delivered order, `404` product not found, `409` duplicate review

---

### PUT /api/reviews/:id

**Auth:** `protect` (owner only)

**Body:** `{ rating?, title?, comment? }` — partial update

**What it does:** Updates the user's own review. Recalculates product ratings.

**Response:** `200`

**Errors:** `400` invalid fields, `403` not owner, `404` not found

---

### DELETE /api/reviews/:id

**Auth:** `protect` (owner or admin)

**What it does:** Deletes a review. Owner can delete their own; admin can delete any. Recalculates product ratings.

**Response:** `200` `{ success: true, data: null }`

**Errors:** `403` not authorized, `404` not found

---

## Wishlist (`/api/wishlist`)

Implemented in Sprint 10. All routes require authentication. One wishlist per user.

---

### GET /api/wishlist

**Auth:** `protect`

**What it does:** Returns the user's wishlist with populated product details.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "id": "...",
    "user": "...",
    "items": [
      {
        "product": {
          "id": "...",
          "name": "Product Name",
          "slug": "product-name",
          "images": [...],
          "price": 29.99,
          "compareAtPrice": null,
          "stock": 10,
          "ratings": { "average": 4.5, "count": 12 },
          "isActive": true
        },
        "addedAt": "2026-03-06T..."
      }
    ],
    "updatedAt": "2026-03-06T..."
  }
}
```

---

### POST /api/wishlist/:productId

**Auth:** `protect`

**What it does:** Adds a product to the wishlist. No duplicates allowed.

**Response:** `201` (returns full populated wishlist)

**Errors:** `404` product not found/inactive, `409` already in wishlist

---

### DELETE /api/wishlist/:productId

**Auth:** `protect`

**What it does:** Removes a product from the wishlist.

**Response:** `200` (returns updated wishlist)

**Errors:** `404` wishlist not found or product not in wishlist

---

### DELETE /api/wishlist

**Auth:** `protect`

**What it does:** Clears the entire wishlist.

**Response:** `200` `{ success: true, data: null }`

---

## Dashboard (Admin)

All dashboard endpoints require `protect + restrictTo("admin")`.

### GET /api/dashboard/stats

**Auth:** `protect + restrictTo("admin")`

**What it does:** Returns KPI overview stats for the admin dashboard. Cached for 2 minutes.

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "totalRevenue": 12500.50,
    "totalOrders": 45,
    "totalUsers": 120,
    "totalProducts": 30,
    "ordersToday": 3,
    "revenueToday": 350.00,
    "newUsersThisMonth": 15,
    "ordersByStatus": { "pending": 5, "confirmed": 8, "delivered": 25 }
  }
}
```

---

### GET /api/dashboard/revenue-chart

**Auth:** `protect + restrictTo("admin")`

**Query:** `days` (1-365, default 30)

**What it does:** Returns daily revenue data for line chart. Cached for 5 minutes.

**Response:** `200`
```json
{
  "success": true,
  "data": [
    { "date": "2026-03-01", "revenue": 500.00, "orders": 3 }
  ]
}
```

---

### GET /api/dashboard/top-products

**Auth:** `protect + restrictTo("admin")`

**Query:** `limit` (1-20, default 5)

**What it does:** Returns top-selling products by quantity sold. Cached for 5 minutes.

**Response:** `200`
```json
{
  "success": true,
  "data": [
    { "productId": "...", "name": "Product Name", "image": "...", "totalSold": 25, "totalRevenue": 1250.00 }
  ]
}
```

---

### GET /api/dashboard/recent-orders

**Auth:** `protect + restrictTo("admin")`

**Query:** `limit` (1-50, default 10)

**What it does:** Returns most recent orders with populated user info.

**Response:** `200`
```json
{
  "success": true,
  "data": [
    { "orderNumber": "ORD-20260306-0001", "user": { "_id": "...", "name": "John", "email": "john@example.com" }, "status": "pending", "totalPrice": 150.00, "createdAt": "..." }
  ]
}
```

---

### GET /api/dashboard/low-stock

**Auth:** `protect + restrictTo("admin")`

**Query:** `threshold` (1-100, default 10)

**What it does:** Returns active products with stock at or below the threshold. Cached for 2 minutes.

**Response:** `200`
```json
{
  "success": true,
  "data": [
    { "_id": "...", "name": "Product Name", "slug": "product-name", "stock": 3, "images": [] }
  ]
}
```
