# Architecture

This document describes the backend and frontend architecture of {PROJECT_NAME}.

---

## 1. Backend Architecture

### Entry point

`{BACKEND_DIR}/server.js` -- Express application listening on port {BACKEND_PORT} (`127.0.0.1:{BACKEND_PORT}`).

### Middleware chain order

The middleware is applied in this exact order as defined in `server.js`:

1. `helmet()` -- HTTP security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
2. `globalLimiter` -- Rate limiter: 100 requests per 15 minutes per IP (applied globally)
3. `express.json({ limit: "1mb" })` -- JSON body parser, hard-capped at 1 MB
4. `express.urlencoded({ limit: "1mb", extended: true })` -- URL-encoded body parser, hard-capped at 1 MB
5. `morgan("dev")` -- HTTP request logger
6. `cors(corsOptions)` -- CORS: configured origins for dev and production
7. `cookieParser()` -- Parses cookies (used for the `refreshToken` cookie)
8. Static file serving -- `express.static` for uploads and assets (with video range support if applicable)
9. Request timeout middleware -- configurable per-route timeouts
10. Route mounting -- all API route handlers

<!-- Document your route mounting order here -->

### MVC directory tree

```
{BACKEND_DIR}/
  server.js               Entry point, middleware chain, route mounting, cron jobs
  src/
    config/
      db.js               Mongoose connection (connects using MONGODB_URI)
    controllers/          Business logic, one file per domain
      authController.js   Register, login, refresh, logout, me, password management
      <!-- Add your controllers here -->
    middlewares/
      auth.js             Primary auth middleware (JWT_ACCESS_SECRET). Exports protect + restrictTo()
      upload.js           Multer configuration (size limits, MIME + extension validation)
      videoStreamHandler.js  HTTP 206 Range request streaming with path traversal guard
    models/               Mongoose schemas (see DATA-MODELS.md)
      userModel.js
      <!-- Add your models here -->
    routes/               Express Router instances
      authRoutes.js
      chunkUploadRoutes.js
      <!-- Add your routes here -->
    utils/
      jwt.js              signAccessToken(), signRefreshToken(), verifyAccessToken(), verifyRefreshToken()
      sendEmail.js        Nodemailer wrapper with SMTP config and retry
      emailTemplates.js   HTML/text email content generators
      sanitize.js         escapeRegex() for safe $regex queries in MongoDB
      logger.js           Dev-only logger (always logs errors)
  uploads/
    courses/              Assembled files after chunked upload completes
    temp/                 Temporary chunk storage during upload (auto-cleaned)
```

### Route prefix table

<!-- Document your routes here -->

| Prefix | File | Notes |
|---|---|---|
| `/auth` | `authRoutes.js` | Auth rate limiter (10 req/15min) |
| `/upload` | `chunkUploadRoutes.js` | Chunked file upload |
| `/health` | inline in server.js | Public, returns JSON status |
| <!-- Add routes --> | | |

### Body and file size limits

| Context | Limit |
|---|---|
| JSON body (`express.json`) | 1 MB |
| URL-encoded body | 1 MB |
| Multer (general upload middleware) | 10 GB per file (configurable) |
| Chunk upload | 50 MB per chunk (in-memory) |

### Request timeouts

<!-- Configure per-route timeouts as needed -->

| Route pattern | Timeout |
|---|---|
| Upload / heavy processing routes | 20 minutes |
| All other routes | 15 minutes |

---

## 2. Authentication

### Two auth middleware files

There are two files that both export a function called `protect`. They use different environment variables and serve different purposes:

| File | Secret used | Populates | Used by |
|---|---|---|---|
| `src/middlewares/auth.js` | `JWT_ACCESS_SECRET` | `req.user` (no populate) | All route protection; exports `protect` and `restrictTo()` |
| `src/middlewares/authMiddleware.js` | `JWT_SECRET` | `req.user` with populated relations | Only specific routes needing populated user data |

**`auth.js` is the primary middleware** and must be used for all route protection. `authMiddleware.js` is a secondary middleware used only on routes that need extra user relations populated from MongoDB.

### JWT utilities (`src/utils/jwt.js`)

```js
signAccessToken(payload)    // Signs with JWT_ACCESS_SECRET, expires in JWT_ACCESS_EXPIRES
signRefreshToken(payload)   // Signs with JWT_REFRESH_SECRET, expires in JWT_REFRESH_EXPIRES
verifyAccessToken(token)    // Verifies with JWT_ACCESS_SECRET
verifyRefreshToken(token)   // Verifies with JWT_REFRESH_SECRET
```

### `protect` middleware (`auth.js`)

1. Reads `Authorization: Bearer <token>` header
2. Verifies token with `JWT_ACCESS_SECRET`
3. Loads user from MongoDB by decoded `id`
4. Checks `user.changedPasswordAfter(decoded.iat)` -- returns 401 if password changed after token issue
5. Attaches `req.user = currentUser`
6. Returns 401 if token missing, invalid, expired, or user not found

### `restrictTo(...roles)` middleware (`auth.js`)

Checks `req.user.role` against the allowed roles array. Returns 403 Forbidden if the role is not in the list.

```js
// Example usage in a route file:
router.delete("/:id", protect, restrictTo("admin"), deleteResource)
```

### Token rotation

On login, the server issues both an access token (returned in response body) and a refresh token (set as an `httpOnly` cookie on path `/auth/refresh`). On refresh, both tokens are rotated. The old refresh token is discarded.

The frontend (`axiosInstance.ts`) also stores both tokens in `localStorage` as `accessToken` and `refreshToken` for use in API calls.

### Password reset flow

1. `POST /auth/forgot-password` with `{ email }` -- generates a random 32-byte token using `crypto.randomBytes(32)`
2. The token is SHA-256 hashed and stored in `user.passwordResetTokenHash`
3. Expiry is set in `user.passwordResetExpiresAt` (configurable via `PASSWORD_RESET_TOKEN_EXPIRES_MIN`, default 15 minutes)
4. The **raw** (unhashed) token is sent to the user's email in a URL
5. `POST /auth/reset-password` with `{ token, email, newPassword }` -- hashes the submitted token, queries DB for match with expiry check

---

## 3. Backend Special Systems

### Cron jobs

<!-- Document your scheduled tasks here -->

Scheduled in `server.js` using `node-cron`:
- Frequency: configurable (e.g., every 5 minutes)
- Timezone: configurable via `node-cron` options
- Handler: describe what the job does

### Video streaming (`videoStreamHandler.js`)

- Intercepts requests to static upload paths
- Only activates for video extensions: `.mp4`, `.avi`, `.mov`, `.webm`, `.mkv`
- Reads the `Range` header and responds with HTTP 206 Partial Content
- **Path traversal guard**: `path.resolve()` is called on the requested path, and the result must start with the `resolvedBase` directory. Requests outside the base directory return 403 Forbidden.
- Non-video files fall through to `express.static`

### Chunked upload flow

Used for large files (videos, etc.) to avoid HTTP timeouts and enable progress tracking:

```
Frontend                            Backend
   |                                   |
   |-- POST /upload/chunk (chunk 0) -->|  Writes to uploads/temp/<fileId>/chunk_0
   |-- POST /upload/chunk (chunk 1) -->|  Writes to uploads/temp/<fileId>/chunk_1
   |   ... (N chunks total)            |
   |-- POST /upload/complete ---------->|  Reads chunks in order, concatenates into
   |                                   |  uploads/courses/<fileId>-<filename>
   |                                   |  Deletes temp directory
   |<-- { success: true, file: {...} }--|
```

`fileId` is validated with `/^[a-zA-Z0-9_-]+$/` before use in path construction. An additional `assertWithin()` check ensures the resolved path stays within the temp directory (prevents path traversal via crafted `fileId`).

### File upload validation (`upload.js`)

The Multer `fileFilter` requires **both** a valid MIME type **and** a valid extension. Either alone is not sufficient. This prevents MIME-type spoofing.

```
Accept only if: mimetype IN allowedMimeTypes AND extension IN allowedExtensions
```

### NoSQL injection protection

All text fields used in MongoDB `$regex` queries are sanitized with `escapeRegex()` from `src/utils/sanitize.js`. This function escapes regex metacharacters before they are placed into `new RegExp(...)`.

---

## 4. Frontend Architecture

### App Router page structure

<!-- Document your pages here -->

```
{FRONTEND_DIR}/app/
  page.tsx                  Root page (redirect or landing)
  layout.tsx                Root layout (wraps app with ClientProviders)
  globals.css               Global styles
  auth/
    page.tsx                Login page
  dashboard/
    page.tsx                Main dashboard (role-dependent)
  reset-password/
    page.tsx                Password reset form (token + email from URL query params)
  change-password/
    page.tsx                Authenticated password change form
  <!-- Add your pages here -->
```

### ProtectedRoute component

Enforces the user access flow. Checks in sequence:

1. `loading === true` -- show loading spinner
2. `user === null` -- redirect to `/auth`
3. Role-based checks -- redirect if user lacks required role or validation status
4. All checks pass -- render children

<!-- Customize the ProtectedRoute checks for your app's onboarding flow -->

### Two API patterns (both coexist)

#### Pattern 1: `utils/axiosInstance.ts`

An Axios instance pre-configured with the API base URL and a response interceptor.

- Automatically injects `Authorization: Bearer <token>` from `localStorage`
- On 401 response: triggers token refresh (mutex pattern -- see below)
- Used by: `authService.ts`, `AuthContext.tsx`, and most service files

```ts
import api from "@/utils/axiosInstance"
const res = await api.get("/auth/me")
```

#### Pattern 2: `lib/api.ts` -- `fetchAPI()`

A wrapper around native `fetch`.

- Reads `accessToken` from `localStorage` and adds it as a Bearer header
- Does **not** have automatic token refresh on 401
- Does not set `Content-Type` when the body is `FormData` (lets the browser set multipart boundary)
- Used by: service files, especially when uploading files as `FormData`

```ts
import { fetchAPI } from "@/lib/api"
const data = await fetchAPI("/resource", { method: "GET" })
```

**When to use which:** `axiosInstance` is appropriate for auth-critical flows and anything that needs automatic token refresh. `fetchAPI` is appropriate for data-fetching service functions, especially when uploading files as `FormData`.

### Token refresh race condition solution (axiosInstance.ts)

When multiple concurrent requests fail with 401, they would each independently try to refresh the token. The mutex pattern prevents this:

```
isRefreshing = false   (module-level flag)
failedQueue = []       (module-level queue)

On 401:
  if (isRefreshing):
    Push request into failedQueue and wait
  else:
    Set isRefreshing = true
    Call refreshTokenRequest()
    On success: processQueue(null, newToken) -- retry all queued requests
    On failure: processQueue(error, null) -- reject all queued requests
    Set isRefreshing = false
```

---

## 5. i18n System

Configuration file: `{FRONTEND_DIR}/lib/i18n/index.ts`

| Setting | Value |
|---|---|
| Languages | {LANGUAGES} |
| Default namespace | `common` |
| Fallback language | `en` |
| Language persistence | `localStorage` key `i18nextLng` |
| Detection order | `localStorage` -> browser navigator -> HTML tag |

Translation files are loaded dynamically:
```
lib/i18n/locales/
  en/
    common.json
    auth.json
  <!-- Add language directories for each supported language -->
```

<!-- If you use IP-based language detection, describe the mapping here -->

---

## 6. Security Hardening Applied

| Layer | Measure | Detail |
|---|---|---|
| Backend | Helmet | Sets `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`, and others |
| Backend | Global rate limit | 100 requests per 15 minutes per IP. Returns 429 with JSON error. |
| Backend | Auth rate limit | 10 requests per 15 minutes per IP, applied only to `/auth` routes |
| Backend | Body size limit | JSON and URL-encoded bodies hard-limited to 1 MB |
| Backend | File type validation | Multer requires both valid MIME type AND valid extension |
| Backend | Path traversal -- video | `path.resolve()` containment check before serving any file; 403 if outside `baseDir` |
| Backend | Path traversal -- chunks | `validateFileId()` regex on `fileId`; `assertWithin()` path guard before writing chunks |
| Backend | NoSQL injection | `escapeRegex()` applied to all `$regex` query inputs |
| Backend | Password reset | Token stored as SHA-256 hash; plain token only in email; 15-minute expiry |
| Frontend | Security headers | `middleware.ts` sets `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` |
| Frontend | Auth on chunk upload | `getAuthHeader()` injects `Authorization: Bearer <token>` on all chunk and finalize requests |
| Frontend | Token refresh mutex | `isRefreshing` flag + `failedQueue` prevent multiple concurrent token refresh calls |

---

## 7. Auth Flow Diagram

```
Client                         Backend
  |                               |
  |-- POST /auth/login ----------->|
  |   { email, password }         |
  |                          Validates credentials
  |                          Signs accessToken + refreshToken
  |                          Sets httpOnly refreshToken cookie
  |<-- 200 { accessToken, user } --|
  |   (stores tokens in           |
  |    localStorage)              |
  |                               |
  |-- GET /auth/me                |
  |   Authorization: Bearer ... ->|
  |                          [protect middleware]
  |                           1. Extract Bearer token
  |                           2. Verify with JWT_ACCESS_SECRET
  |                           3. Load user from DB
  |                           4. Check changedPasswordAfter
  |                           5. Attach req.user
  |<-- 200 { user object } --------|
  |                               |
  |-- GET /protected (expired) --->|
  |<-- 401 Unauthorized -----------|
  |                               |
  |  [axiosInstance interceptor]  |
  |  isRefreshing = false         |
  |  -> set isRefreshing = true   |
  |-- POST /auth/refresh ---------->|
  |   (reads refreshToken cookie) |
  |                          Verify refresh token
  |                          Issue new accessToken + refreshToken
  |                          Set new refreshToken cookie
  |<-- 200 { accessToken } --------|
  |  -> store new accessToken      |
  |  -> processQueue(newToken)     |
  |  -> isRefreshing = false       |
  |                               |
  |-- Retry: GET /protected ------->|
  |   Authorization: Bearer <new> |
  |<-- 200 OK ----------------------|
```
