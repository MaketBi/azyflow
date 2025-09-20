-- Politiques RLS pour la table contracts

-- Activer RLS sur la table contracts
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins : peuvent gérer tous les contrats de leur société
CREATE POLICY "admin_manage_company_contracts" ON contracts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.company_id = contracts.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.company_id = contracts.company_id
    )
  );

-- Politique pour les freelances : peuvent voir uniquement leurs propres contrats
CREATE POLICY "freelancer_view_own_contracts" ON contracts
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Politique pour vérifier qu'un contrat actif existe lors de la création d'un CRA
-- (Cette politique sera utilisée par d'autres services qui vérifient les contrats)
CREATE POLICY "check_active_contract_for_timesheets" ON contracts
  FOR SELECT
  TO authenticated
  USING (
    -- Permettre la lecture des contrats actifs pour validation
    status = 'active' 
    AND start_date <= CURRENT_DATE 
    AND end_date >= CURRENT_DATE
    AND (
      -- Par l'admin de la société
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
          AND u.role = 'admin'
          AND u.company_id = contracts.company_id
      )
      OR
      -- Par le freelance propriétaire du contrat
      user_id = auth.uid()
    )
  );