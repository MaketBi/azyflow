-- Script rapide pour désactiver TOUTES les notifications WhatsApp d'un utilisateur
-- Remplacez 'votre-email@example.com' par votre adresse email

DO $$
DECLARE
    target_user_id UUID;
    user_email TEXT := 'votre-email@example.com'; -- 🔧 MODIFIER ICI
BEGIN
    -- Trouver l'ID de l'utilisateur
    SELECT id INTO target_user_id 
    FROM users 
    WHERE email = user_email;
    
    IF target_user_id IS NOT NULL THEN
        -- Désactiver WhatsApp pour toutes les notifications
        UPDATE notification_preferences 
        SET 
            timesheet_submitted = '{"email": true, "whatsapp": false}',
            timesheet_validated = '{"email": true, "whatsapp": false}',
            timesheet_rejected = '{"email": true, "whatsapp": false}',
            invoice_sent = '{"email": true, "whatsapp": false}',
            payment_received = '{"email": true, "whatsapp": false}',
            freelancer_paid = '{"email": true, "whatsapp": false}',
            invoice_overdue = '{"email": true, "whatsapp": false}'
        WHERE user_id = target_user_id;
        
        RAISE NOTICE '✅ WhatsApp désactivé pour toutes les notifications de %', user_email;
        
        -- Afficher les nouvelles préférences
        RAISE NOTICE '📋 Nouvelles préférences:';
        FOR rec IN 
            SELECT 
                'timesheet_submitted' as type, timesheet_submitted as prefs
            FROM notification_preferences WHERE user_id = target_user_id
            UNION ALL
            SELECT 
                'timesheet_validated' as type, timesheet_validated as prefs
            FROM notification_preferences WHERE user_id = target_user_id
            UNION ALL
            SELECT 
                'invoice_sent' as type, invoice_sent as prefs
            FROM notification_preferences WHERE user_id = target_user_id
        LOOP
            RAISE NOTICE '  %: %', rec.type, rec.prefs;
        END LOOP;
        
    ELSE
        RAISE NOTICE '❌ Utilisateur % introuvable', user_email;
        RAISE NOTICE '📋 Utilisateurs disponibles:';
        FOR rec IN SELECT email, role FROM users ORDER BY role, email LOOP
            RAISE NOTICE '  % (%)', rec.email, rec.role;
        END LOOP;
    END IF;
END $$;