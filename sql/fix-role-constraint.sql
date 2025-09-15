-- Script pour identifier et corriger la contrainte role sur la table users

-- 1. Vérifier la contrainte actuelle
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
AND contype = 'c'  -- check constraints
AND conname LIKE '%role%';

-- 2. Vérifier les valeurs autorisées si c'est un enum
SELECT 
    t.typname, 
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as allowed_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname LIKE '%role%';

-- 3. Corriger la contrainte pour accepter 'freelancer' au lieu de 'freelance'

-- Supprimer l'ancienne contrainte
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Créer la nouvelle contrainte avec les bonnes valeurs
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'freelancer'));

-- 4. Vérifier que la contrainte est bien appliquée
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
AND conname = 'users_role_check';