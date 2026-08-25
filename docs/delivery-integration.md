# HamzaPhone - Architecture de Livraison & Intégration EcoTrack

Ce document spécifie l'architecture modulaire et agnostique du moteur de livraison de **HamzaPhone**, l'implémentation du premier transporteur officiel (**EcoTrack Express**), la gestion sécurisée des webhooks, ainsi que la tarification nationale sur les **58 Wilayas d'Algérie**.

---

## 1. Principes d'Architecture & Conception Agnostique

Pour garantir l'évolutivité et éviter tout couplage fort avec un transporteur spécifique, le système repose sur le patron de conception **Provider Pattern / Adapter** :

```
┌─────────────────────────────────────────────────────────────┐
│                    HamzaPhone Core Order                    │
│             (Orders, Inventory, State Machine)              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                ┌──────────────▼──────────────┐
                │   DeliveryService Engine    │
                │(Idempotency, DB, Stock Sync)│
                └──────────────┬──────────────┘
                               │
              ┌────────────────▼────────────────┐
              │    DeliveryProvider Interface   │
              │(create, track, cancel, normalize)│
              └───────┬─────────────────┬───────┘
                      │                 │
         ┌────────────▼────────┐ ┌──────▼──────────────┐
         │  EcoTrack Provider  │ │ Futur (ex: Yalidine)│
         │  (Production /      │ │      Provider       │
         │   Sandbox Fallback) │ └─────────────────────┘
         └─────────────────────┘
```

### Contrat d'Interface `DeliveryProvider`

Défini dans [`src/lib/delivery/types.ts`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/delivery/types.ts) :

* `createShipment(input: CreateShipmentInput): Promise<ShipmentResult>`
* `getShipment(trackingNumber: string): Promise<ShipmentDetails>`
* `trackShipment(trackingNumber: string): Promise<TrackingEvent[]>`
* `cancelShipment(trackingNumber: string, reason?: string): Promise<{ success: boolean; message?: string }>`
* `normalizeStatus(externalStatus: string): DeliveryStatus`
* `validateAddress(address: AlgerianDeliveryAddress): Promise<AddressValidationResult>`
* `testConnection(): Promise<ProviderConnectionTestResult>`

---

## 2. Intégration Transporteur EcoTrack Express

### Configuration Environnementale

```env
ECOTRACK_API_URL=https://api.ecotrack.dz/v1
ECOTRACK_API_TOKEN=votre_jeton_api_ecotrack
ECOTRACK_WEBHOOK_SECRET=votre_secret_webhook_securise
```

*En l'absence de jeton API configuré en local ou environnement de développement, l'adaptateur bascule automatiquement en mode **Sandbox Déterministe** générant des numéros de colis au format `ECO-XXXXXXXXXXXX` et des bordereaux virtuels.*

### Normalisation des Statuts

| Statut EcoTrack | `DeliveryStatus` HamzaPhone | Impact sur `orders.status` | Impact Stock (Inventaire) |
| :--- | :--- | :--- | :--- |
| `pret_a_expedier`, `created` | `PENDING` | `READY_FOR_SHIPMENT` | Réservation active |
| `recu`, `ramasse`, `centre` | `PICKED_UP` | `READY_FOR_SHIPMENT` | Réservation active |
| `en_transit`, `en_voyage` | `IN_TRANSIT` | `SHIPPED` | Réservation active |
| `en_livraison`, `en_cours` | `OUT_FOR_DELIVERY` | `SHIPPED` | Réservation active |
| `livre`, `paye`, `encaisse` | `DELIVERED` | `DELIVERED` *(Payment: PAID)* | `FULFILLMENT_OUT` (Décrémentation définitive) |
| `echec`, `non_abouti` | `FAILED` | Inchangé *(Notification client)* | Inchangé |
| `retour`, `retour_recu` | `RETURNED` | `RETURNED` | `CUSTOMER_RETURN_RESTOCK` (Réintégration stock) |
| `annule` | `CANCELLED` | `CANCELLED` | `RESERVATION_RELEASE` (Libération réservation) |

---

## 3. Matrice de Tarification 58 Wilayas (`DeliveryPricingService`)

La tarification est calculée exclusivement côté serveur par le service autoritaire [`src/lib/delivery/delivery-pricing.service.ts`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/delivery/delivery-pricing.service.ts) :

### Règles Tarifaires :
1. **Wilaya 16 (Alger)** :
   * À Domicile (`HOME`) : **400 DZD** (Délai : 24h à 48h)
   * En Point Retrait / Stopdesk (`DESK`) : **300 DZD** (Délai : 24h)
2. **Autres 57 Wilayas (01-15, 17-58)** :
   * À Domicile (`HOME`) : **600 DZD** (Délai : 48h à 72h)
   * En Point Retrait / Stopdesk (`DESK`) : **450 DZD** (Délai : 48h)
3. **Grand Sud (Adrar, Tamanrasset, Illizi, Tindouf, etc.)** :
   * Même tarif plafond avec estimation de livraison ajustée de **3 à 5 jours ouvrés**.
4. **Seuil de Gratuité Configurable** :
   * Optionnel, configurable par campagne promotionnelle (ex: gratuit dès 20 000 DZD d'achats).

---

## 4. Architecture Sécurisée des Webhooks & Table Persistante (`/api/webhooks/ecotrack`)

### Pipeline de Traitement Multi-Worker Sécurisé :
1. **Vérification du Secret** : Contrôle du jeton `x-ecotrack-secret` ou `Authorization: Bearer <token>`.
2. **Validation Zod du Payload** : Validation stricte de la structure JSON (code de suivi, statut, timestamp, montant).
3. **Empreinte Déterministe (Payload Hash)** :
   * Empreinte unique générée à partir de `provider + tracking_code + status + timestamp + montant + event_id`.
4. **Ingestion & Persistance en Base (`webhook_events`)** :
   * Chaque événement est immédiatement persisté dans la table `public.webhook_events` avec le statut initial `PROCESSING`.
   * Un index d'unicité `UNIQUE(provider, payload_hash)` et `UNIQUE(provider, external_event_id)` garantit l'idempotence absolue même entre plusieurs conteneurs ou workers concurrents.
5. **Gestion des Cas Limites & Échecs** :
   * **Événement Déjà Traité (`PROCESSED`)** : Retour HTTP 200 immédiat sans rejouer les écritures de stock ni altérer la caisse COD.
   * **Événement en Cours (`PROCESSING`)** : Acquittement concurrent sans double exécution.
   * **Événement Échoué (`FAILED`)** : L'erreur technique est consignée dans `error_message`, le compteur `attempt_count` est incrémenté, et une nouvelle tentative est autorisée.
   * **Événements Désordonnés (Out-of-Order)** : La garde d'états terminaux empêche un statut ancien (`IN_TRANSIT`) d'écraser un statut final interne (`DELIVERED` ou `RETURNED`).
6. **Mise à Jour Base de Données** :
   * Table `deliveries` : Mise à jour du statut, historique des événements et horodatages (`dispatched_at`, `delivered_at`).
   * Table `orders` : Synchronisation du statut de commande et paiement COD.
   * Table `inventory_transactions` : Écriture en partie double (`FULFILLMENT_OUT` ou `CUSTOMER_RETURN_RESTOCK`).
   * Table `audit_logs` : Journalisation d'audit immuable avec le contexte du webhook.
   * Table `webhook_events` : Transition finale vers le statut `PROCESSED` avec horodatage `processed_at`.

---

## 5. Console Logistique Admin & Suivi Client

### Console Admin (`/admin` -> Onglet Expéditions & Transport) :
* **Tableau de Bord des Expéditions** : Filtrage multi-critères (Transporteur, Statut, Wilaya, Type de livraison, Recherche textuelle).
* **Création d'Expédition Directe** : Depuis la vue Commande, bouton "Générer Bordereau EcoTrack" pour toute commande `CONFIRMED` ou `PROCESSING`.
* **Impression des Bordereaux** : Accès direct aux bordereaux d'expédition et étiquettes de transport.
* **Test de Connectivité API** : Diagnostic en temps réel de l'état du serveur EcoTrack avec mesure de latence.
* **Matrice des 58 Wilayas** : Consultation et vérification instantanée des tarifs Domicile et Stopdesk.

### Suivi Storefront (Client & Invité) :
* **Page de Suivi (`/track-order`)** : Affichage du badge transporteur ("EcoTrack Express"), du numéro de colis et du lien direct vers la plateforme officielle de suivi EcoTrack.
