-- Vérifier les contraintes sur la table users
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
AND contype = 'c';  -- check constraints

-- Également vérifier la structure de la table
\d public.users;