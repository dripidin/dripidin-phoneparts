# HamzaPhone — Registre des Anomalies & Observations QA (E2E Bug Tracker)

## 1. Synthèse de Gravité des Anomalies

| Niveau de Gravité | Définition | Détecté | Résolu | Statut |
| :--- | :--- | :--- | :--- | :--- |
| **P0 — Bloquant Critique** | Arrêt de service, perte financière, corruption de stock, faille de sécurité. | **0** | **0** | `AUCUN BLOQUANT P0` |
| **P1 — Haute Priorité** | Fonctionnalité majeure indisponible sans solution de contournement. | **0** | **0** | `AUCUN BLOQUANT P1` |
| **P2 — Priorité Moyenne** | Comportement sous-optimal avec solution de contournement existante. | **1** | **1** | `RÉSOLU (CORRIGÉ)` |
| **P3 — Basse Priorité** | Amélioration d'ergonomie ou d'affichage mineur. | **2** | **2** | `RÉSOLU (CORRIGÉ)` |
| **Cosmétique** | Ajustement d'espacement, libellé ou micro-alignement visuel. | **1** | **1** | `RÉSOLU (CORRIGÉ)` |

---

## 2. Inventaire des Anomalies & Correctifs Appliqués

### Bug BUG-001 : Limitation de hauteur du panneau de recherche instantanée mobile
- **Gravité** : `P2 (Priorité Moyenne)`
- **Route Affectée** : `/` (Storefront Navbar & Mobile Drawer)
- **Rôle Concerné** : *Tous les utilisateurs mobiles*
- **Sous-système** : `Storefront UI / Instant Search (src/components/storefront/search/instant-search-overlay.tsx)`
- **Correctif Appliqué** : Plafonnement de la hauteur maximale à `max-h-[60vh] sm:max-h-[75vh]` avec `overflow-y-auto` pour garantir la visibilité du bouton de fermeture sur tous les formats mobiles.
- **Statut** : `RESOLVED`

---

### Bug BUG-002 : Normalisation automatique des numéros de téléphone (+213 et espaces)
- **Gravité** : `P3 (Basse Priorité - Ergonomie)`
- **Route Affectée** : `/checkout` & `/register`
- **Rôle Concerné** : *Clients B2C / B2B*
- **Sous-système** : `Validation Schemas (src/lib/validation/auth.schema.ts, account.schema.ts)`
- **Correctif Appliqué** : Intégration de `cleanAlgerianPhone` avec `z.preprocess()` retirant automatiquement les espaces, tirets, parenthèses et convertissant les préfixes `+213` ou `00213` au format local standard à 10 chiffres (ex: `0550123456`).
- **Statut** : `RESOLVED`

---

### Bug BUG-003 : Réinitialisation de pagination sur changement de filtre du journal d'audit
- **Gravité** : `P3 (Basse Priorité)`
- **Route Affectée** : `/admin` -> Onglet Journal d'Audit (`ActivityLogsView`)
- **Rôle Concerné** : *ADMINISTRATOR / OWNER*
- **Sous-système** : `Admin UI (src/components/admin/views/activity-logs-view.tsx)`
- **Correctif Appliqué** : Ajout d'un hook `useEffect` de sécurité vérifiant `if (page > totalPages) setPage(1)` lors de tout changement de filtre de recherche.
- **Statut** : `RESOLVED`

---

### Bug BUG-004 : Harmonisation des badges d'état de stock
- **Gravité** : `Cosmétique`
- **Route Affectée** : `/admin` -> Onglet Gestion des Stocks (`InventoryView`)
- **Rôle Concerné** : *WAREHOUSE_OPERATOR*
- **Sous-système** : `Admin UI (src/components/admin/views/inventory-view.tsx, src/components/ui/badge.tsx)`
- **Correctif Appliqué** : Uniformisation des classes de base `inline-flex items-center gap-1` sur la primitive `Badge`.
- **Statut** : `RESOLVED`
