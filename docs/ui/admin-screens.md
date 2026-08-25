# HamzaPhone — Admin Screens Specification

> Version 1.0 — August 2026  
> Consistent with: `design-system.md` · `admin-navigation.md`  
> Colors: `--color-brand: #FF6B00` · `--sidebar-bg: #111827`  
> Typography: Inter + JetBrains Mono

---

## Screen Inventory

| # | Screen | Nav Group | Route |
|---|---|---|---|
| 1 | Dashboard Overview | OVERVIEW | `/admin` |
| 2 | Orders List | COMMERCE | `/admin/orders` |
| 3 | Order Details | COMMERCE | `/admin/orders/:id` |
| 4 | Create Order | COMMERCE | `/admin/orders/new` |
| 5 | Products List | COMMERCE | `/admin/products` |
| 6 | Product Details / Edit | COMMERCE | `/admin/products/:id` |
| 7 | Create Product | COMMERCE | `/admin/products/new` |
| 8 | Categories | COMMERCE | `/admin/categories` |
| 9 | Brands | COMMERCE | `/admin/brands` |
| 10 | Inventory | OPERATIONS | `/admin/inventory` |
| 11 | Inventory Adjustment | OPERATIONS | `/admin/inventory/adjust` |
| 12 | Inventory History | OPERATIONS | `/admin/inventory/history` |
| 13 | Suppliers | OPERATIONS | `/admin/suppliers` |
| 14 | Supplier Details | OPERATIONS | `/admin/suppliers/:id` |
| 15 | Pricing Management | COMMERCE | `/admin/pricing` |
| 16 | Bulk Price Adjustment | COMMERCE | `/admin/pricing/bulk` |
| 17 | Import | COMMERCE | `/admin/import` |
| 18 | Export | COMMERCE | `/admin/export` |
| 19 | Import Result / Error Report | COMMERCE | `/admin/import/:jobId` |
| 20 | B2C Customers | PEOPLE | `/admin/customers` |
| 21 | B2C Customer Details | PEOPLE | `/admin/customers/:id` |
| 22 | B2B Customers | PEOPLE | `/admin/b2b` |
| 23 | B2B Business Details | PEOPLE | `/admin/b2b/:id` |
| 24 | B2B Approval Queue | PEOPLE | `/admin/b2b/approvals` |
| 25 | Employees / Staff | ANALYTICS & ADMIN | `/admin/users` |
| 26 | Roles | ANALYTICS & ADMIN | `/admin/roles` |
| 27 | Permissions | ANALYTICS & ADMIN | `/admin/roles/:roleId/permissions` |
| 28 | Delivery Management | OPERATIONS | `/admin/delivery` |
| 29 | Delivery Provider Details | OPERATIONS | `/admin/delivery/:providerId` |
| 30 | Payments | OPERATIONS | `/admin/payments` |
| 31 | Reports | ANALYTICS & ADMIN | `/admin/reports` |
| 32 | Notifications | PEOPLE | `/admin/notifications` |
| 33 | Activity Logs | ANALYTICS & ADMIN | `/admin/logs` |
| 34 | Trash / Archive | ANALYTICS & ADMIN | `/admin/trash` |
| 35 | Website Settings | ANALYTICS & ADMIN | `/admin/settings/website` |
| 36 | System Settings | ANALYTICS & ADMIN | `/admin/settings/system` |

---

## 1. Dashboard Overview

**Purpose:** High-level operational overview of the store's health, pending actions, and key metrics.  
**Role(s):** Super Admin, Operations Manager (read-only for others)  
**Navigation:** OVERVIEW → Dashboard  

### Sections

1. **Store Health Strip** — top-of-page banner showing API status (EcoTrack, Supabase)
2. **KPI Row** (4 cards) — CA du Mois, Commandes, Clients Actifs, Panier Moyen
3. **Alert Bar** — sticky critical alerts (stock rupture, pending B2B approvals, API errors)
4. **Revenue Chart + Activity Feed** — 2-column, 30-day bar chart + real-time activity
5. **Quick Stats Row** (3 cards) — Orders by Status, Critical Stock, Top Categories

### Primary Actions
- Export Rapport (Excel)
- Date range picker (This week / This month / Custom)

### Secondary Actions
- Click KPI card → navigate to relevant list screen
- Click Activity item → navigate to entity
- "Voir →" links inside alert bar

### Empty States
- No orders: "Aucune commande ce mois"
- No activity: "Aucune activité récente"

### Loading State
- Skeleton cards for all 4 KPIs
- Skeleton rows for activity feed
- Chart placeholder with shimmer

### Error State
- Alert warning banner: "Impossible de charger les données — Réessayer"

### Permission Requirements
- `dashboard.view` — required to access this screen
- Revenue figures hidden if `pricing.read` is absent

### Mobile Behavior
- KPIs stack 2×2
- Chart collapses to smaller height (120px)
- Activity feed scrolls in full-width card

### Business Rules
- Revenue figures are always in DZD
- KPI delta % is computed vs previous calendar month
- Pending order badge refreshes every 30 seconds (realtime subscription)

---

## 2. Orders List

**Purpose:** Browse, filter, search, and manage all customer orders.  
**Role(s):** Super Admin, Operations Manager, Support (read-only)  
**Navigation:** COMMERCE → Orders  

### Sections
1. **Page Header** — title, subtitle (total count), primary actions
2. **Status Tab Row** — Toutes / Pending / Processing / Shipped / Delivered / Cancelled
3. **Table Toolbar** — search, wilaya filter, delivery mode filter, date range, bulk action menu
4. **Orders Table** — paginated datagrid
5. **Pagination Footer**

### Table Columns
| Column | Type | Sortable | Notes |
|---|---|---|---|
| Checkbox | Select | No | Bulk select |
| N° Commande | String | No | `#HP-YYYY-NNNN` — orange, monospace |
| Client | Name + phone | No | B2B badge if applicable |
| Articles | Count | No | "N articles" |
| Total | DZD amount | Yes | Monospace |
| Wilaya | String | No | Name + code |
| Livraison | String | No | EcoTrack mode |
| Statut | Badge | Yes | See badge spec |
| Date | Datetime | Yes | Relative or absolute |
| Actions | Buttons | No | Context-sensitive |

### Filters
- Status tab (primary filter)
- Wilaya (58 wilayas)
- Delivery mode (EcoTrack Express / Standard / In-store)
- Date range (Today / This week / This month / Custom)
- Customer type (B2C / B2B)

### Search
- Debounce: 300ms
- Searches: order number, customer name, customer phone
- Instant results in table (no page reload)
- Clears on ✕ button

### Primary Actions
- Nouvelle Commande Manuelle → `/admin/orders/new`
- Export (CSV/Excel)

### Row Actions (context-sensitive per status)
| Status | Actions |
|---|---|
| PENDING | **Confirmer** (primary), Voir, Annuler |
| CONFIRMED | Passer en Processing, Voir, Annuler |
| PROCESSING | Marquer Prêt, Voir |
| READY_FOR_SHIPMENT | Créer Étiquette EcoTrack, Voir |
| SHIPPED | Voir Suivi, Voir |
| DELIVERED | Voir, Rembourser |
| CANCELLED | Voir (read-only) |

### Bulk Actions
- Confirmer (pending only)
- Exporter sélection
- Assigner mode livraison

### Destructive Actions
- **Annuler commande** — confirmation dialog required:
  - Dialog: "Annuler la commande #HP-YYYY-NNNN ?"
  - Secondary text: "Cette action est irréversible. Le stock sera réintégré automatiquement."
  - Confirm button: red "Annuler la commande"
  - Cancel button: "Non, conserver"

### Empty State
- Icon: 📦
- Title: "Aucune commande"
- Subtitle: Varies by active filter
- CTA: "Nouvelle Commande" if no filter; "Effacer les filtres" if filter active

### Loading State
- Skeleton rows (6) while fetching
- Table toolbar grayed out

### Permission Requirements
- `orders.read` — view list
- `orders.manage` — confirm/cancel/process actions
- `orders.delete` — cancel destructive action

### Mobile Behavior
- Table collapses to card list view (one card per order)
- Card shows: order number, customer, status badge, total, primary action button
- Swipe right on card → quick action (Confirmer / Voir)
- Tab row scrolls horizontally

---

## 3. Order Details

**Purpose:** Full view of a single order with timeline, items, delivery info, and action history.  
**Role(s):** Super Admin, Operations, Support  
**Navigation:** Orders List → Order row → Click  

### Sections
1. **Breadcrumb** — Admin / Commandes / #HP-YYYY-NNNN
2. **Order Header** — Order number, status badge, creation date, primary action
3. **Status Timeline** — horizontal step indicator (Pending → Confirmed → Processing → Shipped → Delivered)
4. **Order Items Table** — product image, name, SKU, qty, unit price, line total
5. **Pricing Summary** — Sous-total, Frais livraison, Remise, **Total DZD**
6. **Customer Info Card** — name, phone, email, customer type, link to profile
7. **Delivery Info Card** — address, wilaya, mode, EcoTrack tracking number + link
8. **Payment Info Card** — payment method, status
9. **Internal Notes** — text area for admin notes (not visible to customer)
10. **Activity Log** — timestamped history of status changes on this order

### Primary Actions (context per status)
- PENDING → **Confirmer**
- PROCESSING → **Créer Étiquette EcoTrack**
- SHIPPED → **Voir Suivi EcoTrack**

### Secondary Actions
- Imprimer / Exporter PDF
- Envoyer lien de suivi (SMS / Email)
- Modifier adresse de livraison (PENDING only)
- Ajouter une note interne

### Destructive Actions
- **Annuler commande** (PENDING / CONFIRMED only)
  - Confirmation dialog with order number and stock reintegration warning
- **Émettre un remboursement** (DELIVERED only)
  - Dialog with amount field and reason dropdown

### Forms — Internal Note
| Field | Type | Required |
|---|---|---|
| Note | Textarea | Yes |
| Visibilité | Toggle (Admin only / Staff visible) | No |

### Permission Requirements
- `orders.read` — view
- `orders.manage` — status transitions, notes
- `orders.delete` — cancel
- `payments.refund` — issue refund

### Mobile Behavior
- Stack all cards vertically
- Timeline collapses to vertical stepper
- "Actions" button opens bottom sheet with all available actions

---

## 4. Create Order (Manual)

**Purpose:** Admin creates an order on behalf of a customer (phone/walk-in sales).  
**Role(s):** Super Admin, Operations  
**Navigation:** Orders List → Nouvelle Commande  

### Form Sections

**Step 1 — Client**
| Field | Type | Required |
|---|---|---|
| Rechercher client existant | Instant search | No |
| OU créer client invité | Toggle | — |
| Nom complet | Text | Yes |
| Téléphone | Phone (+213…) | Yes |
| Email | Email | No |
| Type | B2C / B2B select | Yes |

**Step 2 — Produits**
| Field | Type | Required |
|---|---|---|
| Rechercher produit | Instant search (SKU / name) | Yes |
| Quantité | Number | Yes |
| Prix unitaire | DZD (pre-filled, editable) | Yes |
| Remise ligne | % or DZD | No |

**Step 3 — Livraison**
| Field | Type | Required |
|---|---|---|
| Mode | EcoTrack Express / Standard / Retrait | Yes |
| Adresse | Autocomplete from customer addresses | Yes |
| Wilaya | Select (58 wilayas) | Yes |
| Frais livraison | DZD (auto-calculated, editable) | Yes |

**Step 4 — Paiement**
| Field | Type | Required |
|---|---|---|
| Méthode | Cash / Virement / CIB | Yes |
| Statut | Payé / En attente | Yes |
| Note paiement | Text | No |

### Business Rules
- B2B orders automatically apply the client's tier pricing
- Stock reservation occurs on order confirmation, not creation
- Minimum order for B2B: 5 000 DA (configurable in System Settings)

---

## 5. Products List

**Purpose:** Browse, search, filter, and manage all 4 000+ product references.  
**Role(s):** Super Admin, Product Manager  
**Navigation:** COMMERCE → Produits  

### Table Columns
| Column | Type | Sortable |
|---|---|---|
| Checkbox | Select | No |
| Produit | Image + Name + Compatibility | No |
| SKU | Monospace string | No |
| Marque | Text | Yes |
| Catégorie | Badge | Yes |
| Coût | DZD monospace | Yes |
| Prix B2C | DZD orange | Yes |
| Prix B2B | DZD blue | Yes |
| Stock | Number with color-coded level | Yes |
| Statut | Badge | Yes |
| Actions | Icon buttons | No |

### Filters
- Marque (multi-select)
- Catégorie (hierarchical, multi-select)
- Statut (Active / Draft / Archived / Out of Stock / Low Stock)
- Fournisseur
- Price range (B2C min/max)
- Stock level (In Stock / Low / Out)

### Search
- Debounce: 250ms
- Searches: product name, SKU, compatible model
- Instant result count updates in filter chips

### Primary Actions
- Nouveau Produit → `/admin/products/new`
- Importer CSV/Excel
- Exporter

### Row Actions
- ✎ Modifier → `/admin/products/:id`
- ⧉ Dupliquer (creates draft copy)
- ⋯ More: Archiver, Supprimer, Voir sur la boutique

### Bulk Actions
- Archiver
- Activer / Désactiver
- Changer catégorie
- Ajustement prix % (opens Bulk Pricing tool)
- Exporter sélection
- Supprimer (destructive)

### Destructive Actions
- **Archiver** — soft delete. Requires confirmation if product has pending orders.
  - Dialog: "Archiver N produit(s) ?"
  - Warning if active orders reference the product
- **Supprimer définitivement** — only from Trash screen. Hard delete.
  - Dialog: "SUPPRIMER DÉFINITIVEMENT — cette action est irréversible"
  - Requires typing the product SKU to confirm

### Empty State
- Icon: 🛒
- "Aucun produit correspond à vos critères"
- CTA: "Effacer les filtres" or "Nouveau Produit"

### Permission Requirements
- `products.read` — view
- `products.write` — create/edit
- `products.delete` — archive/delete
- `pricing.read` — see cost/price columns

---

## 6. Product Details / Edit

**Purpose:** View and edit all product attributes, pricing, stock, compatibility, images, and supplier info.  
**Role(s):** Super Admin, Product Manager  

### Tabs
1. **Informations** — core product data
2. **Tarification** — B2C, B2B prices, cost, margin calculator
3. **Stock** — current stock, reservations, threshold settings
4. **Compatibilité** — phone model compatibility list
5. **Médias** — product images (up to 10), primary image selector
6. **Fournisseur** — linked supplier, supplier SKU, last update
7. **Publication** — visibility, B2B-only toggle, featured toggle, draft/active

### Tab 1 — Informations
| Field | Type | Required |
|---|---|---|
| Nom du produit | Text | Yes |
| SKU | Text (monospace) | Yes (unique) |
| Description courte | Textarea | No |
| Description complète | Rich text | No |
| Marque | Select | Yes |
| Catégorie | Hierarchical select | Yes |
| Sous-catégorie | Select | No |
| Tags | Multi-tag input | No |
| Poids (g) | Number | No |
| Dimensions (mm) | 3 × Number | No |

### Tab 2 — Tarification
| Field | Type | Required |
|---|---|---|
| Prix de revient (DZD) | Number monospace | Yes |
| Prix B2C (DZD) | Number monospace + orange | Yes |
| Marge B2C % | Auto-calculated, read-only | — |
| Prix B2B — Tier 1 | Number monospace + blue | No |
| Prix B2B — Tier 2 | Number monospace + blue | No |
| Prix B2B — Tier 3 | Number monospace + blue | No |
| Historique des prix | Link → price history modal | — |

### Tab 3 — Stock
| Field | Type | Required |
|---|---|---|
| Stock actuel | Number (read-only) | — |
| Stock réservé | Number (read-only) | — |
| Stock disponible | Number (read-only) | — |
| Seuil d'alerte | Number | Yes |
| Stock maximum | Number | No |
| Fournisseur principal | Select | No |

### Tab 5 — Médias
- Drag-and-drop image uploader (max 10, each max 5 MB)
- JPEG/PNG/WebP accepted
- First image = primary (catalog thumbnail)
- Images stored in Supabase Storage bucket `product-images/{product_id}/`
- Alt text field per image

### Primary Actions
- Sauvegarder
- Sauvegarder et continuer à modifier

### Destructive Actions
- **Archiver le produit** — confirmation dialog, warns if active orders
- **Supprimer l'image** — confirmation: "Supprimer cette image ?"

### Unsaved Changes Behavior
- Browser `beforeunload` warning if unsaved changes exist
- Yellow banner: "Modifications non sauvegardées — Sauvegarder ou Annuler"

---

## 7. Create Product

Identical to Product Details / Edit, but:
- All fields start empty
- Status defaults to **DRAFT**
- No tabs — single form with sections (tabs added after first save)
- Redirect to Product Details after creation

---

## 8. Categories

**Purpose:** Manage the category hierarchy for products.  
**Role(s):** Super Admin, Product Manager  

### Layout: 2-Column
- Left: category tree (hierarchical)
- Right: edit panel for selected category

### Category Tree Columns
- Category name
- Parent category
- Product count
- Status (Active / Hidden)
- Actions (Edit, Add sub-category, Archive)

### Form — Create/Edit Category
| Field | Type | Required |
|---|---|---|
| Nom | Text | Yes |
| Slug URL | Text (auto-generated) | Yes |
| Catégorie parente | Select | No |
| Description | Textarea | No |
| Image | File upload | No |
| Visible en boutique | Toggle | Yes |
| Ordre d'affichage | Number | No |

### Destructive Actions
- **Archiver catégorie** — only if 0 active products assigned
  - If products assigned: "Déplacez d'abord les N produits vers une autre catégorie"

---

## 9. Brands

**Purpose:** Manage product brands (Samsung, Apple, Xiaomi, etc.)  
**Role(s):** Super Admin, Product Manager  

### Table Columns
- Logo (thumbnail)
- Nom de la marque
- Slug
- Nombre de produits
- Statut
- Actions (Edit, Archive)

### Form — Create/Edit Brand
| Field | Type | Required |
|---|---|---|
| Nom | Text | Yes |
| Slug | Text (auto-generated) | Yes |
| Logo | File upload (SVG/PNG, max 200 KB) | No |
| Description | Textarea | No |
| Pays d'origine | Select | No |
| Site officiel | URL | No |
| Visible en boutique | Toggle | Yes |

---

## 10. Inventory

**Purpose:** View and manage stock levels across all products. Surface critical and out-of-stock items.  
**Role(s):** Super Admin, Operations, Product Manager  

### KPI Row
- Total Références
- En Rupture (red)
- Stock Critique (amber)
- Valeur Totale Stock (DZD)

### Table Columns
| Column | Type | Sortable |
|---|---|---|
| Checkbox | Select | No |
| Produit | Name | No |
| SKU | Monospace | No |
| Stock Actuel | Number (color-coded) | Yes |
| Seuil Alerte | Number | Yes |
| Réservé | Number | No |
| Disponible | Number | Yes |
| Valeur Stock | DZD | Yes |
| Niveau | Badge (OK / Critique / Rupture) | Yes |
| Actions | Buttons | No |

### Stock Level Color Rules
- ≥ threshold: green
- < threshold and > 0: amber
- = 0: red

### Filters
- Niveau (OK / Critique / Rupture)
- Marque
- Catégorie
- Fournisseur

### Row Actions
- Ajuster → opens inline Inventory Adjustment panel
- Réapprovisionner → opens Supplier link / PO creation
- Historique → `/admin/inventory/history?sku=XXX`

### Bulk Actions
- Ajustement groupé
- Exporter inventaire

---

## 11. Inventory Adjustment

**Purpose:** Manually add or remove stock units with a reason code.  
**Route:** `/admin/inventory/adjust` OR inline side panel  

### Form
| Field | Type | Required |
|---|---|---|
| Produit | Search + select | Yes |
| Type | Addition / Soustraction / Correction | Yes |
| Quantité | Number | Yes |
| Raison | Select (Réception / Perte / Retour / Correction / Inventaire Physique / Autre) | Yes |
| Note | Textarea | No |
| Document ref. | Text (bon de livraison, etc.) | No |

### Business Rules
- Stock cannot go below 0 (unless Correction type is selected)
- Every adjustment creates an `inventory_transactions` record
- Adjustments are logged in the Activity Log with the admin's identity

---

## 12. Inventory History

**Purpose:** Full audit trail of all stock movements for a specific product or all products.  
**Route:** `/admin/inventory/history`  

### Table Columns
- Date / Heure
- Produit + SKU
- Type de mouvement (badge)
- Quantité (±)
- Stock avant → après
- Raison
- Référence document
- Opérateur (admin user)

### Filters
- Produit / SKU search
- Type de mouvement
- Date range
- Opérateur

---

## 13. Suppliers

**Purpose:** Manage supplier relationships, product associations, and pricing feeds.  
**Role(s):** Super Admin, Operations  

### Table Columns
- Nom fournisseur
- Pays (flag + name)
- Nombre de produits liés
- Délai livraison
- Dernier import de prix
- Statut (Actif / Inactif)
- Actions

### Primary Actions
- Nouveau Fournisseur

### Form — Create/Edit Supplier
| Field | Type | Required |
|---|---|---|
| Nom | Text | Yes |
| Email | Email | Yes |
| Téléphone | Phone | No |
| Pays | Select | Yes |
| Délai livraison (jours) | Number range | No |
| Conditions de paiement | Select (Anticipé / Net 30 / Net 60) | No |
| Devise fournisseur | Select (USD / EUR / CNY / DZD) | Yes |
| Notes | Textarea | No |

---

## 14. Supplier Details

**Purpose:** View a single supplier, their linked products, price history, and import log.  

### Sections
1. **Supplier Header** — name, country, status, contact info
2. **Linked Products Tab** — table of products sourced from this supplier with supplier SKU and cost
3. **Price History Tab** — log of price updates from this supplier
4. **Import Log Tab** — history of imported catalogs from this supplier

### Actions
- Import nouveau fichier prix fournisseur (CSV/Excel)
- Lier produits existants
- Désactiver fournisseur

---

## 15. Pricing Management

**Purpose:** View and manage product pricing across B2C, B2B tiers, and historical changes.  
**Role(s):** Super Admin, Product Manager (with `pricing.read`)  

### Sections
1. **Bulk Adjustment Tool** (card) — filter + % or flat adjustment + preview
2. **Price Change History** (card) — recent price changes per product
3. **B2B Tier Configuration** (table) — tier name, client count, min order, discount %, conditions

### B2B Tier Table Columns
- Nom du niveau
- Clients associés
- Commande minimum (DZD)
- Remise sur Prix B2C
- Conditions
- Statut
- Actions

### Bulk Adjustment Tool Fields
| Field | Options |
|---|---|
| Filtre produits | Catégorie / Marque / Fournisseur / Sélection manuelle |
| Type de tarif | Prix B2C / Prix B2B / Les deux |
| Direction | Augmentation / Réduction |
| Valeur | % (default) or DZD flat |
| Planification | Immédiat / Date programmée |

### Business Rules
- Margin warning: alert if resulting B2C margin < 10%
- B2B price must always be ≤ B2C price — validation enforced
- All price changes are recorded in `price_history` table

---

## 16. Bulk Price Adjustment

**Route:** `/admin/pricing/bulk`  
**Purpose:** Step-by-step guided bulk price update with preview before applying.  

### Steps
1. **Sélection** — choose filter (category, brand, supplier, manual)
2. **Paramètres** — price type, direction, value
3. **Aperçu** — paginated table showing "Prix actuel → Prix futur" per product with margin delta
4. **Confirmation** — summary card + confirm button
5. **Résultat** — success count, error count, rollback option (within 10 minutes)

### Rollback
- After applying, a "Annuler ce changement" button appears for 10 minutes
- Clicking it restores all previous prices from `price_history` snapshot

---

## 17. Import

**Purpose:** Upload product catalog, price updates, or stock updates via CSV/Excel.  
**Route:** `/admin/import`  

### Sections
1. **File Upload Zone** — drag-and-drop or browse, with file type/size info
2. **Import Type Selector** — Catalogue complet / Prix uniquement / Stock uniquement / Compatible modèles
3. **Template Downloads** — Modèle Produits / Modèle Prix / Modèle Stock
4. **Encoding & Options** — column separator, encoding (UTF-8 / Windows-1256 for Arabic)

### Import Steps (shown after file upload)
1. Validation du fichier (format, size, encoding)
2. Validation des données (required fields, duplicates, invalid values)
3. Aperçu des changements (new / updated / skipped / errors — show counts and sample rows)
4. Confirmation (button to apply)
5. Traitement (progress bar, estimated time)
6. Résultat → redirect to Import Result screen

### Business Rules
- Max file size: 50 MB
- Accepted formats: `.xlsx`, `.xls`, `.csv`
- Import creates a job record in `import_jobs` table
- Validation errors shown inline — import blocked until resolved or explicitly skipped
- Duplicate SKU = update (not create) by default

---

## 18. Export

**Purpose:** Export product data, orders, or inventory to Excel/CSV.  
**Route:** `/admin/export`  

### Options
| Field | Options |
|---|---|
| Type de données | Produits / Commandes / Inventaire / Clients / Prix |
| Format | Excel (.xlsx) / CSV (.csv) |
| Contenu | Tout / Actifs uniquement / Sélection actuelle / Filtre avancé |
| Colonnes | Toutes / Catalogue public / Prix et stock uniquement / Custom |
| Devise | DZD (fixed) |

### Business Rules
- Customer data exports require `customers.export` permission
- Price exports (including cost) require `pricing.read` permission
- Export jobs are logged in Activity Log

---

## 19. Import Result / Error Report

**Route:** `/admin/import/:jobId`  
**Purpose:** Full result of a completed or failed import job.  

### Sections
1. **Job Summary** — file name, operator, timestamp, status badge
2. **Counts Row** — Créés / Mis à jour / Ignorés / Erreurs
3. **Erreurs Table** — row number, SKU, field, error description
4. **Success Preview** — sample of successfully imported rows
5. **Download Error Report** — CSV of all errors for offline correction

### States
- `PROCESSING` — progress bar, auto-refresh every 5 seconds
- `COMPLETED` — green success banner + counts
- `COMPLETED_WITH_ERRORS` — amber banner + error table
- `FAILED` — red banner + error reason + retry button

---

## 20. B2C Customers

**Purpose:** Manage individual customer accounts, purchase history, and addresses.  
**Role(s):** Super Admin, Support  

### Table Columns
- Avatar initials
- Nom + Email
- Type (B2C badge)
- Wilaya
- Nombre de commandes
- Dépenses totales (DZD)
- Dernière commande
- Statut (Actif / Suspendu / Non vérifié)
- Actions

### Filters
- Statut (Actif / Suspendu)
- Wilaya
- Date d'inscription
- Has orders / No orders

### Row Actions
- Voir profil
- Suspendre / Réactiver
- Exporter historique

---

## 21. B2C Customer Details

**Purpose:** Full profile of a single B2C customer.  

### Sections
1. **Profile Card** — avatar, name, email, phone, registration date, Supabase Auth method (Google/Facebook/Email)
2. **Addresses** — list of saved addresses (Domicile / Travail / Autre) with default indicator
3. **Order History** — mini order table (N° / Status / Total / Date)
4. **Statistics** — total orders, total spend, average basket, last active
5. **Admin Actions** — Send password reset, Suspend account, Merge accounts

### Actions
- **Suspendre le compte** — dialog: "Le client ne pourra plus se connecter ni passer de commandes."
- **Envoyer réinitialisation mot de passe** — triggers Supabase Auth email

---

## 22. B2B Customers

**Purpose:** Manage business accounts, their approval status, and tier assignment.  
**Role(s):** Super Admin, Operations  

### Table Columns
- Nom de l'entreprise + email
- Type (SARL / SNC / EI / SPA / Autre)
- Wilaya
- Niveau B2B (Tier badge)
- Nombre de commandes
- CA Total (DZD)
- Statut (Approuvé / En attente / Rejeté / Suspendu)
- Actions

### Alert
- Banner showing count of pending approvals with quick link

---

## 23. B2B Business Details

**Purpose:** Full view of a business account, their orders, tier, and contacts.  

### Sections
1. **Business Card** — name, legal type, registration number, address, website
2. **Contact List** — contacts within the business
3. **Tier & Pricing** — current tier, tier override option, credit terms
4. **Order History** — same as B2C but with B2B pricing displayed
5. **Documents** — uploaded commercial register, tax ID
6. **Admin Notes**

---

## 24. B2B Approval Queue

**Route:** `/admin/b2b/approvals`  
**Purpose:** Review and approve or reject new B2B registration requests.  

### Actions per application
- **Approuver** — opens dialog to select tier + credit terms → sends approval email
- **Demander des informations** — opens message composer
- **Rejeter** — dialog with reason field → sends rejection email

### Business Rules
- All approvals/rejections are logged in Activity Log
- Approved accounts immediately gain access to B2B prices on the storefront
- Email template sent on approval/rejection (configurable in Website Settings)

---

## 25. Employees / Staff (Users)

**Purpose:** Manage admin and staff user accounts with role assignments.  
**Role(s):** Super Admin only  

### Table Columns
- Avatar + Nom + Email
- Rôle (badge)
- Statut (Actif / Suspendu / Invitation en attente)
- Dernière connexion
- 2FA (✓ / ✗)
- Actions

### Actions
- **Inviter un utilisateur** — email invitation form with role selector
- **Modifier le rôle** — inline role change
- **Suspendre / Réactiver**
- **Révoquer l'invitation**
- **Réinitialiser 2FA** — requires Super Admin confirmation

### Destructive Actions
- **Supprimer utilisateur** — only if user has no audit log entries. Otherwise: Désactiver only.

---

## 26. Roles

**Purpose:** View and manage admin role definitions.  
**Route:** `/admin/roles`  

### Layout
- Left panel: role list with user counts
- Right panel: role detail / permission matrix

### Built-in Roles (non-deletable)
- `super_admin` — all permissions
- `product_manager` — products, pricing, inventory, import/export
- `operations` — orders, inventory, delivery, payments
- `support` — read-only customers, read-only orders

### Custom Roles
- Admins can create custom roles with granular permission selection

---

## 27. Permissions

**Route:** `/admin/roles/:roleId/permissions`  
**Purpose:** Edit the permission set for a specific role.  

### Permission Matrix
Rows = modules, Columns = actions (Voir / Créer / Modifier / Supprimer / Exporter / Admin)

| Module | View | Create | Edit | Delete | Export | Admin |
|---|---|---|---|---|---|---|
| Products | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | — |
| Orders | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | — |
| Pricing | ✓/✗ | — | ✓/✗ | — | ✓/✗ | — |
| Inventory | ✓/✗ | ✓/✗ | ✓/✗ | — | ✓/✗ | — |
| Customers | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | — |
| B2B | ✓/✗ | ✓/✗ | ✓/✗ | — | ✓/✗ | ✓/✗ |
| Users | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | — | ✓/✗ |
| Settings | ✓/✗ | — | ✓/✗ | — | — | ✓/✗ |
| Reports | ✓/✗ | — | — | — | ✓/✗ | — |
| Logs | ✓/✗ | — | — | — | ✓/✗ | — |
| Delivery | ✓/✗ | ✓/✗ | ✓/✗ | — | — | ✓/✗ |

### Business Rules
- Super Admin role permissions cannot be edited
- A user cannot grant permissions they do not themselves hold
- Permission changes take effect immediately (no re-login required)
- All changes logged in Activity Log

---

## 28. Delivery Management

**Purpose:** Configure delivery providers, view active shipments, and monitor EcoTrack integration.  
**Route:** `/admin/delivery`  

### Sections
1. **Provider Status Strip** — EcoTrack API health, last sync time
2. **Shipment KPIs** — En transit / Livrés / Retours / Délai moyen
3. **Active Shipments Table**
4. **Delivery Zones Configuration**

### Shipment Table Columns
- N° de suivi (EcoTrack)
- N° Commande (link)
- Client
- Wilaya
- Mode (Express / Standard)
- Statut EcoTrack
- Date d'expédition
- Actions (Voir suivi / Signaler problème)

### Delivery Zones
- 58 wilayas of Algeria
- Per-zone: Express available (Y/N), Standard available (Y/N), Estimated days, Base price

---

## 29. Delivery Provider Details

**Route:** `/admin/delivery/:providerId`  
**Purpose:** EcoTrack integration configuration and API key management.  

### Form — EcoTrack Config
| Field | Type |
|---|---|
| API Key | Password input (masked) |
| API Base URL | Text |
| Webhook Secret | Password input |
| Mode | Production / Sandbox |
| Timeout (ms) | Number |

### Sections
- API Connection Test button (returns status + latency)
- Webhook event log (last 50 events)
- Error log (last 50 API errors)

---

## 30. Payments

**Purpose:** Monitor payment transactions, manual payment recording, and reconciliation.  
**Route:** `/admin/payments`  

### Table Columns
- ID Transaction
- N° Commande
- Client
- Montant (DZD)
- Méthode (Cash / Virement / CIB)
- Statut (Payé / En attente / Remboursé / Échoué)
- Date
- Actions

### Actions
- Marquer comme payé (pending orders)
- Émettre remboursement
- Exporter relevé

---

## 31. Reports

**Purpose:** Pre-built analytics reports for business decision-making.  
**Route:** `/admin/reports`  

### Available Reports
| Report | Description |
|---|---|
| Ventes par période | Revenue, orders, basket by day/week/month |
| Top Produits | Best-selling products by revenue and units |
| Top Clients | Highest-value customers |
| Ventes par Wilaya | Geographic sales distribution |
| Rapport B2B | B2B-specific revenue, top businesses |
| Rapport Inventaire | Stock value, turnover rates |
| Rapport Fournisseurs | Cost analysis by supplier |
| Rapport Marges | Margin % by category / product |

### Common Controls
- Date range picker
- Export (Excel / CSV / PDF)
- Chart type selector (where applicable)

---

## 32. Notifications

**Purpose:** Manage notification templates and view sent notifications.  
**Route:** `/admin/notifications`  

### Sections
1. **Notification Inbox** — system alerts (stock, orders, B2B approvals)
2. **Templates** — email/SMS templates for order status changes, B2B approval, password reset
3. **Send Manual Notification** — to a specific customer or B2B account

### Template Fields
| Field | Type |
|---|---|
| Nom du template | Text |
| Trigger | Select (order confirmed / shipped / delivered / B2B approved / ...) |
| Canal | Email / SMS / Les deux |
| Sujet | Text (Email only) |
| Corps | Rich text with variables ({client_name}, {order_number}, etc.) |
| Langue | Français / Arabe / Les deux |

---

## 33. Activity Logs

**Purpose:** Full audit trail of all admin actions with filtering and export.  
**Route:** `/admin/logs`  

### Table Columns
- Horodatage (ISO 8601)
- Utilisateur (avatar + name)
- Action (badge: CREATE / UPDATE / DELETE / LOGIN / IMPORT / EXPORT / BULK)
- Ressource (module + entity name)
- Détails (summary of change)
- Adresse IP
- User Agent (expandable)

### Filters
- Utilisateur
- Action type
- Module (Products / Orders / Pricing / Users / ...)
- Date range
- IP address

### Business Rules
- Logs are immutable — no admin can delete log entries
- Retained for minimum 2 years
- Sensitive fields (passwords, API keys) are never logged — only action type

---

## 34. Trash / Archive

**Purpose:** View and manage soft-deleted items across all modules.  
**Route:** `/admin/trash`  

### Tabs
- Produits archivés
- Commandes annulées
- Clients suspendus
- Catégories archivées
- Marques archivées

### Table Columns (Products)
- Nom + SKU
- Date d'archivage
- Archivé par
- Raison
- Actions: **Restaurer** / **Supprimer définitivement**

### Destructive Actions
- **Supprimer définitivement** — requires typing the item name/SKU:
  - Dialog: "Tapez [SKU] pour confirmer la suppression définitive."
  - Confirmation input must match exactly
- **Vider la corbeille** — deletes ALL items in selected tab:
  - Dialog: "VIDER — Supprimer définitivement tous les produits archivés ?"
  - Requires typing "CONFIRMER"

### Business Rules
- Auto-purge: items in Trash > 90 days are flagged for review (not auto-deleted)
- Products with `inventory_transactions` history cannot be hard-deleted (audit integrity)

---

## 35. Website Settings

**Purpose:** Configure the public storefront appearance and content.  
**Route:** `/admin/settings/website`  

### Sections / Tabs
1. **Général** — store name, logo, favicon, contact email, phone, address
2. **Boutique** — default currency (DZD fixed), default language, meta title/description
3. **Pages** — About, Contact, Terms, Privacy — rich text editors
4. **Bannières** — homepage hero banners with image + link + CTA text
5. **Réseaux Sociaux** — Facebook, Instagram, TikTok links
6. **Emails** — reply-to email, email footer text, logo in emails
7. **Localisation** — timezone (Africa/Algiers), date format, number format

---

## 36. System Settings

**Purpose:** Technical configuration for integrations, security, and system behavior.  
**Route:** `/admin/settings/system`  
**Role(s):** Super Admin only  

### Sections / Tabs
1. **Intégrations** — EcoTrack API keys, Supabase config (read-only display)
2. **Authentification** — Enforce 2FA for admins, session timeout, allowed IP ranges
3. **Import/Export** — default encoding, max file size, auto-archive failed imports
4. **B2B** — min order amount for B2B, approval workflow (auto / manual), required documents
5. **Notifications** — SMTP config, SMS provider (future), Supabase notifications
6. **Performance** — CDN settings (future), image optimization
7. **Sauvegarde** — last backup date, trigger manual backup, export full DB snapshot
