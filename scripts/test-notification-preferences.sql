-- Script de test pour vérifier le bon fonctionnement des préférences de notifications
-- À exécuter dans Supabase SQL Editor pour diagnostiquer les problèmes

-- =============================================================================
-- 1. VÉRIFIER L'ÉTAT DES PRÉFÉRENCES EXISTANTES
-- =============================================================================

-- Afficher toutes les préférences de notifications
SELECT 
    u.email,
    u.full_name,
    u.role,
    np.timesheet_submitted,
    np.timesheet_validated,
    np.timesheet_rejected,
    np.invoice_sent,
    np.payment_received,
    np.freelancer_paid,
    np.invoice_overdue,
    np.created_at
FROM notification_preferences np
JOIN users u ON u.id = np.user_id
ORDER BY u.role, u.full_name;

-- =============================================================================
-- 2. IDENTIFIER LES UTILISATEURS SANS PRÉFÉRENCES
-- =============================================================================

-- Utilisateurs qui n'ont pas encore de préférences
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    'MANQUE PRÉFÉRENCES' as status
FROM users u
LEFT JOIN notification_preferences np ON np.user_id = u.id
WHERE np.id IS NULL;

-- =============================================================================
-- 3. CRÉER LES PRÉFÉRENCES MANQUANTES
-- =============================================================================

-- Insérer les préférences manquantes
INSERT INTO notification_preferences (user_id)
SELECT u.id 
FROM users u
LEFT JOIN notification_preferences np ON np.user_id = u.id
WHERE np.id IS NULL;

-- =============================================================================
-- 4. TESTER LES FONCTIONS SQL
-- =============================================================================

-- Test 1: Récupérer les préférences d'un utilisateur spécifique
DO $$
DECLARE
    test_user_id UUID;
    prefs_count INTEGER;
BEGIN
    -- Prendre le premier freelancer disponible
    SELECT id INTO test_user_id 
    FROM users 
    WHERE role = 'freelancer' 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Compter les préférences retournées
        SELECT COUNT(*) INTO prefs_count
        FROM get_notification_preferences(test_user_id);
        
        RAISE NOTICE 'TEST 1 - Utilisateur: %, Préférences trouvées: %', test_user_id, prefs_count;
        
        IF prefs_count > 0 THEN
            RAISE NOTICE '✅ TEST 1 RÉUSSI: Fonction get_notification_preferences fonctionne';
        ELSE
            RAISE NOTICE '❌ TEST 1 ÉCHOUÉ: Aucune préférence trouvée';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ TEST 1 IGNORÉ: Aucun freelancer trouvé';
    END IF;
END $$;

-- Test 2: Tester la mise à jour d'une préférence
DO $$
DECLARE
    test_user_id UUID;
    updated_prefs RECORD;
BEGIN
    -- Prendre le premier utilisateur disponible
    SELECT id INTO test_user_id 
    FROM users 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Mettre à jour une préférence
        SELECT * INTO updated_prefs
        FROM update_notification_preference(
            test_user_id,
            'timesheet_submitted',
            '{"email": false, "whatsapp": true}'::jsonb
        ) LIMIT 1;
        
        IF updated_prefs.id IS NOT NULL THEN
            RAISE NOTICE '✅ TEST 2 RÉUSSI: Fonction update_notification_preference fonctionne';
            RAISE NOTICE 'Nouvelle préférence timesheet_submitted: %', updated_prefs.timesheet_submitted;
        ELSE
            RAISE NOTICE '❌ TEST 2 ÉCHOUÉ: Impossible de mettre à jour la préférence';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ TEST 2 IGNORÉ: Aucun utilisateur trouvé';
    END IF;
END $$;

-- =============================================================================
-- 5. VÉRIFIER L'INTÉGRITÉ DES DONNÉES
-- =============================================================================

-- Vérifier que tous les utilisateurs ont des préférences
SELECT 
    'RÉSUMÉ' as type,
    COUNT(*) as total_users,
    (SELECT COUNT(*) FROM notification_preferences) as users_with_preferences,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM notification_preferences) THEN '✅ TOUS ONT DES PRÉFÉRENCES'
        ELSE '❌ ' || (COUNT(*) - (SELECT COUNT(*) FROM notification_preferences))::text || ' UTILISATEURS SANS PRÉFÉRENCES'
    END as status
FROM users;

-- =============================================================================
-- 6. AFFICHER UN EXEMPLE DE PRÉFÉRENCES TYPIQUES
-- =============================================================================

-- Exemple de préférences pour un freelancer
SELECT 
    'EXEMPLE FREELANCER' as type,
    u.full_name,
    'timesheet_validated (CRA validé)' as notification_type,
    np.timesheet_validated as preferences
FROM notification_preferences np
JOIN users u ON u.id = np.user_id
WHERE u.role = 'freelancer'
LIMIT 1

UNION ALL

-- Exemple de préférences pour un admin
SELECT 
    'EXEMPLE ADMIN' as type,
    u.full_name,
    'timesheet_submitted (CRA soumis)' as notification_type,
    np.timesheet_submitted as preferences
FROM notification_preferences np
JOIN users u ON u.id = np.user_id
WHERE u.role = 'admin'
LIMIT 1;

-- =============================================================================
-- 7. INSTRUCTIONS DE DÉPANNAGE
-- =============================================================================

SELECT 
    '📋 INSTRUCTIONS DE DÉPANNAGE' as titre,
    'Si vous continuez à recevoir des notifications malgré les préférences désactivées:

1. Vérifiez que vos préférences sont bien sauvegardées (voir résultats ci-dessus)
2. Déconnectez-vous et reconnectez-vous à l''application
3. Videz le cache de votre navigateur
4. Vérifiez dans les logs de Supabase Edge Functions si les préférences sont bien lues
5. Contactez l''administrateur si le problème persiste

🔧 Pour forcer une synchronisation des préférences:
- Allez dans votre profil
- Cliquez sur "Réinitialiser" dans les préférences de notifications
- Reconfigurez vos préférences

⚠️ Si le problème persiste, il peut y avoir un cache côté serveur à vider.' as instructions;