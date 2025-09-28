-- Migration: Création du système Super Admin et invitations ESN
-- Date: 2025-01-27
-- Objectif: Phase 1 - Dashboard Super Admin pour contrôle B2B premium

-- 1. Ajout du support super_admin dans la colonne role existante
-- Garder la colonne role comme VARCHAR pour éviter de casser les politiques RLS existantes
-- Créer l'enum user_role pour référence future si nécessaire
DO $$
BEGIN
    -- Créer l'enum user_role pour référence future (optionnel)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'freelancer', 'super_admin');
    ELSE
        -- Si l'enum existe, juste ajouter super_admin s'il n'existe pas
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'super_admin' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN
            ALTER TYPE user_role ADD VALUE 'super_admin';
        END IF;
    END IF;
    
    -- Ajouter une contrainte CHECK pour valider les valeurs role
    -- D'abord, supprimer la contrainte existante si elle existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_role_check' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
    
    -- Ajouter la nouvelle contrainte avec support super_admin
    ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('admin', 'freelancer', 'super_admin'));
END $$;

-- 2. Création de la table company_invitations
CREATE TABLE IF NOT EXISTS company_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    siret VARCHAR(14), -- SIRET français optionnel
    business_sector VARCHAR(100),
    estimated_freelancers INTEGER DEFAULT 1,
    
    -- Statuts invitation
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    
    -- Tokens et sécurité
    invitation_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Metadata
    invited_by UUID REFERENCES users(id),
    company_created_id UUID REFERENCES companies(id), -- Une fois acceptée
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    UNIQUE(email, company_name)
);

-- 3. Index pour performance
CREATE INDEX IF NOT EXISTS idx_company_invitations_status ON company_invitations(status);
CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON company_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_company_invitations_expires_at ON company_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_company_invitations_invited_by ON company_invitations(invited_by);

-- 4. Création de la table super_admin_activities pour audit trail
CREATE TABLE IF NOT EXISTS super_admin_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES users(id) NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'invitation_sent', 'esn_approved', 'esn_rejected', etc.
    target_type VARCHAR(50), -- 'company_invitation', 'company', 'user'
    target_id UUID,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour audit trail
CREATE INDEX IF NOT EXISTS idx_super_admin_activities_admin_id ON super_admin_activities(admin_id);
CREATE INDEX IF NOT EXISTS idx_super_admin_activities_type ON super_admin_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_super_admin_activities_created_at ON super_admin_activities(created_at DESC);

-- 5. Trigger pour updated_at sur company_invitations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_invitations_updated_at 
    BEFORE UPDATE ON company_invitations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS (Row Level Security) pour sécurité
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admin_activities ENABLE ROW LEVEL SECURITY;

-- Politique: Seuls les super_admin peuvent gérer les invitations
CREATE POLICY "Super admins can manage company invitations" 
    ON company_invitations 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );

-- Politique: Les invités peuvent voir leur propre invitation (via token)
CREATE POLICY "Invited users can view their invitation" 
    ON company_invitations 
    FOR SELECT 
    TO authenticated 
    USING (
        email = auth.email() 
        OR invitation_token::text = current_setting('request.jwt.claims', true)::json->>'invitation_token'
    );

-- Politique: Super admins peuvent voir leurs activités
CREATE POLICY "Super admins can view their activities" 
    ON super_admin_activities 
    FOR SELECT 
    TO authenticated 
    USING (
        admin_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );

-- 7. Fonction utilitaire pour créer une invitation ESN
CREATE OR REPLACE FUNCTION create_esn_invitation(
    p_email VARCHAR(255),
    p_company_name VARCHAR(255),
    p_siret VARCHAR(14) DEFAULT NULL,
    p_business_sector VARCHAR(100) DEFAULT NULL,
    p_estimated_freelancers INTEGER DEFAULT 1
)
RETURNS UUID AS $$
DECLARE
    invitation_id UUID;
    current_user_role VARCHAR(20);
BEGIN
    -- Vérifier que l'utilisateur est super_admin
    SELECT role INTO current_user_role 
    FROM users 
    WHERE id = auth.uid();
    
    IF current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Only super admins can create ESN invitations';
    END IF;
    
    -- Créer l'invitation
    INSERT INTO company_invitations (
        email, 
        company_name, 
        siret, 
        business_sector, 
        estimated_freelancers, 
        invited_by
    ) VALUES (
        p_email, 
        p_company_name, 
        p_siret, 
        p_business_sector, 
        p_estimated_freelancers, 
        auth.uid()
    ) RETURNING id INTO invitation_id;
    
    -- Log de l'activité
    INSERT INTO super_admin_activities (
        admin_id, 
        activity_type, 
        target_type, 
        target_id, 
        description,
        metadata
    ) VALUES (
        auth.uid(), 
        'invitation_sent', 
        'company_invitation', 
        invitation_id, 
        'ESN invitation sent to ' || p_email || ' for company ' || p_company_name,
        json_build_object(
            'email', p_email,
            'company_name', p_company_name,
            'siret', p_siret,
            'estimated_freelancers', p_estimated_freelancers
        )
    );
    
    RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Fonction pour accepter une invitation
CREATE OR REPLACE FUNCTION accept_esn_invitation(
    p_invitation_token UUID,
    p_company_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    invitation_record company_invitations%ROWTYPE;
BEGIN
    -- Récupérer l'invitation
    SELECT * INTO invitation_record 
    FROM company_invitations 
    WHERE invitation_token = p_invitation_token 
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation token';
    END IF;
    
    -- Mettre à jour l'invitation
    UPDATE company_invitations 
    SET 
        status = 'accepted',
        company_created_id = p_company_id,
        accepted_at = NOW()
    WHERE invitation_token = p_invitation_token;
    
    -- Log de l'activité
    INSERT INTO super_admin_activities (
        admin_id, 
        activity_type, 
        target_type, 
        target_id, 
        description,
        metadata
    ) VALUES (
        invitation_record.invited_by, 
        'esn_invitation_accepted', 
        'company_invitation', 
        invitation_record.id, 
        'ESN invitation accepted by ' || invitation_record.email,
        json_build_object(
            'email', invitation_record.email,
            'company_name', invitation_record.company_name,
            'company_id', p_company_id
        )
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Commentaires pour documentation
COMMENT ON TABLE company_invitations IS 'Invitations ESN envoyées par les Super Admins pour contrôler l''accès B2B';
COMMENT ON TABLE super_admin_activities IS 'Journal d''audit des actions Super Admin pour traçabilité';
COMMENT ON FUNCTION create_esn_invitation IS 'Fonction sécurisée pour créer une invitation ESN (super_admin uniquement)';
COMMENT ON FUNCTION accept_esn_invitation IS 'Fonction pour accepter une invitation ESN lors de la création de compte';

-- 10. Données de test (optionnel - à supprimer en production)
-- Créer un super admin de test si nécessaire
-- INSERT INTO users (id, email, full_name, role, company_id, created_at) 
-- VALUES (
--     gen_random_uuid(), 
--     'admin@azyflow.com', 
--     'Super Admin Azyflow', 
--     'super_admin', 
--     (SELECT id FROM companies LIMIT 1), 
--     NOW()
-- ) ON CONFLICT (email) DO NOTHING;