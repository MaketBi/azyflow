# Analytics Dashboard - AzyFlow

## 🎯 Fonctionnalités implémentées

### 📊 Tableau de bord Analytics

Le système d'analytics permet de suivre les performances des freelancers et des entreprises avec des KPIs détaillés.

#### KPIs Freelancers
- **CA mensuel** : Chiffre d'affaires mensuel calculé automatiquement
- **Taux de validation CRA** : Pourcentage de feuilles de temps approuvées vs soumises
- **Délais de paiement** : Délai moyen entre l'émission et le paiement des factures

#### Graphiques de Performance
- **Évolution du chiffre d'affaires** : Graphique linéaire montrant l'évolution mensuelle
- **Répartition clients** : Graphique en secteurs des revenus par client
- **Performance freelancers** : Comparaison des KPIs entre freelancers

### 🇫🇷 Système de Paiement Français

#### Conditions de Paiement
- **30 jours fin de mois** : Paiement le dernier jour du mois suivant
- **45 jours fin de mois** : Paiement 15 jours après la fin du mois suivant
- **60 jours fin de mois** : Paiement le dernier jour du surlendemain du mois de facturation

#### TVA
- **TVA française** : 20% appliquée automatiquement
- **Calcul HT/TTC** : Montants hors taxes et TTC calculés automatiquement
- **Facturation automatique** : Les factures sont générées avec les bonnes conditions

## 🏗️ Architecture

### Services
- `AnalyticsService` : Calculs des KPIs et métriques
- `PaymentTermsHelper` : Gestion des délais de paiement français
- Services existants étendus avec la gestion VAT et délais

### Composants
- `AnalyticsDashboard` : Dashboard principal avec onglets freelancer/admin
- `Charts` : Composants Chart.js pour les visualisations
- `PaymentTermsConfig` : Configuration des conditions de paiement
- `InvoiceDisplay` : Affichage des factures avec TVA

### Base de données
- Colonnes ajoutées : `payment_terms`, `payment_terms_type`, `vat_rate`, `vat_applicable`
- Migration : `20241201_add_payment_terms_and_vat.sql`
- Données de test : `20241201_add_analytics_test_data.sql`

## 🚀 Utilisation

### Accès au Dashboard Analytics

1. **Admin** : 
   - Aller dans "Tableau de bord" 
   - Cliquer sur l'onglet "Analytics"
   - Vue globale sur tous les freelancers et métriques d'entreprise

2. **Freelancer** : 
   - Page dédiée `/freelancer/analytics`
   - Vue personnalisée sur ses propres KPIs

### Configuration des Conditions de Paiement

1. Dans la création/modification de contrat
2. Sélectionner le type de délai (30/45/60 jours fin de mois)
3. La TVA 20% est appliquée automatiquement

### Génération des Factures

Les factures sont générées automatiquement avec :
- Conditions de paiement du contrat
- Calcul de la date d'échéance selon la réglementation française
- TVA 20% incluse
- Montants HT et TTC

## 📊 KPIs Calculés

### Freelancers
- `monthlyRevenue` : CA du mois (factures payées + en attente)
- `validationRate` : % CRA approuvées / soumises
- `averagePaymentDelay` : Délai moyen de paiement en jours
- `totalInvoices` : Nombre total de factures
- `pendingInvoices` : Factures en attente
- `overdueInvoices` : Factures en retard
- `totalWorkedDays` : Jours travaillés dans la période
- `averageTJM` : Tarif journalier moyen

### Entreprises
- `totalRevenue` : CA total de l'entreprise
- `monthlyGrowth` : Croissance mensuelle en %
- `activeFreelancers` : Nombre de freelancers actifs
- `averageValidationDelay` : Délai moyen de validation des CRA

## 🔧 Technologies Utilisées

- **Chart.js** : Graphiques et visualisations
- **React Chart.js 2** : Intégration React pour Chart.js
- **TypeScript** : Typage fort pour la fiabilité
- **Supabase** : Base de données et requêtes SQL avancées
- **Tailwind CSS** : Styling responsive

## 📝 Tests

- Tests unitaires avec Vitest
- Page de test dédiée : `AnalyticsTestPage.tsx`
- Vérification des calculs KPIs
- Test des fonctions de paiement

## 🚧 Prochaines étapes

- [ ] Export des données en PDF/Excel
- [ ] Notifications sur les retards de paiement
- [ ] Dashboard temps réel avec WebSockets
- [ ] Analytics prédictives avec IA
- [ ] Intégration comptabilité (Sage, Cegid)

## 📞 Support

Pour toute question sur l'implémentation des analytics ou du système de paiement français, consulter :
- Code source dans `/lib/services/analytics.ts`
- Helper paiements dans `/lib/payment-terms-helper.ts`
- Composants dans `/components/analytics/`