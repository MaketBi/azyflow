-- 🧪 Script de test pour vider la table freelancer_payments
-- À exécuter dans Supabase SQL Editor pour tester le filtre "Avec avances"

-- 1. Vider complètement la table freelancer_payments
DELETE FROM freelancer_payments;

-- 2. Vérifier que la table est bien vide
SELECT 
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE is_advance = true) as total_advances
FROM freelancer_payments;

-- 3. Résultat attendu après suppression de la simulation :
-- - Filtre "Avec avances" : 0 facture affichée
-- - Console navigateur : "📭 Facture XXX: Aucun paiement (table vide)"
-- - Plus de données aléatoires ou simulées

-- 4. Pour rétablir des données de test :
-- INSERT INTO freelancer_payments (invoice_id, company_id, amount, payment_method, is_advance, advance_reason, created_by)
-- VALUES (
--   'uuid-de-votre-facture',
--   'uuid-de-votre-compagnie',
--   1500.00,
--   'bank_transfer',
--   true,
--   'Test après nettoyage simulation',
--   auth.uid()
-- );