# HamzaPhone — Documentation : Paramètres Généraux & CMS Vitrine

## 1. Vue d'Ensemble

Le module **Paramètres Généraux & CMS** permet à l'équipe dirigeante et aux gestionnaires de contenu d'administrer l'identité de l'entreprise, les coordonnées de l'entrepôt de Belfort (Alger), les réseaux sociaux, les métadonnées SEO, ainsi que l'ensemble des sections visibles sur la page d'accueil de la vitrine, **sans jamais devoir modifier le code source ou redéployer l'application**.

---

## 2. Modèle de Données des Paramètres Généraux (`WebsiteSettings`)

### Structure Principale
- **Identité & Contact** : Nom du magasin, logo, favicon, téléphone direct, numéro WhatsApp flottant, adresse postale à Belfort (El Harrach, Alger), horaires d'ouverture.
- **Réseaux Sociaux** : Liens officiels Facebook, Instagram, TikTok, YouTube et canal Telegram.
- **SEO & Référencement** : `metaTitle`, `metaDescription`, `metaKeywords`, `ogImageUrl` (image de partage OpenGraph).
- **Messages Vitrine & Réassurance** :
  - Barre d'annonce supérieure (`announcementBarEnabled`, `announcementBarText`, `announcementBarLink`).
  - Textes des 4 piliers de garantie (`deliveryBadgeText`, `paymentBadgeText`, `warrantyBadgeText`, `supportBadgeText`).
  - Politique de retour SAV et texte de copyright.
  - Couverture nationale certifiée (58 Wilayas).
- **Audit & Versioning** : Numéro de version incrémental (`version`), horodatage et e-mail de l'opérateur ayant effectué la modification.

---

## 3. Gestionnaire CMS Structuré de la Page d'Accueil (`HomepageSection`)

Plutôt qu'un constructeur de page non typé, le CMS repose sur un ensemble de sections modulaires fortement typées :

```
[ ORDRE DES SECTIONS DE LA PAGE D'ACCUEIL ]
1.  sec-hero              : Bannière Héro & Barre de Recherche Immédiate
2.  sec-trust             : Piliers de Réassurance & Garanties
3.  sec-categories        : Grille des Catégories de Pièces
4.  sec-featured-products : Rail Produits Populaires & Meilleures Ventes
5.  sec-b2b               : Bannière Appel à l’Action Espace Pro B2B
6.  sec-new-arrivals      : Rail Nouveaux Arrivages en Stock
7.  sec-brands            : Bandeau des Marques Smartphones Supportées
8.  sec-reviews           : Témoignages & Avis d’Ateliers Partenaires
9.  sec-delivery          : Section Couverture Logistique 58 Wilayas
10. sec-faq               : Foire Aux Questions (FAQ)
```

### Fonctionnalités CMS
- **Activation / Désactivation instantanée** (`enabled: boolean`).
- **Réordonnancement par glisser-déposer ou boutons Monter / Descendre** (`orderIndex: number`).
- **Édition des contenus** : Titre, sous-titre, libellé et lien du bouton d'appel à l'action (CTA), badge d'accroche.

---

## 4. Sécurité, Rôles & Traçabilité (Audit Trail)

| Permission | Rôles Autorisés | Description Opérationnelle |
| :--- | :--- | :--- |
| **`settings.read`** | `OWNER`, `ADMINISTRATOR`, `CONTENT_MANAGER`, `SALES_MANAGER`, `ORDER_MANAGER`, `VIEWER` | Consultation des paramètres de la boutique et de l'historique des versions. |
| **`settings.manage`** | `OWNER`, `ADMINISTRATOR` | Modification des coordonnées, numéros de téléphone, réseaux sociaux et SEO. |
| **`cms.read`** | `OWNER`, `ADMINISTRATOR`, `CONTENT_MANAGER`, `VIEWER` | Lecture de la disposition des sections CMS et contenus de vitrine. |
| **`cms.manage`** | `OWNER`, `ADMINISTRATOR`, `CONTENT_MANAGER` | Modification, activation et réordonnancement des sections de la page d'accueil. |

Toute modification enregistre un cliché d'audit dans la table `audit_logs` ainsi qu'un historique versionné (`settings_history`), garantissant une traçabilité complète sans perte de données.

---

## 5. Synchronisation Vitrine en Temps Réel

Les composants de la vitrine (`StorefrontHeader`, `StorefrontFooter`, bannières d'annonce et sections d'accueil) consomment directement les hooks TanStack Query connectés aux Server Actions (`useWebsiteSettings`, `useHomepageSections`). 
Toute sauvegarde effectuée dans l'Admin Dashboard invalide les clés de cache et met à jour instantanément l'affichage pour les visiteurs sans rechargement lourd.
