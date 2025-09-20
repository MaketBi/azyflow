-- Migration pour corriger le trigger de calcul des champs de facture
-- Ce trigger utilise aussi les anciens noms de champs

-- Supprimer complètement le trigger et la fonction existants
DROP TRIGGER IF EXISTS trg_calculate_invoice_fields ON invoices CASCADE;
DROP FUNCTION IF EXISTS calculate_invoice_fields() CASCADE;

-- Recréer la fonction avec les bons noms de champs
CREATE OR REPLACE FUNCTION calculate_invoice_fields()
RETURNS TRIGGER AS $$
DECLARE
  contract_record contracts%ROWTYPE;
  ts_record timesheets%ROWTYPE;
  commission NUMERIC;
BEGIN
  -- Récupérer le contrat et le CRA associé
  SELECT * INTO contract_record
  FROM contracts
  WHERE id = (SELECT contract_id FROM timesheets WHERE id = NEW.timesheet_id);

  -- Vérifier que le contrat existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found for timesheet %', NEW.timesheet_id;
  END IF;

  SELECT * INTO ts_record
  FROM timesheets
  WHERE id = NEW.timesheet_id;

  -- Vérifier que le timesheet existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Timesheet not found %', NEW.timesheet_id;
  END IF;

  -- Calculer la commission (avec vérification de NULL)
  commission := COALESCE(contract_record.commission_rate, 0) / 100.0;

  -- Calculs avec les bons noms de champs
  NEW.tjm_final := contract_record.tjm * (1 - commission);  -- tjm au lieu de tjm_client
  NEW.facturation_ttc := ts_record.worked_days * contract_record.tjm;  -- worked_days au lieu de days_worked
  NEW.commission_amount := ts_record.worked_days * contract_record.tjm * commission;
  NEW.facturation_ht := NEW.facturation_ttc; -- simplifié (HT = TTC si pas de TVA)
  NEW.facturation_net := NEW.facturation_ht * (1 - commission);
  NEW.amount_cfa := NEW.facturation_net * COALESCE(NEW.conversion_rate, 655.95);  -- valeur par défaut si NULL

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le nouveau trigger
CREATE TRIGGER trg_calculate_invoice_fields
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION calculate_invoice_fields();