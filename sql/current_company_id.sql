-- Correction : fonction current_company_id pour Supabase
-- Retourne l'id de la société de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid AS $$
DECLARE
  company_id uuid;
BEGIN
  SELECT company_id INTO company_id
  FROM public.users
  WHERE email = auth.email();
  RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
