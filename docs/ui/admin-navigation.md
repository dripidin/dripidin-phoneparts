# HamzaPhone Admin Navigation Structure

> Version 1.0 — August 2026

---

## 1. Navigation Architecture

### Pattern: Persistent Sidebar (Desktop) + Bottom Sheet (Mobile)

The Admin Dashboard uses a **collapsible left sidebar** on desktop/tablet, and a **slide-in drawer + bottom tab bar** on mobile. This pattern is used by Shopify, Notion, and Linear — it scales well to 21+ navigation items.

---

## 2. Sidebar Structure

### Navigation Groups

The 21 navigation items are organized into **5 logical groups** separated by dividers:

```
━━━━━━━━━━━━━━━━━━━━━━
  HAMZAPHONE ADMIN
  [Store Health Strip]
━━━━━━━━━━━━━━━━━━━━━━

OVERVIEW
  ▸ Dashboard

━━━━━━━━━━━━━━━━━━━━━━
COMMERCE
  ▸ Orders              [badge: pending count]
  ▸ Products
  ▸ Categories
  ▸ Brands
  ▸ Pricing
  ▸ Import / Export

━━━━━━━━━━━━━━━━━━━━━━
OPERATIONS
  ▸ Inventory           [badge: low stock count]
  ▸ Suppliers
  ▸ Delivery
  ▸ Payments

━━━━━━━━━━━━━━━━━━━━━━
PEOPLE
  ▸ Customers
  ▸ B2B
  ▸ Notifications

━━━━━━━━━━━━━━━━━━━━━━
ANALYTICS & ADMIN
  ▸ Reports
  ▸ Activity Logs
  ▸ Users
  ▸ Roles & Permissions
  ▸ Trash               [badge: archived count]
  ▸ Website Settings
  ▸ System Settings
```

---

## 3. Sidebar States

### Desktop Expanded (width: 248px)
- Logo + brand name
- All section headings
- Full item labels
- Badges inline right
- Bottom: User avatar + role + logout

### Desktop Collapsed (width: 64px)
- Logo only
- Icon-only navigation
- Badge dots
- Hover tooltip shows label
- Toggle button on rail border

### Tablet (768–1024px)
- Collapsed by default (64px)
- Expand on hover (overlay)
- Or: hamburger opens full sidebar as overlay

### Mobile (< 768px)
- No sidebar
- Bottom tab bar: [Dashboard, Orders, Products, ···, Profile]
- Hamburger opens full-screen nav drawer
- Drawer swipes in from the left

---

## 4. Badge Counters

| Item | Badge Logic |
|---|---|
| Orders | Count of PENDING orders |
| Inventory | Count of out-of-stock + low-stock products |
| Trash | Count of soft-deleted items |
| Notifications | Count of unread notifications |

---

## 5. Keyboard Navigation

| Key | Action |
|---|---|
| `Ctrl+K` / `Cmd+K` | Open global command palette |
| `G O` | Go to Orders |
| `G P` | Go to Products |
| `G I` | Go to Inventory |

---

## 6. Header Structure (per page)

```
[Breadcrumb path]                          [Search] [Notifications] [Role] [Avatar]
[H1 Page Title]                            [Primary Action Button]
[Optional: filter pills / active filters]
```

---

## 7. Mobile Tab Bar (Primary 5 Items)

```
[Dashboard] [Orders] [Products] [Inventory] [More]
```

"More" opens full navigation drawer.

---

## 8. Page Layout Pattern

### Desktop Layout
```
┌──────────────────────────────────────────┐
│ SIDEBAR (248px)  │  MAIN CONTENT AREA    │
│                  │  ┌────────────────┐   │
│  Navigation      │  │  Page Header   │   │
│  Items           │  │  Breadcrumb    │   │
│                  │  │  Page Title    │   │
│                  │  │  Actions       │   │
│                  │  ├────────────────┤   │
│                  │  │  Content Area  │   │
│                  │  │  (Scrollable)  │   │
│                  │  └────────────────┘   │
└──────────────────────────────────────────┘
```

### Mobile Layout
```
┌────────────────────────┐
│  [Ham] Page Title  [+] │  ← Sticky Top Header
├────────────────────────┤
│                        │
│  Content Area          │
│  (Scrollable)          │
│                        │
├────────────────────────┤
│ [📊][📦][🛒][🏭][···] │  ← Fixed Bottom Tab Bar
└────────────────────────┘
```

---

## 9. Permission-Gated Navigation

Items that require specific permissions are hidden (not just disabled) for users without access.

| Navigation Item | Required Permission |
|---|---|
| Pricing | `pricing.read` |
| Import / Export | `products.import` |
| B2B | `b2b.view` |
| Roles & Permissions | `users.manage` |
| System Settings | `settings.manage` |
| Activity Logs | `audit.read` |
