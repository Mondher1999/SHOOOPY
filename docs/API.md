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
