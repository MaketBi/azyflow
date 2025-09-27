import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { HNOTimeSlot, HNORate, HNO_RATES } from '../../lib/types/hno';
import { HNOConfigurationService } from '../../lib/services/hno-configuration';

interface HNOConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const HNOConfigurationModal: React.FC<HNOConfigurationModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [rates, setRates] = useState<Record<HNOTimeSlot, HNORate>>(HNO_RATES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfiguration();
    }
  }, [isOpen]);

  const loadConfiguration = async () => {
    try {
      const config = await HNOConfigurationService.getConfiguration();
      setRates(config);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement de la configuration');
    }
  };

  const handlePercentageChange = (timeSlot: HNOTimeSlot, value: string) => {
    const percentage = parseFloat(value);
    if (isNaN(percentage) || percentage < 0 || percentage > 1000) return;

    setRates(prev => ({
      ...prev,
      [timeSlot]: {
        ...prev[timeSlot],
        majorationPercent: percentage
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await HNOConfigurationService.saveConfiguration(rates);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onSave?.();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir revenir aux valeurs par défaut ?')) {
      try {
        await HNOConfigurationService.resetToDefaults();
        setRates(HNO_RATES);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onSave?.();
      } catch (err) {
        console.error('Erreur lors de la réinitialisation:', err);
        setError('Erreur lors de la réinitialisation');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Configuration des Taux HNO
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Modifiez les pourcentages de majoration pour les heures non ouvrées
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 text-green-400">✓</div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Succès</h3>
                  <div className="mt-2 text-sm text-green-700">
                    Configuration sauvegardée avec succès
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-medium text-blue-900 mb-2">Information</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Ces taux s'appliquent aux heures supplémentaires facturées</p>
              <p>• Le calcul : Taux horaire = TJM ÷ 7 heures</p>
              <p>• Montant majoré = Taux horaire × (1 + pourcentage de majoration)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {Object.entries(rates).map(([timeSlot, rate]) => (
              <div key={timeSlot} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{rate.label}</h4>
                    <p className="text-sm text-gray-600">{rate.description} ({rate.timeRange})</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="1000"
                      step="1"
                      value={rate.majorationPercent}
                      onChange={(e) => handlePercentageChange(timeSlot as HNOTimeSlot, e.target.value)}
                      className="w-20 text-center"
                    />
                    <span className="text-gray-600 font-medium">%</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Exemple avec TJM 700€ : 
                  Taux horaire = 100€/h → 
                  Taux majoré = {Math.round(100 * (1 + rate.majorationPercent / 100))}€/h
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-2 text-gray-600"
          >
            <RotateCcw className="h-4 w-4" />
            Valeurs par défaut
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};