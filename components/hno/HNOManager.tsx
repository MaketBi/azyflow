import React, { useState, useEffect } from 'react';
import { Plus, Minus, Clock, Calculator } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { HNOEntry, HNOTimeSlot, HNORate, HNO_RATES, calculateHNOAmount, calculateTotalHNOAmount } from '../../lib/types/hno';
import { HNOConfigurationService } from '../../lib/services/hno-configuration';

interface HNOManagerProps {
  entries: HNOEntry[];
  onChange: (entries: HNOEntry[]) => void;
  tjm: number;
  readonly?: boolean;
  hideFinancialInfo?: boolean; // Nouveau prop pour masquer les infos financières
}

export const HNOManager: React.FC<HNOManagerProps> = ({ 
  entries, 
  onChange, 
  tjm,
  readonly = false,
  hideFinancialInfo = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRates, setCurrentRates] = useState<Record<HNOTimeSlot, HNORate>>(HNO_RATES);

  useEffect(() => {
    // Charger la configuration personnalisée
    const loadConfiguration = async () => {
      try {
        const config = await HNOConfigurationService.getConfiguration();
        setCurrentRates(config);
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration HNO:', error);
        // Utiliser les valeurs par défaut en cas d'erreur
        setCurrentRates(HNO_RATES);
      }
    };
    
    loadConfiguration();
  }, []);

  const addEntry = () => {
    const newEntry: HNOEntry = {
      id: `hno-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timeSlot: HNOTimeSlot.WEEKDAY_EVENING,
      hours: 1,
      description: '',
    };
    onChange([...entries, newEntry]);
  };

  const removeEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    onChange(newEntries);
  };

  const updateEntry = (index: number, updates: Partial<HNOEntry>) => {
    const newEntries = entries.map((entry, i) => 
      i === index ? { ...entry, ...updates } : entry
    );
    onChange(newEntries);
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalAmount = calculateTotalHNOAmount(entries, tjm, currentRates);
  const hourlyRate = tjm / 7;

  if (readonly && entries.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-600" />
          <h3 className="font-medium text-gray-900">
            Heures Non Ouvrées (HNO)
          </h3>
          {entries.length > 0 && (
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              {totalHours}h{!hideFinancialInfo && <span> • {totalAmount}€</span>}
            </span>
          )}
        </div>
        {!readonly && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-purple-600"
          >
            {isOpen ? 'Fermer' : 'Gérer HNO'}
          </Button>
        )}
      </div>

      {(isOpen || readonly) && (
        <div className="space-y-3">
          <div className="text-xs text-gray-600 bg-white p-3 rounded border">
            <div className="font-medium mb-1">Taux de majoration :</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
              {Object.entries(currentRates).map(([_, rate]) => (
                <div key={rate.timeSlot}>
                  • {rate.label} ({rate.timeRange}) : +{rate.majorationPercent}%
                </div>
              ))}
            </div>
            {!hideFinancialInfo && (
              <div className="mt-2 text-gray-500">
                Taux horaire : {hourlyRate.toFixed(2)}€/h (TJM: {tjm}€)
              </div>
            )}
          </div>

          {entries.length > 0 && (
            <div className="space-y-2">
              {entries.map((entry, index) => {
                const rate = currentRates[entry.timeSlot];
                const amount = calculateHNOAmount(entry, tjm, currentRates);
                
                return (
                  <div key={entry.id || index} className="bg-white p-3 rounded border space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <Input
                          type="date"
                          value={entry.date}
                          onChange={(e) => updateEntry(index, { date: e.target.value })}
                          disabled={readonly}
                          className="text-sm h-10"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Créneau
                        </label>
                        <select
                          value={entry.timeSlot}
                          onChange={(e) => updateEntry(index, { timeSlot: e.target.value as HNOTimeSlot })}
                          disabled={readonly}
                          className="w-full h-10 px-4 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                          {Object.entries(currentRates).map(([key, rate]) => (
                            <option key={key} value={key}>
                              {rate.label} (+{rate.majorationPercent}%)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Heures
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="24"
                          value={entry.hours}
                          onChange={(e) => updateEntry(index, { hours: Math.round(parseInt(e.target.value) || 1) })}
                          disabled={readonly}
                          className="text-sm h-10"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        {!hideFinancialInfo && (
                          <div className="text-sm">
                            <div className="text-xs text-gray-500">Montant</div>
                            <div className="font-medium text-purple-600">
                              {amount}€
                            </div>
                          </div>
                        )}
                        {!readonly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEntry(index)}
                            className="ml-2 text-red-500 hover:text-red-700 flex items-center gap-1"
                          >
                            <Minus className="h-4 w-4" />
                            <span className="text-xs">Supprimer</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {!readonly && (
                      <div>
                        <Input
                          placeholder="Description (optionnel)"
                          value={entry.description || ''}
                          onChange={(e) => updateEntry(index, { description: e.target.value })}
                          className="text-sm h-10"
                        />
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-600">
                      {rate.description} ({rate.timeRange})
                      {!hideFinancialInfo && (
                        <span> - Taux: {(hourlyRate * (1 + rate.majorationPercent / 100)).toFixed(2)}€/h</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!readonly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEntry}
              className="w-full flex items-center justify-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <Plus className="h-4 w-4" />
              Ajouter des heures HNO
            </Button>
          )}

          {entries.length > 0 && (
            <div className="bg-purple-50 p-3 rounded border border-purple-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Total HNO :</span>
                </div>
                <div className="font-medium text-purple-800">
                  {totalHours} heures{!hideFinancialInfo && <span> • {totalAmount}€</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};