-- Script de test pour vérifier les politiques RLS des factures
-- À exécuter après avoir appliqué les politiques RLS

-- Test 1: Vérifier qu'un freelance ne voit que ses propres factures
-- (Connecté en tant que freelance)
-- Cette requête devrait retourner seulement les factures du freelance connecté
SELECT 
  i.id,
  i.number,
  u.full_name as freelance_name,
  c.company_id
FROM invoices i
JOIN timesheets ts ON i.timesheet_id = ts.id
JOIN contracts c ON ts.contract_id = c.id
JOIN users u ON c.user_id = u.id;

-- Test 2: Vérifier qu'un admin ne voit que les factures de sa compagnie
-- (Connecté en tant qu'admin)
-- Cette requête devrait retourner seulement les factures des freelances de la compagnie de l'admin
SELECT 
  i.id,
  i.number,
  u.full_name as freelance_name,
  c.company_id,
  comp.name as company_name
FROM invoices i
JOIN timesheets ts ON i.timesheet_id = ts.id
JOIN contracts c ON ts.contract_id = c.id
JOIN users u ON c.user_id = u.id
JOIN companies comp ON c.company_id = comp.id;

-- Test 3: Vérifier les permissions d'insertion
-- Un admin devrait pouvoir créer une facture pour un freelance de sa compagnie
-- Un freelance ne devrait pas pouvoir créer de facture

-- Test 4: Vérifier les permissions de modification
-- Un admin devrait pouvoir modifier les factures de sa compagnie uniquement
-- Un freelance ne devrait pas pouvoir modifier de factures

-- Test 5: Vérifier les permissions de suppression
-- Un admin devrait pouvoir supprimer les factures de sa compagnie uniquement
-- Un freelance ne devrait pas pouvoir supprimer de factures

-- Afficher les politiques actives pour vérification
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'invoices'
ORDER BY policyname;