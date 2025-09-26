#!/bin/bash
# 🚀 Script d'exécution de la migration freelancer_payments

echo "🚀 Migration Freelancer Payments - Système d'Avances"
echo "=================================================="

# Vérification que nous sommes dans le bon répertoire
if [ ! -f "supabase/migrations/001_create_freelancer_payments.sql" ]; then
    echo "❌ Erreur: Fichier de migration non trouvé"
    echo "   Assurez-vous d'être dans le répertoire du projet"
    exit 1
fi

echo "✅ Fichier de migration trouvé"

# Afficher les étapes à suivre
echo ""
echo "📋 ÉTAPES À SUIVRE:"
echo ""
echo "1. 🔗 Ouvrir Supabase Dashboard"
echo "   → https://supabase.com/dashboard"
echo ""
echo "2. 📂 Aller dans SQL Editor"
echo "   → Projet AzyFlow → SQL Editor → New query"
echo ""
echo "3. 📋 Copier le contenu de la migration:"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 CONTENU DE LA MIGRATION À COLLER:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat supabase/migrations/001_create_freelancer_payments.sql
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "4. ▶️ Exécuter la requête dans Supabase"
echo ""
echo "5. ✅ Vérifier le succès:"
echo "   → Table 'freelancer_payments' créée"
echo "   → Index et contraintes ajoutés"
echo "   → Politiques RLS activées"
echo ""
echo "6. 🔄 Regénérer les types TypeScript:"
echo "   npx supabase gen types typescript --project-id [votre-project-id] > lib/database.types.ts"
echo ""
echo "🎯 RÉSULTAT ATTENDU:"
echo "   ✅ Table freelancer_payments créée avec gestion des avances"
echo "   ✅ Sécurité RLS par compagnie"
echo "   ✅ Contraintes métier (avance → raison obligatoire)"
echo "   ✅ Performance optimisée avec index"
echo ""
echo "📞 En cas de problème:"
echo "   → Vérifier que les tables 'invoices', 'companies', 'users' existent"
echo "   → Vérifier les permissions admin sur Supabase"
echo "   → Consulter les logs d'erreur dans Supabase"

echo ""
echo "🚀 Migration prête à être exécutée !"