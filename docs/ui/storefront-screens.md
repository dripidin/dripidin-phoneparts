# HamzaPhone — Storefront Screens Specification

> Version 1.0 — August 2026  
> Consistent with: `design-system.md` · `admin-navigation.md`  
> Brand: Orange `#FF6B00` × White · Mobile-first · Algeria market

---

## Screen Inventory

| # | Screen | User Type | Route |
|---|---|---|---|
| 1 | Homepage | All | `/` |
| 2 | Product Listing (PLP) | All | `/produits` |
| 3 | Category Listing | All | `/categories/:slug` |
| 4 | Brand Listing | All | `/marques/:slug` |
| 5 | Search Results | All | `/recherche?q=...` |
| 6 | Instant Search / Suggestions | All | Overlay (global) |
| 7 | Product Details (PDP) | All | `/produits/:slug` |
| 8 | Product Compatibility Selection | All | `/produits/:slug#compatibilite` |
| 9 | Cart | All | `/panier` |
| 10 | Checkout | Auth + Guest | `/checkout` |
| 11 | Login | Guest | `/connexion` |
| 12 | Register | Guest | `/inscription` |
| 13 | Social Login | Guest | OAuth redirect |
| 14 | Forgot Password | Guest | `/mot-de-passe-oublie` |
| 15 | Customer Account | B2C Auth | `/compte` |
| 16 | Profile | B2C Auth | `/compte/profil` |
| 17 | Address Management | Auth | `/compte/adresses` |
| 18 | Order History | Auth | `/compte/commandes` |
| 19 | Order Details (customer) | Auth | `/compte/commandes/:id` |
| 20 | Guest Order Tracking | Guest | `/suivi-commande` |
| 21 | B2B Registration | Guest / B2C | `/b2b/inscription` |
| 22 | B2B Account | B2B Auth | `/compte/b2b` |
| 23 | B2B Pricing Experience | B2B Auth | Integrated in PLP/PDP |
| 24 | Wishlist | Auth (optional) | `/compte/liste-envies` |
| 25 | Recently Viewed | All | Component (persistent) |
| 26 | Related Products | All | Component (on PDP) |
| 27 | Order Success | Auth + Guest | `/commande/succes/:id` |
| 28 | Error / Not Found | All | `/404`, `/500` |
| 29 | Contact / Support | All | `/contact` |
| 30 | Trust / Reviews / Social Proof | All | Component (Homepage, PDP) |

---

## 1. Homepage

**Purpose:** First impression, traffic conversion, product discovery, trust building.  
**User Type:** All (B2C, B2B, Guest)  
**Primary CTA:** "Voir nos Produits" / "Rechercher votre pièce"  

### Sections (top → bottom)

1. **Sticky Navigation Bar**
   - Logo, search bar (instant), Cart icon + count, Account icon, B2B link
   - On scroll: shadow appears, stays pinned

2. **Hero Banner**
   - Full-width carousel (1–3 banners)
   - Headline, sub-headline, CTA button
   - Mobile: single image, reduced text
   - Configured via Website Settings (admin)

3. **Instant Search Bar** (large, centered, above the fold on mobile)
   - Placeholder: "Rechercher votre pièce... (ex: écran Samsung S22)"
   - On focus: opens suggestions overlay

4. **Category Grid**
   - 6–8 primary categories with icon + label
   - Mobile: 2-column scroll
   - Desktop: horizontal row or 3-column grid

5. **Featured Products Rail** (horizontal scroll)
   - "Pièces populaires ce mois"
   - Product cards with image, name, price, Add to Cart

6. **Brand Logos Row**
   - Samsung, Apple, Xiaomi, Huawei, Oppo, Realme, Vivo, Tecno, ...
   - Grayscale → color on hover
   - Link to `/marques/:slug`

7. **Trust Signals Section**
   - 4 icons: 🚚 Livraison 48h / ✅ Pièces OEM + Compatibles / 🏆 4 000+ Références / 🔧 SAV Algérie
   - Clean icon + headline + short text layout

8. **Social Proof Section**
   - "Ils nous font confiance" — customer count badge
   - 3–4 review cards (star rating, quote, city, date)
   - If Avis Vérifiés or Google Reviews integrated: live widget

9. **B2B Call-to-Action Banner**
   - Orange background section: "Vous êtes réparateur ou revendeur ? Rejoignez le programme B2B HamzaPhone"
   - CTA: "Créer un compte B2B"
   - Only shown to non-authenticated or B2C users

10. **Recently Viewed** (persistent, localStorage-based)
    - Shown only if user has browsed products in this session

11. **Footer**
    - Links: Catalogue, B2B, Contact, Mentions légales, Conditions, Confidentialité
    - Social: Facebook, Instagram
    - Copyright + Algerian legal mentions

### SEO
- `<title>` — "HamzaPhone — N°1 Pièces Détachées Smartphones en Algérie"
- `<meta name="description">` — 155 chars targeting Algeria + "pièces détachées"
- Schema.org: `Organization`, `WebSite` with `SearchAction`
- Open Graph: homepage og:image featuring brand logo + orange brand

### Mobile Behavior
- Hero banner: single-image, 16:9 ratio
- Category grid: 2×3 scroll
- Trust signals: 2-column grid
- CTA button full-width below hero text

### B2C/B2B Differences
- Authenticated B2B users see B2B pricing on product rails
- B2B CTA section hidden for authenticated B2B users

---

## 2. Product Listing (PLP)

**Purpose:** Browse and filter the full product catalog. Primary discovery surface.  
**User Type:** All  
**Primary CTA:** Add to Cart (on product card)  
**Route:** `/produits`  

### Layout
- **Desktop:** Sidebar filters (left 240px) + Product grid (right)
- **Mobile:** Collapsible filter drawer + product grid

### Filter Sidebar
- Marque (checkbox list with counts)
- Catégorie (hierarchical tree)
- Compatibilité (phone model search + select)
- Prix (range slider, DZD)
- Disponibilité (En stock / Rupture toggle)
- Tri (Pertinence / Prix ↑ / Prix ↓ / Nouveautés / Meilleures ventes)

### Product Card (grid cell)
- Product image (1:1, white background)
- Brand badge (top-left corner)
- Product name (max 2 lines)
- Compatibility summary (e.g., "Samsung S22 · S22+")
- Price (B2C or B2B if authenticated)
- Stock badge (En stock / Stock limité / Rupture)
- Add to Cart button (disabled if out of stock)

### Grid Density
- Desktop: 4 columns (1280px+), 3 columns (1024px)
- Tablet: 2–3 columns
- Mobile: 2 columns (tight layout, compact card)

### Pagination
- Infinite scroll (default) with "Charger plus" button as fallback
- SEO: paginated links (`?page=N`) for search engines

### Search within PLP
- Refines current listing without leaving the page
- Debounce 300ms, updates grid in place

### Empty State
- "Aucun produit correspond à vos critères"
- Show applied filters with ✕ to remove each
- CTA: "Voir tout le catalogue"

### Loading State
- Skeleton cards (6–12 ghost cards) while fetching

### SEO
- Canonical per filter combination
- `<title>` — "Pièces Détachées [Catégorie] — HamzaPhone Algeria"
- Structured data: `ItemList` with product entries
- No-index on combined filter pages with 0–1 results

### B2C/B2B Differences
- B2B users see their tier price replacing B2C price
- B2B price displayed with blue badge "Prix B2B Tier N"
- B2B users see a "Ajouter à la commande groupée" option

---

## 3. Category Listing

**Purpose:** Browse all products within a specific category.  
**Route:** `/categories/:slug`  

Same layout as PLP. Differences:
- Breadcrumb: Homepage / Catégories / [Category Name]
- Page H1: category name
- Category description block at top
- Sub-category chips for navigation to child categories
- Sidebar filters pre-filtered to this category

### SEO
- `<title>` — "[Category Name] — Pièces Détachées Smartphones | HamzaPhone"
- Schema.org `BreadcrumbList`

---

## 4. Brand Listing

**Purpose:** Browse all products from a specific brand.  
**Route:** `/marques/:slug`  

Same layout as PLP. Differences:
- Brand logo displayed prominently in header
- Breadcrumb: Homepage / Marques / [Brand Name]
- "Tous les modèles [Brand]" sub-filter chips
- Compatible models filter prominent

### SEO
- `<title>` — "Pièces Détachées [Brand Name] — HamzaPhone Algeria"

---

## 5. Search Results

**Purpose:** Show full search results after query submission.  
**Route:** `/recherche?q=...`  

### Layout
- Search bar at top with current query (editable)
- Result count: "N résultats pour « [query] »"
- Same product grid as PLP
- Filters sidebar active

### Result Ranking Priority
1. Exact SKU match
2. Product name match (weighted by word position)
3. Compatibility model match
4. Brand + category match
5. Description match

### No Results State
- Icon 🔍
- "Aucun résultat pour « [query] »"
- Suggestions: "Avez-vous essayé ?" — 3–5 related search terms
- Popular products section below

### SEO
- `<meta name="robots" content="noindex">` for search pages
- `<title>` — "Recherche : [query] | HamzaPhone"

---

## 6. Instant Search / Search Suggestions

**Purpose:** Real-time search suggestions before the user presses Enter.  
**Location:** Global overlay triggered by search bar focus  

### Behavior
- Trigger: on focus + after 1st character typed
- Debounce: 200ms
- API call: `/api/search/suggest?q=...`

### Overlay Content (grouped)
1. **Produits** — top 4–5 product results (thumbnail, name, price)
2. **Catégories** — top 2–3 matching categories
3. **Marques** — top 2–3 matching brands
4. **Modèles** — top 2–3 compatible phone models

### Keyboard Navigation
- `↓` / `↑` — navigate suggestions
- `Enter` — select focused suggestion or submit search
- `Escape` — close overlay without submitting

### Close Behavior
- Click outside overlay
- Escape key
- Selecting a result

### No Results (instant)
- "Aucune suggestion — Appuyez sur Entrée pour rechercher"

---

## 7. Product Details (PDP)

**Purpose:** Full product information to drive purchase decision.  
**User Type:** All  
**Primary CTA:** "Ajouter au Panier"  
**Route:** `/produits/:slug`  

### Layout
- **Desktop:** 2-column — images left (sticky), info right
- **Mobile:** stacked — image → info → description → compatibility → related

### Right Column Sections
1. **Breadcrumb** — Home / Catégorie / Produit
2. **Brand badge** + Stock badge
3. **Product Name** (H1)
4. **Compatibility Summary** — "Compatible avec : Samsung Galaxy S22, S22+"
5. **Price Display**
   - B2C: orange `14 500 DA`
   - B2B (if logged in): blue `11 200 DA B2B Tier 2`
   - Per-unit price below if B2B bulk pricing applies
6. **Availability** — "En stock (48 unités)" / "Stock limité" / "Rupture"
7. **Quantity Selector** — `−` count `+` (max = available stock)
8. **Add to Cart Button** — full-width, orange, large (48px)
9. **Save to Wishlist** — icon button, second line
10. **SKU + Reference** — monospace, small
11. **Short Description** — 2–3 lines

### Below Fold Sections
1. **Full Description** — rich text with images
2. **Specifications** (table) — OEM / Compatible, Color, Dimensions, Weight
3. **Compatibility List** — searchable table of all compatible phone models
4. **Product Images** — thumbnail strip (if multiple images)
5. **Social Proof** — star rating + review count, top 3 reviews
6. **Related Products Rail** — "D'autres clients ont aussi acheté"
7. **Recently Viewed Rail**

### Image Gallery
- Primary image: large, 1:1, `object-fit: contain`, white background
- Thumbnail row below (desktop) or horizontal scroll (mobile)
- Pinch-to-zoom on mobile
- Lightbox on desktop click

### Stock States
| State | Display |
|---|---|
| > 15 units | "En stock" (green badge) |
| 1–15 units | "Stock limité — N unités restantes" (amber) |
| 0 units | "Rupture de stock" + "M'alerter" button (red) |

### "M'alerter" (Back-in-stock)
- Requires authenticated email
- Guest: prompt to log in or enter email
- Creates `stock_alerts` record

### SEO
- `<title>` — "[Product Name] — [Brand] — HamzaPhone Algeria"
- `<meta name="description">` — product + compatibility summary + price
- Schema.org `Product` with `Offer`, `AggregateRating`
- `og:image` — primary product image
- `og:price:amount` + `og:price:currency`

### B2C/B2B Differences
- B2B authenticated: show both prices (B2B primary, B2C crossed out)
- B2B: show "Ajouter à la commande B2B" instead of standard cart
- B2B: show "Disponible en quantités professionnelles"

### Mobile Behavior
- Sticky bottom bar: Price + "Ajouter au Panier" always visible
- Images: swipe-able carousel
- Compatibility list: collapsible by default

---

## 8. Product Compatibility Selection

**Purpose:** Help customer find the right part for their specific phone model.  
**Location:** Section on PDP, also accessible from PLP filter  

### Behavior
- Search input: "Entrez votre modèle de téléphone..."
- Auto-suggest as user types (debounced 200ms)
- On select: highlights compatibility row in table, confirms fit
- If model NOT in compatibility list: "Ce produit n'est pas listé comme compatible avec [model]. Consultez notre support."

### Compatibility Table Columns
- Marque
- Modèle
- Variante (5G / 4G, couleur)
- Compatibilité (✓ Confirmée / ⚠ Non garantie)

---

## 9. Cart

**Purpose:** Review selected products before checkout.  
**User Type:** All (guest + authenticated)  
**Primary CTA:** "Passer la commande"  
**Route:** `/panier`  

### Cart States
- **Populated:** item list + summary
- **Empty:** empty state with CTA
- **Loading:** skeleton rows

### Layout
- **Desktop:** 2-column — Items list (left 65%) + Order Summary (right 35%, sticky)
- **Mobile:** stacked — items → summary → CTA

### Cart Item Row
- Product image (small, 64×64px)
- Product name (link to PDP)
- SKU (monospace)
- Unit price (DZD)
- Quantity selector (−/+)
- Line total (DZD, bold)
- Remove button (✕)

### Order Summary
- Sous-total
- Frais de livraison (estimated or "calculé à l'étape suivante")
- **Total DZD** (large, bold orange)
- "Passer la commande" button (full-width, orange, large)
- Secure payment mention

### Cart Persistence
- Authenticated: cart saved to `carts` table (Supabase)
- Guest: cart saved to `localStorage`
- On login: guest cart merged with server cart (most recent quantity wins)

### Empty State
- Icon: 🛒
- "Votre panier est vide"
- CTA: "Voir nos produits"
- Recently viewed products below

### Business Rules
- Stock validation on cart render — if quantity > available stock: warn + reduce qty
- B2B cart: shows B2B prices, may have different minimum quantities
- Minimum order value (if configured in System Settings) shown as alert

### Mobile Behavior
- Quantity selector: large touch targets (44×44px minimum)
- Sticky bottom bar: "Total DZD — Passer la commande"

---

## 10. Checkout

**Purpose:** Complete the purchase with address, delivery, and payment info.  
**User Type:** Authenticated + Guest  
**Primary CTA:** "Confirmer la commande"  
**Route:** `/checkout`  

### Steps (multi-step, progress indicator at top)

**Step 1 — Informations**
| Field | Type | Required |
|---|---|---|
| Prénom | Text | Yes |
| Nom | Text | Yes |
| Téléphone | Phone (+213) | Yes |
| Email | Email | Yes (for confirmation) |
| Guest / Login prompt (if not authenticated) | Banner | — |

**Step 2 — Adresse de Livraison**
| Field | Type | Required |
|---|---|---|
| Adresse (rue, numéro) | Text | Yes |
| Complément d'adresse | Text | No |
| Wilaya | Select (58 wilayas) | Yes |
| Commune | Text / Select | Yes |
| Code postal | Text | No |
| Sauvegarder cette adresse | Toggle (auth only) | No |
| Label | Domicile / Travail / Autre | If saving |

**Step 3 — Livraison**
- Available modes dynamically loaded based on wilaya
- EcoTrack Express (price + estimated days)
- EcoTrack Standard (price + estimated days)
- Retrait en magasin (if configured, free)

**Step 4 — Récapitulatif + Confirmation**
- Full order review (items, address, delivery, total)
- Payment method selection: Cash à la livraison / Virement bancaire / CIB
- "J'accepte les conditions générales de vente" checkbox (required)
- **Confirmer la commande** button

### Step Navigation
- "Précédent" at each step
- Progress bar: 4 steps
- Steps not skippable (must complete each in order)
- Unsaved step data: warn before navigating away

### Guest Checkout
- Allowed — guest provides email for confirmation
- After success: prompt to create account (saves their info)

### Form Validation
- Real-time inline (on blur)
- Phone: Algerian format (+213 or 0X XX XX XX XX)
- Submit blocked until all required fields valid

### Mobile Behavior
- Steps full-screen
- Large inputs (height 52px)
- Numeric keyboard for phone + postal code
- "Confirmer" button always visible (sticky bottom)

---

## 11. Login

**Purpose:** Authenticate returning users.  
**Route:** `/connexion`  
**Primary CTA:** "Se connecter"  

### Form
| Field | Type | Required |
|---|---|---|
| Email | Email input | Yes |
| Mot de passe | Password (with show/hide) | Yes |
| "Se souvenir de moi" | Checkbox | No |

### Actions
- **Se connecter** (primary)
- Mot de passe oublié? → `/mot-de-passe-oublie`
- Pas encore de compte ? → `/inscription`
- Social login buttons (Google, Facebook, Apple)

### Post-login redirect
- Redirect to previous page (from `?next=` param) or `/compte`

### Error States
- Invalid credentials: "Email ou mot de passe incorrect"
- Account suspended: "Votre compte a été suspendu. Contactez le support."
- Too many attempts: "Trop de tentatives. Réessayez dans N minutes."

### SEO
- `<meta name="robots" content="noindex">`

---

## 12. Register

**Purpose:** Create a new B2C customer account.  
**Route:** `/inscription`  
**Primary CTA:** "Créer mon compte"  

### Form
| Field | Type | Required |
|---|---|---|
| Prénom | Text | Yes |
| Nom | Text | Yes |
| Email | Email | Yes |
| Téléphone | Phone (+213) | Yes |
| Mot de passe | Password (strength meter) | Yes |
| Confirmer mot de passe | Password | Yes |
| J'accepte les CGU | Checkbox | Yes |

### Actions
- **Créer mon compte** (primary)
- Déjà inscrit ? → `/connexion`
- Social login buttons

### Post-registration
- Supabase Auth email confirmation (optional — configurable)
- If confirmed: welcome email → redirect to `/compte`
- If confirmation required: info page "Vérifiez votre boîte email"

### Validation
- Email: format check + uniqueness check on blur
- Password: min 8 chars, 1 uppercase, 1 number (strength indicator)
- Phone: Algerian format validation

---

## 13. Social Login

**Purpose:** OAuth authentication via Google, Facebook, or Apple.  
**Location:** Login + Register screens  

### Flow
1. User clicks social button
2. Redirect to Supabase Auth OAuth provider
3. On success: Supabase creates/links user → redirect to `/compte` or `?next=`
4. On failure: redirect back with error message

### UI Elements
- Google button: white, Google logo, "Continuer avec Google"
- Facebook button: #1877F2, Facebook logo, "Continuer avec Facebook"
- Apple button: black, Apple logo, "Continuer avec Apple" (iOS Safari only, or always shown)
- Separator: "OU" between social and email form

---

## 14. Forgot Password

**Purpose:** Request a password reset link via email.  
**Route:** `/mot-de-passe-oublie`  

### Form
| Field | Type | Required |
|---|---|---|
| Email | Email | Yes |

### States
- **Default:** form
- **Submitted:** "Si cet email existe, vous recevrez un lien de réinitialisation sous peu."
- Email sent by Supabase Auth

---

## 15. Customer Account

**Purpose:** Hub page for authenticated customer's account.  
**Route:** `/compte`  
**User Type:** B2C + B2B (different sections)  

### Sections
1. **Welcome header** — "Bonjour [Prénom] 👋"
2. **Quick Stats** — Total commandes / Total dépensé (DZD) / Adresses enregistrées
3. **Recent Orders** (last 3) — mini table with link to full history
4. **Quick Nav Cards** — Mes commandes / Mon profil / Mes adresses / Wishlist / Suivi commande
5. **B2B Panel** (if B2B) — Niveau B2B, Contact commercial, Voir catalogue B2B

---

## 16. Profile

**Purpose:** View and edit personal information and password.  
**Route:** `/compte/profil`  

### Form — Personal Info
| Field | Type |
|---|---|
| Prénom | Text |
| Nom | Text |
| Email | Email (read-only if social auth) |
| Téléphone | Phone |

### Form — Changer mot de passe
| Field | Type |
|---|---|
| Mot de passe actuel | Password |
| Nouveau mot de passe | Password (strength meter) |
| Confirmer | Password |

### Danger Zone
- **Supprimer mon compte** — dialog: "Cette action est irréversible. Toutes vos données seront supprimées." Requires email + password confirmation.

---

## 17. Address Management

**Purpose:** Save and manage delivery addresses.  
**Route:** `/compte/adresses`  

### Address Card
- Label (Domicile / Travail / Autre)
- Full address
- Wilaya
- "Par défaut" badge (on default)
- Actions: Modifier / Supprimer / Définir par défaut

### Add Address Form
| Field | Type | Required |
|---|---|---|
| Label | Select | Yes |
| Prénom / Nom | Text | Yes |
| Téléphone | Phone | Yes |
| Adresse | Text | Yes |
| Complément | Text | No |
| Wilaya | Select (58 wilayas) | Yes |
| Commune | Text | Yes |

### Business Rules
- Maximum 5 saved addresses per account
- Default address pre-selected at checkout
- Deleting an address used in an active order: blocked ("Adresse en cours d'utilisation")

---

## 18. Order History

**Purpose:** View all past and current orders.  
**Route:** `/compte/commandes`  

### Table Columns (mobile-friendly card layout on mobile)
- N° Commande
- Date
- Produits (count + thumbnail)
- Total DZD
- Statut (badge)
- Action (Voir détails / Suivre)

### Filters
- Status (Toutes / En cours / Livré / Annulé)
- Date range

---

## 19. Order Details (customer view)

**Purpose:** Customer's view of a single order.  
**Route:** `/compte/commandes/:id`  

### Sections
1. **Order Header** — order number, date, status badge
2. **Status Timeline** — visual stepper (simplified: Commandé → Confirmé → Expédié → Livré)
3. **EcoTrack Tracking** — if shipped: tracking number + "Suivre sur EcoTrack" link
4. **Items Table** — image, name, qty, unit price, line total
5. **Price Summary** — sous-total, livraison, total DZD
6. **Delivery Address** — displayed
7. **Payment Method**

### Actions
- **Annuler ma commande** (PENDING only) — confirmation dialog
- **Retourner un article** (DELIVERED, within policy window) — opens return form
- **Rembourser** (not customer-facing — admin only)

---

## 20. Guest Order Tracking

**Purpose:** Allow guests (no account) to track their order by order number + phone.  
**Route:** `/suivi-commande`  

### Form
| Field | Type | Required |
|---|---|---|
| N° Commande | Text (monospace input) | Yes |
| Téléphone | Phone (+213) | Yes |

### Result View
- Order status badge
- Status timeline
- EcoTrack tracking link (if shipped)
- Item list (name + qty only, no prices)
- Delivery address (truncated for privacy)
- CTA: "Créer un compte pour un meilleur suivi"

### Error State
- "Aucune commande trouvée avec ces informations"

---

## 21. B2B Registration

**Purpose:** Allow repair shops and resellers to apply for a B2B account.  
**Route:** `/b2b/inscription`  

### Form
| Field | Type | Required |
|---|---|---|
| Dénomination sociale | Text | Yes |
| Forme juridique | Select (SARL / SNC / EI / SPA / Autre) | Yes |
| Numéro registre du commerce | Text | Yes |
| NIF (Numéro d'Identification Fiscale) | Text | Yes |
| Adresse complète | Text | Yes |
| Wilaya | Select | Yes |
| Prénom / Nom du gérant | Text | Yes |
| Email professionnel | Email | Yes |
| Téléphone | Phone | Yes |
| Volume mensuel estimé | Select (< 50k / 50k–200k / > 200k DZD) | Yes |
| Documents (RC scan) | File upload (PDF/JPG, max 10 MB) | Yes |
| J'accepte les CGV B2B | Checkbox | Yes |

### Post-submission
- Confirmation page: "Votre demande a été soumise. Notre équipe la traitera dans 24–48h."
- Email sent to applicant (receipt)
- Admin notified (badge in admin sidebar)

### SEO
- `<meta name="robots" content="noindex">`

---

## 22. B2B Account

**Purpose:** Dedicated B2B account hub with business-specific features.  
**Route:** `/compte/b2b`  
**User Type:** B2B authenticated  

### Sections
1. **Business Info** — company name, tier badge, contact
2. **Tier & Pricing** — current tier (Tier 1/2/3), effective discount, min order, credit terms
3. **B2B Orders** — same as Order History but with B2B pricing displayed
4. **Credit Account** (if Tier 2+) — balance, last invoice, payment due date
5. **Documents** — uploaded RC, NIF, invoices

---

## 23. B2B Pricing Experience

**Purpose:** Ensure B2B users always see their negotiated prices across the storefront.  
**Location:** Integrated throughout PLP, PDP, Cart, Checkout  

### Rules
- Authenticated B2B user: B2B tier price displayed in **blue** as primary
- B2C price shown crossed out in gray
- "Prix B2B Tier N" label beneath the price
- Non-authenticated visitors see B2C prices only
- B2B prices are never exposed in HTML source to non-B2B users (server-rendered)

---

## 24. Wishlist

**Purpose:** Save products for later consideration.  
**Route:** `/compte/liste-envies`  
**User Type:** Authenticated (B2C + B2B)  

### Product Card in Wishlist
- Same as PLP product card
- "Retirer de la liste" button
- "Ajouter au panier" CTA

### Business Rules
- Max 100 items in wishlist
- Out-of-stock items remain in wishlist but show stock status
- Share wishlist link (optional feature flag)

---

## 25. Recently Viewed

**Purpose:** Quick access to recently browsed products.  
**Location:** Component displayed on Homepage, PDP, Cart empty state  
**Storage:** `localStorage` (guest + auth) + `user_product_views` table (auth)  

### Display
- Horizontal scroll rail, max 10 items
- Product card: image + name + price
- "X" to remove from list

---

## 26. Related Products

**Purpose:** Drive additional product discovery and increase basket size.  
**Location:** Below the fold on PDP  

### Sourcing Logic (priority order)
1. Same category + same brand + different model
2. Same category + different brand
3. Products frequently bought together (from `order_items` co-occurrence)
4. Same brand — different category

### Display
- Horizontal scroll rail, max 8 products
- Standard product card

---

## 27. Order Success

**Purpose:** Confirm the order was placed and set delivery expectations.  
**Route:** `/commande/succes/:orderId`  

### Sections
1. **Success icon** — ✅ large, green
2. **Headline** — "Commande confirmée !"
3. **Order Number** — `#HP-YYYY-NNNN` (monospace)
4. **Summary** — estimated delivery date, delivery mode
5. **Next Steps** — what happens now (processing → shipment → delivery)
6. **CTA Row** — "Suivre ma commande" / "Continuer mes achats"
7. **Create Account prompt** (guest only) — "Créez un compte pour suivre vos commandes facilement"

---

## 28. Error / Not Found

### 404 Page (`/404`)
- "Page introuvable" headline
- Short friendly message
- Search bar (instant suggestions)
- CTA: "Retour à l'accueil" + "Voir nos produits"

### 500 Page (`/500`)
- "Une erreur est survenue" headline
- "Notre équipe a été informée. Réessayez dans quelques instants."
- CTA: "Retour à l'accueil"
- Contact link

### SEO
- Both pages: `<meta name="robots" content="noindex">`
- 404: proper HTTP 404 status code returned

---

## 29. Contact / Support

**Purpose:** Allow customers to reach HamzaPhone support.  
**Route:** `/contact`  

### Sections
1. **Contact form** — Name, Phone, Email, Subject, Message, Send
2. **Direct contacts** — WhatsApp link, phone number (visible hours), email
3. **FAQ section** (top 5 questions)
4. **Store location** (if physical — Google Maps embed)

### Form
| Field | Type | Required |
|---|---|---|
| Prénom | Text | Yes |
| Email | Email | Yes |
| Téléphone | Phone | No |
| Sujet | Select (Commande / Produit / Livraison / B2B / Autre) | Yes |
| Message | Textarea (min 20 chars) | Yes |

### SEO
- `<title>` — "Contact — HamzaPhone Algeria"
- Schema.org `LocalBusiness` with `telephone`, `address`, `openingHours`

---

## 30. Trust / Reviews / Social Proof Areas

**Purpose:** Build conversion confidence across the storefront.  

### Placement Map
| Area | Elements |
|---|---|
| Homepage hero | "Faites confiance à 1 200+ clients algériens" counter badge |
| Homepage section | 4 trust icons (livraison / OEM / références / SAV) |
| Homepage section | 3–4 customer review cards |
| PDP sidebar | Star rating + review count + "N clients satisfaits" |
| PDP below description | Full review section |
| Cart sidebar | "Paiement sécurisé · Pièces OEM garanties" line |
| Checkout step 4 | Security badge + return policy mention |

### Review System
- Reviews stored in `product_reviews` table
- Displayed reviews are verified purchases only
- Star rating: 1–5
- Review card: initials avatar + city + date + rating stars + comment
- Moderation: admin approves before display

### Trust Badges
- 🚚 "Livraison EcoTrack dans les 48h" (all wilayas)
- ✅ "Pièces OEM et compatibles testées"
- 🏆 "4 000+ références en stock"
- 🔧 "Service après-vente en Algérie"
