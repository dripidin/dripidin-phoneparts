# HamzaPhone — Guide des Identifiants Requis pour la Démo & la Production

> **Objectif :** Ce document synthétise de manière exhaustive et limpide l'ensemble des identifiants nécessaires pour faire fonctionner la plateforme HamzaPhone en démonstration client sur Vercel, puis lors de la mise en production définitive.
> 
> **Important :** Aucun secret réel n'est inclus dans ce document. Toutes les clés peuvent être modifiées ultérieurement sans modifier une seule ligne de code source.

---

# 1. MUST PROVIDE NOW (Obligatoires pour la Démo Immédiate)

Ces 3 identifiants permettent à la boutique de fonctionner en ligne (base de données Supabase, affichage du catalogue, gestion du panier et validation du passage de commande en mode démo).

| Fournisseur | Identifiant Requis | Nom de la Variable d'Environnement | Pourquoi est-ce nécessaire ? | Où le renseigner ? | Portée (Public / Serveur) | Modifiable plus tard sans code ? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Supabase Cloud** | URL du projet hébergé | `NEXT_PUBLIC_SUPABASE_URL` | Permet au frontend et au backend de se connecter à la base de données PostgreSQL et au stockage d'images. | Variables Vercel (Project Settings -> Environment Variables) | **Public** (`NEXT_PUBLIC_`) | **Oui** (via Vercel ou fichier `.env`) |
| **Supabase Cloud** | Clé publique anonyme | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Permet les requêtes clientes sécurisées par Row Level Security (RLS) pour la vitrine. | Variables Vercel (Project Settings -> Environment Variables) | **Public** (`NEXT_PUBLIC_`) | **Oui** |
| **Supabase Cloud** | Clé Super-Administrateur (Service Role) | `SUPABASE_SERVICE_ROLE_KEY` | Permet au serveur d'exécuter les écritures multi-tables privilégiées (création atomique des commandes, réservations de stock). | Variables Vercel (Project Settings -> Environment Variables) | **Serveur Uniquement** (Secret) | **Oui** |
| **Domaine Public** | URL canonique du site | `NEXT_PUBLIC_SITE_URL` | Détermine les redirections d'authentification et l'URL de base (`https://hamzaphone.vercel.app`). | Variables Vercel (Project Settings -> Environment Variables) | **Public** (`NEXT_PUBLIC_`) | **Oui** |

---

# 2. OPTIONAL FOR DEMO (Optionnels pour la Démo)

*La plateforme intègre déjà un moteur de simulation complet pour ces services. Vous n'avez pas besoin de les fournir pour faire la démonstration client complète. Si vous les fournissez, la plateforme se connectera en direct.*

| Fournisseur | Identifiant | Nom de la Variable | Usage | Où le renseigner ? | Portée |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EcoTrack Express** | Jeton API Sandbox | `ECOTRACK_API_TOKEN` | Permet de tester les appels API réels vers le bac à sable EcoTrack au lieu du mock interne. | Variables Vercel | **Serveur Uniquement** (Secret) |
| **EcoTrack Express** | URL API EcoTrack | `ECOTRACK_API_URL` | URL de l'API (`https://api.ecotrack.dz/api/v1` ou sandbox). | Admin Integration Center ou Vercel | **Serveur Uniquement** |
| **Telegram Bot** | Jeton du Bot | `TELEGRAM_BOT_TOKEN` | Permet de recevoir de vraies notifications sur un canal Telegram lors de chaque nouvelle commande démo. | Variables Vercel | **Serveur Uniquement** (Secret) |

---

# 3. REQUIRED AFTER PURCHASE / PRODUCTION (Requis pour la Production Réelle)

*Ces identifiants seront nécessaires une fois le contrat commercial finalisé, pour activer les services payants et contractuels réels en Algérie.*

| Fournisseur | Identifiant Requis | Nom de la Variable | Pourquoi est-ce nécessaire ? | Où le renseigner ? | Portée | Modifiable sans code ? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EcoTrack Express Algérie** | Jeton API Officiel Production | `ECOTRACK_API_TOKEN` | Génération réelle des bordereaux d'expédition, collecte des montants Cash on Delivery (COD) dans les 58 Wilayas. | Variables d'environnement serveur / Secret Manager | **Serveur Uniquement** (Secret) | **Oui** |
| **EcoTrack Express Algérie** | Secret Webhook Partagé | `ECOTRACK_WEBHOOK_SECRET` | Validation HMAC sécurisée des notifications de changement de statut des colis expédiés. | Variables d'environnement serveur | **Serveur Uniquement** (Secret) | **Oui** |
| **Passerelle SMS Nationale** | Clé API SMS (MaghrebSMS / Ooredoo) | `SMS_GATEWAY_API_KEY` | Envoi des SMS réels aux clients algériens pour la confirmation de commande et le suivi de livraison. | Variables d'environnement serveur | **Serveur Uniquement** (Secret) | **Oui** |
| **Passerelle SMS Nationale** | Nom d'émetteur ARPT | `SMS_GATEWAY_SENDER_ID` | Nom officiel approuvé affiché comme expéditeur du SMS (ex: `HamzaPhone`). | Admin Integration Center ou Variable Serveur | **Serveur Uniquement** | **Oui** |
| **Meta WhatsApp Business** | Permanent Access Token Graph API | `WHATSAPP_CLOUD_API_TOKEN` | Envoi automatisé des messages WhatsApp aux clients avec facture PDF et lien de suivi en temps réel. | Variables d'environnement serveur | **Serveur Uniquement** (Secret) | **Oui** |
| **Meta WhatsApp Business** | Identifiant de Ligne | `WHATSAPP_PHONE_NUMBER_ID` | Numéro de téléphone WhatsApp Business enregistré chez Meta. | Admin Integration Center ou Variable Serveur | **Serveur Uniquement** | **Oui** |
| **Resend / Serveur SMTP** | Mot de passe SMTP ou Clé API | `SMTP_PASSWORD` / `RESEND_API_KEY` | Envoi par e-mail des devis proforma, factures fiscales et relevés de compte pour les ateliers B2B. | Variables d'environnement serveur | **Serveur Uniquement** (Secret) | **Oui** |
| **Google Cloud Console** | Client ID & Client Secret | `GOOGLE_CLIENT_SECRET` | Activation de la connexion en 1 clic avec un compte Google pour les clients vitrine. | Console Supabase (Auth -> Providers -> Google) | **Console Supabase** | **Oui** |
| **Système de Maintenance** | Jeton Cron Secret | `CRON_SECRET` | Sécurisation des tâches planifiées d'archivage automatique et libération des stocks non réclamés. | Variables d'environnement serveur | **Serveur Uniquement** (Secret) | **Oui** |

---

## 4. Résumé pour le Développeur

Pour tester l'intégralité du tunnel d'achat maintenant sur `https://hamzaphone.vercel.app` :
1. Les 3 variables Supabase fondamentales suffisent amplement (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
2. Rendez-vous dans **Admin -> Stock & Entrepôt** ou **Admin -> Centre Intégrations** et cliquez sur **"Stock Mode Démo (5 unités)"** pour débloquer immédiatement tous les produits du panier et du checkout.
3. Aucune clé réelle n'est requise pour tester la logistique EcoTrack : l'émulateur démo génère des bordereaux `ECO-XXXXXX` et des timelines complètes sur 58 Wilayas sans coût externe.
