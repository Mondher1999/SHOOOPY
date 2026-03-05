# {PROJECT_NAME} -- Developer Overview

{PROJECT_DESCRIPTION}

## Projects in this repository

| Directory | Description | Port |
|---|---|---|
| `{FRONTEND_DIR}/` | Next.js 14 App Router frontend (TypeScript, Tailwind, shadcn/ui) | {FRONTEND_PORT} |
| `{BACKEND_DIR}/` | Express.js backend (JavaScript, MongoDB/Mongoose) | {BACKEND_PORT} |

---

## What the platform does

<!-- Fill in what your application does, organized by user role -->

- **{USER_ROLES}** -- describe what each role can do
- **Automated emails** -- describe any scheduled notifications
- **File uploads** -- describe supported file types and upload strategy
- **{LANGUAGES}** -- describe supported languages and localization approach

---

## Tech stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM modules) |
| Framework | Express.js 4 |
| Database | MongoDB via Mongoose 8 |
| Authentication | JWT (access + refresh tokens), bcryptjs |
| File upload | Multer (disk storage, configurable size limit) |
| Email | Nodemailer (SMTP with retry) |
| Security | Helmet, express-rate-limit |
| Scheduling | node-cron |
| Timezone | date-fns-tz |
| Dev server | Nodemon |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS, shadcn/ui (Radix UI) |
| HTTP client | Axios (with interceptor) + native fetch |
| State | React Context (no Redux) |
| Forms | react-hook-form + Zod |
| i18n | i18next + react-i18next |
| Animation | Framer Motion |
| Charts | Recharts |

---

## User roles

<!-- Define your application's roles -->

| Role | Internal name | Description |
|---|---|---|
| Role 1 | `role_1` | Description of what this role can do |
| Role 2 | `role_2` | Description of what this role can do |
| Admin | `admin` | Full access; manages users and all content |

<!-- If your app has a user onboarding/validation flow, describe it here -->

---

## Running both projects locally

### Prerequisites
- Node.js 18+
- MongoDB (local instance or MongoDB Atlas connection string)
- A `.env` file in `{BACKEND_DIR}/` (see [SETUP.md](./SETUP.md) for all variables)
- A `.env.local` file in `{FRONTEND_DIR}/` (see [SETUP.md](./SETUP.md) for all variables)

### Backend

```bash
cd {BACKEND_DIR}
npm install
npm run dev
# Server starts on http://localhost:{BACKEND_PORT}
```

### Frontend

```bash
cd {FRONTEND_DIR}
npm install
npm run dev
# Dev server starts on http://localhost:{FRONTEND_PORT}
```

Both must be running at the same time during development. The frontend expects the backend at `http://localhost:{BACKEND_PORT}`.

---

## Key commands

### Backend (`{BACKEND_DIR}/`)

| Command | Description |
|---|---|
| `npm run dev` | Nodemon dev server, auto-reloads on file changes |
| `npm start` | Production server (plain `node server.js`) |

### Frontend (`{FRONTEND_DIR}/`)

| Command | Description |
|---|---|
| `npm run dev` | Next.js dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Start production server (requires build first) |
| `npm run lint` | Run ESLint via `next lint` |

---

## Environment variables -- quick reference

### Backend: `{BACKEND_DIR}/.env`

```env
PORT={BACKEND_PORT}
MONGODB_URI=mongodb://localhost:27017/{DB_NAME}
JWT_ACCESS_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-secret>
JWT_ACCESS_EXPIRES=30d
JWT_REFRESH_EXPIRES=7d
JWT_REFRESH_MAX_AGE_MS=604800000
PASSWORD_RESET_TOKEN_EXPIRES_MIN=15
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=noreply@{DOMAIN}
SMTP_PASS=<smtp-password>
EMAIL_FROM="{PROJECT_NAME} <noreply@{DOMAIN}>"
FRONTEND_URL=http://localhost:{FRONTEND_PORT}
NODE_ENV=development
```

### Frontend: `{FRONTEND_DIR}/.env.local`

```env
# Add your frontend environment variables here
# Example: Firebase config, API keys, feature flags
NEXT_PUBLIC_API_URL=http://localhost:{BACKEND_PORT}
```

For full descriptions of every variable, see [SETUP.md](./SETUP.md).

---

## Documentation index

| File | Contents |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Backend middleware chain, MVC layout, auth flow, frontend routing, state management |
| [API.md](./API.md) | Backend API reference -- endpoint documentation template |
| [DATA-MODELS.md](./DATA-MODELS.md) | Mongoose schemas with fields, methods, and model relationships |
| [FRONTEND-COMPONENTS.md](./FRONTEND-COMPONENTS.md) | Pages, services, contexts, custom hooks, upload flow |
| [SETUP.md](./SETUP.md) | Step-by-step local setup, all environment variables, production deployment |
