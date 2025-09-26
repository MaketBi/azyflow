# Composants de Recherche - Guide d'utilisation

Ce module fournit des composants et hooks réutilisables pour implémenter des fonctionnalités de recherche dans l'application.

## 📂 Structure

```
components/ui/search/
├── SearchBox.tsx          # Composant visuel de champ de recherche
├── useSearch.ts          # Hook pour la logique de recherche
├── FreelancerSearch.tsx  # Composant spécialisé pour les freelancers
└── index.ts             # Exports principaux
```

## 🔍 SearchBox

Composant visuel pour afficher un champ de recherche avec design uniforme.

### Props

- `value: string` - Valeur actuelle de la recherche
- `onChange: (value: string) => void` - Callback appelé quand la valeur change
- `placeholder?: string` - Texte du placeholder (défaut: "Rechercher...")
- `label?: string` - Libellé affiché au-dessus du champ
- `icon?: string | React.ReactNode` - Icône à afficher (défaut: 🔍)
- `className?: string` - Classes CSS additionnelles
- `withCard?: boolean` - Si true, affiche dans une Card (défaut: true)
- `onClear?: () => void` - Callback appelé lors du clic sur "Effacer"

### Exemple d'utilisation

```tsx
import { SearchBox } from '../ui/search';

function MyComponent() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <SearchBox
      value={searchTerm}
      onChange={setSearchTerm}
      placeholder="Rechercher des clients..."
      label="Rechercher un client"
      icon="👥"
    />
  );
}
```

## 🎣 useSearch

Hook personnalisé pour gérer la logique de filtrage de données.

### Paramètres

- `data: T[]` - Tableau des données à filtrer
- `options?: UseSearchOptions` - Options de configuration

### Options disponibles

- `searchFields?: string[]` - Champs spécifiques à chercher dans les objets
- `customFilter?: (item: any, searchTerm: string) => boolean` - Fonction de filtrage personnalisée
- `caseSensitive?: boolean` - Recherche sensible à la casse (défaut: false)

### Valeur de retour

- `searchTerm: string` - Terme de recherche actuel
- `setSearchTerm: (term: string) => void` - Fonction pour mettre à jour le terme
- `filteredData: T[]` - Données filtrées
- `clearSearch: () => void` - Fonction pour effacer la recherche
- `isSearching: boolean` - Indique si une recherche est active

### Exemple d'utilisation

```tsx
import { useSearch } from '../ui/search';

function MyComponent() {
  const [clients, setClients] = useState([]);
  
  const {
    searchTerm,
    setSearchTerm,
    filteredData,
    clearSearch,
    isSearching
  } = useSearch(clients, {
    searchFields: ['name', 'email', 'phone'],
    caseSensitive: false
  });

  return (
    <div>
      <SearchBox
        value={searchTerm}
        onChange={setSearchTerm}
        onClear={clearSearch}
      />
      
      {/* Afficher filteredData au lieu de clients */}
      {filteredData.map(client => (
        <div key={client.id}>{client.name}</div>
      ))}
    </div>
  );
}
```

## 👨‍💼 FreelancerSearch

Composant spécialisé qui combine SearchBox + useSearch pour une utilisation simple avec les données de freelancers.

### Props

- `data: T[]` - Données à filtrer
- `onFilteredDataChange: (filteredData: T[]) => void` - Callback quand les données changent
- `searchFields?: string[]` - Champs à chercher (défaut: ['freelancer_name'])
- `placeholder?: string` - Placeholder personnalisé
- `label?: string` - Label personnalisé
- `searchOptions?: UseSearchOptions` - Options supplémentaires

### Exemple d'utilisation

```tsx
import { FreelancerSearch } from '../ui/search';

function MyComponent() {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);

  return (
    <div>
      <FreelancerSearch
        data={invoices}
        onFilteredDataChange={setFilteredInvoices}
        searchFields={['freelancer_name', 'user.full_name']}
        placeholder="Rechercher un freelancer..."
      />
      
      {/* Utiliser filteredInvoices */}
      {filteredInvoices.map(invoice => (
        <div key={invoice.id}>{invoice.freelancer_name}</div>
      ))}
    </div>
  );
}
```

## 🚀 Exemples d'implémentation

### 1. Recherche simple dans une liste

```tsx
import { SearchBox, useSearch } from '../ui/search';

function ClientsList() {
  const [clients] = useState([...]);
  
  const { searchTerm, setSearchTerm, filteredData } = useSearch(clients, {
    searchFields: ['name', 'email', 'company']
  });

  return (
    <>
      <SearchBox
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Rechercher des clients..."
      />
      
      {filteredData.map(client => (
        <ClientCard key={client.id} client={client} />
      ))}
    </>
  );
}
```

### 2. Recherche avec filtrage personnalisé

```tsx
const { filteredData } = useSearch(contracts, {
  customFilter: (contract, searchTerm) => {
    return contract.user.full_name.toLowerCase().includes(searchTerm) ||
           contract.client.name.toLowerCase().includes(searchTerm) ||
           contract.tjm.toString().includes(searchTerm);
  }
});
```

### 3. Recherche dans propriétés imbriquées

```tsx
const { filteredData } = useSearch(timesheets, {
  searchFields: ['contract.user.full_name', 'contract.client.name', 'month']
});
```

## 💡 Conseils d'utilisation

### Performance
- Le hook `useSearch` utilise `useMemo` pour optimiser les performances
- Évitez de passer des objets recréés à chaque render dans `searchFields`

### Accessibilité
- Le SearchBox inclut des labels appropriés pour l'accessibilité
- Utilisez toujours la prop `label` pour les lecteurs d'écran

### Styling
- Le SearchBox utilise les classes Tailwind standards
- Personnalisez via la prop `className` si nécessaire
- Le composant s'adapte automatiquement au dark mode si configuré

### États de chargement
- Combinez avec des états de loading pour une meilleure UX
- Affichez des indicateurs quand `isSearching` est true

## 📋 Checklist d'intégration

- [ ] Importer les composants nécessaires
- [ ] Ajouter les états pour le terme de recherche
- [ ] Remplacer l'affichage des données originales par les données filtrées
- [ ] Tester la recherche avec différents termes
- [ ] Vérifier l'accessibilité avec les lecteurs d'écran
- [ ] Optimiser les performances si nécessaire