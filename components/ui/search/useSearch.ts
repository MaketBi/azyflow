import { useState, useMemo } from 'react';

export interface UseSearchOptions {
  /** Champs dans lesquels rechercher (si objet) */
  searchFields?: string[];
  /** Fonction de filtrage personnalisée */
  customFilter?: (item: any, searchTerm: string) => boolean;
  /** Si true, recherche insensible à la casse */
  caseSensitive?: boolean;
}

export interface UseSearchResult<T> {
  /** Terme de recherche actuel */
  searchTerm: string;
  /** Fonction pour mettre à jour le terme de recherche */
  setSearchTerm: (term: string) => void;
  /** Données filtrées */
  filteredData: T[];
  /** Fonction pour effacer la recherche */
  clearSearch: () => void;
  /** Indique si une recherche est active */
  isSearching: boolean;
}

/**
 * Hook personnalisé pour gérer la recherche dans un tableau de données
 * @param data - Tableau des données à filtrer
 * @param options - Options de configuration de la recherche
 */
export function useSearch<T>(
  data: T[],
  options: UseSearchOptions = {}
): UseSearchResult<T> {
  const {
    searchFields = [],
    customFilter,
    caseSensitive = false
  } = options;

  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return data;
    }

    const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

    return data.filter((item) => {
      // Si une fonction de filtrage personnalisée est fournie, l'utiliser
      if (customFilter) {
        return customFilter(item, term);
      }

      // Si l'item est une string simple
      if (typeof item === 'string') {
        const value = caseSensitive ? item : item.toLowerCase();
        return value.includes(term);
      }

      // Si l'item est un objet
      if (typeof item === 'object' && item !== null) {
        // Si des champs spécifiques sont définis, chercher seulement dans ces champs
        if (searchFields.length > 0) {
          return searchFields.some(field => {
            const value = getNestedValue(item, field);
            if (value === null || value === undefined) return false;
            const stringValue = caseSensitive ? String(value) : String(value).toLowerCase();
            return stringValue.includes(term);
          });
        }

        // Sinon, chercher dans toutes les propriétés string de l'objet
        return Object.values(item).some(value => {
          if (value === null || value === undefined) return false;
          const stringValue = caseSensitive ? String(value) : String(value).toLowerCase();
          return stringValue.includes(term);
        });
      }

      return false;
    });
  }, [data, searchTerm, searchFields, customFilter, caseSensitive]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
    clearSearch,
    isSearching: searchTerm.trim().length > 0
  };
}

/**
 * Utilitaire pour accéder aux propriétés imbriquées d'un objet
 * @param obj - Objet source
 * @param path - Chemin vers la propriété (ex: 'user.name' ou 'contract.client.name')
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

export default useSearch;