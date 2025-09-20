-- Migration pour corriger l'insertion des factures avec tous les champs obligatoires

-- Mettre à jour la fonction de création de facture pour inclure tous les champs requis
CREATE OR REPLACE FUNCTION create_invoice_from_timesheet()
RETURNS TRIGGER AS $$
DECLARE
  contract_record contracts%ROWTYPE;
  commission NUMERIC;
  invoice_number TEXT;
  total_amount NUMERIC;
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
  
  -- Calculer le montant total
  total_amount := NEW.worked_days * contract_record.tjm;
  
  -- Générer un numéro de facture unique
  invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::text, 1, 8);

  -- Insérer la facture avec TOUS les champs obligatoires
  INSERT INTO invoices (
    timesheet_id,
    company_id,          -- OBLIGATOIRE
    client_id,           -- OBLIGATOIRE  
    amount,              -- OBLIGATOIRE
    number,              -- OBLIGATOIRE
    facturation_ttc,
    facturation_ht,
    facturation_net,
    commission_amount,
    tjm_final,
    conversion_rate,
    amount_cfa,
    status,
    issue_date,
    created_at
  )
  VALUES (
    NEW.id,
    contract_record.company_id,                          -- company_id du contrat
    contract_record.client_id,                           -- client_id du contrat
    total_amount,                                        -- amount = montant total
    invoice_number,                                      -- number = numéro généré
    total_amount,                                        -- facturation_ttc
    total_amount,                                        -- facturation_ht
    total_amount * (1 - commission),                     -- facturation_net
    total_amount * commission,                           -- commission_amount
    contract_record.tjm * (1 - commission),             -- tjm_final
    655.95,                                              -- conversion_rate
    (total_amount * (1 - commission)) * 655.95,         -- amount_cfa
    'pending',                                           -- status
    CURRENT_DATE,                                        -- issue_date
    now()                                                -- created_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;