# HamzaPhone — Spécification Technique de la Migration Initiale du Catalogue

Ce document détaille l'**architecture d'importation, le modèle de correspondance (Mapping), la stratégie de traitement par lots et les garanties d'idempotence** pour la migration des 3 946 produits et 3 953 images sources vers **HamzaPhone**.

---

## 1. Modèle de Correspondance des Données (Field Mapping Matrix)

| Champ Source WooCommerce (`products.csv`) | Champ Destination HamzaPhone | Type & Transformation | Justification & Règle Métier |
| :--- | :--- | :--- | :--- |
| **`ID`** | `source_product_id` | `INTEGER` (Clé externe) | Identifiant historique préservé pour l'appariement des images et la traçabilité. |
| *Auto-généré* | `id` | `UUID` (Clé primaire) | Clé primaire interne de HamzaPhone. |
| **`SKU`** (vide dans source) | `sku` | `VARCHAR(64) UNIQUE` | Généré selon le format déterministe `HP-[BRD]-[TYP]-[ID]`. |
| **`Name`** | `name` | `VARCHAR(255)` | Nettoyage des espaces doubles et préservation des codes modèles (ex: `SM-S908B`). |
| *Auto-généré* | `slug` | `VARCHAR(255) UNIQUE` | `slugify(name) + '-[ID]'` garantissant la stabilité des URLs storefront. |
| **`Status`** | `status` | `ProductStatus` | `publish` $\to$ `ACTIVE` (si prix $> 0$) sinon `DRAFT` ; `draft` $\to$ `DRAFT` ; `private` $\to$ `ARCHIVED`. |
| **`Regular Price`** | `b2c_price_dzd` | `NUMERIC(12,2)` | Valeur numérique en Dinar Algérien (DZD). 0 si absent (statut forcé `DRAFT`). |
| **`Sale Price`** | `b2c_sale_price_dzd` | `NUMERIC(12,2)` ou `NULL` | Prix promotionnel B2C si $> 0$ et inférieur au prix régulier. |
| *Non renseigné* | `b2b_price_dzd` | `NULL` | Non inventé ; administrable via la console tarifaire B2B. |
| *Non renseigné* | `cost_price_dzd` | `NULL` | Non inventé ; protégé contre toute exposition publique. |
| **`Categories`** | `category_id` / `categories` | `UUID` / Relations | Classification automatique selon la marque et le type de pièce. |
| **`Is Featured`** | `is_featured` | `BOOLEAN` | `true` si valeur `'1'` ou `'yes'`, sinon `false`. |
| **`Short Description`** | `short_description` | `TEXT` | Texte brut ou HTML nettoyé. |
| **`Description`** | `description` | `TEXT` | Sanitisé contre l'injection de scripts XSS. |
| **`Main Image File`** | `main_image` | `TEXT` (Chemin Storage) | Appariement automatique : `products/[ID]/main.[ext]`. |
| **`Gallery Image Files`** | `product_images` | `JSONB` / Table liée | Liste ordonnée des fichiers `products/[ID]/gallery/[filename]`. |

---

## 2. Algorithme Déterministe de Génération des SKUs

Pour assurer l'uniformité commerciale et la compatibilité avec les lecteurs de codes-barres dans les entrepôts, le SKU est calculé selon la règle :

$$\text{SKU} = \text{"HP-"} + \text{CodeMarque}_{3} + \text{"-"} + \text{CodeType}_{3} + \text{"-"} + \text{ID}_{\text{Source}}$$

### Table des Codes :
* **Marques** : `SAM` (Samsung), `APP` (Apple), `XIA` (Xiaomi/Redmi/Poco), `OPP` (Oppo), `HUA` (Huawei), `HON` (Honor), `REA` (Realme), `INF` (Infinix), `TEC` (Tecno), `NOK` (Nokia), `GOO` (Google), `VIV` (Vivo), `CON` (Condor), `ACE` (Ace), `GEN` (Générique).
* **Types** : `SCR` (Écrans/Afficheurs), `BAT` (Batteries), `CHG` (Connecteurs de charge), `CAM` (Caméras), `BOD` (Vitres/Châssis), `FLX` (Nappes), `MB` (Cartes mères), `PRD` (Divers).

*Exemples concrets :*
- `ID: 22177` (Afficheur Oppo A74) $\to$ **`HP-OPP-SCR-22177`**
- `ID: 22180` (Afficheur Condor L3) $\to$ **`HP-CON-SCR-22180`**
- `ID: 24605` (Nappe Charge S23 Plus) $\to$ **`HP-SAM-CHG-24605`**

---

## 3. Stratégie d'Upload & Chemins Supabase Storage

Les images du dossier source `d:/Websites On Line/wordpress plugin/products/images` sont téléversées dans le bucket public `catalog-images` avec une arborescence ordonnée et sans collision :

```
catalog-images/
├── products/
│   ├── 22177/
│   │   └── main.webp
│   ├── 38541/
│   │   ├── main.webp
│   │   └── gallery/
│   │       └── prod_38541_gal_1.webp
│   └── ...
```

### Règles d'Intégrité des Médias :
1. **Pas de conversion destructive** : Préservation du format source d'origine (WEBP, JPG, PNG, AVIF).
2. **Déduplication au téléversement** : Si l'image existe déjà sur le chemin déterministe, le fichier n'est pas ré-uploadé.
3. **Optimisation dynamique au rendu** : Utilisation du composant Next.js `Image` avec formats AVIF/WebP automatiques pour le storefront.

---

## 4. Gestion des Stocks & Mouvements d'Inventaire

1. **Quantité Initiale** : La source WooCommerce ne comportant pas de suivi d'entrepôt en temps réel, les articles sont initialisés avec `stock_quantity = 0` et `reserved_stock = 0`.
2. **Type de Mouvement Distinct** : Toute régularisation de stock ultérieure est consignée sous le type d'opération immuable `INITIAL_IMPORT` (ou `PHYSICAL_INSPECTION`), évitant toute confusion avec des réceptions fournisseurs (`RECEIVING`).

---

## 5. Exécution par Lots & Capacité de Reprise (Resumability)

Pour éviter tout blocage réseau ou dépassement de mémoire lors du chargement de 3 946 fiches :
1. **Taille des Lots** : Traitement par paquets de **100 produits**.
2. **Idempotence & Upsert** : Les requêtes d'insertion utilisent `ON CONFLICT (sku) DO UPDATE` ou `ON CONFLICT (source_product_id) DO NOTHING`.
3. **Reprise après Interruption** : Si le processus est interrompu au produit 1 500, la relance saute automatiquement les 1 500 premiers produits déjà présents sans créer de doublons ni d'erreurs d'audit.

---

## 6. Journalisation d'Audit & Sécurité

Chaque lot de migration génère une entrée d'audit dans la table `audit_logs` :
- `actor_id` : ID de l'administrateur exécutant la migration.
- `action` : `CATALOG_INITIAL_IMPORT_BATCH`.
- `entity_type` : `PRODUCT`.
- `metadata` : `{ batch_index: N, count: 100, source_file: "products.csv", timestamp: ISO }`.
