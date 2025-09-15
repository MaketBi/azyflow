-- Politique RLS pour permettre la lecture publique de la table companies
-- Nécessaire pour que les utilisateurs non-connectés puissent voir les sociétés lors de l'inscription

-- Activer RLS sur la table companies (si pas déjà fait)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre la lecture publique
CREATE POLICY "Allow public read access to companies" ON public.companies
    FOR SELECT
    USING (true);

-- Vérifier les politiques existantes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'companies';