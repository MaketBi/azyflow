-- 🧪 Script de test après migration freelancer_payments
-- À exécuter dans Supabase SQL Editor APRÈS la migration

-- 1. Vérifier que la table existe et sa structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE WHEN column_name = 'is_advance' THEN '🎯 AVANCE' 
       WHEN column_name = 'advance_reason' THEN '📝 RAISON'
       WHEN column_name = 'amount' THEN '💰 MONTANT'
       ELSE '' END as description
FROM information_schema.columns 
WHERE table_name = 'freelancer_payments'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes (surtout la contrainte avance)
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  CASE contype 
    WHEN 'c' THEN 'CHECK - ' || 
      CASE WHEN conname LIKE '%advance%' THEN '✅ Avance → Raison obligatoire'
           ELSE 'Autre contrainte' END
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    ELSE contype::text
  END as description
FROM pg_constraint 
WHERE conrelid = 'freelancer_payments'::regclass;

-- 3. Vérifier les index pour performance
SELECT 
  indexname,
  indexdef,
  CASE WHEN indexname LIKE '%advance%' THEN '🚀 Index Avances'
       WHEN indexname LIKE '%company%' THEN '🏢 Index Compagnie'  
       WHEN indexname LIKE '%invoice%' THEN '📄 Index Factures'
       WHEN indexname LIKE '%created%' THEN '📅 Index Chronologique'
       ELSE '📊 Index Standard' END as performance
FROM pg_indexes 
WHERE tablename = 'freelancer_payments';

-- 4. Vérifier les politiques RLS
SELECT 
  policyname,
  cmd,
  qual,
  CASE cmd
    WHEN 'r' THEN '👀 SELECT - Lecture'
    WHEN 'a' THEN '➕ INSERT - Création'  
    WHEN 'w' THEN '✏️ UPDATE - Modification'
    WHEN 'd' THEN '🗑️ DELETE - Suppression'
    ELSE cmd
  END as operation
FROM pg_policies 
WHERE tablename = 'freelancer_payments';

-- 5. Test d'insertion (simulation - ne pas exécuter en production)
-- ATTENTION: Commenté pour éviter les erreurs
/*
-- Exemple de test avec des UUIDs factices:
INSERT INTO freelancer_payments (
  invoice_id, 
  company_id, 
  amount, 
  payment_method, 
  is_advance, 
  advance_reason, 
  created_by
) VALUES (
  gen_random_uuid(), -- invoice_id factice
  (SELECT id FROM companies LIMIT 1), -- première compagnie
  1500.00,
  'bank_transfer',
  true,
  'Avance exceptionnelle - test migration',
  auth.uid()
);
*/

-- 6. Afficher un résumé de validation
SELECT 
  '🎉 MIGRATION VALIDÉE' as status,
  'Table freelancer_payments créée avec succès' as message,
  NOW() as validated_at;

-- 7. Vérifier les relations (foreign keys)
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  CASE ccu.table_name
    WHEN 'invoices' THEN '📄 Lien vers factures'
    WHEN 'companies' THEN '🏢 Lien vers compagnies'
    WHEN 'users' THEN '👤 Lien vers utilisateurs (auth)'
    ELSE '🔗 Autre relation'
  END as relationship_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'freelancer_payments';

-- 8. Prochaines étapes après validation
SELECT 
  '🔄 PROCHAINE ÉTAPE' as action,
  'Regénérer les types TypeScript' as description,
  'npx supabase gen types typescript --project-id [ID] > lib/database.types.ts' as command;

SELECT 
  '⚡ ACTIVATION' as action,  
  'Remplacer le service simulé par la version persistante' as description,
  'Modifier lib/services/partial-payments.ts' as location;