-- Migration ESN simplifiée - Version finale
-- Date: 27 janvier 2025
-- Description: Ajout des champs ESN essentiels uniquement (pas de secteurs d'activité)

-- =============================================
-- Ajout des colonnes ESN à la table companies
-- =============================================

-- Champs métier ESN
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS siret VARCHAR(14) UNIQUE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS estimated_freelancers INTEGER DEFAULT 5 CHECK (estimated_freelancers > 0);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

-- Audit d'invitation (qui et quand)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_companies_siret ON public.companies(siret) WHERE siret IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN public.companies.siret IS 'Numéro SIRET de l''ESN (France)';
COMMENT ON COLUMN public.companies.estimated_freelancers IS 'Nombre estimé de freelancers à gérer';
COMMENT ON COLUMN public.companies.contact_email IS 'Email de contact principal de l''ESN';
COMMENT ON COLUMN public.companies.invited_by IS 'Super Admin qui a envoyé l''invitation';
COMMENT ON COLUMN public.companies.invited_at IS 'Date d''envoi de l''invitation';