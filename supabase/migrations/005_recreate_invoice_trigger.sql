-- Fonction pour créer automatiquement une facture quand un timesheet est approuvé
CREATE OR REPLACE FUNCTION create_invoice_from_timesheet()
RETURNS TRIGGER AS $$
DECLARE
  contract_record contracts%ROWTYPE;
  commission NUMERIC;
BEGIN
  -- Ne rien faire si pas approuvé (utiliser 'approved' au lieu de 'validated')
  IF NEW.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  -- Récupérer le contrat lié
  SELECT * INTO contract_record
  FROM contracts
  WHERE id = NEW.contract_id;

  -- Vérifier que le contrat existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found for timesheet %', NEW.id;
  END IF;

  -- Calculer la commission (avec vérification de NULL)
  commission := COALESCE(contract_record.commission_rate, 0) / 100.0;

  -- Insérer la facture
  INSERT INTO invoices (
    timesheet_id,
    facturation_ttc,
    facturation_ht,
    facturation_net,
    commission_amount,
    tjm_final,
    conversion_rate,
    amount_cfa,
    status,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.worked_days * contract_record.tjm,  -- Utiliser 'tjm' au lieu de 'tjm_client'
    NEW.worked_days * contract_record.tjm,
    (NEW.worked_days * contract_record.tjm) * (1 - commission),
    (NEW.worked_days * contract_record.tjm) * commission,
    contract_record.tjm * (1 - commission),
    655.95,
    (NEW.worked_days * contract_record.tjm) * (1 - commission) * 655.95,
    'pending',
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trg_create_invoice_from_timesheet ON timesheets;

-- Créer le nouveau trigger avec le bon statut
CREATE TRIGGER trg_create_invoice_from_timesheet
AFTER UPDATE OF status ON timesheets
FOR EACH ROW
WHEN (NEW.status = 'approved')  -- Utiliser 'approved' au lieu de 'validated'
EXECUTE FUNCTION create_invoice_from_timesheet();