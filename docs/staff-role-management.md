# HamzaPhone — Documentation : Gestion du Personnel, Rôles & Permissions (RBAC)

## 1. Vue d'Ensemble & Philosophie d'Autorisation

Le système d'administration de **HamzaPhone** s'appuie sur une architecture d'autorisation unifiée et stricte basée sur les rôles et permissions granulaires (**RBAC** — *Role-Based Access Control*). 

Aucun second système d'authentification ou d'autorisation n'a été créé côté interface : le modèle backend PostgreSQL (tables `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`, `audit_logs`) et les gardes serveur (`requirePermission`, `requireRole`, `requireStaff`, `requireAuth`) constituent la **source unique de vérité**.

L'interface d'administration offre une expérience claire, sécurisée et opérationnelle permettant aux gestionnaires habilités de :
1. Consulter et gérer l'**Annuaire du Personnel** (création, modification d'attributions, suspension, réactivation).
2. Configurer les **Rôles Opérationnels & Permissions** via un éditeur interactif avec arborescence par domaine métier.
3. Auditer la **Matrice Globale des Permissions** (Ressource $\times$ Action) et l'historique des actions sensibles.
4. Bénéficier de protections anti-fausse manipulation incontournables (**Last Owner Protection**, **Self-Lockout Prevention**, **Privilege Escalation Guard** et **Modale de Confirmation des Actions Dangereuses**).

---

## 2. Architecture & Modèle de Données

```
+-------------------------------------------------------------------------+
|                              auth.users                                 |
+------------------------------------+------------------------------------+
                                     | 1:1
+------------------------------------v------------------------------------+
|                          public.profiles                                |
|  - id (UUID, PK)                                                        |
|  - email (VARCHAR)                                                      |
|  - full_name (VARCHAR)                                                  |
|  - phone (VARCHAR)                                                      |
|  - user_type ('STAFF' | 'B2B' | 'B2C')                                  |
|  - is_active (BOOLEAN)                                                  |
+------------------------------------+------------------------------------+
                                     |
                                     | 1:N
+------------------------------------v------------------------------------+
|                         public.user_roles                               |
|  - user_id (UUID, FK -> profiles.id)                                    |
|  - role_id (UUID, FK -> roles.id)                                       |
+------------------------------------+------------------------------------+
                                     |
                                     | N:1
+------------------------------------v------------------------------------+
|                           public.roles                                  |
|  - id (UUID, PK)                                                        |
|  - code (VARCHAR, UNIQUE: 'OWNER', 'ADMINISTRATOR', etc.)               |
|  - name (VARCHAR)                                                       |
|  - description (TEXT)                                                   |
|  - is_system (BOOLEAN)                                                  |
+------------------------------------+------------------------------------+
                                     |
                                     | 1:N
+------------------------------------v------------------------------------+
|                      public.role_permissions                            |
|  - role_id (UUID, FK -> roles.id)                                       |
|  - permission_id (UUID, FK -> permissions.id)                           |
+------------------------------------+------------------------------------+
                                     |
                                     | N:1
+------------------------------------v------------------------------------+
|                        public.permissions                               |
|  - id (UUID, PK)                                                        |
|  - code (VARCHAR, UNIQUE: 'products.read', 'pricing.update', etc.)      |
|  - resource (VARCHAR: 'products', 'pricing', 'orders', etc.)            |
|  - action (VARCHAR: 'read', 'create', 'update', 'delete', 'manage', etc)|
+-------------------------------------------------------------------------+
```

---

## 3. Rôles Métier Prédéfinis (Système)

| Code Rôle | Nom Affiché | Description & Périmètre Opérationnel | Statut |
| :--- | :--- | :--- | :--- |
| **`OWNER`** | Propriétaire Fondateur | Accès superadministrateur sans aucune restriction (`all`). Gestion des clés API et rôles. | Système (Immuable) |
| **`ADMINISTRATOR`** | Administrateur Général | Gestion opérationnelle complète : catalogue, prix, commandes, clients, personnel. | Système |
| **`SALES_MANAGER`** | Responsable Commercial B2B | Gestion des grossistes B2B, validation des dossiers fiscaux, remises et contrats. | Système |
| **`INVENTORY_MANAGER`**| Responsable Entrepôt | Réceptions fournisseurs, ajustements d'inventaire Belfort et mouvements de stock. | Système |
| **`ORDER_MANAGER`** | Responsable Commandes | Traitement du flux de commandes, emballage et étiquetage EcoTrack. | Système |
| **`CONTENT_MANAGER`** | Spécialiste Catalogue | Fiches techniques, compatibilités smartphones, photos et arborescence. | Système |
| **`SUPPORT`** | Support Client & SAV | Consultation des commandes et suivi des colis pour assistance clientèle. | Système |
| **`VIEWER`** | Auditeur / Lecteur Seul | Consultation générale en lecture seule sans capacité de modification. | Système |

---

## 4. Répertoire des Permissions Granulaires par Domaine

Les permissions sont organisées en 10 domaines fonctionnels :

### 1. Catalogue & Pièces Détachées (`CATALOG`)
- `products.read` : Consultation des fiches produits et compatibilités.
- `products.create` : Ajout de nouvelles pièces détachées.
- `products.update` : Modification des descriptions, photos et spécifications.
- `products.delete` : Archivage ou suppression d'articles.
- `products.bulk_update` : Mises à jour groupées de statut ou marque.
- `categories.manage` : Gestion de l'arborescence des catégories.
- `brands.manage` : Gestion des marques (Samsung, Apple, Xiaomi) et modèles compatibles.

### 2. Tarification & Marges (`PRICING`)
- `pricing.read` : Accès aux prix d'achat confidentiels et marges brutes.
- `pricing.update` : Modification des tarifs unitaires (Public et B2B).
- `pricing.bulk_percentage` : Ajustement général en pourcentage (+/- %).
- `pricing.b2b_tiers` : Configuration des paliers de remises grossistes.
- `pricing.customer_override` : Fixation de prix dérogatoires par contrat client.

### 3. Stock & Entrepôt Belfort (`INVENTORY`)
- `inventory.read` : Consultation des stocks physiques et réservations actives.
- `inventory.adjust` : Ajustements manuels d'inventaire et mise au rebut de casse.
- `inventory.receive` : Enregistrement des réceptions de conteneurs/colis fournisseurs.

### 4. Commandes & Facturation (`ORDERS`)
- `orders.read` : Consultation des commandes et coordonnées clients.
- `orders.create` : Création de commandes manuelles en magasin ou standard.
- `orders.update` : Modification des états de préparation et expédition.
- `orders.cancel` : Annulation de commande avec libération immédiate du stock.
- `orders.refund` : Émission d'avoirs et remboursements SAV.

### 5. Livraison & Transporteur EcoTrack (`DELIVERY`)
- `delivery.dispatch` : Génération des étiquettes et bordereaux EcoTrack.
- `delivery.manage_rates` : Configuration de la grille tarifaire des 58 Wilayas.

### 6. Clients & Grossistes B2B (`CUSTOMERS_B2B`)
- `customers.read` : Consultation du répertoire clients B2C.
- `customers.update` : Mise à jour des profils ou blocage de comptes.
- `b2b.read` : Consultation des dossiers professionnels et documents légaux.
- `b2b.approve` : Validation ou rejet des candidatures grossistes B2B.
- `b2b.manage_pricing` : Attribution des plafonds de crédit et délais de paiement.

### 7. Fournisseurs & Import Direct (`SUPPLIERS`)
- `suppliers.read` : Consultation des fiches usines Chine/Local.
- `suppliers.create` : Ajout de nouveaux fournisseurs.
- `suppliers.update` : Modification des devises et conditions de paiement.
- `suppliers.delete` : Désactivation de partenaires inactifs.

### 8. Import / Export & Lots (`IMPORTS_EXPORTS`)
- `imports.read` : Historique des sessions de téléversement et logs d'erreurs.
- `imports.create` : Téléversement et analyse préliminaire (Dry-Run).
- `imports.apply` : Application définitive des imports en base.
- `imports.cancel` : Annulation d'une session d'importation en attente.
- `products.export` : Extraction de classeurs Excel/CSV avec masquage de marge.

### 9. Utilisateurs Staff & Sécurité (`ADMIN_SECURITY`)
- `all` : Privilège absolu (Wildcard Superadmin).
- `users.manage` : Gestion des collaborateurs staff (invitation, modification de rôles, suspension).
- `audit.read` : Consultation du journal d'audit immuable.

### 10. Paramètres & Configuration Système (`SYSTEM_SETTINGS`)
- `settings.manage` : Clés API, passerelles SMS, WhatsApp Cloud API et sécurité.

---

## 5. Gardes de Sécurité & Règles Anti-Lockout

### 1. Protection du Dernier Propriétaire (*Last Owner Protection*)
- **Règle** : Il est strictement impossible de suspendre, désactiver ou rétrograder le dernier compte actif doté du rôle `OWNER`.
- **Mécanisme** : Le serveur calcule dynamiquement le nombre de comptes `OWNER` actifs avant toute modification. Si le compte cible est le dernier représentant, la transaction est rejetée immédiatement avec le message :
  > *"Action refusée : Impossible de désactiver ou suspendre le dernier compte Propriétaire (OWNER) actif."*

### 2. Prévention de l'Auto-Verrouillage (*Self-Lockout Prevention*)
- **Règle** : Un administrateur connecté ne peut pas désactiver ou suspendre son propre compte en cours d'utilisation.

### 3. Prévention de l'Élévation de Privilèges (*Privilege Escalation Guard*)
- **Règle** : Un utilisateur disposant de la permission `users.manage` mais ne possédant pas le rôle `OWNER` ne peut **pas** attribuer le rôle `OWNER` à un autre compte ni créer un compte `OWNER`.

### 4. Modale de Confirmation des Actions Dangereuses
Toute action sensible (rétrogradation de privilèges, suspension de compte collaborateur) déclenche une modale d'avertissement explicite détaillant :
- **QUI** : Nom complet et adresse e-mail du collaborateur affecté.
- **CE QUI VA CHANGER** : L'action précise demandée (ex: Passage du statut à Inactif).
- **L'ACCÈS PERDU** : La liste des privilèges et accès d'administration révoqués instantanément.

### 5. Masquage des Données Secrètes
- Les endpoints et actions `getStaffListAction` ne retournent aucun mot de passe hashé, token d'authentification ou métadonnées privées.
- L'attribution de mot de passe se fait via lien d'invitation sécurisé Supabase Auth avec 2FA.

---

## 6. Guide des Actions Serveur & Hooks React Query

| Action Serveur | Garde RBAC | Description |
| :--- | :--- | :--- |
| `getStaffListAction()` | `requireStaff` | Liste sécurisée des collaborateurs du personnel. |
| `getStaffDetailsAction(id)` | `users.manage` | Détails complets du profil, permissions effectives et journal d'audit. |
| `createStaffUserAction(input)` | `users.manage` | Création d'un collaborateur avec rôle et validation d'unicité d'e-mail. |
| `updateStaffUserAction(id, input)` | `users.manage` | Mise à jour des informations, rôle et statut avec gardes anti-lockout. |
| `toggleStaffStatusAction(id, active)` | `users.manage` | Suspension immédiate ou réactivation d'un compte staff. |
| `getRolesWithPermissionsAction()` | `requireStaff` | Liste de tous les rôles système et personnalisés avec leurs permissions. |
| `createRoleAction(input)` | `settings.manage` | Création d'un rôle personnalisé avec sélection de permissions. |
| `updateRolePermissionsAction(id, input)`| `settings.manage` | Mise à jour des permissions d'un rôle (avec synchronisation des membres). |
| `duplicateRoleAction(sourceId, code, name)`| `settings.manage` | Clonage instantané d'un rôle existant vers un nouveau rôle sur mesure. |

---

## 7. Résultats des Tests & Assurance Qualité

La suite de tests automatisée (`src/lib/permissions/staff-roles.test.ts`) a validé l'intégralité des scénarios :
- ✅ **138 tests sur 138 réussis avec 100% de succès** sur l'ensemble du projet.
- ✅ Rejet des requêtes anonymes (`UNAUTHENTICATED`).
- ✅ Rejet des clients B2C (`FORBIDDEN`).
- ✅ Rejet des opérateurs sans `users.manage`.
- ✅ Rejet de l'élévation de privilège vers `OWNER`.
- ✅ Rejet de la suspension ou rétrogradation du dernier `OWNER`.
- ✅ Rejet de l'auto-suspension d'un administrateur.
- ✅ Création, modification, duplication de rôles et propagation des permissions.
- ✅ Compilation TypeScript sans erreur (`npm run typecheck` : 0 erreur).
