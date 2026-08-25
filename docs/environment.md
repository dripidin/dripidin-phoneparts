# HamzaPhone — Spécification des Variables d'Environnement & Secrets

## 1. Classification & Règles de Sécurité

Les variables d'environnement de HamzaPhone sont strictement catégorisées selon trois niveaux de confidentialité :
1. **`PUBLIC`** : Variables préfixées par `NEXT_PUBLIC_`, injectées dans le bundle JavaScript côté client. Ne doivent contenir aucun secret, mot de passe ni clé d'administration.
2. **`SERVER_ONLY`** : Variables non sensibles utilisées uniquement par Node.js/Next.js côté serveur (URLs d'API, identifiants d'environnement).
3. **`SECRET`** : Clés cryptographiques, tokens d'API de paiement ou d'envoi SMS/WhatsApp, mots de passe de base de données. Ne doivent **jamais** être versionnées dans Git, loguées, ni exposées via des Server Actions ou APIs publiques.

---

## 2. Inventaire Détaillé des Variables d'Environnement

| Nom de la Variable | Catégorie | Obligatoire | Portée / Usage | Description & Exemple de Format |
| :--- | :--- | :--- | :--- | :--- |
| **`NEXT_PUBLIC_SITE_URL`** | `PUBLIC` | Oui | Client & Serveur | URL canonique du site vitrine en production (`https://hamzaphone.dz`). |
| **`NEXT_PUBLIC_SUPABASE_URL`** | `PUBLIC` | Oui | Client & Serveur | URL de l'instance Supabase (`https://<project-ref>.supabase.co`). |
| **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | `PUBLIC` | Oui | Client & Serveur | Clé publique anonyme avec RLS activé pour les requêtes vitrine. |
| **`SUPABASE_SERVICE_ROLE_KEY`** | `SECRET` | Oui | Serveur Uniquement | Clé super-administrateur Supabase (bypass RLS pour les migrations et scripts système). |
| **`DATABASE_URL`** | `SECRET` | Oui | Serveur Uniquement | Chaîne de connexion PostgreSQL directe ou via PgBouncer (`postgresql://postgres:[password]@db...:5432/postgres?pgbouncer=true`). |
| **`ECOTRACK_API_URL`** | `SERVER_ONLY` | Oui | Serveur Uniquement | URL du point de terminaison de l'API EcoTrack Algérie (`https://api.ecotrack.dz/v1`). |
| **`ECOTRACK_API_TOKEN`** | `SECRET` | Oui | Serveur Uniquement | Jeton d'authentification API pour la création automatique des bordereaux d'expédition. |
| **`ECOTRACK_WEBHOOK_SECRET`** | `SECRET` | Oui | Serveur Uniquement | Jeton secret partagé pour authentifier et signer les webhooks entrants d'EcoTrack. |
| **`SMS_GATEWAY_API_URL`** | `SERVER_ONLY` | Optionnel | Serveur Uniquement | URL de la passerelle SMS nationale pour les notifications de livraison. |
| **`SMS_GATEWAY_API_KEY`** | `SECRET` | Optionnel | Serveur Uniquement | Clé d'API du fournisseur SMS Algérie. |
| **`SMS_GATEWAY_SENDER_ID`** | `SERVER_ONLY` | Optionnel | Serveur Uniquement | Nom d'émetteur approuvé par l'ARPT (ex: `HamzaPhone`). |
| **`WHATSAPP_CLOUD_API_TOKEN`** | `SECRET` | Optionnel | Serveur Uniquement | Jeton d'accès permanent Meta Graph API pour l'envoi de messages de suivi WhatsApp. |
| **`WHATSAPP_PHONE_NUMBER_ID`** | `SERVER_ONLY` | Optionnel | Serveur Uniquement | Identifiant de la ligne WhatsApp Business HamzaPhone. |
| **`CRON_SECRET`** | `SECRET` | Oui | Serveur Uniquement | Jeton d'autorisation pour les tâches cron de nettoyage et d'archivage automatique. |

---

## 3. Configuration des Fournisseurs OAuth (Google, Facebook, Apple)

### URLs de Redirection & Callbacks Supabase Auth :

| Fournisseur | Environnement Local (Développement) | Environnement de Production |
| :--- | :--- | :--- |
| **Origine Site Web** | `http://localhost:3000` | `https://hamzaphone.dz` |
| **Callback Supabase Auth** | `https://<dev-project-ref>.supabase.co/auth/v1/callback` | `https://<prod-project-ref>.supabase.co/auth/v1/callback` |
| **Redirection App Locale** | `http://localhost:3000/auth/callback` | `https://hamzaphone.dz/auth/callback` |

#### Identifiants Requis dans la Console Supabase (Auth -> Providers) :
- **Google OAuth** : Client ID + Client Secret (autoriser `https://hamzaphone.dz/auth/callback` dans Google Cloud Console).
- **Facebook OAuth** : App ID + App Secret (autoriser le domaine `hamzaphone.dz` dans Meta for Developers).
- **Apple Sign-In** : Service ID, Team ID, Key ID, et clé privée `.p8`.

---

## 4. Configuration EcoTrack : Bac à Sable vs Production

| Paramètre | Mode Développement / Sandbox | Mode Production Réel |
| :--- | :--- | :--- |
| **URL API EcoTrack** | `https://sandbox.ecotrack.dz/v1` (ou simulation locale) | `https://api.ecotrack.dz/v1` |
| **Mode Sandbox Automatique** | Activé par défaut si `ECOTRACK_API_TOKEN` non défini | Désactivé (nécessite le token officiel) |
| **Webhook Secret** | Optionnel en local | **Obligatoire** (`ECOTRACK_WEBHOOK_SECRET`) |
| **Format Numéro Colis** | `ECO-XXXXXXXXXXXX` | Attribué par l'algorithme officiel EcoTrack |

---

## 5. Matrice de Validation au Démarrage

Le module central [`src/lib/config/environment.ts`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/config/environment.ts) valide obligatoirement les variables au lancement :
```typescript
import { assertProductionEnvironment } from '@/lib/config/environment';

// Déclenché au boot de l'application Next.js
assertProductionEnvironment();
```

---

## 6. Recommandations de Déploiement

1. **Fournisseur Cloud (Vercel / VPS Docker / Kubernetes)** : Renseigner les variables `SECRET` directement via le gestionnaire de secrets sécurisé (Vault, Vercel Project Secrets, ou Docker Swarm Secrets).
2. **Pas de fichier `.env` en production** : Le fichier `.env.local` est strictement réservé au développement local et ignoré par Git via `.gitignore`.
3. **Rotation des Clés** : Prévoir une rotation semestrielle du `ECOTRACK_WEBHOOK_SECRET` et du `SUPABASE_SERVICE_ROLE_KEY`.

