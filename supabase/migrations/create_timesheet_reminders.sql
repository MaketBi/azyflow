-- Migration pour créer la table de suivi des rappels de CRA
-- À exécuter dans l'éditeur SQL de Supabase

BEGIN;

-- Créer la table de suivi des rappels
CREATE TABLE IF NOT EXISTS timesheet_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR(2) NOT NULL,
  year INTEGER NOT NULL,
  last_reminder_date TIMESTAMPTZ DEFAULT NOW(),
  reminder_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unique pour éviter les doublons
  UNIQUE(user_id, month, year)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_timesheet_reminders_user_month_year 
ON timesheet_reminders(user_id, month, year);

CREATE INDEX IF NOT EXISTS idx_timesheet_reminders_last_reminder 
ON timesheet_reminders(last_reminder_date);

-- RLS (Row Level Security)
ALTER TABLE timesheet_reminders ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins (peuvent voir tous les rappels de leur société)
CREATE POLICY "Admins can view company reminders" ON timesheet_reminders
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users u1, users u2
      WHERE u1.id = auth.uid() 
        AND u2.id = timesheet_reminders.user_id
        AND u1.company_id = u2.company_id
        AND u1.role = 'admin'
    )
  );

-- Politique pour les freelancers (peuvent voir leurs propres rappels)
CREATE POLICY "Freelancers can view own reminders" ON timesheet_reminders
  FOR SELECT 
  USING (user_id = auth.uid());

-- Politique pour l'insertion (service backend uniquement)
CREATE POLICY "Service can insert reminders" ON timesheet_reminders
  FOR INSERT 
  WITH CHECK (true);

-- Politique pour la mise à jour (service backend uniquement)
CREATE POLICY "Service can update reminders" ON timesheet_reminders
  FOR UPDATE 
  USING (true);

COMMIT;