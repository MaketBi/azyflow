import { useState } from 'react';
import { Button } from '../ui/Button';
import { TimesheetReminderService } from '../../lib/services/timesheet-reminders';

interface ReminderStats {
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
}

export default function TimesheetReminderAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ReminderStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleManualReminders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Démarrage manuel des rappels CRA...');
      
      const result = await TimesheetReminderService.processAutomaticReminders();
      setLastResult(result);
      
      console.log('✅ Rappels terminés:', result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Erreur lors des rappels:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        🔔 Gestion des Rappels CRA
      </h2>
      
      <div className="space-y-4">
        <div className="flex justify-center">
          <Button
            onClick={handleManualReminders}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 px-6 py-3"
          >
            <span>🚀</span>
            <span>Déclencher les rappels</span>
          </Button>
        </div>
        
        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Traitement en cours...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">❌ Erreur</h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}
        
        {lastResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-medium mb-3">✅ Résultats du dernier traitement</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{lastResult.processed}</div>
                <div className="text-gray-600">Traités</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{lastResult.sent}</div>
                <div className="text-gray-600">Envoyés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{lastResult.skipped}</div>
                <div className="text-gray-600">Ignorés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{lastResult.errors}</div>
                <div className="text-gray-600">Erreurs</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-medium mb-2">ℹ️ Fonctionnement</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Les rappels commencent le 20 de chaque mois</li>
            <li>• Premier rappel : dès le 20 si CRA non soumis</li>
            <li>• Rappels suivants : tous les 2 jours</li>
            <li>• Canaux : Email + WhatsApp (selon préférences utilisateur)</li>
            <li>• Messages progressivement plus urgents</li>
          </ul>
        </div>
      </div>
    </div>
  );
}