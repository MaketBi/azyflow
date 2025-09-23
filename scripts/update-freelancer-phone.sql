-- Script SQL pour configurer le numéro de téléphone du freelancer
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier les freelancers existants
SELECT 
  id,
  email,
  full_name,
  role,
  phone,
  company_id
FROM users 
WHERE role = 'freelancer';

-- 2. Mettre à jour le numéro de téléphone d'un freelancer spécifique
-- Remplacez 'freelancer@email.com' par l'email réel de votre freelancer
UPDATE users 
SET phone = '+33123456789'  -- Remplacez par le numéro de téléphone souhaité
WHERE role = 'freelancer' 
  AND email = 'freelancer@email.com'; -- Remplacez par l'email de votre freelancer

-- 3. Vérifier la mise à jour
SELECT 
  id,
  email,
  full_name,
  role,
  phone,
  company_id
FROM users 
WHERE role = 'freelancer';

-- 4. Si vous voulez mettre à jour TOUS les freelancers d'une compagnie
-- (Décommentez cette section si nécessaire)
/*
UPDATE users 
SET phone = '+33123456789'  -- Numéro de test pour tous les freelancers
WHERE role = 'freelancer' 
  AND company_id = 'votre-company-id';
*/