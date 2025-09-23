-- Script de diagnostic pour vérifier les contraintes existantes
-- À exécuter dans l'éditeur SQL de Supabase AVANT la migration

-- 1. Vérifier toutes les contraintes sur la table invoices
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'invoices'::regclass 
ORDER BY conname;

-- 2. Vérifier spécifiquement les contraintes CHECK sur le champ status
SELECT 
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'invoices'::regclass 
    AND contype = 'c'  -- 'c' = CHECK constraint
    AND (consrc LIKE '%status%' OR consrc LIKE '%pending%');

-- 3. Test simple : essayer d'insérer le nouveau statut
-- (Cette requête échouera si la contrainte existe)
-- NE PAS EXÉCUTER si vous avez des données importantes !
/*
INSERT INTO invoices (
    timesheet_id, 
    client_id, 
    company_id, 
    amount, 
    number, 
    status
) VALUES (
    'test-id-123', 
    'test-client', 
    'test-company', 
    1000, 
    'TEST-CONSTRAINT-001', 
    'paid_freelancer'  -- Ceci échouera si contrainte existe
);
*/

-- 4. Vérifier les valeurs actuelles du champ status
SELECT DISTINCT status, COUNT(*) as count
FROM invoices 
GROUP BY status
ORDER BY count DESC;