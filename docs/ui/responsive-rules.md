# HamzaPhone — Responsive Design Rules

> Version 1.0 — August 2026  
> Consistent with: `design-system.md` · `admin-navigation.md`  
> Grid: 4px base · Fonts: Inter + JetBrains Mono

---

## 1. Breakpoint System

### Breakpoint Definitions

| Name | CSS Variable | Min Width | Target Devices |
|---|---|---|---|
| **xs** | `--bp-xs` | 0px | Small phones (< 375px) |
| **sm** | `--bp-sm` | 375px | Standard phones (375–639px) |
| **md** | `--bp-md` | 640px | Large phones, small tablets |
| **lg** | `--bp-lg` | 1024px | Tablets, small laptops |
| **xl** | `--bp-xl` | 1280px | Standard laptops, desktops |
| **2xl** | `--bp-2xl` | 1536px | Large desktops, wide monitors |

### Media Query Conventions (Mobile-First)

```css
/* Mobile first — no wrapper needed (xs) */
/* md: 640px+ */
@media (min-width: 640px) { … }
/* lg: 1024px+ */
@media (min-width: 1024px) { … }
/* xl: 1280px+ */
@media (min-width: 1280px) { … }
/* 2xl: 1536px+ */
@media (min-width: 1536px) { … }
```

### Max Content Widths

| Context | Max Width | Centering |
|---|---|---|
| Storefront main content | `1280px` | `margin: 0 auto` |
| Admin main content (sidebar out) | No max | Fluid within available space |
| Admin content (with sidebar) | — | Fluid |
| Storefront article/blog content | `720px` | Centered |
| Checkout, forms | `640px` | Centered |
| Modals | `480px` (sm) · `640px` (md) · `800px` (lg) | Centered overlay |
| Dashboard (storefront homepage) | `1440px` | Centered |

---

## 2. Spacing System (Responsive Scaling)

Base unit: **4px**

| Token | Mobile | Tablet | Desktop |
|---|---|---|---|
| `--space-page-x` | 16px | 24px | 32px |
| `--space-page-y` | 20px | 32px | 40px |
| `--space-section` | 32px | 48px | 64px |
| `--space-card` | 16px | 20px | 24px |

**Rule:** Horizontal page padding scales up with viewport. Content never touches edge on any screen.

---

## 3. Typography Scaling

Full scale defined in `design-system.md`. Mobile reductions:

| Token | Desktop | Mobile (< 768px) |
|---|---|---|
| `--text-display` | 36px | 28px |
| `--text-h1` | 28px | 22px |
| `--text-h2` | 22px | 18px |
| `--text-h3` | 18px | 16px |
| `--text-body-lg` | 16px | 15px |
| `--text-body` | 14px | 14px |
| `--text-small` | 13px | 12px |

**Rule:** Body text never smaller than 14px. Table cells never smaller than 12px.

---

## 4. Mobile (0–639px)

### 4.1 Navigation (Admin)

- Sidebar: **hidden by default**
- Slide-in drawer (full-width, from left) triggered by hamburger icon
- Fixed **bottom tab bar** (60px):
  - 5 tabs: Dashboard · Orders · Products · Inventory · More
  - Tab contains icon (24px) + label (11px)
  - Active: orange icon + orange label
  - "More" opens full-nav bottom sheet
- Topbar: 56px — Logo (left) + Notification bell + Avatar (right)

### 4.2 Navigation (Storefront)

- Fixed top header (56px): Logo + Search icon + Cart badge + Account icon
- Slide-in left drawer for category navigation
- Optional sticky bottom tab bar: Accueil · Catalogue · Panier · Compte

### 4.3 Product Grid

- **2 columns** (tight layout)
- Card: image (square) + name (2 lines max) + price + "Ajouter" button
- Column gap: 12px
- Row gap: 16px
- No sidebar filter — filter accessible via "Filtrer" floating button (bottom-left)

### 4.4 Tables (Admin)

- Tables **transform to card list** — not horizontal scroll tables
- Each card represents one row
- Card shows: entity name (prominent), 2–3 key values, status badge, action button
- "Voir plus" expands card to show all fields
- Bulk select: checkbox on card top-right
- Column sorting: sort dropdown above card list

**Exception:** Simple 2–3 column tables (e.g., address list, permission matrix) may use horizontal scroll with sticky first column.

### 4.5 Forms

- Single-column layout (no side-by-side fields)
- Input height: **52px** (large touch targets)
- Label above input (never inline/placeholder-only)
- Section headings between field groups with clear spacing
- Submit button: full-width, bottom of form (56px height)
- Floating sticky submit bar for long multi-section forms

### 4.6 Checkout (Storefront)

- Full-screen steps (no visible sidebar on any step)
- Progress indicator: horizontal dots or step label at top
- "Précédent" link top-left
- CTA button: sticky at bottom of viewport
- Order summary collapsed by default → tap to expand (accordion)

### 4.7 Search

- Storefront: tapping search icon expands full-width search bar, pushes content down
- Search suggestions overlay: full-screen (100vh) below the search bar
- Admin: search bar in topbar, opens suggestions in full-width overlay

### 4.8 Dialogs / Modals

- Bottom sheet style (slides up from bottom) — preferred on mobile
- Full-width, rounded top corners (12px radius)
- Max height: 90vh (scrollable content inside)
- Always dismissible by swipe down or tap backdrop
- Destructive dialogs: full-width modal (not bottom sheet) for emphasis

### 4.9 Bottom Action Bars

Used on:
- Cart: "Total — Passer la commande" sticky bar
- PDP: "Prix — Ajouter au Panier" sticky bar
- Admin detail pages: "Sauvegarder" sticky bar (long forms)

Rules:
- Height: 72px (includes safe area padding for iOS)
- Full-width, elevated (`--shadow-md`)
- Background: white
- Always above the OS navigation bar (uses `padding-bottom: env(safe-area-inset-bottom)`)

---

## 5. Tablet (640px–1023px)

### 5.1 Navigation (Admin)

- Sidebar: **collapsed by default** (60px icon-only mode)
- User can expand to 240px by clicking the rail expand button
- Topbar: full topbar with breadcrumb visible
- No bottom tab bar

### 5.2 Navigation (Storefront)

- Full horizontal navbar
- No mobile hamburger drawer
- Search bar: expanded inline (not icon-only)
- Category row or mega-menu

### 5.3 Card Layouts

- Product grid: **2–3 columns** depending on filter sidebar presence
  - With filter sidebar: 2 columns
  - Without filter sidebar: 3 columns
- Admin card/stat grids: 2 columns

### 5.4 Grid Behavior (Admin)

- KPI cards: 2×2 grid
- Dashboard sections: stacked (no multi-column composition)
- Tables: remain as tables (not card list) — horizontal scroll if needed

### 5.5 Forms

- 2-column layout for short field pairs (First Name / Last Name, Min / Max)
- Single column for long text inputs, textareas, file uploads
- Section grouping with clear headings

### 5.6 Tables

- Full table (not card list)
- Horizontal scroll allowed for wide tables
- Sticky first column (entity name) during scroll
- Action column sticky on right
- Pagination controls visible

### 5.7 Dialogs

- Centered modal (not bottom sheet)
- Max width: 480px (confirmation) · 640px (form)
- Consistent across all sizes from tablet up

---

## 6. Laptop (1024px–1279px)

### 6.1 Admin Layout

- Sidebar: **collapsed by default** (60px), expandable to 240px
- Main content: fluid within remaining space
- Topbar: full with breadcrumb + all actions visible

**Rule:** At 1024px, sidebar and main content must coexist without horizontal scroll. Sidebar collapse is default to preserve content width.

### 6.2 Product Grid (Storefront)

- With filter sidebar (240px): **3 columns**
- Without filter sidebar: **4 columns**

### 6.3 Dashboard Layout

- KPI row: 4 cards horizontal
- Two-column composition: chart (65%) + activity feed (35%)
- Quick stats: 3-column row

### 6.4 Tables

- All columns visible (or column visibility toggle available)
- No horizontal scroll (columns adapt width)
- Dense row height: **48px**

### 6.5 Modals

- Max width: 640px (standard form) · 800px (large form / preview table)

### 6.6 Typography

- Desktop scale (no reduction)

---

## 7. Desktop (1280px+)

### 7.1 Admin Layout

- Sidebar: **expanded by default** (240px)
- If user collapses: persists in `localStorage`
- Main content: fluid with `max-content-width` per section
- Topbar: fully detailed

### 7.2 Asymmetric Compositions

Desktop allows 2-column and 3-column asymmetric layouts:

| Screen | Layout |
|---|---|
| Dashboard | KPIs (4-col) → Chart 65% + Feed 35% → Stats (3-col) |
| Product Detail | Images 45% + Info 55% (both sticky-aware) |
| Pricing Bulk | Filters 30% + Preview table 70% |
| Order Detail | Main 65% + Sidebar cards 35% |
| B2B Business | Main info 60% + Orders sidebar 40% |
| Category Tree | Tree 30% + Edit panel 70% |

### 7.3 Product Grid (Storefront)

- With sidebar: **3 columns**
- Without sidebar: **4 columns** (standard) · **5 columns** at 1536px+

### 7.4 Typography

- Full `--text-display` (36px) used on hero sections
- `--text-h1` (28px) on page headings
- Standard body throughout

### 7.5 Sidebar Behavior (Admin)

- Expanded: text labels + section headings visible
- `width: 240px`, `flex-shrink: 0`
- Main content: `flex: 1`, scrollable independently

### 7.6 Table Behavior

- Default 10 rows per page (user can increase to 25/50/100)
- Row height: 48px (standard) · 56px (with image thumbnail)
- Hover: light gray background `--color-gray-50`
- Sticky header on scroll (the column header row)

### 7.7 Modal Behavior

- Max width: 480px (confirm) · 640px (form) · 960px (preview/bulk)
- Backdrop: `rgba(0,0,0,0.4)`, click closes non-critical modals
- Centered both horizontally and vertically
- Max height: 85vh, inner scrollable

---

## 8. Sidebar Behavior Across Breakpoints

| Breakpoint | Sidebar Mode | Width | Trigger |
|---|---|---|---|
| < 640px (mobile) | Hidden — Drawer | Full-width drawer | Hamburger icon |
| 640–1023px (tablet) | Collapsed icon-only | 60px | Rail expand button |
| 1024–1279px (laptop) | Collapsed (default) | 60px / 240px toggle | Rail expand button |
| 1280px+ (desktop) | Expanded (default) | 240px | Rail collapse button |

Collapsed state preference stored in `localStorage: 'admin-sidebar-collapsed'`

---

## 9. Image Responsiveness

### Product Images (Storefront)

| Size | Usage |
|---|---|
| `96×96px` | Recently viewed rail |
| `160×160px` | Product card (mobile grid) |
| `240×240px` | Product card (tablet/desktop) |
| `480×480px` | PDP primary image (mobile) |
| `640×640px` | PDP primary image (desktop) |

All product images: white background, `object-fit: contain`, 1:1 aspect ratio.

Use `srcset` and `sizes` for responsive loading:
```html
<img
  srcset="image-160.jpg 160w, image-240.jpg 240w, image-480.jpg 480w, image-640.jpg 640w"
  sizes="(max-width: 640px) 160px, (max-width: 1024px) 240px, 640px"
/>
```

### Admin Product Images

| Context | Size |
|---|---|
| Table thumbnail | `40×40px` |
| Card thumbnail | `64×64px` |
| Product detail media tab | `320×320px` |

All images served from Supabase Storage with CDN. WebP preferred, JPEG fallback.

---

## 10. Responsive Component Patterns

### 10.1 KPI Cards

| Breakpoint | Layout |
|---|---|
| Mobile | 2×2 grid |
| Tablet | 2×2 grid |
| Laptop | 4×1 row |
| Desktop | 4×1 row (wider cards) |

Card spacing: 16px gap on mobile, 24px on desktop.

### 10.2 Filter Sidebar (Storefront PLP)

| Breakpoint | Behavior |
|---|---|
| Mobile (< 640px) | Hidden — accessible via "Filtrer" floating button → bottom sheet |
| Tablet (640–1023px) | Hidden by default — "Filtres" button opens left overlay panel |
| Laptop (1024px+) | Persistent left sidebar (240px) |

### 10.3 Charts (Admin Dashboard)

| Breakpoint | Height | Width |
|---|---|---|
| Mobile | 180px | Full-width |
| Tablet | 220px | Full-width |
| Desktop | 280px | 65% of dashboard width |

Chart labels: hide intermediate X-axis labels on mobile.

### 10.4 Horizontal Scroll Rails

Used for: recently viewed, related products, brand logos.

- Mobile: snap scroll (`scroll-snap-type: x mandatory`)
- Tablet: snap scroll or visible overflow
- Desktop: always shows all items OR grid layout if space allows

Card width in rail:
- Mobile: 40vw (no more than 160px)
- Tablet: 200px
- Desktop: 220px

### 10.5 Order Status Timeline

| Breakpoint | Orientation |
|---|---|
| Mobile | Vertical stepper (stacked) |
| Tablet+ | Horizontal step indicator |

### 10.6 Tabs

- Mobile: horizontally scrollable tabs (overflow scroll, hidden scrollbar)
- Desktop: all tabs visible, no scroll

### 10.7 Table → Card Transformation

Admin tables that switch to card layout on mobile (< 640px):

| Table | Mobile Pattern |
|---|---|
| Orders | Status badge top-right, Order # prominent, client name, total, action button |
| Products | Image left (56px), name + SKU, price pair (B2C / B2B), stock badge |
| Customers | Initials avatar, name + email, order count + spend, status badge |
| Inventory | Name + SKU, stock bar, level badge, "Ajuster" action |
| Activity Logs | Timestamp top, action badge, resource name, user |

---

## 11. Touch Optimization (Mobile)

### Minimum Target Sizes

| Element | Min Size |
|---|---|
| Buttons (primary/secondary) | 44×44px |
| Icon-only buttons | 44×44px |
| Checkboxes / Radio buttons | 44×44px (tap area) |
| Tab bar items | Full tab cell width × 60px |
| Navigation links (sidebar) | 44px height |
| Swipeable cards | Natural card height |

### Swipe Gestures (Mobile Admin)

| Gesture | Action |
|---|---|
| Swipe right from left edge | Open sidebar drawer |
| Swipe left on drawer | Close drawer |
| Swipe down on bottom sheet | Dismiss |
| Swipe on table card row | Quick action (single primary action only) |

### Input Fields (Mobile)

- Height: 52px minimum
- Font size: minimum 16px (prevents iOS auto-zoom on focus)
- Numeric inputs: `inputmode="numeric"` (shows number keypad)
- Phone: `inputmode="tel"`
- Email: `type="email"` (optimized mobile keyboard)

---

## 12. Print Layout (Admin Reports & Orders)

Print-specific styles applied with `@media print`:

- Sidebar: hidden
- Topbar: hidden
- Background colors: white (except brand badges)
- Shadows: none
- Page breaks before major sections
- `font-size: 12pt` base
- DZD prices: always visible (no column hiding)
- URLs: printed after links

Print targets:
- Order PDF (customer receipt)
- Inventory report
- Financial report
- B2B invoice

---

## 13. Safe Area Insets (iOS / Android)

For mobile web, account for device notches and navigation bars:

```css
/* Top (notch) */
padding-top: env(safe-area-inset-top);

/* Bottom (home indicator / gesture bar) */
padding-bottom: env(safe-area-inset-bottom);
```

Applied to:
- Fixed bottom tab bar
- Sticky bottom action bars (Add to Cart, Checkout CTA)
- Bottom sheet modals

---

## 14. Dark Mode

**Current policy:** Dark mode is **not supported** in v1.0.

- Admin sidebar background (`#111827`) provides sufficient contrast in light mode
- All component tokens use explicit light-mode values
- `prefers-color-scheme: dark` is NOT implemented in v1.0

Dark mode may be added in v2.0 as a user preference stored in account settings.

---

## 15. RTL (Right-to-Left) Support

**Current policy:** UI is primarily **LTR** (French interface).

Arabic content areas (product descriptions, customer addresses in Arabic) use:
```css
.arabic-content {
  direction: rtl;
  font-family: 'Noto Sans Arabic', sans-serif;
  text-align: right;
}
```

Full RTL UI switch is not supported in v1.0 but is architecturally prepared:
- No hardcoded `margin-left`, `margin-right`, `padding-left`, `padding-right` in CSS — use logical properties (`margin-inline-start`, etc.) going forward
- Sidebar icons symmetrical (no directional bias)

---

## 16. Performance Rules (Responsive)

- **Images:** Lazy-load all product images below the fold (`loading="lazy"`)
- **Fonts:** Load Inter/JetBrains Mono via `font-display: swap`
- **Above-fold content:** Preload hero image + critical CSS
- **Mobile:** No large animation sequences — `prefers-reduced-motion` respected
- **Skeleton screens:** Always used before first data load (never just a spinner)
- **JavaScript:** Code-split by route (Next.js automatic); admin and storefront bundles separated
