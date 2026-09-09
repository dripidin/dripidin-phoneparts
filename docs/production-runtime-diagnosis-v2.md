# HamzaPhone Production Auth & Import Runtime Deep Diagnosis (v2)

**Environment:** Production  
**Production Storefront:** [https://hamzaphone.vercel.app](https://hamzaphone.vercel.app)  
**Production Supabase Project:** `gcqseaefboaijktusjmg` (`https://gcqseaefboaijktusjmg.supabase.co`)  
**Diagnosis Type:** 100% READ-ONLY Audit  

---

## 1. Registration

- **Root Cause:**  
  The PostgreSQL trigger function `public.handle_new_user()` is missing an explicit `SET search_path = public, pg_temp;` and contains an unqualified cast to enum `::user_type`. When Supabase GoTrue Auth service (`supabase_auth_admin`) executes `/signup`, it runs within a session `search_path` that does not include the `public` schema (typically `auth, pg_temp`). Consequently, PostgreSQL fails to resolve `user_type` in the current search path, aborting the transaction with SQLSTATE `42704`.

- **Evidence:**  
  Direct query against Supabase `auth_logs` at `2026-08-25T13:04:58Z`:
  ```json
  {
    "component": "api",
    "path": "/signup",
    "status": 500,
    "error": "failed to close prepared statement: ERROR: current transaction is aborted, commands ignored until end of transaction block (SQLSTATE 25P02): ERROR: type \"user_type\" does not exist (SQLSTATE 42704)"
  }
  ```
  Inspection of `pg_proc` for `handle_new_user()`:
  - `prosecdef`: `true` (SECURITY DEFINER)
  - `proconfig`: `NULL` (No explicit search_path configured)
  - Definition contains: `COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'B2C'::user_type)` without schema qualification.

- **Exact Error:**  
  `Registration failed: Database error saving new user` (HTTP 500 produced by GoTrue upon PostgreSQL transaction rollback).

- **Affected Component:**  
  PostgreSQL database function `public.handle_new_user()` attached to `auth.users` via trigger `on_auth_user_created`.

- **Recommended Fix:**  
  Update `public.handle_new_user()` definition to include:
  1. `SET search_path = public, pg_temp`
  2. Fully qualified type casting: `::public.user_type`
  3. Fully qualified table identifiers: `public.profiles`, `public.roles`, `public.user_roles`.

---

## 2. Admin Login

- **Root Cause:**  
  The `auth.users` record for `admin@hamzaphone.dz` was created via direct SQL insert without initializing non-nullable Go struct string fields. Specifically, `confirmation_token`, `recovery_token`, `email_change_token_new`, and `email_change` were stored as `NULL`. When GoTrue executes `/token` password verification, its internal Go SQL scanner attempts to scan `confirmation_token` into a non-nullable Go `string` variable, throwing a database scan exception.

- **Evidence:**  
  Direct query against Supabase `auth_logs` at `2026-08-25T13:05:58Z`:
  ```json
  {
    "component": "api",
    "path": "/token",
    "status": 500,
    "error": "error finding user: sql: Scan error on column index 3, name \"confirmation_token\": converting NULL to string is unsupported",
    "error_code": "unexpected_failure"
  }
  ```
  Inspection of `auth.users` row for `admin@hamzaphone.dz`:
  - `confirmation_token`: `NULL`
  - `recovery_token`: `NULL`
  - `email_change_token_new`: `NULL`
  - `email_change`: `NULL`

- **Exact Error:**  
  `Sign in failed: Database error querying schema` (HTTP 500 returned by GoTrue `/token` endpoint).

- **Affected Component:**  
  `auth.users` database record for `admin@hamzaphone.dz`.

- **Recommended Fix:**  
  Update `auth.users` row for `admin@hamzaphone.dz` to set empty strings `''` for all uninitialized token columns:
  - `confirmation_token = ''`
  - `recovery_token = ''`
  - `email_change_token_new = ''`
  - `email_change = ''`
  *(Alternatively, provision staff users using the official Supabase Admin Auth API `auth.admin.createUser()` which automatically applies GoTrue schema defaults).*

---

## 3. Import / Export

- **Root Cause:**  
  Next.js Server Action error masking in production. In `src/lib/actions/import-export.actions.ts`, `uploadAndParseImportAction` begins with `await requirePermission(supabase, 'imports.create')`. Because the user could not log in as an administrator (due to Issue #2), `requireAuth` threw an `AuthorizationError('Authentication required to access this resource', 'UNAUTHENTICATED')`. In Next.js production builds, unhandled errors thrown across the Server Action boundary are masked for security and emitted to React client components as `Minified React error #441` with an internal error digest.

- **Evidence:**  
  1. Official React specification for Error #441:  
     *"An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details."*
  2. `src/lib/actions/import-export.actions.ts` (Line 33):  
     ```ts
     const authContext = await requirePermission(supabase, 'imports.create');
     ```
  3. `src/components/admin/views/import-export-view.tsx` (Line 137):  
     ```ts
     } catch (err: any) {
       alert(`Erreur d'analyse: ${err.message}`);
     }
     ```
     Receives the minified Server Action error string from the Next.js RPC boundary.

- **Exact Error:**  
  `Erreur d'analyse: Minified React error #441` (Caused by `UNAUTHENTICATED` authorization rejection in Server Action).

- **Affected Component:**  
  `src/lib/actions/import-export.actions.ts` & `src/components/admin/views/import-export-view.tsx`.

- **Recommended Fix:**  
  1. Resolving Issue #2 (Admin Login) will allow staff members to authenticate properly and pass `requirePermission(supabase, 'imports.create')`.
  2. Harden Server Actions in `src/lib/actions/import-export.actions.ts` to return standardized response objects `{ success: boolean; error?: string; data?: any }` instead of throwing unhandled exceptions across the Server Action boundary.

---

## 4. Environment

- **Status:**
  - `NEXT_PUBLIC_SUPABASE_URL`: **Present** (`https://gcqseaefboaijktusjmg.supabase.co`)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: **Present**
  - `NEXT_PUBLIC_SITE_URL`: **Present** (`https://hamzaphone.vercel.app`)
  - `SUPABASE_SERVICE_ROLE_KEY`: **Present** (Server-only)
  - `ECOTRACK_WEBHOOK_SECRET`: Pending external carrier setup (does not affect auth or import).

- **Impact:**  
  Core Supabase and Next.js production environment variables are present and correctly matched to the production project.

---

## 5. OAuth Clarification

- **Configured:**  
  Standard Email / Password authentication.

- **Missing:**  
  Social providers (Google, Apple, Facebook). Attempting OAuth triggers `provider is not enabled` in `auth_logs`.

- **What actually needs to be configured:**  
  > [!IMPORTANT]
  > Do **NOT** use "Publish a new OAuth application" in the Supabase Dashboard. That interface is for turning HamzaPhone into an OAuth identity provider for third-party apps.
  >
  > To enable customer social sign-in (Google / Apple / Facebook), navigate to:
  > **Supabase Dashboard → Authentication → Providers → Google (or Apple / Facebook) → Toggle "Enable Provider" → Enter OAuth Client ID & Secret**.

---

## 6. Recommended Fix Order

1. **Step 1: Fix `public.handle_new_user()` Trigger Function**  
   Apply `SET search_path = public, pg_temp` and qualify enum types to resolve B2C customer registration.

2. **Step 2: Repair `auth.users` Token Fields for Owner Account**  
   Set empty strings for NULL token columns (`confirmation_token`, `recovery_token`, `email_change_token_new`, `email_change`) to allow Admin sign-in via `/token`.

3. **Step 3: Verify Admin Sign-In & Import/Export Pipeline**  
   Log in with `admin@hamzaphone.dz`, verify permission resolution, test the Import/Export Excel wizard under an active session, and add structured error returns to `import-export.actions.ts`.
