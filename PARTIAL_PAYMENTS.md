# 💰 Système de Paiements aux Freelancers

## Vue d'ensemble
Le système de paiements aux freelancers permet aux administrateurs de gérer les versements progressifs et acomptes payés par la compagnie à ses freelancers.

## Fonctionnalités implémentées

### 🎯 Dashboard des paiements partiels
- **Résumé financier** : Statistiques globales (total factures, montants payés/restants)
- **Liste des factures** avec progression des paiements
- **Filtrage** par statut (toutes, non payées, partiellement payées, complètement payées)
- **Barre de progression** visuelle pour chaque facture

### 💳 Gestion des paiements
- **Ajout de paiements partiels** avec dialog modal
- **Méthodes de paiement** : Virement, chèque, espèces, autre
- **Références et notes** pour traçabilité
- **Validation automatique** des montants (ne peut pas dépasser le solde restant)
- **Calcul automatique** des soldes et pourcentages

### 🔄 Workflow des statuts
- `pending` → `partially_paid` → `paid` → `paid_freelancer`
- **Mise à jour automatique** du statut selon les paiements
- **Bouton "Marquer payé"** pour paiement complet rapide

## Architecture technique

### Services (`/lib/services/partial-payments.ts`)
```typescript
class PartialPaymentService {
  // Ajouter un paiement partiel
  static async addPartialPayment(invoiceId, amount, method, reference?, notes?)
  
  // Récupérer factures avec paiements
  static async getInvoicesWithPayments(companyId)
  
  // Statistiques des paiements
  static async getPaymentSummary(companyId)
  
  // Marquer facture comme payée
  static async markInvoiceAsPaid(invoiceId)
}
```

### Composants UI
- `PartialPaymentDashboard` : Dashboard principal avec liste et statistiques
- `PartialPaymentDialog` : Modal d'ajout de paiement
- `PartialPaymentsPage` : Page complète avec navigation

### Types TypeScript
```typescript
interface PartialPayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: 'bank_transfer' | 'check' | 'cash' | 'other';
  reference?: string;
  notes?: string;
}

interface InvoiceWithPayments {
  // Données facture + array de payments + calculs automatiques
  payments: PartialPayment[];
  total_paid: number;
  remaining_amount: number;
  payment_progress: number; // 0-100%
}
```

## État actuel (Version MVP)

### ✅ Fonctionnel
- Interface utilisateur complète et responsive
- Logique de gestion des paiements partiels
- Intégration avec le système de navigation
- Validation des données et gestion d'erreurs
- Simulation des paiements (pour développement/test)

### ⚠️ Version temporaire
Le système utilise actuellement une **version simulée** car :
- La colonne `partial_payments` n'existe pas encore dans la table `invoices`
- La table dédiée `partial_payments` n'a pas encore été créée

### 🔄 Prochaines étapes pour la production
1. **Créer la table `partial_payments` dans Supabase** :
   ```sql
   CREATE TABLE partial_payments (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
     amount DECIMAL(10,2) NOT NULL,
     payment_date DATE NOT NULL,
     payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'check', 'cash', 'other')),
     reference TEXT,
     notes TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     created_by UUID REFERENCES users(id)
   );
   ```

2. **Ou ajouter une colonne JSON à la table `invoices`** :
   ```sql
   ALTER TABLE invoices ADD COLUMN partial_payments JSONB DEFAULT '[]'::jsonb;
   ```

3. **Activer la version complète** en remplaçant les méthodes simulées par les vraies requêtes SQL

## Navigation et accès
- **Route** : `/admin/partial-payments`
- **Menu** : "💰 Paiements Partiels" dans la navigation admin
- **Permissions** : Administrateurs uniquement

## Avantages métier
- **Suivi précis** des encaissements clients
- **Gestion des acomptes** avant livraison
- **Traçabilité complète** des paiements
- **Amélioration du cash-flow** par visibilité des paiements attendus
- **Réduction des erreurs** de facturation et paiements

---

*Le système est prêt à être utilisé dès que la base de données sera mise à jour avec les structures nécessaires.*