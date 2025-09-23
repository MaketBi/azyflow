import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  NotificationPreferencesService, 
  NotificationPreferences,
  NotificationType,
  NotificationChannel,
  ChannelPreference,
  NOTIFICATION_TYPES
} from '../../lib/services/notification-preferences';

interface NotificationSettingsProps {
  userId: string;
  userRole: 'freelancer' | 'admin';
  onSave?: (preferences: NotificationPreferences) => void;
}

export function NotificationSettings({ userId, userRole, onSave }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les préférences au montage
  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let userPrefs = await NotificationPreferencesService.getUserPreferences(userId);
      
      // Créer des préférences par défaut si elles n'existent pas
      if (!userPrefs) {
        userPrefs = await NotificationPreferencesService.createDefaultPreferences(userId);
      }
      
      setPreferences(userPrefs);
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError('Erreur lors du chargement des préférences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotification = async (
    notificationType: NotificationType,
    channel: NotificationChannel,
    enabled: boolean
  ) => {
    if (!preferences) return;

    try {
      setSaving(true);
      
      // Mettre à jour localement pour feedback immédiat
      const updatedPreferences = {
        ...preferences,
        [notificationType]: {
          ...preferences[notificationType],
          [channel]: enabled
        }
      };
      setPreferences(updatedPreferences);

      // Sauvegarder en base
      await NotificationPreferencesService.updateSpecificPreference(
        userId,
        notificationType,
        channel,
        enabled
      );

      onSave?.(updatedPreferences);
    } catch (err) {
      console.error('Error updating preference:', err);
      setError('Erreur lors de la sauvegarde');
      // Recharger pour annuler les changements locaux
      await loadPreferences();
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser toutes les préférences aux valeurs par défaut ?')) {
      return;
    }

    try {
      setSaving(true);
      const defaultPrefs = await NotificationPreferencesService.resetToDefaults(userId);
      setPreferences(defaultPrefs);
      onSave?.(defaultPrefs);
    } catch (err) {
      console.error('Error resetting preferences:', err);
      setError('Erreur lors de la réinitialisation');
    } finally {
      setSaving(false);
    }
  };

  const getRelevantNotificationTypes = (): NotificationType[] => {
    return NotificationPreferencesService.getNotificationTypesForRole(userRole);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-600 text-center">
          <p>{error}</p>
          <Button
            onClick={loadPreferences}
            className="mt-4"
          >
            Réessayer
          </Button>
        </div>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          Aucune préférence trouvée
        </div>
      </Card>
    );
  }

  const relevantTypes = getRelevantNotificationTypes();

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Préférences de notifications
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Choisissez quand et comment recevoir vos notifications
            </p>
          </div>
          <Button
            onClick={handleResetToDefaults}
            variant="outline"
            size="sm"
            disabled={saving}
          >
            Réinitialiser
          </Button>
        </div>

        {/* Tableau des préférences */}
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type de notification
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  📧 Email
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  📱 WhatsApp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {relevantTypes.map((notificationType) => {
                const config = NOTIFICATION_TYPES[notificationType];
                const channelPrefs = preferences[notificationType] as ChannelPreference;
                
                return (
                  <tr key={notificationType} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {config.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {config.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ToggleSwitch
                        enabled={channelPrefs.email}
                        onChange={(enabled) => handleToggleNotification(notificationType, 'email', enabled)}
                        disabled={saving}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ToggleSwitch
                        enabled={channelPrefs.whatsapp}
                        onChange={(enabled) => handleToggleNotification(notificationType, 'whatsapp', enabled)}
                        disabled={saving}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Légende */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            💡 Comment ça marche
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Email</strong> : Notifications envoyées à votre adresse email</li>
            <li>• <strong>WhatsApp</strong> : Messages envoyés sur votre numéro de téléphone</li>
            <li>• Vous pouvez activer/désactiver chaque canal indépendamment</li>
            <li>• Les changements sont sauvegardés automatiquement</li>
          </ul>
        </div>

        {saving && (
          <div className="flex justify-center items-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">Sauvegarde en cours...</span>
          </div>
        )}
      </div>
    </Card>
  );
}

// Composant Toggle Switch
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

function ToggleSwitch({ enabled, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
        ${enabled ? 'bg-blue-600' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
          transition duration-200 ease-in-out
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}