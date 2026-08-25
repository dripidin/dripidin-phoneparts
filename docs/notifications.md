# HamzaPhone — Documentation : Système de Notifications & Passerelles d'Alertes

## 1. Vue d'Ensemble

Le système de notification de **HamzaPhone** est conçu selon une architecture événementielle découplée (*Event-Driven Architecture*) permettant de capter l'ensemble des événements du cycle de vie commercial, logistique et financier, puis de les acheminer intelligemment vers les destinataires adéquats (Clients particuliers, Grossistes B2B, Gestionnaires de stock, Administrateurs) à travers plusieurs canaux extensibles.

```
                     [ ÉVÉNEMENT DOMAINE ]
                 (order.*, shipment.*, cod.*,
                  inventory.*, b2b.*, import.*)
                                │
                                ▼
                   [ NotificationService ]
           (Idempotence, Filtrage Rôles, Préférences)
                                │
        ┌───────────────┬───────┴───────┬───────────────┐
        ▼               ▼               ▼               ▼
  [ DASHBOARD ]      [ SMS ]      [ WHATSAPP ]    [ TELEGRAM ]
   (Staff/Client)  (Passerelle DZ) (Meta Cloud)     (Bot Alertes)
```

---

## 2. Événements Domaine & Routage des Destinataires

### Événements de Commande (`order.*`)
- `order.created` : Notification Dashboard pour le gestionnaire de commande + Confirmation SMS/Dashboard au client avec le montant et numéro officiel `HP-2026-XXXX`.
- `order.shipped` / `order.delivered` : Suivi en temps réel de l'acheminement et notification de remise du colis.
- `order.cancelled` / `order.returned` : Traitement des retours et alertes de déstockage.

### Événements Logistiques (`shipment.*`)
- `shipment.created` : Génération du bordereau EcoTrack avec numéro de suivi.
- `shipment.in_transit` : Notification SMS au client avec lien de tracking direct.
- `shipment.failed` : Alerte au service client pour reprise de contact avant retour au stopdesk.

### Événements Financiers & Encaissement COD (`cod.*`, `payment.*`)
- `cod.collected` : Validation de l'encaissement espèces par le livreur au pas de la porte.
- `payment.discrepancy` : **Alerte de sécurité de niveau ATTENTION** transmise à l'administrateur financier en cas d'écart entre montant attendu et montant perçu.

### Événements de Stock & Entrepôt Belfort (`inventory.*`)
- `inventory.low_stock` : Alerte transmise au responsable d'approvisionnement dès qu'une référence passe sous son seuil d'alerte.
- `inventory.out_of_stock` : **Alerte CRITIQUE** de rupture immédiate.

### Événements B2B Grossistes (`b2b.*`)
- `b2b.application_received` : Notification de nouveau dossier fiscal (RC/NIF).
- `b2b.approved` : Message WhatsApp officiel de bienvenue et activation des remises ateliers.

---

## 3. Abstraction des Canaux & Idempotence

L'interface `NotificationChannel` formalise le contrat d'envoi :
```typescript
export interface NotificationChannel {
  readonly channelType: NotificationChannelType;
  isAvailable(): boolean;
  send(notification: NotificationRecord): Promise<ChannelSendResult>;
}
```

### Mécanismes de Sécurité & Fiabilité
1. **Idempotence & Anti-Doublons** : Chaque émission d'événement calcule une clé `idempotencyKey` unique (ex: `evt-order.created-HP-2026-004921-SMS-CUSTOMER`). Deux événements identiques consécutifs ne génèrent aucune notification dupliquée.
2. **Isolation Stricte des Données Clients** : Les clients connectés ont accès uniquement aux notifications où `recipientId === auth.userId`. Ils n'ont aucun accès aux alertes internes de marge, de rupture fournisseur ou d'écarts de caisse.
3. **Gestion des Nouvelles Tentatives (Retry Mechanism)** : En cas d'erreur de réseau ou d'indisponibilité de la passerelle SMS, le système supporte une réexpédition manuelle ou automatique bornée à un maximum de **3 tentatives**.

---

## 4. Matrice des Permissions RBAC

| Permission | Rôles Autorisés | Description Opérationnelle |
| :--- | :--- | :--- |
| **`notifications.read`** | `OWNER`, `ADMINISTRATOR`, `SALES_MANAGER`, `ORDER_MANAGER`, `INVENTORY_MANAGER`, `SUPPORT`, `VIEWER` | Lecture du centre de notifications, badges de non-lus et filtrage. |
| **`notifications.manage`** | `OWNER`, `ADMINISTRATOR` | Configuration des modèles de SMS/WhatsApp et réexpédition des notifications échouées. |

---

## 5. Console Administrateur (`NotificationsView`)

La vue d'administration propose 3 onglets complets :
1. **Boîte de Réception (Inbox & Alertes)** : Filtres par niveau de gravité (`CRITIQUE`, `ATTENTION`, `SUCCÈS`, `INFO`), par canal et par entité avec actions *Marquer comme lu*, *Tout marquer comme lu* et *Réessayer*.
2. **Modèles Transactionnels** : Personnalisation des textes SMS et WhatsApp avec balises dynamiques (`{nom}`, `{numero}`, `{montant}`, `{suivi}`).
3. **Préférences d'Alertes Staff** : Configuration individuelle des alertes actives par profil collaborateur.
