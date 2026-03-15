# ShopFlow Admin — Design System (Shopify Polaris-Inspired)

> **Source of Truth** for every admin page. All admin UI must conform to these specs.
> When a page-specific override exists in `design-system/pages/{page}.md`, it takes precedence.

---

## 1. Color Tokens

### Core Palette

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `--p-bg` | `#F1F1F1` | `bg-polaris-bg` | Page background |
| `--p-surface` | `#FFFFFF` | `bg-polaris-surface` | Cards, modals, popovers |
| `--p-surface-hovered` | `#F6F6F7` | `bg-polaris-surface-hovered` | Table row hover, list hover |
| `--p-border` | `#E3E3E3` | `border-polaris-border` | Card borders, dividers |
| `--p-border-subdued` | `#EBEBEB` | `border-polaris-border-subdued` | Inner dividers |
| `--p-text` | `#202223` | `text-polaris-text` | Primary text |
| `--p-text-subdued` | `#6D7175` | `text-polaris-text-subdued` | Secondary/meta text |
| `--p-icon` | `#5C5F62` | `text-polaris-icon` | Default icon color |
| `--p-icon-subdued` | `#8C9196` | `text-polaris-icon-subdued` | Inactive icons |

### Interactive Colors

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `--p-action-primary` | `#008060` | `bg-polaris-primary` | Primary buttons, links |
| `--p-action-primary-hovered` | `#006E52` | `hover:bg-polaris-primary-hovered` | Primary button hover |
| `--p-action-primary-pressed` | `#005C43` | `active:bg-polaris-primary-pressed` | Primary button active |
| `--p-text-on-primary` | `#FFFFFF` | `text-white` | Text on primary bg |

### Status Colors

| Status | Background | Text/Icon | Badge BG | Badge Text |
|--------|-----------|-----------|----------|------------|
| Success | `#AEE9D1` | `#008060` | `bg-polaris-success-light` | `text-polaris-success` |
| Warning | `#FFEA8A` | `#B98900` | `bg-polaris-warning-light` | `text-polaris-warning` |
| Critical | `#FED3D1` | `#D72C0D` | `bg-polaris-critical-light` | `text-polaris-critical` |
| Info | `#A4E8F2` | `#2C6ECB` | `bg-polaris-info-light` | `text-polaris-info` |
| Highlight | `#E4E5E7` | `#202223` | `bg-polaris-highlight` | `text-polaris-text` |

### Navigation Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--p-nav-bg` | `#1A1C1D` | Sidebar background |
| `--p-nav-text` | `#E3E5E7` | Sidebar text |
| `--p-nav-text-subdued` | `#8C9196` | Sidebar secondary text |
| `--p-nav-item-hovered` | `#26282A` | Sidebar item hover |
| `--p-nav-item-active` | `#2A2C2E` | Sidebar active item bg |
| `--p-nav-item-active-text` | `#FFFFFF` | Sidebar active item text |
| `--p-nav-item-active-indicator` | `#008060` | Active indicator bar |

---

## 2. Typography

### Font Family
```
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```
Tailwind: `font-sans` (set Inter as default sans in tailwind.config.ts)

### Scale

| Role | Size | Weight | Line Height | Tailwind Class |
|------|------|--------|-------------|----------------|
| Page title | 20px | 600 | 24px | `text-xl font-semibold` |
| Section heading | 16px | 600 | 20px | `text-base font-semibold` |
| Card title | 14px | 600 | 20px | `text-sm font-semibold` |
| Body | 14px | 400 | 20px | `text-sm` |
| Body subdued | 13px | 400 | 16px | `text-[13px] text-polaris-text-subdued` |
| Badge / label | 12px | 500 | 16px | `text-xs font-medium` |
| Caption | 12px | 400 | 16px | `text-xs` |
| Table header | 13px | 600 | 16px | `text-[13px] font-semibold` |

---

## 3. Spacing System

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| Page padding | 20px | `p-5` | Main content area padding |
| Card padding | 16px | `p-4` | Inside card components |
| Card gap | 12px | `gap-3` | Between cards in a grid |
| Section gap | 20px | `gap-5` | Between page sections |
| Element gap | 8px | `gap-2` | Between elements inside cards |
| Tight gap | 4px | `gap-1` | Between inline items (icon + text) |

---

## 4. Component Specs

### Card
```
Background:    #FFFFFF
Border:        1px solid #E3E3E3
Border radius: 8px (rounded-lg)
Shadow:        0 1px 2px rgba(0,0,0,0.1)
Padding:       16px
```
Tailwind: `bg-polaris-surface border border-polaris-border rounded-lg shadow-polaris p-4`

### Button — Primary
```
Background:    #008060
Text:          #FFFFFF
Border radius: 4px (rounded)
Padding:       8px 16px
Font:          14px / 500
Hover:         #006E52
Active:        #005C43
```
Tailwind: `bg-polaris-primary text-white rounded px-4 py-2 text-sm font-medium hover:bg-polaris-primary-hovered active:bg-polaris-primary-pressed`

### Button — Outline
```
Background:    #FFFFFF
Text:          #202223
Border:        1px solid #C9CCCF
Border radius: 4px
Hover bg:      #F6F6F7
```
Tailwind: `bg-polaris-surface text-polaris-text border border-[#C9CCCF] rounded px-4 py-2 text-sm font-medium hover:bg-polaris-surface-hovered`

### Button — Destructive
```
Background:    #D72C0D
Text:          #FFFFFF
Hover:         #BC2200
```

### Input / Select
```
Background:    #FFFFFF
Border:        1px solid #C9CCCF
Border radius: 4px (rounded)
Padding:       8px 12px
Font:          14px / 400
Focus border:  #008060
Focus ring:    0 0 0 1px #008060
Placeholder:   #6D7175
```

### Status Badge (Pill)
```
Border radius: 9999px (rounded-full)
Padding:       2px 10px
Font:          12px / 500
```

| Status | Background | Text |
|--------|-----------|------|
| Active / Fulfilled / Delivered | `#AEE9D1` | `#008060` |
| Draft / Pending | `#E4E5E7` | `#202223` |
| Unfulfilled / Processing | `#FFEA8A` | `#B98900` |
| Cancelled / Critical | `#FED3D1` | `#D72C0D` |
| Info / Confirmed | `#A4E8F2` | `#2C6ECB` |
| Shipped | `#DFE3E8` | `#44474A` |

### Table
```
Header bg:     #F6F6F7
Header text:   13px / 600 / #6D7175 (uppercase optional)
Row bg:        #FFFFFF
Row hover:     #F6F6F7
Row border:    1px solid #F1F1F1 (between rows)
Cell padding:  12px 16px
Checkbox col:  40px width
Sticky header: position: sticky; top: 0; z-index: 10
```

### Dialog / Modal
```
Overlay:       rgba(0,0,0,0.5)
Background:    #FFFFFF
Border radius: 12px
Shadow:        0 26px 80px rgba(0,0,0,0.2)
Max width:     620px
Padding:       20px
```

### Toast
```
Background:    #202223
Text:          #FFFFFF
Border radius: 8px
Shadow:        0 4px 12px rgba(0,0,0,0.15)
Duration:      4000ms
```

---

## 5. Layout System

### Page Structure
```
┌────────────────────────────────────────────────────────┐
│ Top Bar (56px height, #FFFFFF, bottom border)          │
│  ┌──────────────────────────────┐  ┌────────────────┐  │
│  │ Search bar (max-w-[540px])   │  │ Avatar + Name  │  │
│  └──────────────────────────────┘  └────────────────┘  │
├─────────┬──────────────────────────────────────────────┤
│ Sidebar │  Content Area                                │
│ 240px   │  bg: #F1F1F1                                 │
│ fixed   │  padding: 20px                               │
│ #1A1C1D │  max-width: 1200px (centered)                │
│         │                                              │
│ Nav     │  ┌─────────────────────────────────────────┐ │
│ items   │  │ Page Title (20px/600)                   │ │
│         │  │ Optional subtitle (13px/subdued)        │ │
│         │  ├─────────────────────────────────────────┤ │
│         │  │                                         │ │
│         │  │ Page content...                         │ │
│         │  │                                         │ │
│         │  └─────────────────────────────────────────┘ │
└─────────┴──────────────────────────────────────────────┘
```

### Sidebar Navigation
```
Width:           240px (desktop), hidden on mobile
Background:      #1A1C1D
Padding:         8px
Logo area:       16px padding, 20px font-size, font-semibold, #FFFFFF
Nav item height: 36px
Nav item padding: 8px 12px
Nav item radius:  6px
Nav item text:   14px / 400 / #E3E5E7
Nav item icon:   20px, #8C9196 default, #FFFFFF when active
Active item bg:  #2A2C2E
Active indicator: 3px left border #008060
Hover bg:        #26282A
Section divider: 1px solid #333536, 12px vertical margin
```

### Top Bar
```
Height:          56px
Background:      #FFFFFF
Border bottom:   1px solid #E3E3E3
Position:        sticky top-0
Z-index:         30
Content:         Search bar (centered or left), user avatar + name (right)
```

### Responsive Breakpoints

| Breakpoint | Sidebar | Content | Grid cols |
|------------|---------|---------|-----------|
| < 768px (mobile) | Hidden (sheet overlay) | Full width, p-4 | 1 |
| 768px–1023px (tablet) | Hidden (sheet overlay) | Full width, p-5 | 2 |
| ≥ 1024px (desktop) | 240px fixed | calc(100% - 240px), p-5, max-w-[1200px] | 2–4 |

### Mobile Navigation
- Hamburger button in top bar (left)
- Sheet/drawer slides from left
- Same nav items as desktop sidebar
- 280px drawer width

---

## 6. Page Templates

### Dashboard Page
```
┌─ Page title: "Home" ─────────────────────────────────┐
│                                                       │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│ │ KPI 1  │ │ KPI 2  │ │ KPI 3  │ │ KPI 4  │         │
│ │Revenue │ │Orders  │ │Customers│ │Products│         │
│ └────────┘ └────────┘ └────────┘ └────────┘         │
│                                                       │
│ ┌──────────────────────────┐ ┌──────────────────────┐│
│ │ Revenue Chart            │ │ Top Products         ││
│ │ (Line/Area, 300px h)     │ │ (Ranked list)        ││
│ │                          │ │                      ││
│ └──────────────────────────┘ └──────────────────────┘│
│                                                       │
│ ┌──────────────────────────┐ ┌──────────────────────┐│
│ │ Recent Orders (table)    │ │ Low Stock Alerts     ││
│ │                          │ │                      ││
│ └──────────────────────────┘ └──────────────────────┘│
└───────────────────────────────────────────────────────┘
```

**KPI Card Spec:**
```
┌──────────────────────────┐
│ Title (13px/subdued)     │
│ Value (24px/600)         │
│ Change indicator (+/-)   │
│ or description (12px)    │
└──────────────────────────┘
- No icon in the card (Polaris style — clean metric display)
- Green text for positive change, red for negative
```

### List Page (Products, Orders, Users)
```
┌─ Page title ──────────────────── [Primary Action] ───┐
│                                                       │
│ ┌───────────────────────────────────────────────────┐ │
│ │ Search bar ────── Filter buttons ── Sort dropdown │ │
│ ├───┬────────────┬──────────┬───────┬───────┬───────┤ │
│ │ ☐ │ Column 1   │ Column 2 │ Col 3 │ Col 4 │ ⋯    │ │
│ ├───┼────────────┼──────────┼───────┼───────┼───────┤ │
│ │ ☐ │ Row 1      │          │       │       │       │ │
│ │ ☐ │ Row 2      │          │       │       │       │ │
│ │ ☐ │ Row 3      │          │       │       │       │ │
│ ├───┴────────────┴──────────┴───────┴───────┴───────┤ │
│ │ ◄ Previous      Page 1 of 5           Next ►      │ │
│ └───────────────────────────────────────────────────┘ │
│                                                       │
│ ┌─ Bulk Action Bar (slides up when items checked) ──┐ │
│ │ 3 selected    [Edit] [Delete] [More actions ▾]    │ │
│ └───────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

### Detail Page (Order Detail)
```
┌─ ← Back    Order #1234 ───── Status badge ───────────┐
│                                                       │
│ ┌──────────────────────────┐ ┌──────────────────────┐│
│ │ Order Items (main col)   │ │ Customer             ││
│ │ ┌────┬────────┬────────┐ │ │ Name, email          ││
│ │ │ Img│ Name   │ Price  │ │ │                      ││
│ │ │    │ x Qty  │        │ │ ├──────────────────────┤│
│ │ └────┴────────┴────────┘ │ │ Shipping Address     ││
│ ├──────────────────────────┤ │                      ││
│ │ Payment: COD             │ ├──────────────────────┤│
│ │ Subtotal / Shipping /    │ │ Summary              ││
│ │ Total                    │ │ Subtotal: $X         ││
│ └──────────────────────────┘ │ Shipping: $X         ││
│                              │ Total:    $X         ││
│ ┌──────────────────────────┐ └──────────────────────┘│
│ │ Timeline                 │                         │
│ │ ● Delivered  - Mar 7     │                         │
│ │ ● Shipped    - Mar 5     │                         │
│ │ ● Confirmed  - Mar 3     │                         │
│ │ ○ Created    - Mar 1     │                         │
│ └──────────────────────────┘                         │
└───────────────────────────────────────────────────────┘
```

### Form Page (Product Create/Edit)
```
┌─ ← Back    Product Title ────────────────────────────┐
│                                                       │
│ ┌────────────── Main (2/3) ──┐ ┌─── Sidebar (1/3) ──┐│
│ │ Title & Description        │ │ Status              ││
│ │ ┌────────────────────────┐ │ │ ☐ Active            ││
│ │ │ Title input            │ │ ├─────────────────────┤│
│ │ │ Description textarea   │ │ │ Organization        ││
│ │ └────────────────────────┘ │ │ Category: [select]  ││
│ ├────────────────────────────┤ │ SKU: [input]        ││
│ │ Media                      │ ├─────────────────────┤│
│ │ [Drop zone / Image grid]   │ │ Pricing             ││
│ ├────────────────────────────┤ │ Price: [input]      ││
│ │ Pricing                    │ │ Compare: [input]    ││
│ │ Price / Compare-at         │ ├─────────────────────┤│
│ ├────────────────────────────┤ │ Inventory           ││
│ │ Inventory                  │ │ Stock: [input]      ││
│ │ Stock quantity             │ └─────────────────────┘│
│ ├────────────────────────────┤                        │
│ │ Attributes (key/value)     │                        │
│ └────────────────────────────┘                        │
│                                                       │
│                          [Discard] [Save product]     │
└───────────────────────────────────────────────────────┘
```

---

## 7. Status Mapping

### Order Statuses
| Status | Badge BG | Badge Text | Hex BG | Hex Text |
|--------|----------|------------|--------|----------|
| Pending | `bg-polaris-highlight` | `text-polaris-text` | `#E4E5E7` | `#202223` |
| Confirmed | `bg-polaris-info-light` | `text-polaris-info` | `#A4E8F2` | `#2C6ECB` |
| Processing | `bg-polaris-warning-light` | `text-polaris-warning` | `#FFEA8A` | `#B98900` |
| Shipped | `bg-[#DFE3E8]` | `text-[#44474A]` | `#DFE3E8` | `#44474A` |
| Delivered | `bg-polaris-success-light` | `text-polaris-success` | `#AEE9D1` | `#008060` |
| Cancelled | `bg-polaris-critical-light` | `text-polaris-critical` | `#FED3D1` | `#D72C0D` |

### Product Statuses
| Status | Badge BG | Badge Text |
|--------|----------|------------|
| Active | `bg-polaris-success-light` | `text-polaris-success` |
| Draft | `bg-polaris-highlight` | `text-polaris-text` |
| Archived | `bg-[#DFE3E8]` | `text-[#44474A]` |
| Out of Stock | `bg-polaris-critical-light` | `text-polaris-critical` |

---

## 8. Animation & Transitions

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Button hover | background-color | 150ms | ease-in-out |
| Table row hover | background-color | 100ms | ease |
| Sidebar item hover | background-color | 100ms | ease |
| Card hover (clickable) | box-shadow | 200ms | ease-in-out |
| Dialog enter | opacity, transform | 200ms | ease-out |
| Dialog exit | opacity | 150ms | ease-in |
| Toast enter | translateY | 300ms | ease-out |
| Bulk bar slide | translateY | 200ms | ease-out |
| Badge appear | opacity, scale | 150ms | ease-out |

All animations must respect `prefers-reduced-motion: reduce`.

---

## 9. Tailwind Configuration Additions

### Colors to add in `tailwind.config.ts`
```ts
colors: {
  polaris: {
    bg: '#F1F1F1',
    surface: '#FFFFFF',
    'surface-hovered': '#F6F6F7',
    border: '#E3E3E3',
    'border-subdued': '#EBEBEB',
    text: '#202223',
    'text-subdued': '#6D7175',
    icon: '#5C5F62',
    'icon-subdued': '#8C9196',
    primary: '#008060',
    'primary-hovered': '#006E52',
    'primary-pressed': '#005C43',
    critical: '#D72C0D',
    'critical-light': '#FED3D1',
    warning: '#B98900',
    'warning-light': '#FFEA8A',
    success: '#008060',
    'success-light': '#AEE9D1',
    info: '#2C6ECB',
    'info-light': '#A4E8F2',
    highlight: '#E4E5E7',
    'nav-bg': '#1A1C1D',
    'nav-item-hover': '#26282A',
    'nav-item-active': '#2A2C2E',
  }
}
```

### Box Shadow
```ts
boxShadow: {
  polaris: '0 1px 2px rgba(0,0,0,0.1)',
  'polaris-card': '0 0 0 1px rgba(63,63,68,0.05), 0 1px 3px 0 rgba(63,63,68,0.15)',
  'polaris-modal': '0 26px 80px rgba(0,0,0,0.2)',
}
```

### Font
```ts
fontFamily: {
  sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
}
```

---

## 10. Icon Guidelines

- **Library:** Lucide React (already in project)
- **Default size:** 20px (`w-5 h-5`)
- **Small size:** 16px (`w-4 h-4`) — inside badges, inline
- **Large size:** 24px (`w-6 h-6`) — page headers, empty states
- **Color:** `text-polaris-icon` default, `text-polaris-icon-subdued` for secondary
- **Stroke width:** 1.5 (Lucide default)

### Navigation Icons
| Page | Icon |
|------|------|
| Dashboard | `Home` |
| Orders | `ShoppingBag` |
| Products | `Package` |
| Categories | `FolderTree` |
| Users | `Users` |
| Settings | `Settings` |
| Analytics | `BarChart3` |

---

## 11. Accessibility Checklist

- [ ] All text meets WCAG AA contrast (4.5:1 normal, 3:1 large)
- [ ] Focus rings visible: `ring-2 ring-polaris-primary ring-offset-2`
- [ ] Icon-only buttons have `aria-label`
- [ ] Status communicated by text, not color alone (badge text inside)
- [ ] Table headers use `<th scope="col">`
- [ ] Forms: every input has a `<label>`
- [ ] Modals trap focus and close on Escape
- [ ] Skip-to-content link on admin layout
- [ ] Sidebar navigation uses `<nav aria-label="Admin">`
- [ ] Loading states use `aria-busy="true"`
- [ ] `prefers-reduced-motion` disables all transitions

---

## 12. File Structure

```
frontend/
├── app/admin/
│   ├── layout.tsx          ← Admin shell (sidebar + topbar + content)
│   ├── page.tsx            ← Dashboard
│   ├── products/
│   │   ├── page.tsx        ← Product list
│   │   ├── new/page.tsx    ← Product create
│   │   └── [id]/edit/page.tsx ← Product edit
│   ├── categories/page.tsx
│   ├── orders/
│   │   ├── page.tsx        ← Order list
│   │   └── [id]/page.tsx   ← Order detail
│   ├── users/page.tsx
│   └── settings/page.tsx   ← Settings
├── components/admin/
│   ├── AdminSidebar.tsx    ← Polaris-style sidebar nav
│   ├── AdminTopBar.tsx     ← Top bar with search + avatar
│   ├── KPICard.tsx         ← Dashboard metric card
│   ├── RevenueChart.tsx    ← Revenue line chart
│   ├── LowStockAlert.tsx   ← Low stock warning
│   ├── ProductForm.tsx     ← Two-column product form
│   ├── ImageUploader.tsx   ← Image upload with progress
│   ├── ImageSortable.tsx   ← Drag-reorder images
│   ├── StatusBadge.tsx     ← Polaris-style status pill
│   └── BulkActionBar.tsx   ← Bottom bar for bulk actions
```

---

## 13. Do / Don't

| Do | Don't |
|----|-------|
| Use `polaris-*` color tokens | Use raw hex values in components |
| `rounded-lg` (8px) for cards | `rounded-xl` or `rounded-2xl` |
| `rounded` (4px) for buttons/inputs | `rounded-lg` for small elements |
| `shadow-polaris` for cards | Heavy drop shadows |
| `text-sm` (14px) for body | `text-base` (16px) in admin |
| `gap-3` between cards | `gap-6` or larger |
| `p-4` inside cards | `p-6` or `p-8` |
| White card on `#F1F1F1` bg | Colored or gradient cards |
| Pill badges with light bg + dark text | Solid-colored badges |
| Sticky table headers | Scrolling headers away |
| Left-aligned table text | Center-aligned data columns |
| Right-aligned numbers/currency | Left-aligned monetary values |
| Icons at 20px default | Mixed icon sizes |
| Inter font everywhere in admin | Serif fonts or Playfair |
| Subdued text for meta info | Same color for all text |
