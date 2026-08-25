# HamzaPhone — Global Interaction Rules

> Version 1.0 — August 2026  
> Consistent with: `design-system.md` · `admin-navigation.md`  
> Applies to: Admin Dashboard + Storefront

---

## 1. Navigation

### 1.1 Admin Sidebar

**Pattern:** Persistent left sidebar (desktop) + drawer (mobile)

| State | Width | Behavior |
|---|---|---|
| Expanded | 240px | Full labels, section headings, badges |
| Collapsed | 60px | Icons only, tooltip on hover showing label |
| Mobile open | Full-screen overlay | Swipe-in from left |
| Mobile closed | Hidden | Bottom tab bar visible |

**Toggle:** Collapse button on the sidebar rail border (circular, white, shadow). Toggling saves state to `localStorage` so it persists across page loads.

**Active item:** Orange `#FF6B00` background tint + orange text. Left accent line optional.

**Badge counters:** Always visible in both expanded and collapsed states. In collapsed mode: small red/orange dot on the icon rather than number.

**Hover tooltip:** In collapsed mode, hovering an icon shows a tooltip with the full label (right-positioned, 150ms delay).

**Section headings:** Only visible in expanded mode. Hidden (collapsed) — no label, just visual gap.

**Keyboard navigation:** `Tab` to move between nav items, `Enter` to activate. `Ctrl+K` / `Cmd+K` opens command palette (future).

### 1.2 Admin Header (Topbar)

Always `60px` tall. Contains:
- Sidebar toggle (hamburger icon)
- Breadcrumb (current location)
- Global search bar
- Action icons (external site link, notifications)
- User avatar + name + dropdown

**Global Search:** `Ctrl+K` focuses the search bar from anywhere. Results appear in a floating overlay, navigable by keyboard.

### 1.3 Breadcrumbs

**Format:** `Admin / [Section] / [Entity Name]`

- Each segment is a link except the last (current page)
- Current page segment: `--color-gray-900`, `font-weight: 500`
- Previous segments: `--color-gray-500`, clickable link → turns `--color-brand` on hover
- Separator: `/` in `--color-gray-300`

**Admin:** Always links to `/admin`  
**Max depth:** 4 levels (Admin / Section / Sub-section / Entity)  
**Truncation:** If entity name > 40 chars, truncate with ellipsis

### 1.4 Back Navigation

- **Admin:** Breadcrumb provides back navigation. No "Back" button unless on a detail page opened from a modal context.
- **Storefront:** `←` Back link at top of checkout steps, account sub-pages.
- **Never:** Use browser back in JS navigation — use explicit links.

### 1.5 Mobile Navigation (Admin)

- **Bottom tab bar** (fixed, 60px): Dashboard / Orders / Products / Inventory / More
- **More** tab: opens full-screen nav drawer (slides up from bottom)
- **Active tab:** orange icon + orange label below
- **Inactive:** gray icon + gray label

### 1.6 Mobile Navigation (Storefront)

- **Sticky top header:** Logo + Search icon + Cart icon + Account icon
- **Hamburger:** opens slide-in left drawer with full nav
- **Bottom tab bar** (optional, mobile-first): Home / Catalogue / Panier / Compte

---

## 2. Buttons

### 2.1 Primary Button

- Background: `--color-brand` (`#FF6B00`)
- Text: white, `font-weight: 600`
- Hover: `--color-brand-dark` (`#CC5500`) + `--shadow-brand`
- Active/Pressed: `transform: scale(0.98)`
- Focus: 2px orange outline, 2px offset
- Use for: main CTA only (one per section)

### 2.2 Secondary Button

- Background: white, border: `1.5px solid --color-gray-200`
- Text: `--color-gray-900`
- Hover: `--color-gray-50` background, `--color-gray-300` border
- Use for: complementary actions alongside Primary

### 2.3 Tertiary / Ghost Button

- Background: transparent, no border
- Text: `--color-gray-700`
- Hover: `--color-gray-100` background
- Use for: low-priority actions, icon-adjacent labels, inline links

### 2.4 Destructive Button

- Background: `--color-error` (`#DC2626`)
- Text: white
- Hover: `#B91C1C`
- Use for: irreversible actions (delete, cancel, revoke)
- **Rule:** Never show a Destructive button as the default/first action. Always behind a confirmation dialog.

### 2.5 Icon-Only Button

- Square: 32px (sm) / 36px (md)
- Same variant colors as above
- Always has a `title` attribute for accessibility
- Tooltip on hover (150ms delay)

### 2.6 Loading State

- Spinner replaces icon or text (text hidden, opacity: 0)
- Button disabled (`pointer-events: none`, `opacity: 0.7`)
- Spinner: white circle with transparent arc, 0.8s spin
- Duration: shown until API call resolves (success or error)

### 2.7 Disabled State

- Opacity: `0.45`
- Cursor: `not-allowed`
- `pointer-events: none`
- **Rule:** Use tooltip to explain WHY the button is disabled (e.g., "Complétez d'abord les champs requis")

---

## 3. Forms

### 3.1 Validation Strategy

- **Mode:** Validate on blur (when user leaves a field) — not on every keystroke
- **Exception:** Password strength meter shows on keystroke
- **Submit validation:** All fields validated on submit. First error field receives focus.

### 3.2 Required Fields

- Label suffix: asterisk `*` in `--color-error` (`*`)
- Legend at form top (optional for short forms): "Les champs marqués * sont obligatoires"
- **Never** add `required` visual ONLY in placeholder text — it disappears when user types

### 3.3 Inline Validation

- **Error:** Red border (`--color-error`), error icon in input right, red helper text below
- **Success:** Green border, checkmark icon (only on critical fields like email, SKU uniqueness)
- **Info helper:** Gray text below input (`--color-gray-500`, 12px)
- Error message: specific, actionable. NOT generic ("Ce champ est requis" ✓, "Error" ✗)

### 3.4 Error Messages by Field Type

| Field | Example Error Message |
|---|---|
| Email | "Adresse email invalide" / "Cet email est déjà utilisé" |
| Phone | "Format invalide (ex: 05 12 34 56 78)" |
| Password | "Minimum 8 caractères avec 1 chiffre et 1 majuscule" |
| Number (price) | "La valeur doit être supérieure à 0" |
| SKU | "Ce SKU existe déjà dans le catalogue" |
| Select | "Veuillez sélectionner une option" |
| File | "Format non accepté. Utilisez .xlsx, .csv ou .pdf" |

### 3.5 Success Messages

- After form submission: green alert banner at top of form OR toast notification
- Message: specific ("Produit HP-SCR-SAM-S22 créé avec succès")
- Duration: persistent banner (dismiss manually) or 4s toast

### 3.6 Unsaved Changes Warning

- When navigating away from a form with unsaved changes:
  - Browser `beforeunload` event → native dialog ("Voulez-vous quitter ? Les modifications non enregistrées seront perdues.")
  - In-app navigation (SPA links): custom modal dialog
- Yellow sticky banner at top of form when changes detected: "Modifications non sauvegardées — [Sauvegarder] [Annuler]"

### 3.7 Submit States

| State | Button | Form |
|---|---|---|
| Default | Primary enabled | Editable |
| Submitting | Loading spinner, disabled | Locked (all inputs disabled) |
| Success | Reverts to default OR success redirect | Success message |
| Error | Reverts to enabled | Error messages shown inline |

---

## 4. CRUD Operations

### 4.1 Create

1. Navigate to create form (dedicated route OR slide-in drawer for simple entities)
2. Fill form
3. Click primary Save button → loading state
4. On success: redirect to detail view + success toast ("Produit créé avec succès")
5. On error: stay on form, show inline errors

**Simple entities** (categories, brands, tags): use a right-side drawer instead of a full page.

### 4.2 View

- Read-only display of entity data
- Edit button in top-right of header → switches to edit mode (same page) OR navigates to edit route
- Back button / breadcrumb to return to list

### 4.3 Edit

- Same form as Create, pre-populated
- Changes tracked — yellow unsaved banner shown
- "Sauvegarder" → save + stay on page
- "Sauvegarder et quitter" → save + redirect to list
- "Annuler" → discard changes (confirmation if unsaved)

### 4.4 Delete

**Soft delete (archive):**
- Item moves to Trash screen
- Status badge changes to ARCHIVED
- Confirmation dialog (see §5)
- Undo toast visible for 10 seconds: "Archivé — [Annuler]"

**Hard delete (from Trash only):**
- Requires typing the entity name or SKU
- Irreversible — no undo
- Red confirm button

### 4.5 Restore

- From Trash: "Restaurer" button
- Item returns to its previous status (ACTIVE or DRAFT)
- Success toast: "Produit restauré avec succès"
- No confirmation dialog required (non-destructive)

### 4.6 Duplicate

- Available via ⋯ row action menu
- Creates an exact copy with:
  - Status: DRAFT
  - Name prefix: "Copie de [original name]"
  - New SKU: `[original-SKU]-COPY` (editable before save)
- Redirects to edit view of the new duplicate
- Success toast: "Copie créée — cliquez pour modifier"

### 4.7 Archive

- Soft-delete with ARCHIVED status
- Hidden from storefront and normal admin lists (unless "Archived" filter active)
- Can be restored at any time from Trash
- Certain archives blocked if entity has active dependencies (see individual screen specs)

---

## 5. Destructive Actions

### 5.1 Confirmation Dialog Rules

Every destructive action must show a confirmation dialog **before** executing.

**Standard Dialog Structure:**
```
[Title — describes the destructive action]
[Body — explains consequences, no jargon]
[Cancel button] [Confirm button — Destructive style]
```

**Rules:**
- Cancel is always the default/first button (keyboard Enter = cancel)
- Confirm button is red (`--color-error`)
- Focus on Cancel when dialog opens
- Dialog must not auto-close on backdrop click for high-risk actions
- Title must name the entity: "Supprimer HP-SCR-SAM-S22" not "Supprimer ce produit"

### 5.2 Severity Levels

| Level | Confirmation Required | Type |
|---|---|---|
| Low (archive) | Simple dialog — one click | Standard |
| Medium (cancel order, revoke access) | Dialog + reason field | Standard |
| High (hard delete, bulk delete) | Dialog + type name/SKU | Text confirmation |
| Critical (empty trash, purge data) | Dialog + type "CONFIRMER" | Text confirmation |

### 5.3 Bulk Destructive Actions

- Summary: "Vous êtes sur le point de supprimer **N** produits."
- List affected items (first 5, then "et N autres")
- Warning: items affected by cascading effects (orders, etc.)
- Type "CONFIRMER" to unlock the confirm button

### 5.4 Soft Delete First (Default Policy)

By default, all deletion actions are soft deletes (archive). Hard delete is only available:
- From the Trash screen
- After explicit "Vider la corbeille" action
- Exception: sensitive user data (GDPR compliance) may be hard-deleted on request

### 5.5 Undo / Restore

- After every soft delete: **10-second undo toast**
  - "X archivé(s) — [Annuler]"
  - Clicking "Annuler" immediately restores
  - After 10 seconds: toast disappears, item remains in Trash
- Hard deletes: no undo

---

## 6. Tables (DataGrids)

### 6.1 Row Click Behavior

- **Admin:** Click on a row → navigate to detail view (same as clicking entity name link)
- Exception: clicking on checkbox / action buttons does NOT navigate
- Cursor: `pointer` on row (except in checkbox/action columns)

### 6.2 Row Selection

- Checkbox column (leftmost) for multi-select
- "Select all on page" checkbox in header
- "Select all across all pages" prompt appears when page is fully selected
- Selected rows: light orange/brand-50 background
- Selection count shown in toolbar: "N sélectionnés — [Actions] ▾"

### 6.3 Bulk Actions

- Bulk action dropdown appears in toolbar when ≥ 1 row selected
- Actions vary per table (see individual screen specs)
- Destructive bulk actions trigger confirmation dialog (§5.3)

### 6.4 Sorting

- Clickable column headers for sortable columns
- ↕ icon: both directions possible (default/unsorted)
- ↑ / ↓ icon: shows active sort direction
- Single-column sort (no multi-column)
- Default sort specified per screen

### 6.5 Filtering

- Filters live in toolbar above table
- Active filters shown as chips below toolbar: `[Brand: Samsung ✕]`
- "Effacer tous les filtres" link shown when ≥ 1 filter active
- Filter state preserved in URL query params (shareable links)

### 6.6 Pagination

- Default page size: 10 rows (configurable per user: 10 / 25 / 50 / 100)
- Pagination controls: `‹ 1 2 3 … N ›`
- Current page: orange filled button
- Page size selector in footer: "Afficher N par page ▾"
- Row count in footer: "Affichage 1–10 sur N résultats"

### 6.7 Column Visibility

- ⊞ "Colonnes" button in toolbar
- Dropdown with toggle per column
- Hidden columns persist in `localStorage`
- Required columns (Name, Actions) cannot be hidden

### 6.8 Table Empty State

- Shown when no rows match current filters
- Icon relevant to content type
- Title + subtitle explaining the empty state
- CTA: either "Créer un élément" or "Effacer les filtres" depending on whether a filter is active

### 6.9 Table Loading State

- Skeleton rows (same height as data rows)
- Number of skeleton rows = previous page size or 6 (whichever is less)
- Table header visible during load (shows structure)
- Actions and checkboxes hidden during load

---

## 7. Search

### 7.1 Debounce

- Admin table search: **300ms** debounce
- Storefront instant search: **200ms** debounce
- Typing clears previous pending request (abort controller)

### 7.2 Instant Suggestions (Storefront)

- Appears after first character
- Groups: Produits / Catégories / Marques / Modèles
- Max 4–5 results per group
- Highlight matched term in result (bold)
- "Voir tous les résultats pour « X »" as last item

### 7.3 Keyboard Navigation

- `↓` / `↑` to navigate suggestions
- `Enter` on highlighted item: navigate to it
- `Enter` with no item highlighted: submit full search
- `Escape`: close suggestions, return focus to input
- `Tab`: close suggestions (move focus away)

### 7.4 Clear Search

- `✕` icon appears inside search input when value present
- Clicking ✕: clears input, closes suggestions, table resets to unfiltered state

### 7.5 No Results State

- Storefront overlay: "Aucune suggestion. Appuyez sur Entrée pour chercher."
- Table search no results: empty state with "Effacer la recherche"

### 7.6 Search Loading State

- Admin table: spinner appears inside search input right side
- Storefront overlay: skeleton suggestion items (3)
- Table rows show skeleton during re-fetch

### 7.7 Search Result Prioritization

**Admin Products:**
1. Exact SKU match
2. Name starts with query
3. Name contains query
4. Compatibility model match

**Storefront:**
1. Exact SKU
2. Product name (weighted by position)
3. Compatible phone model
4. Brand + category
5. Description

---

## 8. Modals / Drawers / Full Pages

### Decision Matrix

| Content | Size | Pattern |
|---|---|---|
| Confirmation dialog | Small (< 480px wide) | Modal, centered |
| Simple create form (1–5 fields) | Medium (480–640px) | Modal or Right Drawer |
| Complex create/edit form | Full page | New route |
| Detail view (quick preview) | Large (800px+) | Right Drawer |
| Critical warning | Small, centered | Modal (no backdrop close) |
| Bulk pricing preview | Full page overlay | Overlay with close |
| Import step wizard | Full page | Route |

### Modal Rules

- Backdrop: `rgba(0,0,0,0.4)`, click closes (except Critical level)
- Escape key always closes (except Critical level)
- Focus trapped inside modal while open
- First interactive element receives focus on open
- Scroll lock on body while modal open
- Animation: fade in + scale from 0.95→1.0, 200ms

### Drawer Rules

- Right drawer: 480px wide (desktop), full-width (mobile)
- Animation: slide in from right, 250ms ease
- Backdrop click closes
- Close button (✕) top-right always visible
- Page behind remains interactive visually (dimmed)

---

## 9. Notifications

### 9.1 Toast Notifications

- Position: top-right corner (desktop), top-center (mobile)
- Width: 320–400px
- Auto-dismiss: 4 seconds (success/info), persistent (error)
- Manual dismiss: ✕ button
- Max 3 toasts visible at once (queue additional)
- Stack below each other (newest on top)
- Animation: slide in from right, fade out

| Type | Color | Duration |
|---|---|---|
| Success | Dark green `#065F46` | 4s auto-dismiss |
| Error | Dark red `#991B1B` | Persistent (manual dismiss) |
| Warning | Dark amber `#92400E` | 6s auto-dismiss |
| Info | Dark gray `#111827` | 4s auto-dismiss |

### 9.2 Persistent Notification Banner

- Shown at top of page (below topbar) for critical ongoing issues
- Orange for warnings, red for errors
- Dismissable (✕) unless system-level
- Example: "EcoTrack API déconnecté — Les expéditions ne peuvent pas être créées"

### 9.3 Admin Notification Inbox

- Bell icon in topbar with red dot + count badge
- Dropdown shows last 5 notifications
- "Voir toutes les notifications" link → `/admin/notifications`
- Categories: Stock alert / New order / B2B approval / System

---

## 10. Permissions (UI Treatment)

### 10.1 Principle

Show users **only what they can act on**. Hiding is preferred over disabling. Disabling is preferred over showing an access error after clicking.

### 10.2 Rules by Situation

| Situation | Treatment |
|---|---|
| Navigation item user cannot access | **Hidden** entirely from sidebar |
| Action button user cannot perform | **Hidden** from toolbar / row actions |
| Column user cannot see (e.g., cost price) | **Hidden** from table columns |
| Form field user cannot edit | **Read-only** (disabled input with lock icon) |
| Entire page user cannot access | Redirect to `/admin` with "Accès refusé" toast |

### 10.3 Read-Only Mode

When a user has `view` but not `write` permission on a module:
- All form inputs: disabled with `cursor: default`
- "Modifier" buttons: hidden
- Lock icon shown at top of form: "Vous avez accès en lecture seule"
- Data is still displayed normally

### 10.4 Never

- Never show a broken UI because a permission is missing
- Never show an action that silently fails
- Never route to a permission error page without context (use toast + redirect)

---

## 11. Data Synchronization

### 11.1 Admin → Database → Storefront

**Expectation:** Product/price/inventory changes made in admin are visible on the storefront within **< 5 seconds** (via Supabase Realtime or revalidation).

**Implementation pattern:**
1. Admin mutation → Supabase write
2. Supabase Realtime → broadcast to any connected storefront sessions
3. Next.js ISR (Incremental Static Regeneration) revalidation on product/category pages: `revalidatePath('/produits/[slug]')` on save

### 11.2 Storefront → Database → Admin

**Expectation:** New orders appear in admin within **< 2 seconds** (Supabase Realtime subscription on `orders` table).

**Admin dashboard** uses a Supabase Realtime subscription to refresh the pending order badge count and recent activity feed without polling.

### 11.3 Optimistic Updates

Used in:
- **Cart:** Adding/removing items updates the UI immediately; server confirms async
- **Toggle switches:** (product active/inactive) — toggle flips immediately, reverts on error
- **Inventory adjustment:** Stock number updates immediately after submit

**Rollback on error:**
- Revert optimistic state
- Show error toast: "Échec — La modification n'a pas été appliquée"
- Re-fetch fresh data from server

### 11.4 Loading States

| Context | Pattern |
|---|---|
| Initial page load | Skeleton components |
| Search / filter | Table skeleton rows |
| Form submit | Loading button |
| Async data on detail page | Inline spinner in the section |
| Background sync (EcoTrack) | Subtle spinner in status strip |

### 11.5 Revalidation

- Stale-while-revalidate: storefront product pages cached, revalidated every 60 seconds passively
- On explicit admin save: immediate `revalidatePath` call
- Orders: never cached — always fresh from DB

### 11.6 Realtime Updates

Supabase Realtime channels used:
- `orders` — admin badge counter, recent activity
- `inventory` — stock level alerts
- `notifications` — admin notification bell
- `stock_alerts` — trigger badge on inventory nav item

---

## 12. Accessibility (Minimum Requirements)

- All interactive elements keyboard-navigable
- Focus ring: 2px solid `--color-brand`, 2px offset (never hidden with `outline: none` without replacement)
- Color is never the only indicator (always paired with text or icon)
- `aria-label` on icon-only buttons
- Form errors linked with `aria-describedby` to the input
- Modals: focus trapped, `aria-modal="true"`, `role="dialog"`
- Images: `alt` text on all product images
- Status badges: `aria-label` includes full status text
- Minimum touch target: 44×44px (mobile)
- `prefers-reduced-motion`: disable all non-essential animations

---

## 13. Error Handling (Global)

| Error | User-Facing Message | Recovery |
|---|---|---|
| Network timeout | "La requête a expiré. Vérifiez votre connexion." | Retry button |
| 401 Unauthorized | Redirect to login | Auto-redirect |
| 403 Forbidden | "Accès refusé." + toast | Redirect to safe page |
| 404 Not Found | "Cet élément n'existe plus." | Back to list link |
| 500 Server Error | "Une erreur est survenue. Notre équipe a été informée." | Retry button |
| Validation error (API) | Show inline on the relevant field | Stay on form |
| EcoTrack API error | "EcoTrack indisponible. Réessayez dans quelques minutes." | Retry + manual fallback |

All API errors are logged server-side. Client displays user-friendly messages only — never raw error codes or stack traces.
