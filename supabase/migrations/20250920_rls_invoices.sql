-- Politiques RLS pour la table invoices
-- Ces politiques garantissent que :
-- 1. Les freelances ne voient que leurs propres factures
-- 2. Les admins ne voient que les factures des freelances de leur compagnie

-- Activer RLS sur la table invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les politiques existantes
DROP POLICY IF EXISTS "Users can view invoices based on role" ON invoices;
DROP POLICY IF EXISTS "Admins can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can update invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can delete invoices" ON invoices;
DROP POLICY IF EXISTS "admin_select_company_invoices" ON invoices;
DROP POLICY IF EXISTS "admin_update_company_invoices" ON invoices;
DROP POLICY IF EXISTS "freelancer_select_own_invoices" ON invoices;
DROP POLICY IF EXISTS "invoices_select_all_authenticated" ON invoices;
DROP POLICY IF EXISTS "system_insert_invoices" ON invoices;

-- Politique SELECT : Voir les factures selon le rôle
CREATE POLICY "Users can view invoices based on role" ON invoices
FOR SELECT
USING (
  CASE 
    -- Si l'utilisateur est admin, il peut voir les factures des freelances de sa compagnie
    WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'admin' THEN (
      EXISTS (
        SELECT 1 FROM timesheets ts
        JOIN contracts c ON ts.contract_id = c.id
        WHERE ts.id = invoices.timesheet_id
        AND c.company_id = (SELECT company_id FROM users WHERE id = auth.uid())
      )
    )
    -- Si l'utilisateur est freelance, il peut voir seulement ses propres factures
    WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'freelancer' THEN (
      EXISTS (
        SELECT 1 FROM timesheets ts
        JOIN contracts c ON ts.contract_id = c.id
        WHERE ts.id = invoices.timesheet_id
        AND c.user_id = auth.uid()
      )
    )
    ELSE false
  END
);

-- Politique INSERT : Seuls les admins peuvent créer des factures
CREATE POLICY "Admins can insert invoices" ON invoices
FOR INSERT
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  AND EXISTS (
    SELECT 1 FROM timesheets ts
    JOIN contracts c ON ts.contract_id = c.id
    WHERE ts.id = timesheet_id
    AND c.company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  )
);

-- Politique UPDATE : Seuls les admins peuvent modifier les factures de leur compagnie
CREATE POLICY "Admins can update invoices" ON invoices
FOR UPDATE
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  AND EXISTS (
    SELECT 1 FROM timesheets ts
    JOIN contracts c ON ts.contract_id = c.id
    WHERE ts.id = invoices.timesheet_id
    AND c.company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  )
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  AND EXISTS (
    SELECT 1 FROM timesheets ts
    JOIN contracts c ON ts.contract_id = c.id
    WHERE ts.id = timesheet_id
    AND c.company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  )
);

-- Politique DELETE : Seuls les admins peuvent supprimer les factures de leur compagnie
CREATE POLICY "Admins can delete invoices" ON invoices
FOR DELETE
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  AND EXISTS (
    SELECT 1 FROM timesheets ts
    JOIN contracts c ON ts.contract_id = c.id
    WHERE ts.id = invoices.timesheet_id
    AND c.company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  )
);

-- Vérification des politiques
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'invoices'
ORDER BY policyname;