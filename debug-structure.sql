-- Vérification structure tables pour analytics

-- Vérifier la table users (colonnes company_id présente ?)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier la table contracts (colonnes company_id présente ?)  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'contracts'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier la table invoices (colonnes company_id présente ?)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les données de l'admin mdiop99@gmail.com
SELECT id, email, role, company_id, full_name
FROM users 
WHERE email = 'mdiop99@gmail.com';

-- Compter les freelancers de cette entreprise
SELECT COUNT(*) as freelancers_count
FROM users u1
CROSS JOIN (
  SELECT company_id FROM users WHERE email = 'mdiop99@gmail.com'
) admin
WHERE u1.role = 'freelance' 
AND u1.company_id = admin.company_id;