-- Migration: Ajouter le statut 'paid_freelancer' aux factures
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la contrainte actuelle sur le statut
SELECT 
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'invoices'::regclass 
    AND contype = 'c'
    AND consrc LIKE '%status%';

-- 2. Si une contrainte existe, la supprimer et la recréer avec le nouveau statut
-- (Adapter selon le résultat de la requête précédente)

-- Option A: Si pas de contrainte existante, en créer une
ALTER TABLE invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('pending', 'sent', 'paid', 'paid_freelancer', 'overdue'));

-- Option B: Si contrainte existante, la supprimer d'abord puis recréer
-- ALTER TABLE invoices DROP CONSTRAINT nom_de_la_contrainte_existante;
-- ALTER TABLE invoices 
-- ADD CONSTRAINT invoices_status_check 
-- CHECK (status IN ('pending', 'sent', 'paid', 'paid_freelancer', 'overdue'));

-- 3. Tester l'insertion du nouveau statut
INSERT INTO invoices (
    timesheet_id, 
    client_id, 
    company_id, 
    amount, 
    number, 
    status
) VALUES (
    'test-timesheet-id', 
    'test-client-id', 
    'test-company-id', 
    1000, 
    'TEST-001', 
    'paid_freelancer'
) ON CONFLICT DO NOTHING;

-- 4. Supprimer le test
DELETE FROM invoices WHERE number = 'TEST-001';

-- 5. Vérifier les statuts existants
SELECT status, COUNT(*) as count
FROM invoices 
GROUP BY status
ORDER BY count DESC;