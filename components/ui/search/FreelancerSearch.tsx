import React from 'react';
import { SearchBox } from './SearchBox';
import { useSearch, UseSearchOptions } from './useSearch';

interface FreelancerSearchProps<T> {
  /** Données à filtrer */
  data: T[];
  /** Fonction appelée quand les données filtrées changent */
  onFilteredDataChange: (filteredData: T[]) => void;
  /** Champs dans lesquels chercher (ex: ['freelancer_name', 'user.full_name']) */
  searchFields?: string[];
  /** Placeholder personnalisé */
  placeholder?: string;
  /** Label personnalisé */
  label?: string;
  /** Options supplémentaires pour useSearch */
  searchOptions?: Omit<UseSearchOptions, 'searchFields'>;
}

/**
 * Composant de recherche spécialisé pour les freelancers
 * Combine SearchBox + useSearch pour une utilisation simple
 */
export function FreelancerSearch<T>({
  data,
  onFilteredDataChange,
  searchFields = ['freelancer_name'],
  placeholder = "Tapez le nom du freelancer...",
  label = "Rechercher un freelancer",
  searchOptions = {}
}: FreelancerSearchProps<T>) {
  const {
    searchTerm,
    setSearchTerm,
    filteredData,
    clearSearch,
    isSearching
  } = useSearch(data, {
    ...searchOptions,
    searchFields
  });

  // Mettre à jour les données filtrées quand elles changent
  React.useEffect(() => {
    onFilteredDataChange(filteredData);
  }, [filteredData, onFilteredDataChange]);

  return (
    <SearchBox
      value={searchTerm}
      onChange={setSearchTerm}
      placeholder={placeholder}
      label={label}
      icon="🔍"
      onClear={clearSearch}
    />
  );
}

export default FreelancerSearch;