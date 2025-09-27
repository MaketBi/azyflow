-- Migration pour ajouter le système de configuration HNO
-- Date: 2025-01-15
-- Description: Création de la table hno_configurations pour permettre aux admins de personnaliser les taux de majoration

-- Créer un enum pour les créneaux HNO
CREATE TYPE hno_time_slot AS ENUM (
    'weekday_evening',
    'weekday_night', 
    'saturday_day',
    'saturday_evening',
    'saturday_night',
    'sunday_holiday'
);

-- Créer la table de configuration HNO
CREATE TABLE hno_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    time_slot hno_time_slot NOT NULL,
    majoration_percent DECIMAL(5,2) NOT NULL CHECK (majoration_percent >= 0 AND majoration_percent <= 1000),
    label TEXT NOT NULL,
    description TEXT NOT NULL,
    time_range TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité : une seule configuration par créneau et par entreprise
    UNIQUE(company_id, time_slot)
);

-- Index pour les performances
CREATE INDEX idx_hno_configurations_company_id ON hno_configurations(company_id);
CREATE INDEX idx_hno_configurations_time_slot ON hno_configurations(time_slot);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hno_configurations_updated_at 
    BEFORE UPDATE ON hno_configurations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) pour sécuriser l'accès
ALTER TABLE hno_configurations ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs ne peuvent voir que les configurations de leur entreprise
CREATE POLICY "Users can view hno_configurations of their company" ON hno_configurations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.company_id = hno_configurations.company_id
        )
    );

-- Policy : Seuls les admins peuvent modifier les configurations de leur entreprise
CREATE POLICY "Admins can manage hno_configurations of their company" ON hno_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.company_id = hno_configurations.company_id
            AND users.role = 'admin'
        )
    );

-- Commentaires pour la documentation
COMMENT ON TABLE hno_configurations IS 'Configuration des taux de majoration HNO (Heures Non Ouvrées) par entreprise';
COMMENT ON COLUMN hno_configurations.company_id IS 'Référence vers l''entreprise propriétaire de cette configuration';
COMMENT ON COLUMN hno_configurations.time_slot IS 'Créneau horaire (soirée, nuit, weekend, etc.)';
COMMENT ON COLUMN hno_configurations.majoration_percent IS 'Pourcentage de majoration (0-1000%)';
COMMENT ON COLUMN hno_configurations.label IS 'Libellé court du créneau (ex: "Soirée semaine")';
COMMENT ON COLUMN hno_configurations.description IS 'Description complète du créneau';
COMMENT ON COLUMN hno_configurations.time_range IS 'Plage horaire (ex: "18h-22h")';