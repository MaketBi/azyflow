# azyflow - firstapp

## Présentation

Azyflow est une application de gestion de freelances et d'entreprises, permettant aux administrateurs d'inviter des freelances, de gérer les contrats, les factures, les feuilles de temps et d'activer les comptes utilisateurs. L'application est construite avec React, TypeScript, Supabase et Vite.

## Structure du projet

```
project/
├── components/
│   ├── dashboard/
│   ├── layout/
│   └── ui/
├── lib/
│   ├── auth.ts
│   ├── database.ts
│   ├── supabase.ts
│   └── utils.ts
│   └── services/
├── pages/
│   ├── LoginPage.tsx
│   ├── admin/
│   ├── freelancer/
│   └── auth/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   └── functions/
│       └── invite-freelancer/
│       └── mark-invoice-paid/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Fonctionnalités principales

- **Invitation de freelances** : Les admins peuvent inviter des freelances, qui reçoivent un email d'inscription. Le compte est inactif jusqu'à la première connexion.
- **Activation automatique** : Lors de la première connexion, le compte freelance est activé.
- **Gestion des contrats, factures, feuilles de temps** : Suivi des missions, génération de factures, gestion des temps travaillés.
- **Sécurité** : Utilisation de Supabase Auth, RLS (Row Level Security) et triggers pour synchroniser les données entre `auth.users` et `public.users`.
- **Interface moderne** : UI en React avec Tailwind CSS.

## Déploiement

### Prérequis
- Node.js >= 18
- Supabase project (base de données PostgreSQL, Auth activé)

### Installation

1. **Cloner le projet**
   ```bash
   git clone https://github.com/azyflow/firstapp.git
   cd firstapp
   ```
2. **Installer les dépendances**
   ```bash
   npm install
   ```
3. **Configurer Supabase**
   - Créer un projet Supabase et récupérer les clés API.
   - Renseigner les variables d'environnement dans `.env.local` :
     ```env
     VITE_SUPABASE_URL=...
     VITE_SUPABASE_ANON_KEY=...
     VITE_SUPABASE_SERVICE_ROLE_KEY=...
     ```
4. **Lancer l'application**
   ```bash
   npm run dev
   ```

### Déploiement en production


#### Déploiement sur Netlify

1. **Créer un compte Netlify**
   - Inscris-toi sur https://netlify.com et connecte ton repo GitHub.

2. **Ajouter un nouveau site**
   - Clique sur "Add new site" > "Import an existing project".
   - Sélectionne ton repo `firstapp`.

3. **Configurer le build**
   - Commande de build : `npm run build`
   - Dossier de publication : `dist`

4. **Variables d'environnement**
   - Ajoute les variables dans "Site settings > Environment variables" :
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_SUPABASE_SERVICE_ROLE_KEY`

5. **Déployer**
   - Clique sur "Deploy site".
   - Netlify va builder et déployer automatiquement à chaque push sur GitHub.

6. **Fonctions Edge Supabase**
   - Déploie tes fonctions Supabase séparément via la CLI :
     ```bash
     supabase functions deploy invite-freelancer
     supabase functions deploy mark-invoice-paid
     ```

7. **Accéder à l'app**
   - Une fois le build terminé, ton app sera accessible via l'URL Netlify fournie.

**Remarque** : Pour la production, configure aussi les variables d'environnement dans Netlify et dans Supabase.

## Notes Supabase
- Les triggers et RLS sont configurés pour synchroniser les utilisateurs et sécuriser les accès.
- Les Edge Functions gèrent l'invitation et l'activation des freelances.

## Contact
Pour toute question ou contribution, contactez l'équipe azyflow.
