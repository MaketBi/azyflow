import React from 'react';
import { Card } from '../Card';

export interface SearchBoxProps {
  /** Valeur actuelle de la recherche */
  value: string;
  /** Callback appelé quand la valeur change */
  onChange: (value: string) => void;
  /** Texte du placeholder */
  placeholder?: string;
  /** Libellé affiché au-dessus du champ */
  label?: string;
  /** Icône à afficher (emoji ou composant) */
  icon?: string | React.ReactNode;
  /** Classe CSS additionnelle pour le conteneur */
  className?: string;
  /** Si true, affiche le composant dans une Card */
  withCard?: boolean;
  /** Callback appelé quand on clique sur effacer */
  onClear?: () => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  onChange,
  placeholder = "Rechercher...",
  label,
  icon = "🔍",
  className = "",
  withCard = true,
  onClear
}) => {
  const handleClear = () => {
    onChange('');
    if (onClear) {
      onClear();
    }
  };

  const searchContent = (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {typeof icon === 'string' ? icon : icon} {label}
          </label>
        )}
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>
      {value && (
        <button
          onClick={handleClear}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Effacer la recherche"
        >
          ✕ Effacer
        </button>
      )}
    </div>
  );

  if (withCard) {
    return (
      <Card className="p-4">
        {searchContent}
      </Card>
    );
  }

  return searchContent;
};

export default SearchBox;