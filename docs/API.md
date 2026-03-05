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

## Auth (`/auth`)

Auth routes have a stricter rate limit: **10 requests per 15 minutes per IP**.

---

### POST /auth/login

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
  "accessToken": "string",
  "user": {
    "id": "...", "email": "...", "name": "...", "role": "...",
    "createdAt": "...", "updatedAt": "..."
  }
}
```

Also sets an `httpOnly` cookie named `refreshToken`.

---

### POST /auth/refresh

**Auth:** Public (reads `refreshToken` cookie)

**Body:** None (reads from `refreshToken` cookie set by `/auth/login`)

**Response:** `200`
```json
{
  "accessToken": "string"
}
```

Also rotates the `refreshToken` cookie with a new value.

---

### POST /auth/logout

**Auth:** Public

**Body:** None

**What it does:** Clears the `refreshToken` cookie.

**Response:** `200`
```json
{ "message": "Logged out successfully" }
```

---

### GET /auth/me

**Auth:** `protect`

**Response:** `200` -- Returns the authenticated user object:
```json
{
  "id": "...", "email": "...", "name": "...", "role": "...",
  "createdAt": "...", "updatedAt": "..."
}
```

---

### POST /auth/forgot-password

**Auth:** Public

**Body:**
```json
{ "email": "string (required)" }
```

**What it does:** Generates a password reset token, stores its SHA-256 hash in the DB, and emails the raw token as a URL to the user. Always returns success even if the email does not exist (prevents user enumeration).

**Response:** `200`
```json
{ "message": "If this email exists, a reset link has been sent" }
```

---

### POST /auth/reset-password

**Auth:** Public

**Body:**
```json
{
  "token": "string (required, the raw token from the email URL)",
  "email": "string (required)",
  "newPassword": "string (required, min 6 characters)"
}
```

**Response:** `200`
```json
{
  "message": "Password reset successful",
  "user": { "..." },
  "accessToken": "string"
}
```

---

### PATCH /auth/update-password

**Auth:** `protect`

**Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required)"
}
```

**Response:** `200`
```json
{
  "message": "Password updated",
  "user": { "..." },
  "accessToken": "string"
}
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
