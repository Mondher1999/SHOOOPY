# frontend/CLAUDE.md

Frontend coding conventions for ShopFlow's Next.js 14 application.

## Component Conventions
- Functional components only with TypeScript props interfaces (no `any`)
- `"use client"` only when hooks, events, or browser APIs are used
- Hooks at top, early returns for loading/error/empty states
- shadcn/ui primitives + Tailwind + `cn()` for all styling

## Import Order
```tsx
// 1. React
import React, { useState, useEffect } from "react"
// 2. Next.js
import { useRouter } from "next/navigation"
// 3. Third-party
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
// 4. Internal @/ aliases
import { Button } from "@/components/ui/button"
import axiosInstance from "@/utils/axiosInstance"
import logger from "@/lib/logger"
// 5. Types
import type { Product } from "@/types/product"
```

## 4 Required States for Every Data Component
```tsx
// Loading
if (isLoading) return <Skeleton className="h-32 w-full" />
// Error
if (error) return <p role="alert" className="text-destructive">{error}</p>
// Empty
if (!data || data.length === 0) return <p className="text-muted-foreground">No items found.</p>
// Success — render data
```

## API Calls
- `axiosInstance` (utils/axiosInstance.ts) — for auth-critical flows (auto Bearer + 401 refresh)
- `fetchAPI` (lib/api.ts) — for general data fetches and FormData
- Never raw `fetch()` or bare `axios` — they bypass token injection

## File Structure
```
frontend/
  app/                        # Next.js App Router pages
  components/
    ui/                       # shadcn/ui components
    providers/ClientProviders.tsx
  contexts/
    LoadingContext.tsx
  hooks/
    use-toast.ts
  lib/
    utils.ts                  # cn() helper
    api.ts                    # fetchAPI wrapper
    logger.ts                 # Frontend logger
  utils/
    axiosInstance.ts          # Axios + interceptors
  middleware.ts               # Security headers
```

## Styling Rules
- Tailwind CSS only — no inline styles, no hardcoded hex values
- Use CSS variable tokens: `bg-background`, `text-muted-foreground`, `border-border`
- `cn()` from `@/lib/utils` for conditional classes
- Mobile-first responsive: `sm:`, `md:`, `lg:` breakpoints

## Accessibility
- Semantic HTML (`main`, `nav`, `section`, `article`, `header`, `footer`)
- Labels on every form input via `htmlFor` + `id`
- `aria-label` on icon-only buttons
- `aria-live="polite"` on dynamic content areas
- Touch targets minimum 44×44px
