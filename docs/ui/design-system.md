# HamzaPhone Design System

> Version 1.0 — August 2026
> Platform: Algerian Smartphone Replacement Parts E-Commerce

---

## 1. Brand Identity

**Brand Name:** HamzaPhone  
**Tagline:** الجزائر #1 في قطع غيار الهواتف  
**Mission:** Fast, trustworthy smartphone parts for Algerian repair shops and end consumers.

---

## 2. Color Palette

### Primary Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-brand` | `#FF6B00` | Primary CTA, active states, highlights |
| `--color-brand-dark` | `#CC5500` | Hover on primary |
| `--color-brand-light` | `#FFF0E6` | Tint backgrounds, selected states |
| `--color-brand-50` | `#FFF7F0` | Very light brand tint |

### Neutral Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-gray-950` | `#0A0A0A` | Primary display text |
| `--color-gray-900` | `#111827` | Body text, headings |
| `--color-gray-700` | `#374151` | Secondary text |
| `--color-gray-500` | `#6B7280` | Placeholder, metadata |
| `--color-gray-400` | `#9CA3AF` | Disabled text |
| `--color-gray-200` | `#E5E7EB` | Borders, dividers |
| `--color-gray-100` | `#F3F4F6` | Card backgrounds, hover backgrounds |
| `--color-gray-50` | `#F9FAFB` | Page background |
| `--color-white` | `#FFFFFF` | Component backgrounds |

### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#059669` | Order delivered, in stock |
| `--color-success-bg` | `#ECFDF5` | Success backgrounds |
| `--color-warning` | `#D97706` | Low stock, pending |
| `--color-warning-bg` | `#FFFBEB` | Warning backgrounds |
| `--color-error` | `#DC2626` | Out of stock, cancelled, destructive |
| `--color-error-bg` | `#FEF2F2` | Error backgrounds |
| `--color-info` | `#2563EB` | Information, B2B tier |
| `--color-info-bg` | `#EFF6FF` | Info backgrounds |

---

## 3. Typography

### Typeface

**Primary:** `Inter` (Google Fonts)  
**Monospace:** `JetBrains Mono` (for SKUs, barcodes, codes)  
**Arabic fallback:** `Noto Sans Arabic`

### Scale

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `--text-display` | 36px / 2.25rem | 800 | 1.1 | Hero, page titles |
| `--text-h1` | 28px / 1.75rem | 700 | 1.25 | Page main heading |
| `--text-h2` | 22px / 1.375rem | 700 | 1.3 | Section headings |
| `--text-h3` | 18px / 1.125rem | 600 | 1.35 | Card headings |
| `--text-body-lg` | 16px / 1rem | 400 | 1.6 | Long-form body |
| `--text-body` | 14px / 0.875rem | 400 | 1.5 | Default text |
| `--text-small` | 13px / 0.8125rem | 400 | 1.5 | Supporting text |
| `--text-xs` | 12px / 0.75rem | 400 | 1.4 | Metadata, labels |
| `--text-label` | 11px / 0.6875rem | 600 | 1.2 | UPPERCASE form labels |
| `--text-table` | 13px / 0.8125rem | 400 | 1.4 | Table cells |
| `--text-mono` | 13px / 0.8125rem | 500 | 1.4 | SKU, barcode, code |

### Mobile Type Scale (< 768px)

Reduce display → 28px, H1 → 22px, H2 → 18px.  
All other scales remain. Minimum body size: 14px.

---

## 4. Spacing System

Based on **4px grid**:

```
4px   (1) — micro gap
8px   (2) — element internal padding
12px  (3) — compact spacing
16px  (4) — standard spacing
20px  (5) — comfortable spacing
24px  (6) — section spacing (small)
32px  (8) — section spacing (medium)
48px  (12) — section spacing (large)
64px  (16) — hero padding
```

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Tags, badges |
| `--radius-md` | 8px | Buttons, inputs, dropdowns |
| `--radius-lg` | 12px | Cards, modals |
| `--radius-xl` | 16px | Feature cards, hero sections |
| `--radius-2xl` | 24px | Bottom sheets (mobile) |
| `--radius-full` | 9999px | Pills, avatars, switches |

---

## 6. Shadow Tokens

| Token | CSS Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards (resting) |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Dropdowns, popovers |
| `--shadow-lg` | `0 10px 25px rgba(0,0,0,0.1)` | Modals, drawers |
| `--shadow-brand` | `0 4px 12px rgba(255,107,0,0.25)` | Primary button hover |

---

## 7. Motion & Animation

| Token | Value | Usage |
|---|---|---|
| `--duration-instant` | 80ms | Hover feedback |
| `--duration-fast` | 150ms | Button state changes |
| `--duration-normal` | 250ms | Panel open/close |
| `--duration-slow` | 400ms | Modal, drawer |
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Most transitions |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Micro-interactions |

Respect `prefers-reduced-motion`. Disable or simplify animations when active.

---

## 8. Component States

Every interactive component must support these states:

| State | Visual Treatment |
|---|---|
| **Default** | Base style |
| **Hover** | Slight background lift or border change |
| **Focus** | 2px solid `--color-brand` outline, 2px offset |
| **Active / Pressed** | Scale 0.98, darker shade |
| **Loading** | Spinner icon + disabled interaction |
| **Disabled** | 40% opacity, `cursor: not-allowed` |
| **Error** | Red border + error message below |
| **Success** | Green border/icon feedback |

---

## 9. Button Variants

| Variant | Use Case |
|---|---|
| **Primary** | Main CTA (Add to Cart, Confirm, Save) |
| **Secondary** | Less important action |
| **Ghost** | Tertiary, navigation |
| **Destructive** | Delete, Cancel Order |
| **Link** | Inline text action |
| **Icon** | Compact actions in tables, toolbars |

### Button Sizes

| Size | Height | Padding | Font |
|---|---|---|---|
| **xs** | 28px | 8px 12px | 12px |
| **sm** | 36px | 10px 16px | 13px |
| **md** | 40px | 12px 20px | 14px |
| **lg** | 48px | 14px 24px | 16px |
| **xl** | 56px | 16px 32px | 18px |

---

## 10. Form Components

### Input Fields
- Height: 40px (md), 36px (sm)
- Border: 1.5px solid `--color-gray-200`
- Border Radius: `--radius-md`
- Focus: Orange ring 2px
- Error: Red border + message
- Prefix/Suffix icon support

### Select / Dropdown
- Same height and border treatment as input
- Custom arrow
- Multi-select: checkbox pattern
- Searchable dropdown: search input inside

### Checkbox & Radio
- Custom styled — orange fill when selected
- 18×18px
- Touch target: 44×44px minimum

### Switch / Toggle
- Orange when on, gray when off
- Animated thumb
- Label always adjacent

---

## 11. Status Badges (Order / Product)

| Status | Color | Badge Style |
|---|---|---|
| PENDING | Amber | Yellow pill |
| CONFIRMED | Blue | Blue pill |
| PROCESSING | Indigo | Indigo pill |
| READY_FOR_SHIPMENT | Purple | Purple pill |
| SHIPPED | Orange | Orange pill |
| DELIVERED | Green | Green pill |
| CANCELLED | Red | Red pill |
| RETURNED | Gray | Gray pill |
| REFUNDED | Gray | Gray pill |
| FAILED | Red | Red outline |

---

## 12. Product Status Badges

| Status | Color |
|---|---|
| ACTIVE | Green |
| DRAFT | Gray |
| ARCHIVED | Red outline |
| OUT_OF_STOCK | Red |
| LOW_STOCK | Amber |

---

## 13. Grid System

### Desktop (≥ 1280px)
- 12-column grid
- 1280px max container
- 24px gutter

### Laptop (≥ 1024px)
- 12 columns
- 20px gutter

### Tablet (≥ 768px)
- 8 columns
- 16px gutter

### Mobile (< 768px)
- 4 columns (or full-width single column for most views)
- 16px margins

---

## 14. Iconography

**Library:** Lucide Icons (consistent with existing Admin component library)

**Sizes:**
- 16px — inline text icons
- 20px — button icons
- 24px — navigation icons
- 32px — feature icons
- 48px — empty states

Always use stroke icons, not filled, for consistency.

---

## 15. Image Treatment

### Product Images
- Aspect ratio: **1:1** (square)
- Background: `--color-gray-50`
- Radius: `--radius-md`
- Object-fit: `contain` (show full part, no cropping)

### Brand Logos
- Max width: 120px
- Grayscale by default, color on hover
- White background

### Avatar / Profile
- Circle: `--radius-full`
- Placeholder: Orange initials on light orange background

---

## 16. Z-Index Scale

```
10   — Sticky headers
20   — Dropdowns, tooltips
30   — Modals backdrop
40   — Modals, drawers
50   — Toasts, notifications
```
