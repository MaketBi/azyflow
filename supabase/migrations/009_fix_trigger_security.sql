-- Migration pour corriger les privilèges de sécurité des fonctions de triggers
-- Les fonctions doivent s'exécuter avec SECURITY DEFINER pour contourner RLS

-- Recréer la fonction de création de facture avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_invoice_from_timesheet()
RETURNS TRIGGER AS $$
DECLARE
  contract_record contracts%ROWTYPE;
  commission NUMERIC;
BEGIN
  -- Ne rien faire si pas approuvé
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

  -- Insérer la facture avec les bons noms de champs
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
    NEW.worked_days * contract_record.tjm,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- SECURITY DEFINER pour contourner RLS

-- Recréer la fonction de calcul avec SECURITY DEFINER
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
  NEW.tjm_final := contract_record.tjm * (1 - commission);
  NEW.facturation_ttc := ts_record.worked_days * contract_record.tjm;
  NEW.commission_amount := ts_record.worked_days * contract_record.tjm * commission;
  NEW.facturation_ht := NEW.facturation_ttc;
  NEW.facturation_net := NEW.facturation_ht * (1 - commission);
  NEW.amount_cfa := NEW.facturation_net * COALESCE(NEW.conversion_rate, 655.95);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- SECURITY DEFINER pour contourner RLS