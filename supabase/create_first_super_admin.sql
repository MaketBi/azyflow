-- Script pour créer le premier Super Admin avec Supabase Auth
-- À exécuter APRÈS avoir créé votre compte via l'interface web normale

-- IMPORTANT: Créez d'abord votre compte via l'app web avec ce même email !
-- Puis exécutez ce script pour le promouvoir en super_admin

-- Promouvoir un utilisateur existant au rôle super_admin
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'mamadou@azyflow.com'  -- ⚠️ CHANGEZ PAR VOTRE EMAIL RÉEL
AND role = 'admin';  -- Sécurité: seulement les admins peuvent être promus

-- Alternative si vous n'êtes pas encore admin
-- UPDATE users SET role = 'super_admin' WHERE email = 'mamadou@azyflow.com';

-- Vérification
SELECT id, email, full_name, role 
FROM users 
WHERE role = 'super_admin';

-- OPTION SUPPRIMÉE: Ne pas créer d'utilisateur directement en SQL
-- Avec Supabase Auth, l'utilisateur DOIT être créé via l'interface web
-- Sinon il n'existera pas dans auth.users et la connexion échouera

-- Processus correct:
-- 1. Créer le compte via l'app web (inscription normale)
-- 2. Se connecter une fois pour synchroniser les données  
-- 3. Exécuter le script ci-dessus pour promouvoir en super_admin
-- 4. Se déconnecter et reconnecter pour rafraîchir les permissions

-- Vérifier les permissions (doit retourner des résultats si super_admin)
SELECT 
    'company_invitations' as table_name,
    COUNT(*) as accessible_rows
FROM company_invitations
UNION ALL
SELECT 
    'super_admin_activities' as table_name,
    COUNT(*) as accessible_rows  
FROM super_admin_activities;