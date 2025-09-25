-- Migration pour ajouter les délais de paiement et la gestion de la TVA
-- Auteur: GitHub Copilot
-- Date: 24 septembre 2025

-- Ajouter les colonnes pour les délais de paiement dans la table contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 30;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_terms_type VARCHAR(20) DEFAULT 'end_of_month' CHECK (payment_terms_type IN ('end_of_month', 'net_days'));
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 20.00;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS vat_applicable BOOLEAN DEFAULT true;

-- Commentaires pour les nouvelles colonnes
COMMENT ON COLUMN contracts.payment_terms IS 'Délai de paiement en jours (30, 45, 60)';
COMMENT ON COLUMN contracts.payment_terms_type IS 'Type de délai: end_of_month (30 fin de mois) ou net_days (30 jours nets)';
COMMENT ON COLUMN contracts.vat_rate IS 'Taux de TVA en pourcentage (20% pour la France)';
COMMENT ON COLUMN contracts.vat_applicable IS 'Si la TVA s''applique à ce contrat';

-- Ajouter des colonnes pour la TVA dans la table invoices (si pas déjà présentes)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 20.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_ht DECIMAL(10,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_ttc DECIMAL(10,2);

-- Commentaires pour les colonnes de facture
COMMENT ON COLUMN invoices.vat_rate IS 'Taux de TVA appliqué à cette facture';
COMMENT ON COLUMN invoices.vat_amount IS 'Montant de la TVA';
COMMENT ON COLUMN invoices.amount_ht IS 'Montant hors taxes';
COMMENT ON COLUMN invoices.amount_ttc IS 'Montant toutes taxes comprises';

-- Mise à jour des données existantes
UPDATE contracts SET 
  payment_terms = 30,
  payment_terms_type = 'end_of_month',
  vat_rate = 20.00,
  vat_applicable = true
WHERE payment_terms IS NULL;

-- Mise à jour des factures existantes pour calculer la TVA rétroactivement
UPDATE invoices SET 
  vat_rate = 20.00,
  amount_ht = amount / 1.20,
  vat_amount = amount - (amount / 1.20),
  amount_ttc = amount
WHERE vat_rate IS NULL;