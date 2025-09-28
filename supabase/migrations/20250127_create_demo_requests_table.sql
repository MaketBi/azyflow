-- Migration: Création de la table demo_requests
-- Date: 27 janvier 2025
-- Description: Table pour stocker les demandes de démonstration des ESN

-- Création de la table demo_requests
CREATE TABLE IF NOT EXISTS public.demo_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    freelancers_count VARCHAR(20) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'invited', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON public.demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_email ON public.demo_requests(email);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON public.demo_requests(created_at);

-- RLS (Row Level Security)
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Seuls les Super Admins peuvent voir les demandes de démo
CREATE POLICY "Super admins can manage demo requests" ON public.demo_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_demo_requests_updated_at 
    BEFORE UPDATE ON public.demo_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE public.demo_requests IS 'Demandes de démonstration des ESN potentielles';
COMMENT ON COLUMN public.demo_requests.company_name IS 'Nom de l''ESN intéressée';
COMMENT ON COLUMN public.demo_requests.contact_name IS 'Nom du contact principal';
COMMENT ON COLUMN public.demo_requests.email IS 'Email de contact';
COMMENT ON COLUMN public.demo_requests.phone IS 'Téléphone (optionnel)';
COMMENT ON COLUMN public.demo_requests.freelancers_count IS 'Nombre estimé de freelancers';
COMMENT ON COLUMN public.demo_requests.message IS 'Message libre de l''ESN';
COMMENT ON COLUMN public.demo_requests.status IS 'Statut de la demande : pending, contacted, invited, rejected';
COMMENT ON COLUMN public.demo_requests.notes IS 'Notes internes du Super Admin';

-- Politique pour permettre l'insertion publique (pour le formulaire de demande)
CREATE POLICY "Anyone can create demo requests" ON public.demo_requests
    FOR INSERT WITH CHECK (true);