-- Script SQL pour vérifier et configurer le numéro de téléphone de l'admin
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier l'admin actuel et son numéro de téléphone
SELECT 
  id,
  email,
  full_name,
  role,
  phone,
  company_id,
  created_at
FROM users 
WHERE role = 'admin';

-- 2. Mettre à jour le numéro de téléphone de l'admin
-- Remplacez 'admin@email.com' par l'email réel de votre admin
UPDATE users 
SET phone = '+33761604943'
WHERE role = 'admin' 
  AND email = 'admin@email.com'; -- Remplacez par l'email de votre admin

-- 3. Vérifier la mise à jour
SELECT 
  id,
  email,
  full_name,
  role,
  phone,
  company_id
FROM users 
WHERE role = 'admin';

-- 4. Vérifier les freelancers et leurs numéros (optionnel)
SELECT 
  id,
  email,
  full_name,
  role,
  phone,
  company_id
FROM users 
WHERE role = 'freelancer';