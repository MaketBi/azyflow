# Configuration automatique des rappels CRA

## 🎯 Objectif
Automatiser l'envoi de rappels pour les CRA non soumis :
- Démarrage le 20 de chaque mois
- Rappels tous les 2 jours jusqu'à soumission
- Email + WhatsApp selon préférences utilisateur

## 📋 Étapes d'installation

### 1. Créer la table de suivi
Exécuter le script SQL dans Supabase :
```bash
supabase/migrations/create_timesheet_reminders.sql
```

### 2. Déployer la fonction Edge
```bash
supabase functions deploy timesheet-reminders
```

### 3. Configurer le cron job dans Supabase

#### 3.1 Créer la fonction pg_cron
Dans l'éditeur SQL de Supabase :

```sql
-- Activer l'extension pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer une fonction SQL pour appeler notre Edge Function
CREATE OR REPLACE FUNCTION trigger_timesheet_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    response_status integer;
    response_body text;
BEGIN
    -- Appeler la fonction Edge via HTTP
    SELECT status, content::text INTO response_status, response_body
    FROM http((
        'POST',
        current_setting('app.base_url') || '/functions/v1/timesheet-reminders',
        ARRAY[
            http_header('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
            http_header('Content-Type', 'application/json')
        ],
        'application/json',
        '{}'
    )::http_request);
    
    -- Logger le résultat
    INSERT INTO cron_logs (function_name, status, response, created_at)
    VALUES ('timesheet_reminders', response_status, response_body, NOW());
    
    IF response_status != 200 THEN
        RAISE WARNING 'Timesheet reminders failed with status: %, body: %', response_status, response_body;
    END IF;
END;
$$;
```

#### 3.2 Programmer l'exécution quotidienne
```sql
-- Programmer l'exécution tous les jours à 09:00 UTC
SELECT cron.schedule('timesheet-reminders-daily', '0 9 * * *', 'SELECT trigger_timesheet_reminders();');
```

#### 3.3 Créer une table de logs (optionnel)
```sql
CREATE TABLE IF NOT EXISTS cron_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    function_name VARCHAR(255) NOT NULL,
    status INTEGER,
    response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Configuration des variables d'environnement
Dans Supabase Dashboard > Settings > Edge Functions :

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key (pour emails)
WASENDER_API_KEY=your-wasender-api-key (pour WhatsApp)
```

## 🛠 Configuration manuelle alternative

Si pg_cron n'est pas disponible, utiliser un service externe comme :

### Option A: GitHub Actions
```yaml
# .github/workflows/timesheet-reminders.yml
name: Timesheet Reminders
on:
  schedule:
    - cron: '0 9 * * *'  # Tous les jours à 9h UTC
  workflow_dispatch:

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger reminders
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.SUPABASE_URL }}/functions/v1/timesheet-reminders"
```

### Option B: Vercel Cron (si hébergé sur Vercel)
```typescript
// api/cron/timesheet-reminders.ts
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vérifier le token de sécurité
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.functions.invoke('timesheet-reminders');
    
    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

Et dans `vercel.json` :
```json
{
  "crons": [
    {
      "path": "/api/cron/timesheet-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Option C: Service externe (EasyCron, Cron-job.org)
URL à appeler : `https://your-project.supabase.co/functions/v1/timesheet-reminders`
Headers : `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`

## 🔍 Tests et monitoring

### Test manuel via l'interface admin
Le composant `TimesheetReminderAdmin` permet de :
- Tester les rappels manuellement
- Voir les statistiques d'envoi
- Débugger les problèmes

### Monitoring des logs
```sql
-- Voir les dernières exécutions
SELECT * FROM cron_logs 
WHERE function_name = 'timesheet_reminders' 
ORDER BY created_at DESC 
LIMIT 10;

-- Statistiques des rappels
SELECT 
    DATE(created_at) as date,
    COUNT(*) as executions,
    AVG(CASE WHEN status = 200 THEN 1 ELSE 0 END) as success_rate
FROM cron_logs 
WHERE function_name = 'timesheet_reminders'
    AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Tableau de bord des rappels
```sql
-- Vue des rappels par utilisateur
SELECT 
    u.full_name,
    tr.month,
    tr.year,
    tr.reminder_count,
    tr.last_reminder_date,
    CASE 
        WHEN t.status IS NULL THEN '❌ Pas de CRA'
        WHEN t.status = 'draft' THEN '⏳ En cours'
        WHEN t.status = 'submitted' THEN '✅ Soumis'
        WHEN t.status = 'approved' THEN '✅ Validé'
        ELSE t.status
    END as cra_status
FROM timesheet_reminders tr
JOIN users u ON u.id = tr.user_id
LEFT JOIN timesheets t ON t.contract_id IN (
    SELECT id FROM contracts WHERE user_id = u.id
) AND t.month = tr.month AND t.year = tr.year
WHERE tr.created_at >= NOW() - INTERVAL '2 months'
ORDER BY tr.last_reminder_date DESC;
```

## 🚨 Points d'attention

1. **Fuseaux horaires** : Les rappels s'exécutent en UTC, ajuster selon vos besoins
2. **Limites d'API** : Vérifier les quotas Resend/WASender pour gros volumes
3. **Préférences utilisateur** : Respecter les choix de canaux de notification
4. **Gestion d'erreur** : Les erreurs sont loggées mais n'interrompent pas le processus
5. **Performance** : Pour de gros volumes, envisager la pagination

## 🔄 Maintenance

- Surveiller les logs de cron régulièrement  
- Nettoyer les anciens logs (> 3 mois)
- Tester après chaque mise à jour des fonctions Edge
- Vérifier les quotas API mensuellemen