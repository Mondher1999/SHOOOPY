# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚙️ Project Configuration — FILL THIS IN FIRST

> **Instructions**: Replace every `{PLACEHOLDER}` in this file and all files under `docs/` and `.claude/commands/` with your project-specific values. Use find-and-replace across the entire workspace.

| Placeholder | Your Value | Example |
|---|---|---|
| `{PROJECT_NAME}` | `ShopFlow` | `ShopFlow`, `HealthTrack`, `EduPlatform` |
| `{PROJECT_DESCRIPTION}` | `An e-commerce platform for Cash on Delivery orders` | `An e-commerce platform for artisan goods` |
| `{INDUSTRY}` | `e-commerce` | `e-commerce`, `healthcare`, `e-learning`, `fintech` |
| `{FRONTEND_DIR}` | `frontend/` | `frontend/`, `client/`, `web/` |
| `{BACKEND_DIR}` | `backend/` | `backend/`, `server/`, `api/` |
| `{FRONTEND_PORT}` | `3000` | `3000` |
| `{BACKEND_PORT}` | `5000` | `4002`, `5000`, `8080` |
| `{USER_ROLES}` | `customer, admin` | `customer, vendor, admin` |
| `{LANGUAGES}` | `EN` | `EN`, `FR/EN`, `EN/ES/ZH` |
| `{DB_NAME}` | `shopflow_db` | `shopflow_db` |
| `{DOMAIN}` | `shopflow.com` | `shopflow.com` |

---

## Project Identity

ShopFlow is a full-stack web application for the e-commerce industry. An e-commerce platform for Cash on Delivery orders. It serves the following user roles: customer, admin. It supports these languages: EN. The frontend is a Next.js 14 App Router application with TypeScript, Tailwind CSS, and shadcn/ui (`frontend/`). The backend is an Express.js REST API with MongoDB/Mongoose (`backend/`). Both projects live in this monorepo — each has its own `CLAUDE.md` with project-specific conventions that you must read before making changes.

## Commands

```bash
# Frontend (frontend/)
cd frontend
npm run dev      # Dev server — localhost:3000, connects to backend at localhost:5000
npm run build    # Production build
npm run lint     # ESLint

# Backend (backend/)
cd backend
npm run dev      # Nodemon dev server — localhost:5000
npm start        # Production server
curl http://localhost:5000/health  # Verify backend is running
```

No test framework is configured by default. Testing is manual (curl for API, browser for UI). Set up Jest + Supertest (backend) and Jest + React Testing Library (frontend) when ready.

## Code Standards

### Module System
The backend uses **ESM** (`import`/`export`) because `"type": "module"` is set in package.json. Always write `import { protect, restrictTo } from "../middlewares/auth.js"` — never `require()`. Include `.js` extensions in all backend import paths because Node.js ESM resolution requires explicit extensions.

### Logging
Use `logger` everywhere — never `console.log` — because the loggers suppress output in production, preventing sensitive data leaks in server logs. Backend: `src/utils/logger.js`. Frontend: `lib/logger.ts`.

### Error Handling
Wrap all async functions in try/catch because unhandled rejections crash the Node process and expose raw stack traces to users. Every backend controller must follow this pattern:

```js
const handler = async (req, res) => {
  try {
    // 1. Validate input
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Missing required field: name" });
    // 2. Business logic
    const result = await Model.findById(req.params.id).lean();
    if (!result) return res.status(404).json({ success: false, error: "Not found" });
    // 3. Success response
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("handler error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
```

Frontend API calls must catch errors and show user-friendly messages via `t()`.

### Input Validation
Validate all user input at the start of every controller because MongoDB injection and regex DoS are real attack vectors:
- `escapeRegex()` from `utils/sanitize.js` for ALL `$regex` queries because unescaped patterns enable ReDoS
- `assertWithin()` + `validateFileId()` for ALL file path operations because raw paths enable directory traversal
- ObjectId format validation before any database query because invalid IDs cause unhandled CastErrors

### Authentication
All mutating routes (POST/PUT/PATCH/DELETE) must use `protect` middleware because unauthenticated writes are the #1 security risk. Role gates use `restrictTo()` with appropriate roles from customer, admin. Always import from `src/middlewares/auth.js`.

### i18n
All user-facing strings must use `t()` from `useTranslation` because the platform serves users in multiple languages (EN). Always add keys to ALL language files. Never leave a language incomplete because missing keys render as raw key strings in the UI.

### Naming Conventions
| Context | Convention | Example | Reason |
|---|---|---|---|
| React components | PascalCase | `ItemCard.tsx` | React convention for JSX elements |
| Hooks/utilities | camelCase | `useAuth.ts` | JavaScript function convention |
| Services | kebab-case | `item-service.ts` | URL-friendly, consistent with REST patterns |
| Backend files | camelCase | `authController.js` | Node.js ecosystem convention |
| Mongoose models | PascalCase export | `User`, `Product` | Mongoose convention for constructor functions |
| Route prefixes | kebab-case | `/products` | REST API convention |

## Architecture Rules

### Backend (Express.js + MongoDB)
MVC under `backend/src/`: models → controllers → routes → middlewares → utils. Entry point: `server.js`. Security stack: Helmet headers, rate limiting (100/15min global, 10/15min auth), 1MB JSON body limit. File uploads via Multer. In-memory cache (`utils/cache.js`) with auto-invalidation on writes.

### Frontend (Next.js 14 App Router)
Two API patterns coexist: `axiosInstance.ts` (Axios + Bearer injection + 401 refresh mutex) for auth-critical flows, and `lib/api.ts` (`fetchAPI` native fetch wrapper) for services/FormData. Tokens in localStorage. State via React Context only (AuthContext, LoadingContext). Security headers set in `middleware.ts`.

### Cross-Stack Data Flow
Feature implementation always follows this order: **Model → Controller → Route → Frontend Service → UI Component → i18n keys**. This ensures the backend contract exists before the frontend consumes it, preventing type mismatches and wasted integration effort.

### Key Documentation
- `frontend/CLAUDE.md` — Frontend coding rules, component structure, import order, styling rules
- `backend/CLAUDE.md` — Backend coding rules, controller pattern, route protection, query conventions
- `docs/SETUP.md` — Environment variables (complete list), deployment steps, nginx config
- `docs/API.md` — All API endpoints with request/response shapes
- `docs/DATA-MODELS.md` — All Mongoose schemas with fields and relationships

## Communication Style

### Commit Messages
Imperative mood, max 72 chars first line. Focus on *why*, not *what*: `Fix token refresh race condition in concurrent 401s` not `Update axiosInstance.ts`.

### Code Comments
Only where logic is non-obvious. Comment *why*, never *what*. Remove commented-out code — don't leave it because git history preserves all deleted code.

### Git Workflow
Branch naming: `feature/short-description`, `fix/short-description`, `refactor/short-description`. Never force-push to main/master. Never commit `.env`, `.env.local`, or files containing secrets.

## Forbidden Patterns

| Pattern | Consequence | Alternative |
|---|---|---|
| `console.log` | Leaks sensitive data in production logs | `logger` from utils/logger |
| `eval()` / `Function()` | Code injection attacks — attacker executes arbitrary JS | Safe alternatives (JSON.parse, Map lookup) |
| `$where` in MongoDB | Arbitrary JS execution on database server | Standard query operators ($eq, $in, $regex) |
| Hardcoded API URLs | Breaks when switching between dev/staging/prod | `axiosInstance` or `fetchAPI` |
| Hardcoded user-facing strings | Shows wrong language to users | `t()` from `useTranslation` |
| `any` in TypeScript | Defeats type safety, hides bugs at compile time | Proper interfaces in `types/` |
| Inline styles | Breaks design consistency, can't responsive-adapt | Tailwind classes + `cn()` |
| Raw user input in file paths | Path traversal reads/writes arbitrary server files | `validateFileId()` + `assertWithin()` |
| Raw user input in `$regex` | ReDoS hangs the event loop for all users | `escapeRegex()` from utils/sanitize |
| Missing `protect` middleware | Unauthenticated users can mutate data | Always add `protect` on non-public routes |
| `dangerouslySetInnerHTML` | XSS — attacker injects scripts into the page | Safe text rendering, sanitized HTML |
| Disabling security middleware | Creates persistent vulnerabilities in production | Fix the root cause instead |
| `require()` in backend | Breaks ESM module system, causes runtime errors | `import` with `.js` extension |
| `{ message: "..." }` response | Frontend can't parse — expects `success` field | `{ success: true/false, data/error }` |

## Project-Specific Knowledge

> **Fill these in** once your project is set up. Delete the placeholder text.

### Environment Variables
See `docs/SETUP.md` for the complete list. Backend needs: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, SMTP config, `FRONTEND_URL`. Frontend needs: environment-specific vars in `.env.local`.

### Deployment
Target server with PM2 + nginx. Frontend on port 3000, backend on port 5000. nginx proxies `/api/*` to backend. See `docs/SETUP.md` for full steps.

### Response Format (Backend — Mandatory)
```js
res.status(200).json({ success: true, data: result });
res.status(201).json({ success: true, data: created });
res.status(400).json({ success: false, error: "Missing required field: name" });
res.status(404).json({ success: false, error: "Resource not found" });
res.status(500).json({ success: false, error: "Something went wrong" });
```

### Roles & User Flow
- `customer`: registers → email verification → browse products → add to cart → checkout (COD) → track orders
- `admin`: full access including user management, product CRUD, order management, dashboard analytics

### Timezone
> **Fill in** if your app serves users in multiple timezones.

## Custom Commands

Commands in `.claude/commands/` activate specialized expertise. Always analyze the task before acting.

| Category | Commands |
|---|---|
| **`/dev/`** — Developer agents | `frontend`, `backend`, `fullstack`, `api`, `db`, `auth`, `i18n`, `upload`, `designer`, `docs`, `test` |
| **`/ops/`** — Quality agents | `review`, `security`, `audit`, `qa`, `perf`, `debug`, `refactor`, `deploy`, `accessibility` |
| **`/workflow/`** — Orchestrators | `build` (multi-phase pipeline), `feature` (quick build), `fix` (bug diagnosis), `endpoint`, `component`, `translate`, `release` |
