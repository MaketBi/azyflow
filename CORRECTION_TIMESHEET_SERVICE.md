# Correction TimesheetService - Méthodes manquantes

## 🐛 Problème résolu

**Erreur** : `TimesheetService.getAll is not a function`  
**Cause** : Méthodes manquantes dans le service pour les fonctionnalités admin

## ✅ Corrections apportées

### 1. Ajout `TimesheetService.getAll()`
```typescript
/**
 * Get all timesheets for current company (admin only)
 */
static async getAll(): Promise<TimesheetWithRelations[]> {
  // Vérifie que l'utilisateur est admin
  // Récupère tous les timesheets de la société
  // Filtre par company_id via les contracts
}
```

### 2. Ajout `TimesheetService.approve()`
```typescript
/**
 * Approve a timesheet (admin only)
 */
static async approve(id: string): Promise<Timesheet | null> {
  // Vérifie role admin
  // Met à jour status = 'approved'
  // Ajoute validated_at et admin_id
}
```

### 3. Ajout `TimesheetService.reject()`
```typescript
/**
 * Reject a timesheet (admin only)
 */
static async reject(id: string): Promise<Timesheet | null> {
  // Vérifie role admin
  // Met à jour status = 'rejected'
  // Ajoute rejected_at et admin_id
}
```

### 4. Ajout `ContractService.getAll()`
```typescript
/**
 * Get all contracts for the current company (alias for getAllByCompany)
 */
static async getAll(): Promise<ContractWithRelations[]> {
  return this.getAllByCompany();
}
```

### 5. Correction `createDraft()` et `createSubmitted()`
❌ **Avant** :
```typescript
.insert({
  client_id: data.client_id,  // ❌ client_id n'existe pas dans timesheets
  contract_id: contract.id,
  // ...
})
```

✅ **Après** :
```typescript
.insert({
  contract_id: contract.id,   // ✅ Seul contract_id nécessaire
  worked_days: data.worked_days,
  month: data.month,
  year: data.year,
  status: 'draft',
})
```

## 🔐 Sécurité maintenue

### Contrôles d'accès :
- **`getAll()`** : Vérifie role admin + filtre par company_id
- **`approve()`** : Vérifie role admin avant mise à jour
- **`reject()`** : Vérifie role admin avant mise à jour

### Audit trail :
- **Approbation** : `validated_at` + `admin_id`
- **Rejet** : `rejected_at` + `admin_id`
- **Soumission** : `submitted_at`

## 📊 Fonctionnalités restaurées

### Dashboard Admin (`DashboardPage.tsx`) :
✅ **KPI** : Nombre de timesheets en attente  
✅ **Liste** : Dernières feuilles de temps  
✅ **Compteurs** : Contrats actifs  

### Page Timesheets Admin (`timesheets.tsx`) :
✅ **Listing** : Tous les timesheets de la société  
✅ **Actions** : Boutons Valider/Rejeter fonctionnels  
✅ **Status** : Badges colorés (En attente/Approuvée/Rejetée)  

## 🎯 Structure de données respectée

```
timesheets → contracts → clients
           → contracts → users (freelancers)
           → contracts → companies
```

- **Timesheets** n'a que `contract_id` (pas de `client_id`)
- **Relations** via contracts pour accéder aux clients et users
- **Filtrage société** via `contracts.company_id`

## 🚀 Tests recommandés

1. **Dashboard** : Vérifier affichage KPI et listes
2. **Admin Timesheets** : Tester Valider/Rejeter
3. **Sécurité** : Vérifier que freelances ne voient que leurs timesheets
4. **Audit** : Contrôler les timestamps d'approbation/rejet

L'erreur `TimesheetService.getAll is not a function` est maintenant résolue ! 🎉