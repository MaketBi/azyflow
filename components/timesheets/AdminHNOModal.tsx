import React, { useState, useEffect } from 'react';
import { X, Clock, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { HNOManager } from '../hno/HNOManager';
import { HNOEntry } from '../../lib/types/hno';
import { TimesheetWithRelations } from '../../lib/services/timesheets';

interface AdminHNOModalProps {
  timesheet: TimesheetWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (timesheetId: string, hnoEntries: HNOEntry[]) => Promise<void>;
}

export const AdminHNOModal: React.FC<AdminHNOModalProps> = ({
  timesheet,
  isOpen,
  onClose,
  onSave
}) => {
  const [hnoEntries, setHnoEntries] = useState<HNOEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (timesheet && isOpen) {
      // TODO: Charger les HNO existantes depuis la base de données
      setHnoEntries([]);
      setError(null);
    }
  }, [timesheet, isOpen]);

  const handleSave = async () => {
    if (!timesheet) return;

    setSaving(true);
    setError(null);

    try {
      await onSave(timesheet.id, hnoEntries);
      onClose();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des HNO:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !timesheet) {
    return null;
  }

  const tjm = timesheet.contract?.tjm || 500;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Gestion des Heures Non Ouvrées (HNO)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {timesheet.contract?.user?.full_name} • {timesheet.month} {timesheet.year} • TJM: {tjm}€
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-medium text-blue-900 mb-2">Information Administrative</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Freelancer :</strong> {timesheet.contract?.user?.full_name}</p>
              <p><strong>Client :</strong> {timesheet.contract?.client?.name}</p>
              <p><strong>Période :</strong> {timesheet.month} {timesheet.year}</p>
              <p><strong>Jours travaillés :</strong> {timesheet.worked_days} jours</p>
              <p><strong>TJM :</strong> {tjm}€</p>
              <p><strong>Statut :</strong> {timesheet.status}</p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <HNOManager
              entries={hnoEntries}
              onChange={setHnoEntries}
              tjm={tjm}
              readonly={false}
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="font-medium text-gray-900 mb-2">Instructions pour l'administrateur</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Les HNO sont des heures supplémentaires facturées avec majoration</p>
              <p>• Seuls les administrateurs peuvent modifier les HNO après soumission du CRA</p>
              <p>• Les montants sont calculés automatiquement selon les taux de majoration</p>
              <p>• Ces informations seront reportées sur la facture</p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Sauvegarder HNO
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};