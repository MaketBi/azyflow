# Configuration requise pour les Edge Functions Supabase

## Variables d'environnement nécessaires

### 1. Pour les emails (Resend API)
```
RESEND_API_KEY=re_123...
```

### 2. Pour WhatsApp (WasenderAPI)
```
WASENDER_API_URL=https://www.wasenderapi.com/api/send-message
WASENDER_API_KEY=votre_api_key_wasender
```

## Comment configurer dans Supabase

1. **Via le Dashboard Supabase :**
   - Aller dans Project Settings > Edge Functions
   - Ajouter les variables d'environnement dans la section "Environment Variables"

2. **Via Supabase CLI :**
   ```bash
   supabase secrets set RESEND_API_KEY=your_key
   supabase secrets set WASENDER_API_KEY=your_key
   supabase secrets set WASENDER_API_URL=https://www.wasenderapi.com/api/send-message
   ```

## Test de configuration

Pour tester si vos variables sont correctement configurées, vous pouvez créer un edge function de test :

```typescript
// Test des variables d'environnement
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const WASENDER_API_KEY = Deno.env.get('WASENDER_API_KEY');
const WASENDER_API_URL = Deno.env.get('WASENDER_API_URL');

console.log('Environment check:', {
  hasResendKey: !!RESEND_API_KEY,
  hasWasenderKey: !!WASENDER_API_KEY,
  wasenderUrl: WASENDER_API_URL || 'Not set'
});
```

## Prochaines étapes

1. **Configurer le numéro de l'admin :**
   - Exécuter le script SQL dans scripts/update-admin-phone.sql
   - Remplacer l'email par votre email admin réel

2. **Configurer WasenderAPI :**
   - Récupérer votre API key depuis le dashboard WasenderAPI
   - Ajouter les variables d'environnement dans Supabase

3. **Tester le système :**
   - Créer un nouveau CRA avec un compte freelancer
   - Vérifier les logs dans Supabase Edge Functions
   - Confirmer réception des notifications email + WhatsApp