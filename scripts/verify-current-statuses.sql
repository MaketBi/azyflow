-- Vérification des statuts existants dans votre base de données
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Voir tous les statuts actuellement utilisés
SELECT DISTINCT status, COUNT(*) as count
FROM invoices 
GROUP BY status
ORDER BY count DESC;

-- 2. Vérifier si 'paid_freelancer' existe déjà
SELECT COUNT(*) as count_paid_freelancer
FROM invoices 
WHERE status = 'paid_freelancer';

-- 3. Voir quelques exemples de factures récentes avec leurs statuts
SELECT 
    id,
    number,
    status,
    created_at,
    paid_at
FROM invoices 
ORDER BY created_at DESC 
LIMIT 10;