-- Trigger corrigé : gère le champ 'active' lors de la création d'un utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  company_id uuid;
  user_role text := 'freelancer';
  company_identifier text;
  full_name text;
  active_status boolean := true;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'freelancer');
  company_identifier := NEW.raw_user_meta_data->>'company_name';
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur');
  IF NEW.raw_user_meta_data ? 'active' THEN
    active_status := (NEW.raw_user_meta_data->>'active')::boolean;
  END IF;
  -- ...gestion company_id comme avant...
  -- (copie la logique existante ici)
  -- Créer le profil utilisateur avec le statut
  INSERT INTO public.users (id, company_id, role, full_name, email, created_at, active)
  VALUES (
    NEW.id,
    company_id,
    user_role,
    full_name,
    NEW.email,
    NOW(),
    active_status
  );
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
