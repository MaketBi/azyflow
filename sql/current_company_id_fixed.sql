-- Correction : fonction current_company_id pour Supabase
-- Utilise l'ID utilisateur (auth.uid()) au lieu de l'email
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid AS $$
DECLARE
  company_id uuid;
  user_count integer;
BEGIN
  RAISE LOG '[current_company_id] auth.uid() = %', auth.uid();
  SELECT COUNT(*) INTO user_count FROM public.users WHERE id = auth.uid();
  RAISE LOG '[current_company_id] user_count for id = %: %', auth.uid(), user_count;
  SELECT company_id INTO company_id
  FROM public.users
  WHERE id = auth.uid();
  RAISE LOG '[current_company_id] company_id found: %', company_id;
  RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
