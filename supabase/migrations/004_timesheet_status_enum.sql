-- Migration pour définir l'enum des statuts des timesheets et corriger la contrainte
-- Cette migration doit être exécutée après avoir appliqué 003_fix_timesheets_rls.sql
-- ET après avoir supprimé manuellement ces éléments via le dashboard :
-- 
-- POLITIQUES À SUPPRIMER :
-- - timesheets_select_all_authenticated
-- - timesheets.insert.freelance_or_admin  
-- - timesheets.select.by_scope
-- - timesheets.update.freelance_draft_or_admin
--
-- TRIGGER À SUPPRIMER :
-- - trg_create_invoice_from_timesheet
-- (sera recréé plus tard)

-- Supprimer les politiques que nous allons recréer
DROP POLICY IF EXISTS "freelancer_insert_own_timesheets" ON timesheets;
DROP POLICY IF EXISTS "freelancer_select_own_timesheets" ON timesheets;
DROP POLICY IF EXISTS "freelancer_update_own_draft_timesheets" ON timesheets;
DROP POLICY IF EXISTS "admin_select_company_timesheets" ON timesheets;
DROP POLICY IF EXISTS "admin_update_company_timesheets" ON timesheets;
DROP POLICY IF EXISTS "freelancer_delete_own_draft_timesheets" ON timesheets;

-- Créer un type enum pour les statuts des timesheets
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'timesheet_status') THEN
    CREATE TYPE timesheet_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
  END IF;
END $$;

-- Supprimer l'ancienne contrainte si elle existe
ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS timesheets_status_check;

-- Supprimer la valeur par défaut existante
ALTER TABLE timesheets ALTER COLUMN status DROP DEFAULT;

-- Modifier la colonne status pour utiliser le nouvel enum
ALTER TABLE timesheets 
  ALTER COLUMN status TYPE timesheet_status USING status::timesheet_status;

-- Ajouter la nouvelle contrainte par défaut avec le type enum
ALTER TABLE timesheets 
  ALTER COLUMN status SET DEFAULT 'draft'::timesheet_status;

-- Recréer TOUTES les politiques RLS pour la table timesheets

-- Politique pour l'insertion des timesheets par les freelances
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

-- Politique pour la lecture des timesheets par les freelances
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

-- Politique pour la mise à jour des timesheets par les freelances
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