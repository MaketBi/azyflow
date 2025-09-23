-- Script de correction pour les contraintes de statut des factures
-- À exécuter dans l'éditeur SQL de Supabase APRÈS le diagnostic

-- ATTENTION : Remplacez 'invoices_status_check' par le nom exact trouvé dans le diagnostic

BEGIN;

-- 1. Supprimer l'ancienne contrainte (remplacez le nom si différent)
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- 2. Créer la nouvelle contrainte avec tous les statuts
ALTER TABLE invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('pending', 'sent', 'paid', 'paid_freelancer', 'overdue'));

-- 3. Vérifier que la contrainte est bien créée
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'invoices'::regclass 
    AND contype = 'c'  
    AND pg_get_constraintdef(oid) LIKE '%status%';

-- 4. Test de validation : essayer d'insérer les nouveaux statuts
-- (Ces requêtes devraient maintenant fonctionner)
INSERT INTO invoices (
    timesheet_id, 
    client_id, 
    company_id, 
    amount, 
    number, 
    status
) VALUES 
    ('test-ts-1', 'test-client-1', 'test-company-1', 1000, 'TEST-OVERDUE-001', 'overdue'),
    ('test-ts-2', 'test-client-2', 'test-company-2', 2000, 'TEST-PAID-FREELANCER-001', 'paid_freelancer')
ON CONFLICT (number) DO NOTHING;

-- 5. Vérifier que les insertions ont fonctionné
SELECT number, status FROM invoices WHERE number LIKE 'TEST-%';

-- 6. Nettoyer les données de test
DELETE FROM invoices WHERE number LIKE 'TEST-%';

-- 7. Confirmation finale
SELECT 'Migration réussie - Tous les statuts sont maintenant autorisés' as result;

COMMIT;