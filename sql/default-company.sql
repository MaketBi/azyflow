-- Script SQL à exécuter dans Supabase pour créer une société par défaut
-- Allez dans Supabase Dashboard > SQL Editor et exécutez ce script

INSERT INTO companies (id, name, plan, created_at) 
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'Société par défaut', 
  'standard', 
  NOW()
) 
ON CONFLICT (id) DO NOTHING;

-- Cette société servira comme fallback pour les admins en attente de configuration
