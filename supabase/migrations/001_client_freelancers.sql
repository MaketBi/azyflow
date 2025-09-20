-- Table pivot client_freelancers (relation n:n)
CREATE TABLE client_freelancers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES users(id),
  
  -- Contrainte d'unicité pour éviter les doublons
  UNIQUE(client_id, freelancer_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_client_freelancers_client_id ON client_freelancers(client_id);
CREATE INDEX idx_client_freelancers_freelancer_id ON client_freelancers(freelancer_id);

-- RLS (Row Level Security)
ALTER TABLE client_freelancers ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins : peuvent gérer toutes les relations de leur société
CREATE POLICY "admin_manage_client_freelancers" ON client_freelancers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN clients c ON c.company_id = u.company_id
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND c.id = client_freelancers.client_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN clients c ON c.company_id = u.company_id
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND c.id = client_freelancers.client_id
    )
  );

-- Politique pour les freelances : peuvent voir leurs propres relations
CREATE POLICY "freelancer_view_own_relations" ON client_freelancers
  FOR SELECT
  TO authenticated
  USING (
    freelancer_id = auth.uid()
  );

-- Mise à jour de la politique des timesheets pour vérifier la relation client-freelance
DROP POLICY IF EXISTS "users_can_create_own_timesheets" ON timesheets;

CREATE POLICY "freelancer_create_timesheets_for_linked_clients" ON timesheets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Vérifier que le freelance est lié au client via le contrat
    EXISTS (
      SELECT 1 FROM contracts ct
      JOIN client_freelancers cf ON cf.client_id = ct.client_id
      WHERE ct.id = timesheets.contract_id
        AND ct.user_id = auth.uid()
        AND cf.freelancer_id = auth.uid()
    )
  );

-- Politique pour que les freelances puissent voir leurs propres timesheets
CREATE POLICY "freelancer_view_own_timesheets" ON timesheets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts ct
      WHERE ct.id = timesheets.contract_id
        AND ct.user_id = auth.uid()
    )
  );

-- Politique pour que les admins puissent gérer tous les timesheets de leur société
CREATE POLICY "admin_manage_company_timesheets" ON timesheets
  FOR ALL
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

-- Fonction helper pour récupérer les freelances disponibles pour un client
CREATE OR REPLACE FUNCTION get_available_freelancers_for_client(client_uuid UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  is_linked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.email,
    CASE WHEN cf.freelancer_id IS NOT NULL THEN TRUE ELSE FALSE END as is_linked
  FROM users u
  LEFT JOIN client_freelancers cf ON cf.freelancer_id = u.id AND cf.client_id = client_uuid
  WHERE u.role = 'freelancer'
    AND u.company_id = (
      SELECT c.company_id 
      FROM clients c 
      WHERE c.id = client_uuid
    )
  ORDER BY u.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper pour récupérer les clients liés à un freelance
CREATE OR REPLACE FUNCTION get_linked_clients_for_freelancer(freelancer_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name
  FROM clients c
  JOIN client_freelancers cf ON cf.client_id = c.id
  WHERE cf.freelancer_id = freelancer_uuid
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;