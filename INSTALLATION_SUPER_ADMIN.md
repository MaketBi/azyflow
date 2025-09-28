# 🚀 Guide d'Installation Super Admin - Phase 1

## ⚡ Installation Rapide

### 1. Exécution de la Migration Principale

```bash
# Dans Supabase SQL Editor
# Coller et exécuter le contenu de: supabase/migrations/20250127_create_super_admin_system.sql
```

**✅ Cette migration est maintenant SAFE** - elle ne casse aucune politique RLS existante !

### 2. Régénération des Types

```bash
cd /Users/mamadoudiop/Documents/projet/azyflow/project

# Régénérer les types TypeScript
npx supabase gen types typescript --project-id VOTRE_PROJECT_ID > lib/database.ts
```

### 3. Création du Premier Super Admin

```bash
# Exécuter le script dédié: supabase/create_first_super_admin.sql
# ⚠️ IMPORTANT: Modifiez l'email dans le script avant d'exécuter !
```

**Script inclus** : Utilise `supabase/create_first_super_admin.sql` avec options sécurisées

### 4. Vérification

```bash
# Compiler pour vérifier les types
npm run build

# Lancer l'application
npm run dev
```

### 5. Accès au Dashboard

```
URL: http://localhost:5173/super-admin
```

---

## 🔧 Résolution des Erreurs

### Erreur: Type "user_role" does not exist
✅ **CORRIGÉ** dans la migration mise à jour

### Erreur: Table "company_invitations" not found
```sql
-- Vérifier que toutes les tables ont été créées
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('company_invitations', 'super_admin_activities');
```

### Erreur TypeScript après migration
```bash
# Régénérer les types après la migration
npx supabase gen types typescript --project-id VOTRE_PROJECT_ID > lib/database.ts
```

---

## ✅ Test de Fonctionnement

### 1. Vérifier l'accès Super Admin
- Aller sur `/super-admin`
- Doit afficher le dashboard (si super_admin) ou page d'accès refusé

### 2. Tester l'invitation ESN
- Cliquer "Inviter une ESN"
- Remplir le formulaire
- Vérifier que l'invitation apparaît dans la table

### 3. Vérifier les statistiques
- Le dashboard doit afficher les compteurs
- Stats temps réel des invitations

---

## 🎯 Prochaines Actions

Une fois la Phase 1 fonctionnelle :

1. **Tester le workflow d'invitation complet**
2. **Configurer les templates d'email** (Phase 2)
3. **Implémenter l'onboarding ESN guidé** (Phase 2)
4. **Système de plans et billing** (Phase 3)

---

**Le système Super Admin est prêt à transformer votre modèle B2B !** 🚀