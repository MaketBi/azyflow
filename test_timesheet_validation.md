# Test de validation CRA - Anti-doublons

## Fonctionnalité implémentée

✅ **Validation ajoutée dans TimesheetService** :
- Nouvelle méthode `checkExistingTimesheet()` qui vérifie l'existence d'un CRA pour un mois donné
- Validation intégrée dans `createDraft()` et `createSubmitted()`
- Message d'erreur explicite : "Un CRA existe déjà pour {mois}/{année}. Vous ne pouvez créer qu'un seul CRA par mois."

✅ **Gestion d'erreur améliorée dans TimesheetsPage** :
- Détection spécifique des erreurs de doublons
- Affichage du message exact sans préfixe technique
- Même validation pour création en brouillon et soumission directe

## Scénarios de test

### Test 1 : Création CRA normal
1. Freelancer se connecte
2. Clique sur "Nouveau CRA"
3. Sélectionne client, mois (ex: 2025-01), jours travaillés
4. Clique "Sauvegarder brouillon" ou "Soumettre pour validation"
5. ✅ **Résultat attendu** : CRA créé avec succès

### Test 2 : Tentative de doublon
1. Freelancer se connecte
2. Clique sur "Nouveau CRA"
3. Sélectionne même client, même mois (ex: 2025-01), jours travaillés
4. Clique "Sauvegarder brouillon" ou "Soumettre pour validation"
5. ✅ **Résultat attendu** : Message d'erreur "Un CRA existe déjà pour 2025-01/2025. Vous ne pouvez créer qu'un seul CRA par mois."

### Test 3 : CRA pour mois différent
1. Freelancer se connecte
2. Clique sur "Nouveau CRA"
3. Sélectionne même client, mois différent (ex: 2025-02), jours travaillés
4. Clique "Sauvegarder brouillon" ou "Soumettre pour validation"
5. ✅ **Résultat attendu** : CRA créé avec succès (mois différent = autorisé)

## Code modifié

### `/lib/services/timesheets.ts`
- Ajout méthode `checkExistingTimesheet()`
- Validation dans `createDraft()` ligne ~195
- Validation dans `createSubmitted()` ligne ~250

### `/pages/freelancer/TimesheetsPage.tsx`
- Amélioration gestion erreur dans `handleSubmitDraft()` ligne ~85
- Amélioration gestion erreur dans `handleSubmitForApproval()` ligne ~140

## UX améliorée
- ❌ **Avant** : Erreur technique ou création silencieuse de doublons
- ✅ **Après** : Message clair "Un CRA existe déjà pour {mois}/{année}. Vous ne pouvez créer qu'un seul CRA par mois."