-- Migration pour corriger les politiques RLS des timesheets
-- Ajout des politiques manquantes pour UPDATE et amélioration des politiques existantes

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "freelancer_create_timesheets_for_linked_clients" ON timesheets;
DROP POLICY IF EXISTS "freelancer_view_own_timesheets" ON timesheets;
DROP POLICY IF EXISTS "admin_manage_company_timesheets" ON timesheets;

-- Nouvelle politique pour l'insertion des timesheets par les freelances
CREATE POLICY "freelancer_insert_own_timesheets" ON timesheets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Vérifier que le freelance peut créer un timesheet pour ce contrat
    EXISTS (
      SELECT 1 FROM contracts ct
      WHERE ct.id = timesheets.contract_id
        AND ct.user_id = auth.uid()
        AND ct.status = 'active'
        AND ct.start_date <= CURRENT_DATE
        AND ct.end_date >= CURRENT_DATE
    )
  );

-- Nouvelle politique pour la lecture des timesheets par les freelances
CREATE POLICY "freelancer_select_own_timesheets" ON timesheets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts ct
      WHERE ct.id = timesheets.contract_id
        AND ct.user_id = auth.uid()
    )
  );

-- Nouvelle politique pour la mise à jour des timesheets par les freelances
CREATE POLICY "freelancer_update_own_draft_timesheets" ON timesheets
  FOR UPDATE
  TO authenticated
  USING (
    -- Le freelance peut mettre à jour ses propres timesheets en brouillon
    EXISTS (
      SELECT 1 FROM contracts ct
      WHERE ct.id = timesheets.contract_id
        AND ct.user_id = auth.uid()
    )
    AND status = 'draft'
  )
  WITH CHECK (
    -- Vérifier que le contrat appartient toujours au freelance
    EXISTS (
      SELECT 1 FROM contracts ct
      WHERE ct.id = timesheets.contract_id
        AND ct.user_id = auth.uid()
    )
  );

-- Politique pour les admins : lecture de tous les timesheets de leur société
CREATE POLICY "admin_select_company_timesheets" ON timesheets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN contracts ct ON ct.user_id = u.id
      WHERE u.company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND ct.id = timesheets.contract_id
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    )
  );

-- Politique pour les admins : mise à jour des timesheets de leur société (approbation/rejet)
CREATE POLICY "admin_update_company_timesheets" ON timesheets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN contracts ct ON ct.user_id = u.id
      WHERE u.company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND ct.id = timesheets.contract_id
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN contracts ct ON ct.user_id = u.id
      WHERE u.company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        AND ct.id = timesheets.contract_id
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    )
  );

-- Politique pour la suppression des timesheets (seulement les brouillons par leur auteur)
CREATE POLICY "freelancer_delete_own_draft_timesheets" ON timesheets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts ct
      WHERE ct.id = timesheets.contract_id
        AND ct.user_id = auth.uid()
    )
    AND status = 'draft'
  );