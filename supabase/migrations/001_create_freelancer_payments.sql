-- Migration: Création table freelancer_payments pour gestion des avances
-- À exécuter dans Supabase SQL Editor

-- Création de la table des paiements aux freelancers
CREATE TABLE IF NOT EXISTS freelancer_payments (
  -- Identifiants
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Détails du paiement
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  payment_method varchar(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'check', 'cash', 'other')),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  reference varchar(255),
  notes text,
  
  -- Gestion des avances (NOUVELLE FONCTIONNALITÉ)
  is_advance boolean NOT NULL DEFAULT false,
  advance_reason text, -- Obligatoire si is_advance = true
  
  -- Métadonnées
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  
  -- Contraintes
  CONSTRAINT valid_advance_reason CHECK (
    (is_advance = false) OR 
    (is_advance = true AND advance_reason IS NOT NULL AND length(trim(advance_reason)) > 0)
  )
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_freelancer_payments_invoice_id ON freelancer_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_payments_company_id ON freelancer_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_payments_created_at ON freelancer_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_freelancer_payments_is_advance ON freelancer_payments(is_advance) WHERE is_advance = true;

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_freelancer_payments_updated_at 
  BEFORE UPDATE ON freelancer_payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) pour la sécurité
ALTER TABLE freelancer_payments ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs ne peuvent voir que les paiements de leur compagnie
CREATE POLICY "Users can view payments from their company" ON freelancer_payments
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid()
    )
  );

-- Politique : Les admins peuvent créer des paiements pour leur compagnie  
CREATE POLICY "Admins can create payments for their company" ON freelancer_payments
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT u.company_id FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'owner')
    )
  );

-- Politique : Les admins peuvent modifier les paiements de leur compagnie
CREATE POLICY "Admins can update payments from their company" ON freelancer_payments
  FOR UPDATE USING (
    company_id IN (
      SELECT u.company_id FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'owner')
    )
  );

-- Politique : Les admins peuvent supprimer les paiements de leur compagnie
CREATE POLICY "Admins can delete payments from their company" ON freelancer_payments
  FOR DELETE USING (
    company_id IN (
      SELECT u.company_id FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'owner')
    )
  );

-- Commentaires pour documentation
COMMENT ON TABLE freelancer_payments IS 'Table des paiements aux freelancers avec gestion des avances';
COMMENT ON COLUMN freelancer_payments.is_advance IS 'True si le paiement est une avance (client pas encore payé)';
COMMENT ON COLUMN freelancer_payments.advance_reason IS 'Raison obligatoire pour les avances (traçabilité)';
COMMENT ON COLUMN freelancer_payments.amount IS 'Montant versé au freelancer en euros';
COMMENT ON COLUMN freelancer_payments.payment_method IS 'Méthode de paiement utilisée';

-- Données d'exemple (optionnel - pour tests)
-- INSERT INTO freelancer_payments (invoice_id, company_id, amount, payment_method, is_advance, advance_reason, created_by)
-- VALUES (
--   'uuid-de-facture',
--   'uuid-de-compagnie', 
--   1500.00,
--   'bank_transfer',
--   true,
--   'Avance exceptionnelle - urgence financière freelancer',
--   auth.uid()
-- );

-- Vérification de la structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'freelancer_payments'
ORDER BY ordinal_position;