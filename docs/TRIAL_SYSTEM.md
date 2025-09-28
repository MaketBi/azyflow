# 🕐 Système de Gestion des Durées d'Essai - Azyflow

## Vue d'ensemble

Le système de gestion des durées d'essai d'Azyflow permet de contrôler l'accès des ESN invitées avec des périodes d'essai limitées dans le temps. Cela garantit une expérience premium tout en limitant l'utilisation gratuite.

## ⏱️ Durées configurées

### Invitations ESN
- **Durée d'invitation :** 7 jours pour accepter l'invitation
- **Expiration automatique :** Les invitations non acceptées sont marquées comme expirées
- **Statut :** `pending` → `expired` après 7 jours

### Comptes d'essai
- **Durée par défaut :** 30 jours d'accès complet
- **Démarrage :** Lors de l'acceptation de l'invitation ESN
- **Alertes :** Notification 7 jours avant expiration
- **Période de grâce :** 3 jours supplémentaires après expiration (configurable)

## 🏗️ Architecture technique

### 1. Base de données
```sql
-- Champs ajoutés à la table companies
ALTER TABLE companies ADD COLUMN trial_expires_at timestamptz;
ALTER TABLE companies ADD COLUMN trial_duration_days integer DEFAULT 30;
ALTER TABLE companies ADD COLUMN is_trial boolean DEFAULT true;
ALTER TABLE companies ADD COLUMN trial_started_at timestamptz;

-- Index pour les requêtes d'expiration
CREATE INDEX idx_companies_trial_expires_at ON companies(trial_expires_at);
```

### 2. Service TrialService
- **Localisation :** `/lib/services/trial.ts`
- **Fonctions principales :**
  - `startTrial(companyId, config)` - Démarre une période d'essai
  - `getTrialStatus(companyId)` - Récupère le statut actuel
  - `extendTrial(companyId, days)` - Prolonge la période d'essai
  - `upgradeFromTrial(companyId, plan)` - Upgrade vers un plan payant
  - `checkAndExpireTrials()` - Vérifie et expire les comptes (cron)

### 3. Composants UI
- **TrialStatusBadge :** Badge d'affichage du statut (actif/expire bientôt/expiré)
- **TrialExpirationWarning :** Alerte d'expiration avec boutons d'action

### 4. Edge Function de surveillance
- **Localisation :** `/supabase/functions/check-expirations/`
- **Fréquence :** À exécuter quotidiennement (cron)
- **Actions :**
  - Expire les invitations anciennes (7 jours)
  - Expire les comptes d'essai (30 jours)
  - Envoie des alertes d'expiration (7 jours avant)
  - Nettoie les anciennes données (3 mois)

## 📋 États et transitions

### États des invitations
```
pending → accepted (dans les 7 jours)
pending → expired (après 7 jours)
```

### États des comptes d'essai
```
pending → active (acceptation invitation + démarrage trial)
active → expired (après 30 jours)
active → premium (upgrade payant)
expired → premium (upgrade après expiration)
```

## 🎯 Intégration dans l'interface

### SuperAdmin Dashboard
- Badge de statut trial à côté de chaque invitation
- Information sur la durée d'essai dans le formulaire d'invitation
- Alertes visuelles pour les comptes expirés

### Landing Page
- Mention de la période d'essai gratuite dans la démonstration

### Admin ESN
- Alerte d'expiration dans le dashboard admin
- Boutons d'upgrade vers les plans premium

## 🔧 Configuration et deployment

### 1. Appliquer la migration
```bash
cd /path/to/azyflow/project
supabase migration up
```

### 2. Déployer la fonction de surveillance
```bash
supabase functions deploy check-expirations
```

### 3. Configurer le cron (GitHub Actions exemple)
```yaml
# .github/workflows/check-expirations.yml
name: Check Expirations
on:
  schedule:
    - cron: '0 9 * * *'  # Tous les jours à 9h
jobs:
  check-expirations:
    runs-on: ubuntu-latest
    steps:
      - name: Call expiration check
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            https://your-project.supabase.co/functions/v1/check-expirations
```

### 4. Configuration Vercel Cron (alternative)
```typescript
// api/cron/check-expirations.ts
export default async function handler(req: any, res: any) {
  const response = await fetch(
    'https://your-project.supabase.co/functions/v1/check-expirations',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );
  
  const result = await response.json();
  res.status(200).json(result);
}
```

## 📊 Monitoring et métriques

### Logs à surveiller
- Nombre d'invitations expirées par jour
- Nombre de comptes d'essai expirés
- Taux de conversion trial → premium
- Alertes d'expiration envoyées

### Requêtes utiles
```sql
-- Comptes d'essai actifs
SELECT COUNT(*) FROM companies 
WHERE is_trial = true AND status = 'active';

-- Comptes expirant dans les 7 jours
SELECT * FROM companies 
WHERE is_trial = true 
AND trial_expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days';

-- Invitations en attente
SELECT COUNT(*) FROM company_invitations 
WHERE status = 'pending' AND expires_at > NOW();
```

## 🚀 Évolutions futures

### Phase 1 (Actuel)
- [x] Système de base avec durées fixes
- [x] Interface d'administration
- [x] Surveillance automatique

### Phase 2 (Prochainement)  
- [ ] Durées personnalisables par invitation
- [ ] Emails automatiques d'alerte
- [ ] Dashboard de métriques d'expiration
- [ ] API d'extension de trial pour le support

### Phase 3 (Avancé)
- [ ] Système de crédits/usage
- [ ] Expiration progressive (limitation de fonctionnalités)
- [ ] A/B testing sur les durées d'essai
- [ ] Intégration payment gateway pour auto-upgrade

## 🔐 Sécurité

### Contrôles d'accès
- Les comptes expirés perdent l'accès aux fonctionnalités
- Les données restent intactes (pas de suppression)
- Restauration automatique lors de l'upgrade

### Validation
- Impossible de manipuler les dates d'expiration côté client
- Vérification serveur à chaque requête sensible
- Logs d'audit pour toutes les modifications de trial

## 📞 Support et dépannage

### Commandes utiles
```typescript
// Prolonger un essai de 15 jours
await TrialService.extendTrial('company-id', 15);

// Convertir en compte premium
await TrialService.upgradeFromTrial('company-id', 'pro');

// Vérifier le statut
const status = await TrialService.getTrialStatus('company-id');
```

### Résolution de problèmes courants
1. **Compte bloqué par erreur :** Vérifier `trial_expires_at` et `status`
2. **Invitation expirée :** Créer nouvelle invitation ou prolonger l'existante  
3. **Alertes non envoyées :** Vérifier la configuration cron et les logs

---

*Système d'expiration Azyflow v1.0 - Optimisé pour la conversion B2B premium* ⚡