# Configuration des notifications AzyFlow

## 📧 Configuration Email (Resend)

Pour activer les notifications email, ajoutez cette variable d'environnement dans Supabase :

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Obtenir une clé API Resend :
1. Créez un compte sur [resend.com](https://resend.com)
2. Allez dans "API Keys" 
3. Créez une nouvelle clé API
4. Ajoutez-la dans Supabase Edge Functions secrets

## 📱 Configuration WhatsApp (Meta Business API)

Pour activer les notifications WhatsApp, ajoutez ces variables d'environnement :

```bash
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=1234567890123456
```

### Obtenir les credentials WhatsApp :
1. Créez un compte Meta for Developers
2. Configurez WhatsApp Business API
3. Obtenez votre Phone Number ID
4. Générez un access token permanent
5. Ajoutez les variables dans Supabase Edge Functions

## 🔧 Déploiement de la fonction Edge

Pour déployer la fonction `send-notification` :

```bash
# 1. Installer Supabase CLI
npm install -g supabase

# 2. Se connecter à votre projet
supabase login
supabase link --project-ref YOUR_PROJECT_ID

# 3. Déployer la fonction
supabase functions deploy send-notification

# 4. Définir les variables d'environnement
supabase secrets set RESEND_API_KEY=your_resend_key
supabase secrets set WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=your_phone_id
```

## 🎯 Types de notifications implémentées

### 📨 Notification de soumission CRA
**Déclencheur** : Freelancer soumet un CRA  
**Destinataire** : Admin de la compagnie  
**Canal** : Email + WhatsApp (si configuré)  
**Template** : Bleu avec détails du CRA et bouton d'action

### ✅ Notification de validation CRA
**Déclencheur** : Admin approuve un CRA  
**Destinataire** : Freelancer concerné  
**Canal** : Email + WhatsApp (si configuré)  
**Template** : Vert avec confirmation et liens vers factures

### ❌ Notification de rejet CRA
**Déclencheur** : Admin rejette un CRA  
**Destinataire** : Freelancer concerné  
**Canal** : Email + WhatsApp (si configuré)  
**Template** : Rouge avec motif de rejet et bouton correction

## 📋 Workflow complet

```
1. Freelancer soumet CRA
   ↓
2. 📧 Email automatique → Admin
   📱 WhatsApp → Admin (si configuré)
   ↓
3. Admin valide/rejette
   ↓
4. 📧 Email automatique → Freelancer
   📱 WhatsApp → Freelancer (si configuré)
```

## 🎨 Templates Email

Les templates incluent :
- ✅ Design responsive (mobile + desktop)
- ✅ Branding Azyflow cohérent
- ✅ Boutons d'action directs
- ✅ Informations contextuelles complètes
- ✅ Messages de statut colorés

## ⚡ Gestion d'erreurs

- **Échec notification** : N'affecte pas l'opération CRA principale
- **Service indisponible** : Logs d'erreur pour debugging
- **Configuration manquante** : Fallback gracieux (skip WhatsApp)
- **Rate limiting** : Retry automatique (future implémentation)

## 🔮 Améliorations futures

1. **Notifications in-app** : Toast/popup dans l'interface
2. **Digest email** : Résumé quotidien/hebdomadaire
3. **Personnalisation** : Préférences utilisateur notifications
4. **Templates avancés** : Personnalisation par compagnie
5. **Analytics** : Taux d'ouverture, clics, engagement
6. **Multi-langue** : Support français/anglais/autre
7. **Slack/Teams** : Intégrations workflow d'équipe

## 🚀 Activation

Pour activer immédiatement :

1. **Minimum viable** : Configurez seulement `RESEND_API_KEY`
2. **Full featured** : Ajoutez aussi les credentials WhatsApp
3. **Test** : Soumettez un CRA de test pour vérifier le workflow

Les notifications sont automatiquement intégrées dans :
- `TimesheetService.createSubmitted()` → Notification admin
- `TimesheetService.approve()` → Notification freelancer  
- `TimesheetService.reject()` → Notification freelancer