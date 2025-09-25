-- Ajout de données de test pour les analytics

-- Mise à jour des contrats avec des conditions de paiement et TVA
UPDATE contracts SET 
  payment_terms = '{"days": 30, "type": "end_of_month"}',
  payment_terms_type = 'end_of_month',
  vat_applicable = true,
  vat_rate = 0.20
WHERE id IN (
  SELECT id FROM contracts LIMIT 5
);

-- Ajout de quelques factures avec des montants réalistes
INSERT INTO invoices (
  contract_id,
  number,
  amount,
  amount_excluding_tax,
  vat_amount,
  status,
  generated_date,
  due_date,
  month_year
) 
SELECT 
  c.id,
  'INV-2024-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'),
  (RANDOM() * 5000 + 1000)::numeric(10,2),
  ((RANDOM() * 5000 + 1000) / 1.20)::numeric(10,2),
  ((RANDOM() * 5000 + 1000) * 0.20 / 1.20)::numeric(10,2),
  CASE WHEN RANDOM() > 0.3 THEN 'paid' ELSE 'pending' END,
  CURRENT_DATE - (RANDOM() * 90)::int,
  CURRENT_DATE + (RANDOM() * 60)::int,
  TO_CHAR(CURRENT_DATE - (RANDOM() * 90)::int, 'YYYY-MM')
FROM contracts c
WHERE c.status = 'active'
LIMIT 10;

-- Ajout de données de timesheets avec différents statuts
INSERT INTO timesheets (
  contract_id,
  month,
  days_worked,
  status,
  submitted_at,
  created_at,
  updated_at
)
SELECT 
  c.id,
  TO_CHAR(CURRENT_DATE - (RANDOM() * 180)::int, 'YYYY-MM'),
  (RANDOM() * 22 + 8)::numeric(5,2),
  CASE 
    WHEN RANDOM() > 0.7 THEN 'submitted'
    WHEN RANDOM() > 0.4 THEN 'approved' 
    ELSE 'rejected'
  END,
  CURRENT_DATE - (RANDOM() * 30)::int,
  CURRENT_DATE - (RANDOM() * 30)::int,
  CURRENT_DATE - (RANDOM() * 15)::int
FROM contracts c
WHERE c.status = 'active'
ORDER BY RANDOM()
LIMIT 20;

-- Mise à jour des profils utilisateurs avec des noms complets
UPDATE users SET 
  full_name = CASE 
    WHEN role = 'freelance' THEN 
      (ARRAY['Jean Dupont', 'Marie Martin', 'Pierre Durand', 'Sophie Bernard', 'Luc Moreau', 'Emma Petit', 'Thomas Robert'])[floor(random() * 7 + 1)]
    ELSE full_name
  END
WHERE role = 'freelance' AND (full_name IS NULL OR full_name = '');

-- Ajout de quelques entreprises
INSERT INTO users (email, role, full_name, created_at)
VALUES 
  ('tech-corp@example.com', 'company', 'Tech Corp', NOW()),
  ('digital-solutions@example.com', 'company', 'Digital Solutions', NOW()),
  ('startup-inc@example.com', 'company', 'Startup Inc', NOW())
ON CONFLICT (email) DO NOTHING;