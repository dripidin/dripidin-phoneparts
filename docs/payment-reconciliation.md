# HamzaPhone — Documentation : Système de Paiement & Rapprochement COD (Cash on Delivery)

## 1. Vue d'Ensemble & Découplage des États

Le système financier de **HamzaPhone** sépare formellement et strictement les cinq dimensions du cycle de vie commercial :

```
+------------------+     +------------------+     +------------------+
|   État Commande  |     |  État Livraison  |     |   État Paiement  |
|  (Order Status)  |     |(Delivery Status) |     | (Payment Status) |
+------------------+     +------------------+     +------------------+
| PENDING          |     | PENDING          |     | COD_PENDING      |
| CONFIRMED        |     | PICKED_UP        |     | COD_COLLECTED    |
| PROCESSING       |     | IN_TRANSIT       |     | COD_REMITTED     |
| READY_FOR_SHIP.  |     | OUT_FOR_DELIVERY |     | RECONCILED       |
| SHIPPED          |     | DELIVERED        |     | FAILED           |
| DELIVERED        |     | FAILED           |     | REFUNDED         |
| CANCELLED        |     | RETURNED         |     +------------------+
| RETURNED         |     | CANCELLED        |
+------------------+     +------------------+
```

### Règle Fondamentale de Séparation
- **Une commande livrée n'est JAMAIS automatiquement marquée comme rapprochée en banque.**
- Une commande peut être `DELIVERED` (livrée physiquement au client) tout en ayant son paiement en `COD_PENDING` (en attente de pointage d'encaissement livreur), `COD_COLLECTED` (argent chez le livreur), ou `COD_REMITTED` (fonds transférés par le transporteur mais non encore pointés sur le relevé CCP / bancaire).

---

## 2. Modèle de Données du Domaine de Paiement

### Structure Principale (`PaymentRecord`)
- `id` : Identifiant unique du paiement (UUID).
- `orderId` : Identifiant de la commande associée.
- `orderNumber` : Numéro public de la commande (ex: `HP-2026-004921`).
- `customerName`, `customerPhone`, `customerType` (`'B2C'` | `'B2B'`).
- `wilayaCode`, `wilayaName` : Localisation en Algérie (Wilayas 1 à 58).
- `deliveryProvider` : Code du transporteur (ex: `'ECOTRACK'`).
- `trackingNumber` : Numéro de suivi du colis.
- `deliveryStatus` : État logistique courant.
- `paymentMethod` : `'CASH_ON_DELIVERY'` | `'BANK_TRANSFER'` | `'B2B_CREDIT_ACCOUNT'`.
- `paymentStatus` : Statut financier COD (`COD_PENDING`, `COD_COLLECTED`, `COD_REMITTED`, `RECONCILED`, `FAILED`, `REFUNDED`).
- `expectedAmountDzd` : **Montant attendu officiel**, snapshot immuable calculé par le serveur à partir de la commande.
- `collectedAmountDzd` : Montant en espèces effectivement collecté au pas de la porte.
- `remittedAmountDzd` : Montant viré/reversé par le transporteur dans le bordereau de règlement.
- `discrepancyType` : `'EXACT'` | `'PARTIAL_COLLECTION'` | `'OVER_COLLECTION'` | `'REMITTANCE_SHORTAGE'` | `'REMITTANCE_SURPLUS'` | `'RESOLVED'`.
- `discrepancyAmountDzd` : Différence financière nette.
- `courierReference` : Référence du reçu ou bordereau EcoTrack.
- `collectionDate`, `remittanceDate`, `reconciliationDate` : Horodatages certifiés.
- `reconciledBy` : E-mail de l'opérateur financier ayant certifié le rapprochement.
- `reconciliationBatchId` : Identifiant du bordereau de versement groupé.
- `adjustments` : Historique chronologique immuable des régularisations et abandons d'écart.

---

## 3. Cycle de Vie COD & Machine à États

```
                       [ Commande Validée ]
                                │
                                ▼
                        [ COD_PENDING ]
                                │
        ┌───────────────────────┼───────────────────────┐
        │ (Livraison &          │ (Refus colis /        │ (Annulation)
        │  Collecte Espèces)    ▼  Client introuvable)  ▼
        │                [ COD_COLLECTED ]          [ FAILED ]
        │                       │
        │                       ▼ (Versement EcoTrack / Bordereau)
        │                [ COD_REMITTED ]
        │                       │
        │                       ▼ (Pointage Relevé Bancaire / CCP)
        │                 [ RECONCILED ]
        │                       │
        └───────────────────────┼───────────────────────┘
                                ▼ (Retour SAV / Litige)
                           [ REFUNDED ]
```

### Règles de Transition & Gardes de Sécurité
1. **`COD_PENDING` $\rightarrow$ `COD_COLLECTED`** : Enregistré lors de la confirmation d'encaissement de la tournée livreur. Calcule immédiatement l'écart éventuel (`PARTIAL_COLLECTION` si inférieur, `OVER_COLLECTION` si supérieur).
2. **`COD_COLLECTED` $\rightarrow$ `COD_REMITTED`** : Enregistré lors de la réception du virement ou versement espèces du transporteur. Compare le montant versé au montant collecté.
3. **`COD_REMITTED` $\rightarrow$ `RECONCILED`** : Pointage avec le relevé de compte bancaire ou CCP. **Bloqué si un écart non régularisé subsiste.**
4. **`MANUAL_ADJUSTMENT`** : Permet à un profil habilité (`payments.adjust`) de documenter un abandon d'écart (`DISCREPANCY_WRITE_OFF`) ou une correction d'encaissement avec motif obligatoire.

---

## 4. Bordereaux de Rapprochement Transporteur (Batches EcoTrack)

Pour traiter les volumes importants de commandes expédiées via EcoTrack, le système propose un regroupement en **Bordereaux de Rapprochement** (`ReconciliationBatch`) :
- **Numérotation automatique** : `RECON-YYYYMMDD-ECO-XX`.
- **Agrégation financière** : Somme des montants attendus vs somme des montants versés.
- **Détection des écarts de lot** : Statut `BALANCED` si écart = 0 DZD, sinon `DISCREPANCY`.
- **Clôture globale** : La saisie de la référence bancaire finale marque automatiquement l'ensemble des commandes associées comme `RECONCILED`.

---

## 5. Matrice des Rôles & Permissions

| Permission | Rôles Autorisés | Description Opérationnelle |
| :--- | :--- | :--- |
| **`payments.read`** | `OWNER`, `ADMINISTRATOR`, `SALES_MANAGER`, `ORDER_MANAGER`, `VIEWER` | Consultation du journal des paiements, soldes et échéanciers. |
| **`payments.manage`** | `OWNER`, `ADMINISTRATOR`, `ORDER_MANAGER` | Enregistrement de la collecte livreur et des versements transporteur. |
| **`payments.reconcile`** | `OWNER`, `ADMINISTRATOR` | Création et clôture des bordereaux, validation du rapprochement bancaire CCP. |
| **`payments.adjust`** | `OWNER`, `ADMINISTRATOR` | Régularisations manuelles, corrections d'erreurs et abandons d'écart (Write-offs). |

---

## 6. Console Administrateur (`PaymentsView`)

L'interface dédiée offre :
1. **Bandeau Métrique Financier** : Total attendu, encaissé livreur, versé transporteur, rapproché banque et montant des litiges en cours.
2. **Filtres Rapides** :
   - *Livrés non encaissés* : Détecte les anomalies de tournée.
   - *Encaissés non versés* : Surveille la trésorerie détenue par le transporteur.
   - *Écarts & Litiges* : Isole les dossiers nécessitant une régularisation.
   - *Rapprochés* : Historique archivé et certifié.
3. **Modales Opérationnelles** :
   - *Encaisser COD* avec saisie du montant réel et référence de tournée.
   - *Enregistrer Versement* avec référence de virement EcoTrack.
   - *Rapprocher en Banque* avec saisie de la référence CCP / relevé.
   - *Régularisation Financière* avec motif obligatoire.
   - *Création et Clôture de Bordereaux*.
4. **Tiroir Détail & Timeline** : Vue visuelle étape par étape (Commande $\rightarrow$ Expédition $\rightarrow$ Livraison $\rightarrow$ Encaissement $\rightarrow$ Versement $\rightarrow$ Rapprochement) et grand livre des ajustements.

---

## 7. Résultats des Tests Automatisés

La suite de tests automatisée ([`src/lib/payments/payment-reconciliation.test.ts`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/payments/payment-reconciliation.test.ts)) a validé avec succès l'intégralité des 21 exigences :
- ✅ Découplage strict des statuts de livraison et de paiement.
- ✅ Encaissement exact et détection d'encaissement partiel (`PARTIAL_COLLECTION`).
- ✅ Rejet des montants négatifs.
- ✅ Versement transporteur et détection des écarts de virement (`REMITTANCE_SHORTAGE`).
- ✅ Blocage du rapprochement bancaire en cas d'écart non justifié.
- ✅ Régularisation comptable par écriture d'ajustement (`DISCREPANCY_WRITE_OFF`).
- ✅ Création et clôture de bordereaux de réconciliation multi-commandes.
- ✅ Contrôle strict des permissions RBAC (`payments.read`, `payments.manage`, `payments.reconcile`, `payments.adjust`).
- ✅ **154 tests sur 154 réussis (100% de réussite)**.
