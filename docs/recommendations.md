# HamzaPhone — Documentation : Moteur de Recommandations Produits Déterministe

## 1. Vue d'Ensemble & Objectifs

Le moteur de recommandations de **HamzaPhone** fournit des suggestions de pièces détachées et d'accessoires de manière **déterministe, explicable, performante et respectueuse de la vie privée**.

Plutôt que d'introduire des modèles de Machine Learning "boîte noire", le moteur exploite les relations métier réelles du catalogue :
1. **Co-occurrence d'achat dans les commandes passées** (*Fréquemment achetés ensemble*).
2. **Compatibilité matérielle par modèle de smartphone** (*Même gamme / Marque*).
3. **Réapprovisionnement ciblé pour ateliers professionnels B2B**.
4. **Meilleures ventes par catégorie**.

---

## 2. Typologie des Recommandations

```
                                [ REQUÊTE CONTEXTUELLE ]
                        (Fiche Produit, Panier, Client B2B/B2C)
                                         │
                                         ▼
                             [ RecommendationService ]
                                         │
     ┌───────────────────┬───────────────┴───────────────┬───────────────────┐
     ▼                   ▼                               ▼                   ▼
[ CO-OCCURRENCE ] [ COMPATIBILITÉ ]              [ RÉASSORT B2B ]    [ TOP CATÉGORIE ]
 (Panier combiné)  (Même smartphone)              (Écrans / Batt.)    (Meilleures Ventes)
```

### 1. Fréquemment Achetés Ensemble (`FREQUENTLY_BOUGHT_TOGETHER`)
- **Principe** : Analyse les commandes historiques pour identifier les produits commandés simultanément (ex: Écran OLED + Adhésif d'étanchéité + Kit d'outils de démontage).
- **Raisonnement** : *"Fréquemment acheté ensemble lors des réparations"*.

### 2. Compatibilité Appareils & Modèles (`COMPATIBLE_DEVICES`)
- **Principe** : Filtre les pièces partageant la même marque et les mêmes codes modèles matériels (`modelCode`, ex: `SM-S908B` pour Galaxy S22 Ultra).
- **Raisonnement** : *"Pièce compatible pour modèles Samsung"*.

### 3. Réapprovisionnement Ateliers B2B (`B2B_REPLENISHMENT`)
- **Principe** : Pour les comptes B2B authentifiés, le moteur analyse l'historique d'achat spécifique de l'atelier et suggère les pièces d'usure à haute rotation (écrans service pack, batteries haute capacité, connecteurs de charge) disponibles en stock de gros.
- **Raisonnement** : *"Référence recommandée pour réapprovisionnement atelier B2B"*.
- **Protection des Données** : L'historique d'un réparateur n'est **jamais** divulgué ni utilisé pour influencer les suggestions d'un atelier concurrent.

### 4. Populaires dans la Catégorie (`POPULAR_IN_CATEGORY`)
- **Principe** : Recommandation de secours basée sur le volume de stock disponible et la popularité générale de la catégorie.
- **Raisonnement** : *"Meilleure vente populaire chez HamzaPhone"*.

---

## 3. Structure du Modèle de Données

```typescript
export interface ProductRecommendation {
  product: PublicProductRecommendationItem;
  reasonFr: string;
  reasonAr?: string;
  score: number;
  type: RecommendationType;
}
```

Toutes les propriétés exposées au client sont strictement nettoyées :
- `costPriceDzd` n'est **jamais** inclus dans les objets renvoyés aux visiteurs vitrine.
- Les prix publics (`b2cPriceDzd`), prix promotionnels (`b2cSalePriceDzd`) et prix grossistes de base (`b2bBasePriceDzd`) sont calculés de manière transparente.

---

## 4. Stratégie de Mise en Cache & Performance

1. **Calcul Déterministe Côté Serveur** : Les requêtes sont exécutées sans latence superflue en O(N) sur les structures en mémoire / indexées.
2. **Cache Client TanStack Query** : Les recommandations sont mises en cache pour une durée de **5 minutes** (`staleTime: 1000 * 60 * 5`).
3. **Invalidation Ciblée** : Les caches sont automatiquement invalidés lors de modifications d'état du catalogue (création de commande, ajustement de stock) sans rechargement global du site.
