-- Version avec logs détaillés pour diagnostiquer l'erreur "Database error saving new user"

-- 1. Fonction trigger avec logs complets
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  company_id uuid;
  user_role text := 'freelancer';  -- valeur par défaut
  company_name text;
  full_name text;
  error_context text;
BEGIN
  -- LOG 1: Début du trigger
  RAISE LOG '[TRIGGER START] User ID: %, Email: %', NEW.id, NEW.email;
  RAISE LOG '[TRIGGER START] Raw metadata: %', NEW.raw_user_meta_data;

  -- Récupération sécurisée des métadonnées
  BEGIN
    error_context := 'parsing metadata';
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'freelancer');
    company_name := NEW.raw_user_meta_data->>'company_name';
    full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur');
    
    -- LOG 2: Métadonnées extraites
    RAISE LOG '[METADATA] Role: %, Company: %, Name: %', user_role, company_name, full_name;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Si erreur dans la récupération des métadonnées, utiliser des valeurs par défaut
      RAISE LOG '[METADATA ERROR] SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
      user_role := 'freelancer';
      company_name := 'Société par défaut';
      full_name := 'Utilisateur';
      RAISE LOG '[METADATA] Using defaults - Role: %, Company: %, Name: %', user_role, company_name, full_name;
  END;

  -- Gestion robuste de la société
  error_context := 'handling company';
  
  IF user_role = 'admin' AND company_name IS NOT NULL AND company_name != '' THEN
    -- Créer nouvelle société pour admin
    RAISE LOG '[COMPANY] Creating new company for admin: %', company_name;
    
    BEGIN
      INSERT INTO public.companies (name, plan, created_at)
      VALUES (company_name, 'standard', NOW())
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name  -- éviter les doublons
      RETURNING id INTO company_id;
      
      RAISE LOG '[COMPANY] Admin company created/found with ID: %', company_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG '[COMPANY ERROR] Admin company creation failed - SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
        RAISE;
    END;
    
  ELSE
    -- Pour freelancer ou admin sans nom de société, utiliser société par défaut
    RAISE LOG '[COMPANY] Looking for existing company: %', COALESCE(company_name, 'NULL');
    
    BEGIN
      SELECT id INTO company_id
      FROM public.companies
      WHERE name = COALESCE(company_name, 'Société par défaut')
      LIMIT 1;

      RAISE LOG '[COMPANY] Search result for "%" : %', COALESCE(company_name, 'Société par défaut'), COALESCE(company_id::text, 'NOT FOUND');

      -- Si pas trouvé, utiliser la première société disponible
      IF company_id IS NULL THEN
        RAISE LOG '[COMPANY] Company not found, looking for any company...';
        
        SELECT id INTO company_id
        FROM public.companies
        ORDER BY created_at ASC
        LIMIT 1;
        
        RAISE LOG '[COMPANY] First available company: %', COALESCE(company_id::text, 'NONE');
      END IF;

      -- Si toujours pas de société, créer une société par défaut
      IF company_id IS NULL THEN
        RAISE LOG '[COMPANY] No companies found, creating default company...';
        
        INSERT INTO public.companies (name, plan, created_at)
        VALUES ('Société par défaut', 'standard', NOW())
        RETURNING id INTO company_id;
        
        RAISE LOG '[COMPANY] Default company created with ID: %', company_id;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG '[COMPANY ERROR] Freelancer company handling failed - SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
        RAISE;
    END;
  END IF;

  -- Validation finale
  IF company_id IS NULL THEN
    RAISE EXCEPTION '[FATAL] No company_id found after all attempts';
  END IF;

  RAISE LOG '[COMPANY] Final company_id: %', company_id;

  -- Insérer le profil utilisateur
  error_context := 'inserting user profile';
  RAISE LOG '[USER] Inserting user profile...';
  RAISE LOG '[USER] Data: ID=%, company_id=%, role=%, name=%, email=%', NEW.id, company_id, user_role, full_name, NEW.email;

  BEGIN
    INSERT INTO public.users (id, company_id, role, full_name, email, created_at)
    VALUES (
      NEW.id,
      company_id,
      user_role,
      full_name,
      NEW.email,
      NOW()
    );

    RAISE LOG '[USER] User profile created successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG '[USER ERROR] User profile creation failed - SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
      RAISE LOG '[USER ERROR] Attempted values: ID=%, company_id=%, role=%, name=%, email=%', NEW.id, company_id, user_role, full_name, NEW.email;
      RAISE;
  END;

  RAISE LOG '[TRIGGER END] Success for user: %', NEW.id;
  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG '[TRIGGER FATAL ERROR] Context: %, SQLSTATE: %, SQLERRM: %', error_context, SQLSTATE, SQLERRM;
    RAISE EXCEPTION '[TRIGGER FAILED] Error in %: % (SQLSTATE: %)', error_context, SQLERRM, SQLSTATE;
END;
$$;