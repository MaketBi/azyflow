import { supabase } from '../supabase';
import { Database } from '../database';
import { HNOTimeSlot, HNORate, HNO_RATES } from '../types/hno';

export type HNOConfiguration = Database['public']['Tables']['hno_configurations']['Row'];
export type HNOConfigurationInsert = Database['public']['Tables']['hno_configurations']['Insert'];
export type HNOConfigurationUpdate = Database['public']['Tables']['hno_configurations']['Update'];

export class HNOConfigurationService {
  /**
   * Récupère la configuration HNO depuis la base de données
   * Si aucune configuration n'existe, retourne les valeurs par défaut
   */
  static async getConfiguration(companyId?: string): Promise<Record<HNOTimeSlot, HNORate>> {
    try {
      let targetCompanyId = companyId;
      
      if (!targetCompanyId) {
        // Récupérer l'ID de l'entreprise de l'utilisateur actuel
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Non authentifié');
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (userError || !userData) {
          throw new Error('Impossible de récupérer les informations utilisateur');
        }

        targetCompanyId = userData.company_id;
      }

      // Récupérer la configuration personnalisée depuis la base de données
      const { data: configurations, error } = await supabase
        .from('hno_configurations')
        .select('*')
        .eq('company_id', targetCompanyId);

      if (error) {
        console.error('Erreur lors de la récupération de la configuration HNO:', error);
        return HNO_RATES; // Retourner les valeurs par défaut en cas d'erreur
      }

      // Si aucune configuration personnalisée, retourner les valeurs par défaut
      if (!configurations || configurations.length === 0) {
        return HNO_RATES;
      }

      // Construire l'objet de configuration à partir des données de la base
      const customRates: Record<HNOTimeSlot, HNORate> = { ...HNO_RATES };

      configurations.forEach((config: HNOConfiguration) => {
        if (config.time_slot in customRates) {
          customRates[config.time_slot as HNOTimeSlot] = {
            timeSlot: config.time_slot as HNOTimeSlot,
            label: config.label,
            description: config.description,
            majorationPercent: config.majoration_percent,
            timeRange: config.time_range,
          };
        }
      });

      return customRates;

    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration HNO:', error);
      return HNO_RATES; // Retourner les valeurs par défaut en cas d'erreur
    }
  }

  /**
   * Sauvegarde la configuration HNO dans la base de données
   */
  static async saveConfiguration(rates: Record<HNOTimeSlot, HNORate>): Promise<void> {
    try {
      // Récupérer l'ID de l'entreprise de l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Non authentifié');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id, role')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('Impossible de récupérer les informations utilisateur');
      }

      // Vérifier que l'utilisateur est admin
      if (userData.role !== 'admin') {
        throw new Error('Seuls les administrateurs peuvent modifier la configuration HNO');
      }

      const companyId = userData.company_id;

      // Supprimer l'ancienne configuration
      const { error: deleteError } = await supabase
        .from('hno_configurations')
        .delete()
        .eq('company_id', companyId);

      if (deleteError) {
        throw new Error(`Erreur lors de la suppression de l'ancienne configuration: ${deleteError.message}`);
      }

      // Préparer les nouvelles configurations à insérer
      const configurationsToInsert: HNOConfigurationInsert[] = 
        Object.entries(rates).map(([timeSlot, rate]) => ({
          company_id: companyId,
          time_slot: timeSlot as Database['public']['Enums']['hno_time_slot'],
          majoration_percent: rate.majorationPercent,
          label: rate.label,
          description: rate.description,
          time_range: rate.timeRange,
        }));

      // Insérer la nouvelle configuration
      const { error: insertError } = await supabase
        .from('hno_configurations')
        .insert(configurationsToInsert);

      if (insertError) {
        throw new Error(`Erreur lors de la sauvegarde: ${insertError.message}`);
      }

    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration HNO:', error);
      throw error;
    }
  }

  /**
   * Réinitialise la configuration aux valeurs par défaut
   */
  static async resetToDefaults(): Promise<void> {
    try {
      await this.saveConfiguration(HNO_RATES);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      throw error;
    }
  }

  /**
   * Valide qu'une configuration contient tous les créneaux requis
   */
  static validateConfiguration(rates: Record<string, any>): rates is Record<HNOTimeSlot, HNORate> {
    return Object.values(HNOTimeSlot).every(slot => {
      const rate = rates[slot];
      return rate && 
        typeof rate.majorationPercent === 'number' &&
        typeof rate.label === 'string' &&
        typeof rate.description === 'string' &&
        typeof rate.timeRange === 'string';
    });
  }
}