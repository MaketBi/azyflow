-- Migration: Ajout de la gestion des périodes d'essai et expirations
-- Date: 27/09/2025
-- Description: Ajoute les champs d'expiration pour les comptes démo et invités

-- 1. Ajouter les champs d'expiration à la table companies
ALTER TABLE companies 
ADD COLUMN trial_expires_at timestamptz,
ADD COLUMN trial_duration_days integer DEFAULT 30,
ADD COLUMN is_trial boolean DEFAULT true,
ADD COLUMN trial_started_at timestamptz;

-- 2. Ajouter un index pour les requêtes d'expiration
CREATE INDEX IF NOT EXISTS idx_companies_trial_expires_at 
ON companies(trial_expires_at) 
WHERE trial_expires_at IS NOT NULL;

-- 3. Ajouter une fonction pour calculer l'expiration automatiquement
CREATE OR REPLACE FUNCTION calculate_trial_expiration()
RETURNS trigger AS $$
BEGIN
  -- Si c'est une nouvelle company avec invitation acceptée
  IF NEW.status = 'active' AND OLD.status = 'pending' AND NEW.is_trial = true THEN
    NEW.trial_started_at = NOW();
    NEW.trial_expires_at = NOW() + INTERVAL '1 day' * COALESCE(NEW.trial_duration_days, 30);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer le trigger pour l'activation automatique
DROP TRIGGER IF EXISTS trigger_calculate_trial_expiration ON companies;
CREATE TRIGGER trigger_calculate_trial_expiration
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trial_expiration();

-- 5. Mettre à jour les company_invitations pour définir une expiration par défaut
UPDATE company_invitations 
SET expires_at = created_at + INTERVAL '7 days'
WHERE expires_at IS NULL AND status = 'pending';

-- 6. Fonction pour vérifier l'expiration des comptes
CREATE OR REPLACE FUNCTION check_expired_trials()
RETURNS void AS $$
BEGIN
  -- Marquer les comptes expirés
  UPDATE companies 
  SET status = 'expired'
  WHERE is_trial = true 
    AND trial_expires_at < NOW() 
    AND status = 'active';
    
  -- Log des comptes expirés
  INSERT INTO audit_log (table_name, operation, record_id, details)
  SELECT 
    'companies',
    'trial_expired',
    id,
    jsonb_build_object('expired_at', NOW(), 'trial_duration', trial_duration_days)
  FROM companies
  WHERE is_trial = true 
    AND trial_expires_at < NOW() 
    AND status = 'expired';
    
END;
$$ LANGUAGE plpgsql;

-- 7. Commentaires pour la documentation
COMMENT ON COLUMN companies.trial_expires_at IS 'Date d''expiration de la période d''essai';
COMMENT ON COLUMN companies.trial_duration_days IS 'Durée de l''essai en jours (défaut: 30)';
COMMENT ON COLUMN companies.is_trial IS 'Indique si le compte est en période d''essai';
COMMENT ON COLUMN companies.trial_started_at IS 'Date de début de la période d''essai';