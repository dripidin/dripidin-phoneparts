# HamzaPhone — Spécification & Manuel du Mode Démonstration Client

> **Version:** 1.0.0  
> **Environnement Cible :** `https://hamzaphone.vercel.app` (et tout déploiement de prévisualisation)  
> **Objectif :** Permettre la démonstration commerciale complète de la plateforme HamzaPhone (Catalogue, Recherche, Panier, Checkout COD 58 Wilayas, B2B wholesale, Tableau de bord d'administration) en toute sécurité, sans dépendance externe obligatoire et sans frais réels.

---

## 1. Principes & Barrières de Sécurité du Mode Démo

En Mode Démonstration :
1. **Zéro Dépense Externe** :
   - Aucun appel payant n'est émis vers des passerelles SMS nationales (les messages sont enregistrés avec succès dans le journal simulé).
   - Aucun frais Meta WhatsApp Cloud API n'est facturé.
   - Aucun envoi de mail non sollicité n'est déclenché vers des adresses réelles.
2. **Zéro Mutation Logistique Réelle** :
   - Aucun bordereau réel d'expédition n'est créé auprès du transporteur EcoTrack Algérie tant que le mode reste en Sandbox/Démo.
   - Les commandes génèrent des identifiants d'expédition virtuels réalistes sous le format `ECO-XXXXXX`.
3. **Indicateurs Visuels Explicites** :
   - Un bandeau distinctif **"Mode Démonstration Client Sécurisé (Sandbox)"** est visible dans le panneau d'administration.
   - Les commandes passées en mode démo sont identifiées par la balise `[COMMANDE DÉMO]` dans les notes et le suivi.
4. **Intégrité de la Machine à États** :
   - Toutes les transitions de statut de commande (`PENDING` -> `CONFIRMED` -> `PROCESSING` -> `READY_FOR_SHIPMENT` -> `SHIPPED` -> `DELIVERED`) fonctionnent fidèlement avec contrôle des rôles et permissions RBAC.

---

## 2. Alimentation Contrôlée du Stock Démo (DEMO_SEED)

Les produits du catalogue initial peuvent avoir un stock à 0 qui empêche l'ajout au panier. L'utilitaire **`DemoInventoryService`** a été conçu pour résoudre ce problème avec des garde-fous stricts :

### Règles d'Exécution :
* **Cible Exclusivement les Produits ACTIFS** : Les pièces en brouillon (`DRAFT`) ou archivées (`ARCHIVED`) ne sont jamais modifiées.
* **Quantité Démo Configurable** : Défaut fixé à **5 unités** disponibles par produit actif.
* **Préservation Absolue des Prix & Métadonnées** :
  - Le prix de revient (`cost_price_dzd`) reste inchangé.
  - Le prix public B2C (`b2c_price_dzd`) et promotionnel (`b2c_sale_price_dzd`) restent intacts.
  - Le tarif de gros B2B (`b2b_price_dzd`) et les paliers de remises restent intacts.
  - Le SKU et le code-barres ne sont pas altérés.
* **Traçabilité Spécifique dans le Grand Livre** :
  - Chaque mouvement est consigné avec le type de transaction **`DEMO_SEED`** (et non `RECEIVING` ou `PURCHASE`), garantissant qu'il ne pollue pas les statistiques d'achat ou de comptabilité réelle.
  - Une action d'audit `INVENTORY.DEMO_SEED` est enregistrée avec horodatage et identifiant d'opérateur.

### Modes d'Utilisation dans l'Admin :
1. **Depuis Admin -> Centre Intégrations** : Bouton vert d'accès rapide *"Alimenter Stock Démo (5 unités)"*.
2. **Depuis Admin -> Stock & Entrepôt** : Bouton *"Stock Mode Démo"* avec possibilité de configurer la quantité ou de réinitialiser le stock démo à 0 via *"Vider Stock Démo"*.

---

## 3. Centre des Intégrations & Tests de Connexion

Accessible via **Admin -> Centre Intégrations** :
* Visualisation de l'état de chaque intégration (EcoTrack, Email, SMS, WhatsApp, Telegram, Supabase DB & Auth, Supabase Storage, OAuth, Monitoring).
* Affichage de l'état des identifiants sous forme masquée (`Configured` / `Missing`), sans jamais exposer de valeur secrète.
* Bouton **"Tester Connexion"** exécutant un test serveur non destructif (lecture seule / ping) avec affichage de la latence en millisecondes (`ms`).
* Possibilité d'ajuster les points de terminaison API (URL) et de basculer entre `sandbox` et `production` en un clic.

---

## 4. Parcours de Test Complet Recommandé pour la Démo

1. **Connexion Propriétaire** : Se connecter à l'espace d'administration avec un compte staff.
2. **Initialisation du Stock Démo** : Cliquer sur *"Stock Mode Démo"* (5 unités).
3. **Exploration Vitrine** : Naviguer sur `/products`, tester la recherche instantanée (ex: `écran oled`, `batterie samsung`), ouvrir une fiche produit.
4. **Panier & Checkout Invité (Guest)** : Ajouter un article au panier, renseigner une adresse dans l'une des 58 Wilayas (ex: Alger / El Harrach), sélectionner *Paiement à la livraison (COD)*.
5. **Confirmation & Suivi** : Valider la commande, observer le numéro `HP-2026-XXXXX` et le token de suivi invité à deux facteurs.
6. **Traitement Admin** : Consulter la commande dans **Admin -> Commandes**, changer son statut en `CONFIRMED` puis `READY_FOR_SHIPMENT`.
7. **Simulation Expédition** : Générer l'expédition démo EcoTrack et consulter la timeline de suivi des 58 Wilayas.
