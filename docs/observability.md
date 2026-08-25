# HamzaPhone — Spécification d'Observabilité, Traçabilité & Monitoring d'Erreurs

## 1. Principes Directeurs & Confidentialité (Privacy-First Monitoring)

Le système d'observabilité de HamzaPhone est conçu pour offrir une visibilité temps réel sur les flux opérationnels et financiers tout en respectant une règle absolue de non-exposition des secrets et des données personnelles (PII) :
- **Zéro Mot de Passe ou Jeton Logué** : Aucune trace d'authentification, mot de passe en clair, clé API ou jeton de session n'est jamais inséré dans les journaux applicatifs.
- **Masquage Automatique des Données Personnelles** : Les numéros de téléphone algériens et adresses postales de livraison sont anonymisés ou masqués dans les rapports d'erreurs externes (`0550****56`).
- **Structure JSON Normalisée** : Tous les événements d'audit et erreurs système respectent un schéma structuré exploitable par des moteurs d'analyse de logs (Datadog, Grafana Loki, CloudWatch).

---

## 2. Points d'Intégration Critiques pour le Monitoring

```
                                [ APP ROUTER / SERVER ACTIONS ]
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
     [ Erreurs Webhooks ]            [ Écarts Caisse COD ]           [ Rejets de Sécurité ]
    (Échecs EcoTrack 58 W)         (Discrepancies > 0 DZD)          (Tentatives IDOR / RBAC)
               │                               │                               │
               └───────────────────────────────┼───────────────────────────────┘
                                               │
                                               ▼
                              [ GESTIONNAIRE D'OBSERVABILITÉ ]
                              - audit_logs (PostgreSQL)
                              - Sentry SDK (Alertes temps réel)
                              - Métriques Agrégées (Analytics)
```

### 1. Échecs de Webhooks Logistiques EcoTrack
- **Point d'écoute** : `src/app/api/webhooks/ecotrack/route.ts` & `DeliveryService.processWebhookEvent`.
- **Déclencheur d'alerte** : Webhook reçu avec signature invalide ou échec de transition d'état (`processing_status: 'FAILED'`).
- **Niveau de criticité** : `HAUT` (notification immédiate de l'équipe logistique).

### 2. Écarts Financiers & Rapprochement COD
- **Point d'écoute** : `PaymentService.recordCollection` et `reconcilePayment`.
- **Déclencheur d'alerte** : Détection d'un écart entre le montant perçu par le livreur et le total TTC de la commande (`DISCREPANCY`).
- **Niveau de criticité** : `CRITIQUE` (alerte immédiate pour le responsable comptable).

### 3. Blocages d'Autorisation & Tentatives d'Élévation de Privilèges
- **Point d'écoute** : `src/lib/permissions/guards.ts` (`requirePermission`, `requireRole`, `requireBusinessMember`).
- **Déclencheur d'alerte** : Requête de modification de prix ou d'accès aux coûts d'achat effectuée par un utilisateur sans `pricing.read`.
- **Niveau de criticité** : `MOYEN` (consignation dans `audit_logs` avec adresse IP et identifiant utilisateur).

---

## 3. Format des Journaux Structurés (Structured Log Schema)

```json
{
  "timestamp": "2026-08-24T18:50:00.000Z",
  "level": "ERROR",
  "service": "hamzaphone-delivery",
  "environment": "production",
  "event": "WEBHOOK_PROCESSING_FAILED",
  "correlation_id": "wh_evt_1787552000_abcde",
  "context": {
    "provider": "ECOTRACK",
    "tracking_number": "ECO-DZ-16-00452",
    "order_number": "HP-2026-000101",
    "attempt_count": 2,
    "error_code": "ORDER_ALREADY_TERMINAL",
    "error_message": "Cannot apply in_transit on returned order"
  }
}
```

---

## 4. Intégration Recommandée de Sentry en Production

Pour connecter un monitoring d'erreurs en temps réel sans altérer le code métier :
1. Installer le SDK officiel Sentry Next.js :
   ```bash
   npm install @sentry/nextjs
   ```
2. Configurer `SENTRY_DSN` dans le gestionnaire de secrets sécurisé.
3. Activer le filtre de masquage de PII dans `sentry.client.config.ts` et `sentry.server.config.ts` :
   ```typescript
   beforeSend(event) {
     if (event.request?.headers) {
       delete event.request.headers['authorization'];
       delete event.request.headers['x-ecotrack-secret'];
     }
     return event;
   }
   ```
