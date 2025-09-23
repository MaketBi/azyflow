-- Migration pour les préférences de notifications
-- À exécuter dans Supabase SQL Editor

-- Table pour stocker les préférences de notifications par utilisateur
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Préférences par type de notification et canal
    -- Format JSON pour flexibilité : { "email": true, "whatsapp": false }
    timesheet_submitted JSONB DEFAULT '{"email": true, "whatsapp": true}',
    timesheet_validated JSONB DEFAULT '{"email": true, "whatsapp": true}', 
    timesheet_rejected JSONB DEFAULT '{"email": true, "whatsapp": true}',
    
    invoice_sent JSONB DEFAULT '{"email": true, "whatsapp": true}',
    payment_received JSONB DEFAULT '{"email": true, "whatsapp": true}',
    freelancer_paid JSONB DEFAULT '{"email": true, "whatsapp": true}',
    invoice_overdue JSONB DEFAULT '{"email": true, "whatsapp": true}',
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unique par utilisateur
    CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

-- Index pour performance
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- RLS (Row Level Security)
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Politique : utilisateurs peuvent voir/modifier leurs propres préférences
CREATE POLICY "Users can manage their own notification preferences"
    ON notification_preferences
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Insérer des préférences par défaut pour les utilisateurs existants
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences);

-- Fonctions SQL pour l'API TypeScript

-- Fonction pour récupérer les préférences d'un utilisateur
CREATE OR REPLACE FUNCTION get_notification_preferences(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    timesheet_submitted JSONB,
    timesheet_validated JSONB,
    timesheet_rejected JSONB,
    invoice_sent JSONB,
    payment_received JSONB,
    freelancer_paid JSONB,
    invoice_overdue JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        np.id,
        np.user_id,
        np.timesheet_submitted,
        np.timesheet_validated,
        np.timesheet_rejected,
        np.invoice_sent,
        np.payment_received,
        np.freelancer_paid,
        np.invoice_overdue,
        np.created_at,
        np.updated_at
    FROM notification_preferences np
    WHERE np.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer des préférences par défaut
CREATE OR REPLACE FUNCTION create_default_notification_preferences(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    timesheet_submitted JSONB,
    timesheet_validated JSONB,
    timesheet_rejected JSONB,
    invoice_sent JSONB,
    payment_received JSONB,
    freelancer_paid JSONB,
    invoice_overdue JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO notification_preferences (user_id) 
    VALUES (user_id_param)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN QUERY
    SELECT 
        np.id,
        np.user_id,
        np.timesheet_submitted,
        np.timesheet_validated,
        np.timesheet_rejected,
        np.invoice_sent,
        np.payment_received,
        np.freelancer_paid,
        np.invoice_overdue,
        np.created_at,
        np.updated_at
    FROM notification_preferences np
    WHERE np.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour des préférences spécifiques
CREATE OR REPLACE FUNCTION update_notification_preference(
    user_id_param UUID,
    notification_type TEXT,
    channel_preferences JSONB
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    timesheet_submitted JSONB,
    timesheet_validated JSONB,
    timesheet_rejected JSONB,
    invoice_sent JSONB,
    payment_received JSONB,
    freelancer_paid JSONB,
    invoice_overdue JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
AS $$
BEGIN
    -- Mettre à jour dynamiquement selon le type de notification
    CASE notification_type
        WHEN 'timesheet_submitted' THEN
            UPDATE notification_preferences 
            SET timesheet_submitted = channel_preferences
            WHERE notification_preferences.user_id = user_id_param;
        WHEN 'timesheet_validated' THEN
            UPDATE notification_preferences 
            SET timesheet_validated = channel_preferences
            WHERE notification_preferences.user_id = user_id_param;
        WHEN 'timesheet_rejected' THEN
            UPDATE notification_preferences 
            SET timesheet_rejected = channel_preferences
            WHERE notification_preferences.user_id = user_id_param;
        WHEN 'invoice_sent' THEN
            UPDATE notification_preferences 
            SET invoice_sent = channel_preferences
            WHERE notification_preferences.user_id = user_id_param;
        WHEN 'payment_received' THEN
            UPDATE notification_preferences 
            SET payment_received = channel_preferences
            WHERE notification_preferences.user_id = user_id_param;
        WHEN 'freelancer_paid' THEN
            UPDATE notification_preferences 
            SET freelancer_paid = channel_preferences
            WHERE notification_preferences.user_id = user_id_param;
        WHEN 'invoice_overdue' THEN
            UPDATE notification_preferences 
            SET invoice_overdue = channel_preferences
            WHERE notification_preferences.user_id = user_id_param;
    END CASE;
    
    RETURN QUERY
    SELECT 
        np.id,
        np.user_id,
        np.timesheet_submitted,
        np.timesheet_validated,
        np.timesheet_rejected,
        np.invoice_sent,
        np.payment_received,
        np.freelancer_paid,
        np.invoice_overdue,
        np.created_at,
        np.updated_at
    FROM notification_preferences np
    WHERE np.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documentation
COMMENT ON TABLE notification_preferences IS 'Préférences de notifications granulaires par utilisateur et canal';
COMMENT ON COLUMN notification_preferences.timesheet_submitted IS 'Notification quand un CRA est soumis (pour admin)';
COMMENT ON COLUMN notification_preferences.timesheet_validated IS 'Notification quand un CRA est validé + facture générée';
COMMENT ON COLUMN notification_preferences.timesheet_rejected IS 'Notification quand un CRA est rejeté';
COMMENT ON COLUMN notification_preferences.invoice_sent IS 'Notification quand une facture est envoyée au client';
COMMENT ON COLUMN notification_preferences.payment_received IS 'Notification quand le paiement client est reçu';
COMMENT ON COLUMN notification_preferences.freelancer_paid IS 'Notification quand le freelancer est payé';
COMMENT ON COLUMN notification_preferences.invoice_overdue IS 'Notification quand une facture est en retard';