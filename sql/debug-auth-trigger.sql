-- Debug et correction du trigger d'authentification
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Fonction trigger avec logs de debug
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  company_id uuid;
  user_role text;
  company_name text;
BEGIN
  -- Debug: log des métadonnées reçues
  RAISE LOG 'NEW USER SIGNUP - raw_user_meta_data: %', NEW.raw_user_meta_data;
  
  -- Récupération des métadonnées avec valeurs par défaut
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'freelancer');
  company_name := NEW.raw_user_meta_data->>'company_name';
  
  RAISE LOG 'Extracted role: %, company_name: %', user_role, company_name;

  -- Vérification que company_name n'est pas null
  IF company_name IS NULL OR company_name = '' THEN
    RAISE EXCEPTION 'Company name is required for user signup';
  END IF;

  -- Gestion de la société
  IF user_role = 'admin' THEN
    -- Si admin → créer une nouvelle company
    RAISE LOG 'Creating new company for admin: %', company_name;
    
    INSERT INTO public.companies (name, plan, created_at)
    VALUES (company_name, 'standard', NOW())
    RETURNING id INTO company_id;
    
    RAISE LOG 'Created company with ID: %', company_id;
  ELSE
    -- Si freelancer → récupérer la company existante
    RAISE LOG 'Looking for existing company: %', company_name;
    
    SELECT id INTO company_id
    FROM public.companies
    WHERE name = company_name
    LIMIT 1;

    IF company_id IS NULL THEN
      RAISE EXCEPTION 'Company "%" not found for freelancer signup. Available companies: %', 
        company_name, 
        (SELECT string_agg(name, ', ') FROM public.companies);
    END IF;
    
    RAISE LOG 'Found company with ID: %', company_id;
  END IF;

  -- Insérer le profil utilisateur dans public.users
  RAISE LOG 'Creating user profile with company_id: %', company_id;
  
  INSERT INTO public.users (id, company_id, role, full_name, email, created_at)
  VALUES (
    NEW.id,                                  -- id = auth.users.id
    company_id,                              -- company
    user_role,                               -- admin/freelancer
    NEW.raw_user_meta_data->>'full_name',    -- nom complet
    NEW.email,                               -- email
    NOW()                                    -- timestamp
  );

  RAISE LOG 'User profile created successfully for user: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'ERROR in handle_new_user: % - %', SQLSTATE, SQLERRM;
    RAISE;
END;
$$;

-- 2. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Créer le nouveau trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Vérifier les logs
-- Après avoir testé l'inscription, consultez les logs avec :
-- SELECT * FROM pg_stat_statements WHERE query LIKE '%handle_new_user%';
-- Ou dans Supabase Dashboard > Logs