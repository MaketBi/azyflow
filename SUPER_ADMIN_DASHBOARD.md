# 🚀 Super Admin Dashboard - Phase 1

## Vue d'ensemble

Le Dashboard Super Admin est la première étape de la migration B2B Premium d'Azyflow. Il permet le contrôle centralisé des invitations ESN et la gestion qualifiée des accès à la plateforme.

## 🎯 Objectifs

- **Contrôle qualité** : Éliminer les inscriptions non qualifiées
- **Pipeline B2B** : Gérer le processus d'onboarding ESN  
- **Audit Trail** : Traçabilité de toutes les actions Super Admin
- **Statistiques** : Vue d'ensemble de l'écosystème ESN

---

## 🔐 Accès Super Admin

### Prérequis
1. **Role Database** : L'utilisateur doit avoir `role = 'super_admin'` dans la table `users`
2. **Authentification** : Session Supabase Auth valide
3. **URL d'accès** : `/super-admin` (protection intégrée)

### Attribution du Role Super Admin

```sql
-- Accorder le role super_admin à un utilisateur existant
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'admin@azyflow.com';
```

---

## 🏗️ Architecture Technique

### Base de Données

#### Table `company_invitations`
```sql
- id: UUID (PK)
- email: VARCHAR(255) - Email du contact ESN
- company_name: VARCHAR(255) - Nom de la société
- siret: VARCHAR(14) - SIRET optionnel
- business_sector: VARCHAR(100) - Secteur d'activité
- estimated_freelancers: INTEGER - Nombre estimé de freelancers
- status: ENUM('pending', 'accepted', 'rejected', 'expired')
- invitation_token: UUID - Token unique pour l'invitation
- expires_at: TIMESTAMP - Date d'expiration (7 jours)
- invited_by: UUID - Référence vers le Super Admin
- company_created_id: UUID - Référence ESN une fois acceptée
- accepted_at, rejected_at: TIMESTAMP - Dates de traitement
- created_at, updated_at: TIMESTAMP - Audit temporel
```

#### Table `super_admin_activities`
```sql  
- id: UUID (PK)
- admin_id: UUID - Super Admin qui a effectué l'action
- activity_type: VARCHAR(50) - Type d'activité
- target_type: VARCHAR(50) - Type de cible ('company_invitation', etc.)
- target_id: UUID - ID de la cible
- description: TEXT - Description humaine de l'action
- metadata: JSONB - Données contextuelles
- created_at: TIMESTAMP - Horodatage
```

### Sécurité (RLS)

```sql
-- Seuls les super_admin peuvent gérer les invitations
CREATE POLICY "Super admins can manage company invitations" 
    ON company_invitations FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.role = 'super_admin'
        )
    );

-- Les invités peuvent voir leur propre invitation
CREATE POLICY "Invited users can view their invitation" 
    ON company_invitations FOR SELECT TO authenticated 
    USING (email = auth.email());
```

---

## 🎨 Interface Utilisateur

### Dashboard Principal

#### **Statistiques Clés**
- **Total ESN** : Nombre d'entreprises actives
- **Invitations En Attente** : Nombre d'invitations pending
- **Total Freelancers** : Nombre de freelancers sur la plateforme
- **Taux d'Acceptation** : Pourcentage d'invitations acceptées

#### **Table des Invitations**
- Vue complète de toutes les invitations ESN
- Filtrage par statut
- Actions contextuelles (Renvoyer, Rejeter, Voir ESN)
- Tri par date de création

#### **Modal d'Invitation**
Formulaire pour créer une nouvelle invitation ESN :
- **Email*** : Contact principal de l'ESN
- **Nom Société*** : Dénomination sociale
- **SIRET** : Numéro SIRET (optionnel)
- **Secteur** : Secteur d'activité (liste prédéfinie)
- **Freelancers Estimés** : Taille prévisionnelle

---

## 🔄 Processus d'Invitation ESN

### 1. Création d'Invitation
```typescript
SuperAdminService.createESNInvitation({
  email: "contact@esn-example.com",
  company_name: "ESN Solutions",
  siret: "12345678901234", // optionnel
  business_sector: "IT Services",
  estimated_freelancers: 25
});
```

### 2. Génération du Token
- Token UUID unique généré automatiquement
- Expiration : 7 jours à partir de la création
- Lien d'invitation : `https://azyflow.com/esn-signup?token={UUID}`

### 3. Workflow d'Acceptation
```typescript
// Validation du token par l'ESN invitée
SuperAdminService.validateInvitationToken(token);

// Acceptation lors de la création de compte ESN
SuperAdminService.acceptESNInvitation(token, company_id);
```

### 4. Audit Trail
Toutes les actions sont automatiquement loggées :
```typescript
// Exemple d'activité loggée
{
  activity_type: 'invitation_sent',
  target_type: 'company_invitation', 
  description: 'ESN invitation sent to contact@esn.com',
  metadata: {
    email: 'contact@esn.com',
    company_name: 'ESN Solutions',
    estimated_freelancers: 25
  }
}
```

---

## 🛠️ Fonctions Utilitaires

### Fonctions Supabase (Stored Procedures)

#### `create_esn_invitation()`
```sql
-- Création sécurisée d'invitation (super_admin uniquement)
SELECT create_esn_invitation(
  'contact@esn.com',
  'ESN Solutions', 
  '12345678901234',
  'IT Services',
  25
);
```

#### `accept_esn_invitation()`
```sql
-- Acceptation d'invitation lors de l'onboarding
SELECT accept_esn_invitation(
  'token-uuid-here',
  'company-id-created'
);
```

---

## 📊 Métriques & Analytics

### KPIs Suivis
- **Volume d'invitations** : Total, par mois, par secteur
- **Taux de conversion** : Invitations → ESN actives
- **Time-to-activation** : Durée invitation → première utilisation
- **Répartition sectorielle** : Distribution des ESN par secteur

### Rapports Disponibles
- **Dashboard Stats** : Vue temps réel
- **Audit Trail** : Historique des actions Super Admin
- **ESN Performance** : Activité et usage par ESN

---

## 🚀 Prochaines Étapes (Phase 2)

### Fonctionnalités en Développement
- [ ] **Onboarding ESN Guidé** : Workflow post-invitation
- [ ] **Templates d'Email** : Personnalisation des invitations
- [ ] **Validation SIRET** : Intégration API INSEE
- [ ] **Scoring ESN** : Système de qualification automatique
- [ ] **Notifications** : Alertes temps réel Super Admin

### Améliorations UX
- [ ] **Filtres Avancés** : Par secteur, date, statut
- [ ] **Export CSV** : Données invitations et stats
- [ ] **Recherche** : Recherche full-text dans les invitations
- [ ] **Bulk Actions** : Actions en masse sur les invitations

---

## 🔧 Installation & Déploiement

### 1. Migration Base de Données
```bash
# Exécuter la migration Super Admin
psql -d database_name -f supabase/migrations/20250127_create_super_admin_system.sql
```

### 2. Mise à Jour Types
```bash
# Régénérer les types TypeScript
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.ts
```

### 3. Configuration Environnement
```env
# Aucune variable spéciale requise - utilise la config Supabase existante
```

### 4. Accès Initial
```sql
-- Créer le premier Super Admin
INSERT INTO users (id, email, full_name, role, company_id) 
VALUES (
  gen_random_uuid(),
  'admin@azyflow.com',
  'Super Admin',
  'super_admin',
  (SELECT id FROM companies LIMIT 1)
);
```

---

## 🔍 Troubleshooting

### Problèmes Courants

#### "Accès Refusé" pour Super Admin
```sql
-- Vérifier le role de l'utilisateur
SELECT email, role FROM users WHERE email = 'votre-email@azyflow.com';

-- Corriger si nécessaire
UPDATE users SET role = 'super_admin' WHERE email = 'votre-email@azyflow.com';
```

#### Erreurs de Compilation TypeScript
```bash
# Les nouvelles tables ne sont pas encore dans database.ts
# Exécuter d'abord la migration SQL, puis régénérer les types
```

#### Invitations non envoyées
```sql
-- Vérifier les permissions RLS
SELECT * FROM company_invitations; -- Doit fonctionner pour super_admin

-- Vérifier les logs d'activité
SELECT * FROM super_admin_activities ORDER BY created_at DESC LIMIT 10;
```

---

## 📞 Support

Pour toute question sur le Dashboard Super Admin :
- **Documentation technique** : Ce fichier
- **Issues GitHub** : Créer un ticket avec le tag `super-admin`
- **Contact direct** : admin@azyflow.com

---

*Dashboard Super Admin v1.0 - Phase 1 Migration B2B Premium*  
*Dernière mise à jour : 27 janvier 2025*