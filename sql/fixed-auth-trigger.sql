-- Trigger corrigé : utilise l'ID de société pour les freelancers au lieu du nom
-- Cela évite les problèmes de correspondance exacte des noms

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  company_id uuid;
  user_role text := 'freelancer';
  company_identifier text;  -- peut être nom (admin) ou ID (freelancer)
  full_name text;
BEGIN
  -- Récupération des métadonnées
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'freelancer');
  company_identifier := NEW.raw_user_meta_data->>'company_name';
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur');

  RAISE LOG '[TRIGGER] Role: %, Company identifier: %, Name: %', user_role, company_identifier, full_name;

  -- Gestion de la société
  IF user_role = 'admin' THEN
    -- ADMIN: company_identifier est un nom → créer nouvelle société
    RAISE LOG '[ADMIN] Creating company with name: %', company_identifier;
    
    INSERT INTO public.companies (name, plan, created_at)
    VALUES (company_identifier, 'standard', NOW())
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO company_id;
    
    RAISE LOG '[ADMIN] Company created/found with ID: %', company_id;
    
  ELSE
    -- FREELANCER: company_identifier est un UUID → chercher par ID
    RAISE LOG '[FREELANCER] Looking for company with ID: %', company_identifier;
    
    -- Vérifier si c'est un UUID valide
    BEGIN
      company_id := company_identifier::uuid;
      RAISE LOG '[FREELANCER] Successfully parsed UUID: %', company_id;
      
      -- Vérifier que cette société existe
      IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = company_id) THEN
        RAISE LOG '[FREELANCER] Company ID % not found', company_id;
        company_id := NULL;
      ELSE
        RAISE LOG '[FREELANCER] Company ID % confirmed to exist', company_id;
      END IF;
      
    EXCEPTION
      WHEN invalid_text_representation THEN
        -- Si ce n'est pas un UUID, c'est peut-être un nom (fallback)
        RAISE LOG '[FREELANCER] Not a UUID, trying name search for: %', company_identifier;
        
        SELECT id INTO company_id
        FROM public.companies
        WHERE name = company_identifier
        LIMIT 1;
        
        RAISE LOG '[FREELANCER] Name search result: %', COALESCE(company_id::text, 'NOT FOUND');
    END;

    -- Si pas de société trouvée, utiliser la première disponible
    IF company_id IS NULL THEN
      RAISE LOG '[FREELANCER] No company found, using first available';
      
      SELECT id INTO company_id
      FROM public.companies
      ORDER BY created_at ASC
      LIMIT 1;
      
      RAISE LOG '[FREELANCER] Fallback company: %', COALESCE(company_id::text, 'NONE');
    END IF;

    -- Si toujours rien, créer société par défaut
    IF company_id IS NULL THEN
      RAISE LOG '[FREELANCER] Creating default company';
      
      INSERT INTO public.companies (name, plan, created_at)
      VALUES ('Société par défaut', 'standard', NOW())
      RETURNING id INTO company_id;
      
      RAISE LOG '[FREELANCER] Default company created: %', company_id;
    END IF;
  END IF;

  -- Validation finale
  IF company_id IS NULL THEN
    RAISE EXCEPTION 'Unable to determine company_id for user';
  END IF;

  RAISE LOG '[FINAL] Using company_id: %', company_id;

  -- Créer le profil utilisateur
  INSERT INTO public.users (id, company_id, role, full_name, email, created_at)
  VALUES (
    NEW.id,
    company_id,
    user_role,
    full_name,
    NEW.email,
    NOW()
  );

  RAISE LOG '[SUCCESS] User profile created for: %', NEW.id;
  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG '[ERROR] SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
    RAISE;
END;
$$;

-- Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();