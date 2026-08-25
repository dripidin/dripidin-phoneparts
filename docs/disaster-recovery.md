# HamzaPhone — Plan de Continuité d'Activité & Reprise Après Sinistre (Disaster Recovery & Backup Plan)

## 1. Objectifs de Continuité d'Activité (SLA / RPO / RTO)

HamzaPhone gérant des transactions commerciales et financières critiques (inventaire en partie double, réconciliation des encaissements COD 58 Wilayas), la stratégie de sauvegarde et de restauration est calibrée selon les objectifs de service suivants :

- **RPO (Recovery Point Objective)** : $\le 5\text{ minutes}$ (perte de données maximale admissible en cas de défaillance matérielle majeure).
- **RTO (Recovery Time Objective)** : $\le 30\text{ minutes}$ pour un basculement complet vers une instance de secours.
- **Rétention des Données** : **30 jours** d'historique continu avec capacité de restauration à la seconde près (Point-in-Time Recovery - PITR).

---

## 2. Architecture de Sauvegarde PostgreSQL & Stockage

```
                                [ BASE DE DONNÉES ACTIVE ]
                              (PostgreSQL 16 Multi-AZ Supabase)
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
          [ FLUX CONTINU WAL ]                                [ SNAPSHOTS QUOTIDIENS ]
        (Write-Ahead Logs chiffrés)                         (Dumps complets base + RLS)
                     │                                                 │
                     ▼                                                 ▼
           [ Stockage PITR 30j ]                             [ Stockage Froid S3 / R2 ]
        (Restauration à la seconde)                         (Archives mensuelles immuables)
```

### 1. Sauvegarde Continue des Journaux de Transactions (WAL-G / PITR)
- Toutes les écritures sur les tables de commandes, mouvements de stock et écritures comptables sont enregistrées en continu dans les segments Write-Ahead Logging (WAL).
- Les segments WAL sont archivés toutes les 2 minutes vers un stockage distribué sécurisé.
- Permet de restaurer la base à n'importe quel instant $T$ des 30 derniers jours (ex: annulation d'une corruption de données survenue à 14h23m10s).

### 2. Snapshots Quotidiens & Exportations Hors-Site
- Un dump logique chiffré (`pg_dump` avec préservation des schémas, politiques RLS et triggers) est exécuté chaque nuit à 02:00 (heure d'Alger).
- Le fichier compressé est répliqué vers un bucket de stockage externe distinct (Cloudflare R2 / AWS S3) pour parer à toute indisponibilité du fournisseur primaire.

### 3. Sauvegarde des Visuels & Fichiers Multimédias (Supabase Storage)
- Les photos de pièces détachées et bordereaux de livraison stockés dans Supabase Storage sont configurés en réplication multi-région avec versioning des objets pour empêcher tout écrasement ou suppression accidentelle.

---

## 3. Procédures Opérationnelles de Restauration

### Procédure 1 : Restauration à un Point Précis dans le Temps (PITR)
À utiliser en cas d'incident logique (ex: suppression accidentelle d'une table, bug de script d'import) :
1. Identifier l'horodatage exact de l'incident via la table `audit_logs` :
   ```sql
   SELECT created_at, actor_email, action, entity_type FROM public.audit_logs 
   ORDER BY created_at DESC LIMIT 20;
   ```
2. Déclencher la restauration PITR à $T - 1\text{ minute}$ via la console d'infrastructure Supabase ou la CLI :
   ```bash
   supabase db restore --target-time "2026-08-24T14:22:00Z"
   ```
3. Valider l'intégrité des tables clés (`orders`, `inventory_transactions`, `products`).
4. Basculer les connexions de l'application Next.js vers la base restaurée.

### Procédure 2 : Reprise Après Sinistre Majeur (Perte Totale d'Instance)
1. Provisionner une nouvelle instance PostgreSQL / Supabase vierge.
2. Exécuter la suite complète des migrations ordonnées :
   ```bash
   supabase db push --include-all
   ```
3. Restaurer le dernier snapshot logique nocturne :
   ```bash
   pg_restore -h [new_host] -U postgres -d postgres --clean --if-exists hamzaphone_latest.dump
   ```
4. Mettre à jour les variables secrètes d'infrastructure (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) dans le gestionnaire de déploiement (Vercel / Kubernetes).

---

## 4. Protocole de Test & Vérification Périodique

Pour garantir que la stratégie de reprise n'est pas seulement théorique :
1. **Exercice Trimestriel de Restauration sur Environnement Isolé (Sandbox)** :
   - Cloner la base de production vers un projet de staging via PITR.
   - Vérifier que la suite de tests automatisés (`npm run test:ts`) s'exécute avec 100% de réussite sur la base clonée.
2. **Contrôle d'Intégrité des Migrations** :
   - Tester périodiquement le rejeu des 10 migrations (`00001` à `00010`) à partir de zéro sur une base locale pour s'assurer de l'absence de régressions structurelles.
