# 📋 Migration ESN - Mise à jour du Super Admin Service

## ✅ État actuel (avant migration)

Le service Super Admin fonctionne avec des données simulées et des champs basiques :

### Fonctionnalités disponibles :
- ✅ Envoi d'invitations ESN par email (via fonction Edge)
- ✅ Affichage des companies existantes comme "invitations acceptées"
- ✅ Statistiques basiques (nombre de companies, users, freelancers)
- ✅ Activités factices basées sur la création des companies
- ✅ Détails des ESN avec comptage des utilisateurs

### Limitations actuelles :
- ❌ Pas de champ SIRET
- ❌ Pas d'estimation de freelancers
- ❌ Pas d'email de contact spécifique
- ❌ Pas de traçabilité des invitations (qui et quand)

## 🚀 Après migration (script à exécuter sur le Dashboard)

### Nouveaux champs disponibles dans `companies` :

```sql
-- Champs métier ESN
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS siret VARCHAR(14) UNIQUE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS estimated_freelancers INTEGER DEFAULT 5;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

-- Audit d'invitation
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
```

### Améliorations du service après migration :

1. **`getESNInvitations()`** : 
   - Affichera les vrais emails de contact
   - Montrera les SIRET des ESN
   - Indiquera l'estimation de freelancers
   - Tracera qui a envoyé l'invitation et quand

2. **`getESNCompanies()`** :
   - Affichera les SIRET
   - Montrera l'estimation vs réalité des freelancers
   - Tracera l'historique d'invitation

3. **Fonction Edge `invite-esn`** :
   - Stockera automatiquement les nouveaux champs
   - Meilleure traçabilité des invitations

## 📝 Actions à effectuer

1. **Exécuter la migration** sur le Dashboard Supabase
2. **Tester une invitation ESN** avec les nouveaux champs
3. **Mettre à jour les types TypeScript** si nécessaire (après tests)
4. **Optionnel** : Ajuster l'interface Super Admin pour afficher les nouveaux champs

## 🎯 Script de migration simplifié

```sql
-- Champs métier ESN
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS siret VARCHAR(14) UNIQUE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS estimated_freelancers INTEGER DEFAULT 5 CHECK (estimated_freelancers > 0);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

-- Audit d'invitation
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_companies_siret ON public.companies(siret) WHERE siret IS NOT NULL;

-- Commentaires
COMMENT ON COLUMN public.companies.siret IS 'Numéro SIRET de l''ESN (France)';
COMMENT ON COLUMN public.companies.estimated_freelancers IS 'Nombre estimé de freelancers à gérer';
COMMENT ON COLUMN public.companies.contact_email IS 'Email de contact principal de l''ESN';
COMMENT ON COLUMN public.companies.invited_by IS 'Super Admin qui a envoyé l''invitation';
COMMENT ON COLUMN public.companies.invited_at IS 'Date d''envoi de l''invitation';
```