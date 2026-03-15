# Setup Guide

This guide covers how to set up ShopFlow for local development and production deployment.

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | Both projects require Node 18 or higher |
| npm | 9+ | Comes with Node 18 |
| MongoDB | 6+ | Local instance or MongoDB Atlas |
| Git | Any | For cloning and version control |

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd EcomWebsite
```

### 2. Install backend dependencies

```bash
cd backend/
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend/
npm install
```

---

## Backend Environment Variables

Create `backend/.env` with the following variables.

| Variable | Required | Description | Example value |
|---|---|---|---|
| `PORT` | No | Express server port | `5001` |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://localhost:27017/shopflow_db` |
| `NODE_ENV` | No | Environment flag | `development` or `production` |
| `FRONTEND_URL` | Yes | Frontend base URL — used in email links | `http://localhost:3002` |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing access tokens (15 min TTL). Use a long random string. | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens (7d TTL). Must be different from access secret. | `openssl rand -hex 32` |
| `SMTP_HOST` | No* | SMTP server hostname | `smtp.mailtrap.io` |
| `SMTP_PORT` | No* | SMTP port | `587` |
| `SMTP_SECURE` | No | Use TLS (`true`) or STARTTLS (`false`) | `false` |
| `SMTP_USER` | No* | SMTP auth username | `your-mailtrap-user` |
| `SMTP_PASS` | No* | SMTP auth password | `your-mailtrap-pass` |
| `SMTP_FROM` | No | Sender address | `noreply@shopflow.com` |
| `JWT_ACCESS_EXPIRES` | No | Access token time-to-live | `15m` or `30d` |
| `JWT_REFRESH_EXPIRES` | No | Refresh token time-to-live | `7d` |
| `JWT_REFRESH_MAX_AGE_MS` | No | Refresh token max age in milliseconds | `604800000` |
| `PASSWORD_RESET_TOKEN_EXPIRES_MIN` | No | Password reset token expiry in minutes | `15` |
| `ADMIN_EMAIL` | No | Default admin email address | `admin@shopflow.com` |
| `EMAIL_FROM` | No | Sender display name and email | `ShopFlow <noreply@shopflow.com>` |
| `SETTINGS_ENCRYPTION_KEY` | No | Key for encrypting SMTP password in DB (32-byte hex string) | `openssl rand -hex 32` |

*SMTP vars are optional in development. When not set, emails are logged to the console instead of sent. **Configure SMTP before production.**

**Dev email services:** [Mailtrap](https://mailtrap.io) (recommended) or [Ethereal](https://ethereal.email) (auto-generates test credentials).

### Example `backend/.env`

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/shopflow_db
JWT_ACCESS_SECRET=replace_with_a_strong_random_secret_at_least_32_chars
JWT_REFRESH_SECRET=replace_with_a_different_strong_random_secret
JWT_SECRET=replace_with_yet_another_secret_or_same_as_access
JWT_ACCESS_EXPIRES=30d
JWT_REFRESH_EXPIRES=7d
JWT_REFRESH_MAX_AGE_MS=604800000
PASSWORD_RESET_TOKEN_EXPIRES_MIN=15
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=noreply@shopflow.com
SMTP_PASS=your_smtp_password_here
EMAIL_FROM=ShopFlow <noreply@shopflow.com>
FRONTEND_URL=http://localhost:3002
NODE_ENV=development
ADMIN_EMAIL=admin@shopflow.com
```

---

## Frontend Environment Variables

Create `frontend/.env.local` with your frontend configuration variables. Variables prefixed with `NEXT_PUBLIC_` are embedded into the client bundle and visible to browser clients.

<!-- Customize this section for your project's frontend env vars -->

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (if not using relative proxy) |
| <!-- Add your variables --> | <!-- Description --> |

### Example `frontend/.env.local`

```env
# Add your frontend environment variables here
# NEXT_PUBLIC_API_URL=http://localhost:5001
```

---

## Running Locally

You need two terminals running simultaneously.

### Terminal 1 -- Backend

```bash
cd backend/
npm run dev
```

Output should include:
```
Server running on port 5001
Health check: http://127.0.0.1:5001/health
```

Verify with: `curl http://localhost:5001/health`

### Terminal 2 -- Frontend

```bash
cd frontend/
npm run dev
```

Output should include:
```
- Local: http://localhost:3002
```

Open `http://localhost:3002` in your browser.

### How they connect

In development, the frontend calls the backend directly at `http://localhost:5001`. No proxy configuration is needed.

In production, nginx sits in front. The frontend is served from the root, and any request to `/api/*` is proxied to the backend at port 5001. The frontend resolves the API base to `/api` when `NODE_ENV === "production"`.

---

## Uploads Directory

The backend writes uploaded files to the `uploads/` directory inside `backend/`. This directory is expected to exist at runtime but should not be committed to version control.

Create it manually:

```bash
mkdir -p backend/uploads/courses
mkdir -p backend/uploads/temp
```

The backend auto-creates these directories on startup if they do not exist, so this step is optional but recommended.

The `.gitignore` should exclude `uploads/` to prevent large media files from being committed.

---

## Available Commands

### Backend (`backend/`)

| Command | Description |
|---|---|
| `npm run dev` | Start with Nodemon -- auto-restarts on file changes |
| `npm start` | Start with plain `node server.js` -- for production |

### Frontend (`frontend/`)

| Command | Description |
|---|---|
| `npm run dev` | Next.js dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Start production server -- requires `npm run build` first |
| `npm run lint` | Run ESLint via `next lint` |

---

## Production Deployment

The deployment target is an Ubuntu server (or equivalent). The intended stack is PM2 for process management and nginx as reverse proxy.

### Backend (PM2)

```bash
# On the server
cd backend/
npm install --production
pm2 start server.js --name ShopFlow-backend
pm2 save
pm2 startup  # Configure PM2 to start on server reboot
```

To restart after a code update:
```bash
git pull
npm install
pm2 restart ShopFlow-backend
```

### Frontend (Next.js)

```bash
cd frontend/
npm install
npm run build
pm2 start npm --name ShopFlow-frontend -- start
```

### nginx configuration (example)

```nginx
server {
    listen 80;
    server_name shopflow.com www.shopflow.com;

    # Frontend (Next.js on port 3002)
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (Express on port 5001)
    location /api/ {
        rewrite ^/api(/.*)$ $1 break;
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 1200s;   # 20 min for large uploads
        proxy_send_timeout 1200s;
        client_max_body_size 0;     # Let the backend handle size limits
    }

    # Direct static file access for uploads
    location /uploads/ {
        alias /path/to/backend/uploads/;
    }
}
```

### Environment variables in production

Set `NODE_ENV=production` in both the backend `.env` and the frontend build environment. For the frontend, Next.js reads `.env.local` during `npm run build`, so environment variables must be present at build time.

For the backend, ensure all variables listed in the [Backend Environment Variables](#backend-environment-variables) section are set in the production `.env` file on the server.

### CORS in production

The backend CORS origin list is defined in `backend/server.js`. Update the `corsOptions.origin` array to include your production domain(s):

```js
const corsOptions = {
  origin: [
    "http://localhost:3002",
    "https://shopflow.com",
    // Add additional origins as needed
  ],
  credentials: true,
}
```

---

## Generating Secure Secrets

To generate strong secrets for JWT:

```bash
# On Linux/macOS
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or using openssl
openssl rand -hex 64
```

Use different values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `JWT_SECRET`.
