# HamzaPhone — Plan de Surveillance Post-Lancement (Semaine 1)

Ce document définit le **protocole de surveillance opérationnelle pour la première semaine** suivant l'ouverture publique de la plateforme **HamzaPhone**.

---

## 1. Calendrier & Fréquence de Surveillance (Jours J0 à J+7)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Jour J0     │    │  Jours J1 - J2  │    │  Jours J3 - J4  │    │  Jours J5 - J7  │
│ Ouverture Réelle│───>│ Première Vague  │───>│ Rapprochement   │───>│ Clôture Hebdo   │
│ & Tests Live COD│    │  Commandes B2B  │    │  Caisse & Stock │    │   & Bilan BI    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 2. Indicateurs Clés de Surveillance Quotidienne (KPI Matrix)

| Domaine Surveillé | Indicateur Critique | Seuil d'Alerte Immédiat | Procédure de Réaction |
| :--- | :--- | :--- | :--- |
| **Erreurs Applicatives** | Taux d'erreurs HTTP 5xx | $> 0.5\%$ des requêtes totales | Consulter les logs serveur et vérifier la disponibilité Supabase/PgBouncer. |
| **Tunnel de Commande** | Commandes échouées au checkout | $> 3$ abandons consécutifs au paiement | Vérifier la validation des numéros de téléphone et le calcul des frais Wilayas. |
| **Recherche Instantanée** | Latence de recherche P95 | $> 200\text{ ms}$ | Vérifier la charge CPU de la base de données et l'indexation des SKUs. |
| **Webhooks EcoTrack** | Événements avec statut `FAILED` | $\ge 1$ événement échoué | Examiner `webhook_events.error_message` et contacter l'équipe support EcoTrack. |
| **Grand Livre de Stock** | Stock physique $<$ Réservé | Tout stock négatif | Bloquer la commande litigieuse et procéder à un comptage d'inventaire physique. |
| **Rapprochement Caisse** | Écart de versement transporteur | Écart $> 1000\text{ DZD}$ sur un lot | Examiner les bordereaux de livraison et consigner l'anomalie dans `payment_discrepancies`. |
| **Notifications Clients** | Échecs d'envoi SMS / WhatsApp | $> 5\%$ d'échecs de remise | Vérifier le solde créditeur de la passerelle SMS et la validité du token Meta. |
| **Imports Fournisseur** | Rejet de lignes d'import | $> 10\%$ de lignes rejetées | Télécharger le rapport d'erreurs et vérifier le format des colonnes du tableur fournisseur. |

---

## 3. Rituels Opérationnels Quotidiens de l'Équipe

### 🌅 Matin (08h30 - 09h00) :
1. **Contrôle de la Caisse & Paiements COD** : Vérifier les versements reçus de la veille via l'onglet *Rapprochement Paiements*.
2. **Vérification des Webhooks** : Contrôler qu'aucun webhook EcoTrack n'est bloqué en état `PENDING` ou `FAILED` dans `webhook_events`.
3. **Revue des Inscriptions B2B** : Traiter et approuver les demandes d'ateliers de réparation en attente (`PENDING`).

### ☀️ Midi (13h30 - 14h00) :
1. **Préparation des Colis & Expéditions** : Valider la génération des bordereaux EcoTrack pour toutes les commandes du matin.
2. **Contrôle des Stocks Faibles** : Vérifier les alertes de seuil critique dans l'onglet *Entrepôt & Stocks*.

### 🌆 Soir (18h00 - 18h30) :
1. **Bilan des Commandes du Jour** : Consolider le volume de ventes B2C / B2B sur le tableau de bord Analytics.
2. **Audit de Sécurité Journalier** : Consulter le journal d'audit (`audit_logs`) pour valider les modifications de prix et de permissions staff.
3. **Vérification des Sauvegardes** : S'assurer du bon archivage continu WAL sur la console Supabase.

---

## 4. Contacts d'Escalade & Responsabilités en Cas d'Urgence

| Rôle Opérationnel | Nom / Responsable | Canal d'Urgence | Périmètre d'Intervention |
| :--- | :--- | :--- | :--- |
| **Incident Manager** | Lead Technique | Téléphone direct / Slack `#alerts-prod` | Panne serveur, indisponibilité base de données, faille de sécurité. |
| **Lead Logistique** | Responsable Expéditions | Ligne directe EcoTrack | Blocage de ramassage colis, problème d'impression bordereaux. |
| **Support Commercial** | Responsable B2B | WhatsApp Support Pro | Réclamations urgentes des ateliers et vérification RC/NIF. |
