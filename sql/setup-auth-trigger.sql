-- Fonction qui crée automatiquement un profil user dans public.users
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Créer la fonction trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  company_id uuid;
  role text;
  company_name text;
BEGIN
  -- Récupération des métadonnées
  role := (NEW.raw_user_meta_data->>'role');
  company_name := (NEW.raw_user_meta_data->>'company_name');

  -- Gestion de la société
  IF role = 'admin' THEN
    -- Si admin → créer une nouvelle company
    INSERT INTO public.companies (name, plan, created_at)
    VALUES (company_name, 'standard', NOW())
    RETURNING id INTO company_id;
  ELSE
    -- Si freelancer → récupérer la company existante
    SELECT id INTO company_id
    FROM public.companies
    WHERE name = company_name
    LIMIT 1;

    IF company_id IS NULL THEN
      RAISE EXCEPTION 'Company "%" not found for freelancer signup', company_name;
    END IF;
  END IF;

  -- Insérer le profil utilisateur dans public.users
  INSERT INTO public.users (id, company_id, role, full_name, email, created_at)
  VALUES (
    NEW.id,                                  -- id = auth.users.id
    company_id,                              -- company
    role,                                    -- admin/freelancer
    NEW.raw_user_meta_data->>'full_name',    -- nom complet
    NEW.email,                               -- email
    NOW()                                    -- timestamp
  );

  RETURN NEW;
END;
$$;

-- 2. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Créer le nouveau trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. (Optionnel) Créer quelques sociétés de test pour les freelancers
INSERT INTO public.companies (name, plan, created_at) 
VALUES 
  ('TechCorp SARL', 'standard', NOW()),
  ('Digital Solutions', 'premium', NOW()),
  ('Startup Innovante', 'standard', NOW())
ON CONFLICT (name) DO NOTHING;
