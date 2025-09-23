-- MIGRATION COMPLÈTE : Système de préférences de notifications
-- À exécuter dans Supabase SQL Editor

-- =============================================================================
-- 1. MISE À JOUR DES CONTRAINTES DE STATUT DES FACTURES
-- =============================================================================

-- Supprimer l'ancienne contrainte sur les statuts des factures
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Créer la nouvelle contrainte avec tous les statuts
ALTER TABLE invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('pending', 'sent', 'paid', 'paid_freelancer', 'overdue'));

-- =============================================================================
-- 2. CRÉATION DE LA TABLE DES PRÉFÉRENCES DE NOTIFICATIONS
-- =============================================================================

-- Table pour stocker les préférences de notifications par utilisateur
CREATE TABLE IF NOT EXISTS notification_preferences (
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
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- =============================================================================
-- 3. TRIGGERS ET FONCTIONS
-- =============================================================================

-- Trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- =============================================================================
-- 4. POLITIQUES RLS (ROW LEVEL SECURITY)
-- =============================================================================

-- Activer RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON notification_preferences;

-- Politique : utilisateurs peuvent voir/modifier leurs propres préférences
CREATE POLICY "Users can manage their own notification preferences"
    ON notification_preferences
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 5. FONCTIONS SQL POUR L'API TYPESCRIPT
-- =============================================================================

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

-- =============================================================================
-- 6. DONNÉES INITIALES
-- =============================================================================

-- Insérer des préférences par défaut pour les utilisateurs existants
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- 7. COMMENTAIRES ET DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE notification_preferences IS 'Préférences de notifications granulaires par utilisateur et canal';
COMMENT ON COLUMN notification_preferences.timesheet_submitted IS 'Notification quand un CRA est soumis (pour admin)';
COMMENT ON COLUMN notification_preferences.timesheet_validated IS 'Notification quand un CRA est validé + facture générée';
COMMENT ON COLUMN notification_preferences.timesheet_rejected IS 'Notification quand un CRA est rejeté';
COMMENT ON COLUMN notification_preferences.invoice_sent IS 'Notification quand une facture est envoyée au client';
COMMENT ON COLUMN notification_preferences.payment_received IS 'Notification quand le paiement client est reçu';
COMMENT ON COLUMN notification_preferences.freelancer_paid IS 'Notification quand le freelancer est payé';
COMMENT ON COLUMN notification_preferences.invoice_overdue IS 'Notification quand une facture est en retard';

-- =============================================================================
-- 8. TESTS DE VALIDATION
-- =============================================================================

-- Test 1: Vérifier que les nouvelles contraintes de statut fonctionnent
DO $$
DECLARE
    test_invoice_id UUID;
BEGIN
    -- Essayer d'insérer avec les nouveaux statuts
    INSERT INTO invoices (
        timesheet_id, 
        client_id, 
        company_id, 
        amount, 
        number, 
        status
    ) VALUES 
        ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1000, 'TEST-OVERDUE-' || extract(epoch from now()), 'overdue')
    RETURNING id INTO test_invoice_id;
    
    -- Si on arrive ici, le test a réussi
    RAISE NOTICE 'TEST 1 RÉUSSI: Nouveau statut "overdue" accepté';
    
    -- Nettoyer
    DELETE FROM invoices WHERE id = test_invoice_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 1 ÉCHOUÉ: %', SQLERRM;
END $$;

-- Test 2: Vérifier que les fonctions de préférences marchent
DO $$
DECLARE
    test_user_id UUID;
    test_prefs RECORD;
BEGIN
    -- Prendre le premier utilisateur disponible
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Créer des préférences par défaut
        SELECT * INTO test_prefs FROM create_default_notification_preferences(test_user_id) LIMIT 1;
        
        IF test_prefs.id IS NOT NULL THEN
            RAISE NOTICE 'TEST 2 RÉUSSI: Préférences créées pour utilisateur %', test_user_id;
        ELSE
            RAISE NOTICE 'TEST 2 ÉCHOUÉ: Impossible de créer les préférences';
        END IF;
    ELSE
        RAISE NOTICE 'TEST 2 IGNORÉ: Aucun utilisateur disponible';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 2 ÉCHOUÉ: %', SQLERRM;
END $$;

-- =============================================================================
-- RÉSULTAT FINAL
-- =============================================================================

SELECT 
    'MIGRATION TERMINÉE AVEC SUCCÈS' as status,
    (SELECT COUNT(*) FROM notification_preferences) as preferences_created,
    (SELECT COUNT(DISTINCT status) FROM invoices WHERE status IN ('overdue', 'paid_freelancer')) as new_statuses_used;