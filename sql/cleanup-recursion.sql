-- Script pour NETTOYER les triggers récursifs et RLS problématiques
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Supprimer tous les triggers sur auth.users qui causent des récursions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Supprimer les politiques RLS problématiques sur public.users
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

-- 3. Supprimer les politiques RLS sur public.companies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.companies;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.companies;

-- 4. Désactiver complètement RLS sur ces tables (temporaire)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- 5. Message de confirmation
SELECT 'All problematic triggers and RLS policies removed' as status;