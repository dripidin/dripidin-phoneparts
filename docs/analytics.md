# HamzaPhone — Documentation : Statistiques, Rapports & Business Intelligence

## 1. Vue d'Ensemble & Principes Directeurs

Le module **Analytics & Business Intelligence** de HamzaPhone est conçu pour transformer l'ensemble des données opérationnelles de commerce, de logistique 58 Wilayas, de caisse COD et de gestion de stock en indicateurs de pilotage précis, sans recourir à des plateformes tierces invasives ni inventer de faux KPIs.

### Principes d'Ingénierie
1. **Données Opérationnelles Réelles** : Agrégation directe côté serveur à partir des tables et des registres existants (`orders`, `order_items`, `inventory_txs`, `payments`, `deliveries`).
2. **Confidentialité & Protection des Données Financières** : Les marges brutes et les coûts d'achat unitaires (`costPriceDzd`) sont strictement masqués (`null`) pour tout utilisateur dépourvu de la permission `pricing.read`.
3. **Fuseau Horaire Localisé** : Toutes les bornes de calendrier et de périodes (`today`, `7d`, `30d`, `90d`, `custom`) sont calculées selon le fuseau officiel de l'Algérie (**`Africa/Algiers` / UTC+1** sans heure d'été).
4. **Optimisation des Performances** : Agrégation serveur optimisée, mise en cache côté client via TanStack Query (`staleTime: 2min`) et génération à la demande d'exports de rapports CSV nettoyés.

---

## 2. Domaines Analytiques & Métriques Couvertes

### 1. Ventes & Flux Financiers (`SalesMetrics`)
- **Chiffre d'Affaires Brut (Gross Sales)** : Total TTC des commandes non annulées sur la période.
- **Chiffre d'Affaires Net (Net Sales)** : Total des commandes effectivement livrées et encaissées.
- **Revenus de Livraison** : Somme des frais de port facturés.
- **Remises Grossistes B2B** : Total des réductions accordées aux ateliers partenaires.
- **Remboursements & Retours** : Montant des commandes retournées au SAV.
- **Encaissements Espèces COD** : Somme des montants collectés à la livraison (`COLLECTED`, `REMITTED`, `RECONCILED`).
- **COD en Cours vs Rapproché** : Montants en transit livreur vs clôturés en comptabilité.
- **Marge Brute Réalisée & Taux de Marge** : `Chiffre d'Affaires - COGS` (accessible uniquement avec `pricing.read`).

### 2. Commandes & Entonnoir de Conversion (`OrderMetrics`, `ConversionFunnel`)
- **Volumes par État** : En attente, Confirmées, En préparation, Expédiées, Livrées, Annulées, Retours.
- **Taux Opérationnels** :
  - Taux d'annulation : $\frac{\text{Annulées}}{\text{Total Commandes}} \times 100$
  - Taux de retour (RTO) : $\frac{\text{Retours}}{\text{Total Commandes}} \times 100$
  - Taux de réalisation : $\frac{\text{Livrées}}{\text{Total Commandes}} \times 100$
  - Panier Moyen (AOV) en DZD.
- **Entonnoir de Conversion à 5 Étapes** :
  $$\text{Vues Fiches Pièces} \longrightarrow \text{Ajouts Panier} \longrightarrow \text{Tunnel Engagé} \longrightarrow \text{Commandes Confirmées} \longrightarrow \text{Colis Livrés \& Encaissés}$$

### 3. Produits & Demande Vitrine (`ProductAnalytics`, `SearchAnalytics`)
- **Top Ventes (Best Sellers)** : Références triées par unités vendues et CA généré.
- **Ventes Lentes (Slow Moving)** : Pièces en stock ayant un faible ratio de rotation.
- **Produits Abandonnés au Panier** : Pièces à fort taux d'ajout mais faible finalisation.
- **Recherches Populaires** : Termes les plus tapés par les réparateurs avec comptage des résultats moyens.
- **Recherches Sans Résultat (Zero-Result Searches)** : Détection immédiate des manques dans le catalogue pour guider les commandes usine en Chine.

### 4. Comparatif de Segments B2C vs B2B (`B2CvsB2BComparison`)
- Analyse comparative côte-à-côte des particuliers vs ateliers grossistes :
  - Nombre de comptes clients actifs
  - Nombre total de commandes
  - Chiffre d'affaires généré & Part du CA Grossiste (%)
  - Panier moyen (AOV)
  - Nombre d'articles par commande
  - Taux de retour

### 5. Stocks & Valorisation de l'Entrepôt (`InventoryAnalytics`)
- Total des unités en stock, unités réservées en commande, unités disponibles.
- Nombre de références en stock critique ($\le \text{minStockAlert}$) et en rupture totale.
- Valorisation du stock au prix public de vente.
- Valorisation du stock au coût d'achat fournisseur (protégée par RBAC).
- Taux de rotation du stock ($\text{Unités Vendues} / \text{Stock Moyen}$).

### 6. Logistique 58 Wilayas & Rapprochement des Paiements (`DeliveryAnalytics`, `PaymentAnalytics`)
- Taux de succès des livraisons EcoTrack.
- Répartition Domicile vs Retrait Stopdesk.
- Classement des Wilayas par volume d'expéditions et chiffre d'affaires.
- Taux de collecte COD, taux de versement transporteur et taux d'écart de caisse.

---

## 3. Matrice des Permissions RBAC

| Permission | Rôles Autorisés | Description Opérationnelle |
| :--- | :--- | :--- |
| **`analytics.read`** | `OWNER`, `ADMINISTRATOR`, `SALES_MANAGER`, `ORDER_MANAGER`, `INVENTORY_MANAGER`, `CONTENT_MANAGER`, `VIEWER` | Consultation du tableau de bord de statistiques et des graphiques. |
| **`reports.read`** | `OWNER`, `ADMINISTRATOR`, `SALES_MANAGER`, `ORDER_MANAGER`, `INVENTORY_MANAGER`, `VIEWER` | Lecture des tableaux détaillés par wilaya, marque et réconciliation. |
| **`reports.export`** | `OWNER`, `ADMINISTRATOR`, `SALES_MANAGER` | Téléchargement des exports CSV / XLSX avec traçabilité dans `audit_logs`. |
| **`pricing.read`** | `OWNER`, `ADMINISTRATOR`, `SALES_MANAGER`, `VIEWER` | Déblocage des calculs de COGS, marge brute et valorisation au coût fournisseur. |

---

## 4. Exports de Rapports Sécurisés

Les exports CSV générés par `exportAnalyticsReportAction` sont filtrés à la source :
- Aucune donnée secrète (hash de mot de passe, tokens, secrets API) n'est jamais exposée.
- Les données de coût fournisseur sont omises si l'utilisateur n'a pas `pricing.read`.
- Chaque téléchargement génère une entrée d'audit immuable :
  ```json
  {
    "action": "EXPORT_ANALYTICS_REPORT",
    "entity_type": "REPORT",
    "entity_id": "SALES",
    "details": { "reportType": "SALES", "period": "30d", "filename": "hamzaphone-rapport-sales-2026-08-24.csv" }
  }
  ```
