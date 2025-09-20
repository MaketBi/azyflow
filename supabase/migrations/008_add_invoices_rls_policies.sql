-- Migration pour ajouter les politiques RLS manquantes sur la table invoices
-- Les triggers ont besoin de pouvoir insérer des factures

-- Activer RLS sur la table invoices si ce n'est pas déjà fait
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux triggers de créer des factures
-- Les triggers s'exécutent avec les permissions du propriétaire de la fonction
CREATE POLICY "system_insert_invoices" ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Permettre l'insertion pour tous les utilisateurs authentifiés via les triggers

-- Politique pour que les admins puissent voir toutes les factures de leur société
CREATE POLICY "admin_select_company_invoices" ON invoices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN timesheets ts ON ts.id = invoices.timesheet_id
      JOIN contracts ct ON ct.id = ts.contract_id
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND ct.company_id = u.company_id
    )
  );

-- Politique pour que les freelances puissent voir leurs propres factures
CREATE POLICY "freelancer_select_own_invoices" ON invoices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM timesheets ts
      JOIN contracts ct ON ct.id = ts.contract_id
      WHERE ts.id = invoices.timesheet_id
        AND ct.user_id = auth.uid()
    )
  );

-- Politique pour que les admins puissent mettre à jour les factures de leur société
CREATE POLICY "admin_update_company_invoices" ON invoices
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN timesheets ts ON ts.id = invoices.timesheet_id
      JOIN contracts ct ON ct.id = ts.contract_id
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND ct.company_id = u.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN timesheets ts ON ts.id = invoices.timesheet_id
      JOIN contracts ct ON ct.id = ts.contract_id
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND ct.company_id = u.company_id
    )
  );