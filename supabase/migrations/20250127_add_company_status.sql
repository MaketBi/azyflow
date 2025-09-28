-- Migration: Ajout du statut d'invitation aux entreprises
-- Date: 27 janvier 2025
-- Description: Ajout du champ status pour gérer les invitations ESN

-- Ajout du champ status avec enum
DO $$ BEGIN
    CREATE TYPE company_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ajout de la colonne status
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status company_status DEFAULT 'pending';

-- Mise à jour des entreprises existantes (celles sans invited_by sont acceptées)
UPDATE public.companies 
SET status = 'accepted' 
WHERE invited_by IS NULL AND status = 'pending';

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);

-- Commentaire
COMMENT ON COLUMN public.companies.status IS 'Statut de l''invitation ESN: pending, accepted, rejected';