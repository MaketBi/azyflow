# 🇫🇷 Système de Facturation Française avec TVA et Délais de Paiement

## 📋 Vue d'ensemble

Ce système implémente la gestion complète de la facturation française avec :
- **Délais de paiement français** : 30/45/60 jours fin de mois
- **TVA française** : 20% automatiquement calculée
- **Calculs de commission** précis
- **Détection de retards** de paiement

## 🚀 Fonctionnalités

### Délais de Paiement
- ✅ **30 jours fin de mois** : Standard français
- ✅ **45 jours fin de mois** : Délai étendu
- ✅ **60 jours fin de mois** : Délai maximum
- ✅ **30 jours nets** : Alternative simple

### TVA Française
- ✅ **Taux 20%** par défaut
- ✅ **Calculs automatiques** HT/TTC
- ✅ **Option désactivation** si nécessaire
- ✅ **Conformité réglementaire**

### Calculs Automatiques
- ✅ **Montant HT** (Hors Taxes)
- ✅ **Montant TVA** (20% du HT)
- ✅ **Montant TTC** (Toutes Taxes Comprises)
- ✅ **Commission** (sur le TTC)
- ✅ **Net freelancer** (TTC - Commission)

## 🔧 Architecture Technique

### Base de Données
```sql
-- Nouveaux champs contrats
ALTER TABLE contracts ADD COLUMN payment_terms INTEGER DEFAULT 30;
ALTER TABLE contracts ADD COLUMN payment_terms_type VARCHAR(20) DEFAULT 'end_of_month';
ALTER TABLE contracts ADD COLUMN vat_rate DECIMAL(5,2) DEFAULT 20.00;
ALTER TABLE contracts ADD COLUMN vat_applicable BOOLEAN DEFAULT true;

-- Nouveaux champs factures
ALTER TABLE invoices ADD COLUMN vat_rate DECIMAL(5,2) DEFAULT 20.00;
ALTER TABLE invoices ADD COLUMN vat_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE invoices ADD COLUMN amount_ht DECIMAL(10,2);
ALTER TABLE invoices ADD COLUMN amount_ttc DECIMAL(10,2);
```

### Services TypeScript
1. **PaymentTermsHelper** : Calculs et logique métier
2. **ContractService** : Gestion des contrats avec délais
3. **TimesheetService** : Génération automatique factures
4. **InvoiceDisplay** : Composant d'affichage

### Composants React
1. **PaymentTermsConfig** : Configuration délais/TVA
2. **InvoiceDisplay** : Affichage factures avec TVA
3. **ContractsPage** : Formulaires étendus

## 🎯 Utilisation

### 1. Configuration d'un Contrat

```typescript
const contractData: ContractFormData = {
  user_id: 'freelancer-id',
  client_id: 'client-id',
  tjm: 500, // TJM HT
  payment_terms: 30, // 30 jours
  payment_terms_type: 'end_of_month', // Fin de mois
  vat_rate: 20.00, // 20% TVA française
  vat_applicable: true, // TVA activée
  commission_rate: 15.00 // 15% commission
};
```

### 2. Calcul Automatique Facture

```typescript
import { PaymentTermsHelper } from '../lib/payment-terms-helper';

const invoice = PaymentTermsHelper.calculateFullInvoice(
  10, // 10 jours travaillés
  500, // 500€ TJM HT
  { days: 30, type: 'end_of_month' }, // Délais
  { rate: 20, applicable: true }, // TVA 20%
  15 // 15% commission
);

console.log(invoice);
// {
//   amountHT: 5000.00,
//   vatAmount: 1000.00,
//   amountTTC: 6000.00,
//   commission: 900.00,
//   netAmount: 5100.00,
//   dueDate: 2024-03-31
// }
```

### 3. Détection de Retards

```typescript
const isOverdue = PaymentTermsHelper.isOverdue(dueDate);
const daysLate = PaymentTermsHelper.getDaysOverdue(dueDate);

if (isOverdue) {
  console.log(`Facture en retard de ${daysLate} jour(s)`);
}
```

## 📊 Exemples de Calculs

### Exemple 1 : Facture Standard
- **Prestation** : 10 jours × 500€ TJM
- **Délai** : 30 jours fin de mois
- **TVA** : 20% française
- **Commission** : 15%

**Résultat :**
- Montant HT : 5 000,00€
- TVA (20%) : 1 000,00€
- **Total TTC : 6 000,00€**
- Commission : -900,00€
- **Net freelancer : 5 100,00€**

### Exemple 2 : Sans TVA
- **Prestation** : 10 jours × 500€ TJM
- **TVA** : Désactivée
- **Commission** : 15%

**Résultat :**
- Montant HT : 5 000,00€
- TVA : 0,00€
- **Total : 5 000,00€**
- Commission : -750,00€
- **Net freelancer : 4 250,00€**

## 🗓️ Calculs de Délais

### 30 jours fin de mois
Facture du 15 janvier → Échéance 31 mars
- Fin du mois suivant : 29 février
- + 30 jours : 31 mars

### 45 jours fin de mois
Facture du 15 janvier → Échéance 15 avril
- Fin du mois suivant : 29 février
- + 45 jours : 15 avril

### 60 jours fin de mois
Facture du 15 janvier → Échéance 30 avril
- Fin du mois suivant : 29 février
- + 60 jours : 30 avril

### 30 jours nets
Facture du 15 janvier → Échéance 14 février
- Date d'émission + 30 jours

## ⚡ Intégration Automatique

### Validation CRA → Facture
Quand un admin valide un CRA :
1. **Récupération** des paramètres du contrat
2. **Calcul automatique** avec PaymentTermsHelper
3. **Création facture** avec TVA et délais
4. **Notification** avec nouveau workflow

### Workflow Complet
1. **Freelancer** soumet CRA
2. **Admin** valide → Facture créée automatiquement
3. **Système** calcule TVA + délais français
4. **Notifications** envoyées
5. **Suivi** retards de paiement

## 🔍 Monitoring et Alertes

### Factures en Retard
- Détection automatique des retards
- Calcul du nombre de jours
- Alertes visuelles dans l'interface
- Notifications possibles (email/WhatsApp)

### Tableaux de Bord
- Vue d'ensemble des factures
- Statistiques TVA collectée
- Analyse des délais de paiement
- Suivi des commissions

## 🧪 Tests et Validation

### Tests Unitaires
```bash
# Lancer les tests de calculs
node test-payment-terms.js
```

### Cas de Test
- ✅ Délais de paiement français
- ✅ Calculs TVA 20%
- ✅ Calculs sans TVA
- ✅ Commissions variables
- ✅ Détection de retards

## 🚦 Migration et Déploiement

### Étapes de Migration
1. **Appliquer** la migration SQL
2. **Mettre à jour** les types TypeScript
3. **Déployer** les nouveaux services
4. **Tester** les calculs en staging
5. **Former** les utilisateurs

### Commandes
```bash
# Appliquer migration
npx supabase db push

# Régénérer types
npm run types

# Build et déploiement
npm run build
netlify deploy --prod --build
```

## 📚 Références

### Réglementation Française
- [Délais de paiement inter-entreprises](https://www.economie.gouv.fr/entreprises/delais-paiement-inter-entreprises)
- [TVA sur prestations de services](https://www.impots.gouv.fr/particulier/questions/tva-sur-prestations-de-services)

### Documentation Technique
- `lib/payment-terms-helper.ts` : Helper principal
- `components/forms/PaymentTermsConfig.tsx` : Configuration
- `components/invoices/InvoiceDisplay.tsx` : Affichage

---

## ✅ Statut d'Implémentation

- [x] **Migration base de données** - Colonnes ajoutées
- [x] **Helper calculs** - PaymentTermsHelper créé
- [x] **Service contrats** - Étendu avec délais/TVA
- [x] **Service timesheets** - Génération automatique
- [x] **Interface utilisateur** - Composants créés
- [x] **Tests** - Script de validation
- [x] **Documentation** - Guide complet

**Système opérationnel et conforme à la réglementation française !** 🎉