-- Ajouter la colonne phone à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN users.phone IS 'Numéro de téléphone du freelancer pour les notifications WhatsApp';

-- Optionnel: Créer un index pour des recherches plus rapides si nécessaire
-- CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);