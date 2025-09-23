import { supabase } from '../supabase';

export type NotificationChannel = 'email' | 'whatsapp';

export type NotificationType = 
  | 'timesheet_submitted'
  | 'timesheet_validated' 
  | 'timesheet_rejected'
  | 'invoice_sent'
  | 'payment_received'
  | 'freelancer_paid'
  | 'invoice_overdue';

export interface ChannelPreference {
  email: boolean;
  whatsapp: boolean;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  timesheet_submitted: ChannelPreference;
  timesheet_validated: ChannelPreference;
  timesheet_rejected: ChannelPreference;
  invoice_sent: ChannelPreference;
  payment_received: ChannelPreference;
  freelancer_paid: ChannelPreference;
  invoice_overdue: ChannelPreference;
  created_at: string;
  updated_at: string;
}

export const NOTIFICATION_TYPES: Record<NotificationType, {
  label: string;
  description: string;
  recipientType: 'freelancer' | 'admin' | 'both';
}> = {
  timesheet_submitted: {
    label: 'CRA soumis',
    description: 'Quand un freelancer soumet son CRA',
    recipientType: 'admin'
  },
  timesheet_validated: {
    label: 'CRA validé + Facture générée',
    description: 'Quand le CRA est validé et la facture automatiquement générée',
    recipientType: 'freelancer'
  },
  timesheet_rejected: {
    label: 'CRA rejeté',
    description: 'Quand le CRA est rejeté avec motif',
    recipientType: 'freelancer'
  },
  invoice_sent: {
    label: 'Facture envoyée au client',
    description: 'Quand la facture est envoyée au client',
    recipientType: 'freelancer'
  },
  payment_received: {
    label: 'Paiement reçu du client',
    description: 'Quand le client a payé la facture',
    recipientType: 'freelancer'
  },
  freelancer_paid: {
    label: 'Freelancer payé',
    description: 'Quand le freelancer a été payé',
    recipientType: 'freelancer'
  },
  invoice_overdue: {
    label: 'Facture en retard',
    description: 'Quand une facture dépasse sa date d\'échéance',
    recipientType: 'both'
  }
};

/**
 * Service de gestion des préférences de notifications
 */
export class NotificationPreferencesService {

  /**
   * Récupérer les préférences d'un utilisateur
   */
  static async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_notification_preferences', { user_id_param: userId });

      if (error) {
        console.error('Error fetching notification preferences:', error);
        return null;
      }

      // La fonction retourne un array, on prend le premier élément
      return (data as NotificationPreferences[])?.[0] || null;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  /**
   * Créer des préférences par défaut pour un utilisateur
   */
  static async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .rpc('create_default_notification_preferences', { user_id_param: userId });

      if (error) throw error;
      
      return (data as NotificationPreferences[])?.[0];
    } catch (error) {
      console.error('Error creating default preferences:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une préférence spécifique
   */
  static async updateSpecificPreference(
    userId: string,
    notificationType: NotificationType,
    channel: NotificationChannel,
    enabled: boolean
  ): Promise<NotificationPreferences> {
    try {
      // Récupérer les préférences actuelles
      let preferences = await this.getUserPreferences(userId);
      
      // Créer si n'existe pas
      if (!preferences) {
        preferences = await this.createDefaultPreferences(userId);
      }

      // Construire les nouvelles préférences de canal
      const currentPref = preferences[notificationType] as ChannelPreference;
      const updatedChannelPrefs = {
        ...currentPref,
        [channel]: enabled
      };

      // Mettre à jour via la fonction SQL
      const { data, error } = await supabase
        .rpc('update_notification_preference', {
          user_id_param: userId,
          notification_type: notificationType,
          channel_preferences: updatedChannelPrefs
        });

      if (error) throw error;
      
      return (data as NotificationPreferences[])?.[0];
    } catch (error) {
      console.error('Error updating specific preference:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour plusieurs préférences à la fois
   */
  static async updateMultiplePreferences(
    userId: string, 
    preferences: Partial<Record<NotificationType, ChannelPreference>>
  ): Promise<NotificationPreferences> {
    try {
      let currentPrefs = await this.getUserPreferences(userId);
      
      if (!currentPrefs) {
        currentPrefs = await this.createDefaultPreferences(userId);
      }

      // Mettre à jour chaque préférence individuellement
      for (const [notificationType, channelPrefs] of Object.entries(preferences)) {
        if (channelPrefs) {
          await supabase.rpc('update_notification_preference', {
            user_id_param: userId,
            notification_type: notificationType,
            channel_preferences: channelPrefs
          });
        }
      }

      // Retourner les préférences mises à jour
      return await this.getUserPreferences(userId) as NotificationPreferences;
    } catch (error) {
      console.error('Error updating multiple preferences:', error);
      throw error;
    }
  }

  /**
   * Vérifier si une notification doit être envoyée
   */
  static async shouldSendNotification(
    userId: string,
    notificationType: NotificationType,
    channel: NotificationChannel
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      // Si pas de préférences, créer les défauts et autoriser
      if (!preferences) {
        await this.createDefaultPreferences(userId);
        return true;
      }

      const channelPreference = preferences[notificationType] as ChannelPreference;
      return channelPreference[channel];
    } catch (error) {
      console.error('Error checking notification preference:', error);
      // En cas d'erreur, autoriser par défaut
      return true;
    }
  }

  /**
   * Obtenir les préférences filtrées par type d'utilisateur
   */
  static getNotificationTypesForRole(role: 'freelancer' | 'admin'): NotificationType[] {
    return Object.entries(NOTIFICATION_TYPES)
      .filter(([_, config]) => 
        config.recipientType === role || config.recipientType === 'both'
      )
      .map(([type]) => type as NotificationType);
  }

  /**
   * Réinitialiser toutes les préférences aux valeurs par défaut
   */
  static async resetToDefaults(userId: string): Promise<NotificationPreferences> {
    try {
      const defaultChannelPrefs = { email: true, whatsapp: true };
      
      const allTypes: NotificationType[] = Object.keys(NOTIFICATION_TYPES) as NotificationType[];
      
      for (const notificationType of allTypes) {
        await supabase.rpc('update_notification_preference', {
          user_id_param: userId,
          notification_type: notificationType,
          channel_preferences: defaultChannelPrefs
        });
      }

      return await this.getUserPreferences(userId) as NotificationPreferences;
    } catch (error) {
      console.error('Error resetting preferences to defaults:', error);
      throw error;
    }
  }
}