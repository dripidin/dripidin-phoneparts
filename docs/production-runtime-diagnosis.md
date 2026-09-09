# HamzaPhone — Diagnostic de Runtime & Accès aux Données en Production

**Date du Diagnostic :** 2026-08-25  
**Projet Supabase Production :** `SmartPhone Part's COD Website Store` (`gcqseaefboaijktusjmg`)  
**URL Supabase Production :** `https://gcqseaefboaijktusjmg.supabase.co`  
**Déploiement Vercel Production :** `https://hamzaphone.vercel.app`  
**Statut Global :** **READ-ONLY AUDIT EFFECTUÉ — CAUSES RACINES IDENTIFIÉES**

---

## A. Causes Racines Identifiées (Root Causes)

L'audit approfondi a identifié **quatre causes racines distinctes et interconnectées** expliquant les 4 défaillances signalées :

1. **Persistance de Session Supabase SSR Inopérante (`src/lib/auth/server.ts`) :**  
   L'adaptateur `createServerClient()` dans `server.ts` implémente des stubs vides pour les cookies (`getAll()` retourne toujours `[]` et `setAll()` est vide). Par conséquent :
   - Aucun cookie de session (`sb-*-auth-token`) n'est écrit dans la réponse HTTP lors de la connexion/inscription.
   - Les Server Actions et Server Components appelant `supabase.auth.getUser()` ou `requireAuth()` ne voient aucun cookie et considèrent l'utilisateur comme systématiquement déconnecté (`user: null`, code `UNAUTHENTICATED`).
   
2. **Absence Totale de Compte Administrateur Initial dans `auth.users` :**  
   La table `auth.users` contient actuellement **0 utilisateur**. Aucun compte `OWNER` / `ADMINISTRATOR` n'a été créé ni lié dans `public.user_roles`. Toute tentative de connexion admin échoue avec *identifiants invalides*.

3. **Conflit RLS sur le Tunnel de Commande Client (`checkout.service.ts` vs RLS Database) :**  
   Le service `checkout.service.ts` exécute la création de commande via le client anonyme public (`anon`), en tentant 5 écritures séquentielles :
   - `INSERT orders` : Autorisé (politique guest existante).
   - `INSERT order_items` : **BLOQUÉ PAR RLS** (La table `order_items` n'a *aucune* politique `INSERT`, uniquement un `SELECT`).
   - `INSERT order_status_history` : **BLOQUÉ PAR RLS** (Aucune politique `INSERT` pour `anon`).
   - `INSERT inventory_transactions` : **BLOQUÉ PAR RLS** (Exige la permission staff `inventory.adjust`).
   - `UPDATE products` (réservation stock) : **BLOQUÉ PAR RLS** (Exige la permission staff `products.update`).

4. **Variables d'Environnement de Production Incomplètes sur Vercel :**  
   Les variables `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY` et `ECOTRACK_WEBHOOK_SECRET` ne sont pas configurées dans les secrets Vercel, provoquant des fallbacks vers `http://localhost:3000` (ce qui casse les redirections OAuth et reset password) et `mock-service-key` pour les opérations d'administration serveur.

---

## B. Composants en Échec Confirmé (Confirmed Failures)

| Composant / Fonctionnalité | Symptôme Observé | Point de Rupture Exact |
|---|---|---|
| **Connexion Client / Admin (`/login`)** | Échec de connexion & session non conservée | 1. `auth.users` vide (0 compte).<br>2. `server.ts` n'écrit pas les cookies de session via `cookies()`. |
| **Inscription Client (`/register`)** | Session non établie après inscription | `registerB2CAction` / `registerB2BAction` ne transmettent pas de cookie de session au navigateur. |
| **Création de Produit Admin (`/admin`)** | Rejet systématique avec code `UNAUTHENTICATED` / `FORBIDDEN` | `createProductAdmin` -> `requirePermission('products.create')` -> `requireAuth` échoue car `getUser()` est `null` + RLS `products` bloque les requêtes non-staff. |
| **Création de Commande (`/checkout`)** | Message d'erreur *"Impossible de finaliser votre commande"* | `processOrderCheckout` -> `order_items.insert()` rejeté par PostgreSQL : *`new row violates row-level security policy for table "order_items"`*. |

---

## C. Matrice d'Audit des Variables d'Environnement

| Variable | Requis | Portée (Client/Serveur) | Utilisé Par | Format Attendu | Statut en Production |
|---|---|---|---|---|---|
| **`NEXT_PUBLIC_SUPABASE_URL`** | **Oui** | Client & Serveur | `client.ts`, `server.ts`, `admin.ts`, `catalog-images` | `https://<project-ref>.supabase.co` | **CONFIGURÉ** (`https://gcqseaefboaijktusjmg.supabase.co`) |
| **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | **Oui** | Client & Serveur | `client.ts`, `server.ts` | JWT Public (`eyJ...`) | **CONFIGURÉ** (`eyJhbGciOi...`) |
| **`NEXT_PUBLIC_SITE_URL`** | **Oui** | Client & Serveur | `auth-service.ts`, `environment.ts` | `https://hamzaphone.vercel.app` | **MANQUANT DANS VERCEL** *(Fallback: `http://localhost:3000`)* |
| **`SUPABASE_SERVICE_ROLE_KEY`** | **Oui** | Serveur Uniquement | `admin.ts`, webhooks, scripts backend | JWT Secret (`eyJ...`) | **MANQUANT DANS VERCEL** *(Fallback: `mock-service-key`)* |
| **`ECOTRACK_API_URL`** | Non | Serveur Uniquement | `ecotrack-provider.ts` | `https://api.ecotrack.dz/v1` | Fallback par défaut actif |
| **`ECOTRACK_API_TOKEN`** | Non | Serveur Uniquement | `ecotrack-provider.ts` | Token API Secret | Non configuré (mode bac à sable) |
| **`ECOTRACK_WEBHOOK_SECRET`** | **Oui** | Serveur Uniquement | `ecotrack-provider.ts`, `delivery.service.ts` | Secret HMAC Token | **MANQUANT DANS VERCEL** |

> [!WARNING]
> **Détection de Nom de Variable :** Le code utilise `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Si Vercel ou Supabase fournit `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, le code ne le lira pas sans mapping. Il est impératif d'utiliser le nom exact `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## D. Diagnostic de la Configuration Supabase Auth

1. **Table `auth.users` :**  
   - Actuellement : **0 utilisateur enregistré**.
   - Aucun administrateur initial n'a été créé lors du déploiement initial.

2. **Trigger `handle_new_user` :**  
   - Vérifié et opérationnel en base : lors d'un `signUp`, le trigger insère automatiquement le profil dans `public.profiles` et affecte le rôle `B2C_CUSTOMER` ou `B2B_CUSTOMER` dans `public.user_roles`.

3. **URLs de Redirection Supabase Auth (Dashboard Supabase) :**  
   `[MANUAL VERIFICATION REQUIRED]`  
   Dans la console Supabase (*Authentication -> URL Configuration*) :
   - **Site URL** doit être : `https://hamzaphone.vercel.app`
   - **Redirect URLs Whitelist** doit inclure :
     - `https://hamzaphone.vercel.app/**`
     - `https://hamzaphone.vercel.app/auth/callback`
     - `https://hamzaphone.vercel.app/account`
     - `https://hamzaphone.vercel.app/forgot-password`

---

## E. Diagnostic des Politiques RLS & Autorisations

### 1. Blocage de `createProductAdmin` :
- `public.products` possède la politique : `Staff manage products` (`cmd: ALL`, check : `has_permission('products.create') OR has_permission('products.update')`).
- `has_permission()` inspecte `auth.uid()` dans `public.user_roles`.
- Comme `createServerClient()` n'a pas de session, `auth.uid()` est `NULL`, ce qui déclenche un refus RLS et une exception `AuthorizationError('UNAUTHENTICATED')`.

### 2. Blocage de `processOrderCheckout` (Commandes Clients) :
- `public.orders` : Politique `INSERT` autorise `((customer_id = auth.uid()) OR (customer_id IS NULL) OR has_permission('orders.create'))`.
- `public.order_items` : **0 politique `INSERT`** existante. RLS étant actif, toute insertion est strictement interdite.
- `public.order_status_history` : **0 politique `INSERT`** existante pour le rôle public/guest.
- `public.inventory_transactions` : Politique `INSERT` restreinte à `has_permission('inventory.adjust') OR has_permission('orders.update')`.
- `public.products` : Mise à jour des stocks réservés restreinte à `has_permission('products.update')`.

---

## F. Diagnostic du Déploiement Vercel

- **Projet Vercel :** `hamzaphone` sur le compte `dripidin` (`dripidin-5162s-projects`).
- **Statut de Compilation :** Déploiement `READY`, 28 routes statiques et dynamiques compilées avec succès.
- **Connectivité API :** Le frontend sert le catalogue et redirige les images correctement via `/catalog-images/[...path]`.
- **Manques Détectés :** Absence des variables d'environnement serveur dans les paramètres du projet Vercel (*Project Settings -> Environment Variables*).

---

## G. Actions Manuelles Requises (Console Supabase & Vercel)

1. **Dashboard Vercel (*Settings -> Environment Variables*) :**
   - Ajouter `NEXT_PUBLIC_SITE_URL` = `https://hamzaphone.vercel.app`
   - Ajouter `SUPABASE_SERVICE_ROLE_KEY` = *(Clé service_role secrète du projet `gcqseaefboaijktusjmg`)*
   - Ajouter `ECOTRACK_WEBHOOK_SECRET` = *(Clé secrète de webhook)*

2. **Dashboard Supabase (*Authentication -> URL Configuration*) :**
   - Régler **Site URL** sur `https://hamzaphone.vercel.app`
   - Ajouter aux **Redirect URLs** : `https://hamzaphone.vercel.app/**`

---

## H. Corrections de Code Requises

1. **Refactoriser `src/lib/auth/server.ts` :**
   Brancher correctement `@supabase/ssr` avec la gestion asynchrone des cookies de Next.js 16 (`await cookies()` de `next/headers`) :
   ```typescript
   import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
   import { cookies } from 'next/headers';

   export async function createServerClient() {
     const cookieStore = await cookies();
     return createSupabaseServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() {
             return cookieStore.getAll();
           },
           setAll(cookiesToSet) {
             try {
               cookiesToSet.forEach(({ name, value, options }) =>
                 cookieStore.set(name, value, options)
               );
             } catch {
               // Ignore in Server Components (read-only)
             }
           },
         },
       }
     );
   }
   ```

2. **Sécuriser et Dédier le Tunnel de Commande dans `checkout.service.ts` :**
   - Pour les opérations transactionnelles internes (insertion `order_items`, `order_status_history`, `inventory_transactions`, et mise à jour des stocks), utiliser une fonction PostgreSQL RPC avec `SECURITY DEFINER` OU exécuter la finalisation avec le client d'administration privilégié (`createAdminClient()`).

3. **Créer le Premier Utilisateur Super-Admin (`OWNER`) :**
   - Créer le premier compte administrateur dans Supabase Auth et lui attribuer le rôle `OWNER` dans `public.user_roles`.

4. **Corriger les Redirections dans `src/lib/auth/auth-service.ts` :**
   - Remplacer les fallbacks `http://localhost:3000` par `process.env.NEXT_PUBLIC_SITE_URL || 'https://hamzaphone.vercel.app'`.

---

## I. Ordre Recommandé de Résolution (Fix Order)

1. **Étape 1 :** Renseigner les variables d'environnement manquantes dans Vercel (`NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ECOTRACK_WEBHOOK_SECRET`) et configurer les URL de redirection dans Supabase Auth.
2. **Étape 2 :** Corriger `src/lib/auth/server.ts` pour implémenter la persistance des cookies de session `@supabase/ssr` via `next/headers`.
3. **Étape 3 :** Mettre à jour `src/lib/services/checkout.service.ts` pour utiliser `createAdminClient()` ou une fonction RPC `SECURITY DEFINER` lors des écritures de commande et de réservation de stock.
4. **Étape 4 :** Créer le compte `OWNER` initial dans `auth.users` et lui lier le rôle `OWNER` dans `public.user_roles`.
5. **Étape 5 :** Redéployer sur Vercel et tester les 4 flux (Inscription, Connexion, Création de commande, Création de produit admin).
