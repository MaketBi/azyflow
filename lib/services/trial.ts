import { supabase } from '../supabase';

export interface TrialConfig {
  durationDays: number;
  warningDays: number; // Nombre de jours avant expiration pour alerter
  gracePeriodDays: number; // Période de grâce après expiration
}

export interface TrialStatus {
  isActive: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number;
  expiresAt: string | null;
  startedAt: string | null;
  warningThreshold: boolean;
}

export class TrialService {
  // Configuration par défaut des durées d'essai
  static readonly DEFAULT_TRIAL_CONFIG: TrialConfig = {
    durationDays: 30,      // 30 jours d'essai
    warningDays: 7,        // Alerte 7 jours avant expiration  
    gracePeriodDays: 3     // 3 jours de grâce après expiration
  };

  /**
   * Démarre une période d'essai pour une company
   * Utilise le plan 'trial' pour marquer les comptes d'essai
   */
  static async startTrial(companyId: string, config?: Partial<TrialConfig>): Promise<{ success: boolean; error?: string }> {
    try {
      const trialConfig = { ...this.DEFAULT_TRIAL_CONFIG, ...config };
      
      // Pour l'instant, on utilise le plan 'trial' et le timestamp invited_at
      // Une fois la migration appliquée, on utilisera les nouveaux champs
      const { error } = await supabase
        .from('companies')
        .update({
          plan: 'trial',
          status: 'accepted', // Statut accepté = compte actif
          invited_at: new Date().toISOString() // Pour calculer l'expiration
        })
        .eq('id', companyId);

      if (error) {
        console.error('Error starting trial:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Période d'essai démarrée pour la company ${companyId}:`, {
        duration: trialConfig.durationDays,
        plan: 'trial'
      });

      return { success: true };
    } catch (error) {
      console.error('Error in startTrial:', error);
      return { success: false, error: 'Erreur technique lors du démarrage de la période d\'essai' };
    }
  }

  /**
   * Récupère le statut de la période d'essai d'une company
   * Utilise le plan 'trial' et la date invited_at pour calculer l'expiration
   */
  static async getTrialStatus(companyId: string): Promise<TrialStatus | null> {
    try {
      const { data: company, error } = await supabase
        .from('companies')
        .select('plan, invited_at, created_at, status')
        .eq('id', companyId)
        .single();

      if (error || !company) {
        console.error('Error fetching trial status:', error);
        return null;
      }

      // Si ce n'est pas un compte d'essai
      if (company.plan !== 'trial') {
        return {
          isActive: false,
          isExpired: false,
          isExpiringSoon: false,
          daysRemaining: 0,
          expiresAt: null,
          startedAt: company.invited_at,
          warningThreshold: false
        };
      }

      const now = new Date();
      const startDate = new Date(company.invited_at || company.created_at);
      const expirationDate = new Date(startDate.getTime() + (this.DEFAULT_TRIAL_CONFIG.durationDays * 24 * 60 * 60 * 1000));
      const timeRemaining = expirationDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));

      const isExpired = timeRemaining <= 0;
      const isExpiringSoon = daysRemaining <= this.DEFAULT_TRIAL_CONFIG.warningDays;
      const isActive = company.status === 'accepted' && !isExpired;

      return {
        isActive,
        isExpired,
        isExpiringSoon: isExpiringSoon && !isExpired,
        daysRemaining: Math.max(0, daysRemaining),
        expiresAt: expirationDate.toISOString(),
        startedAt: company.invited_at,
        warningThreshold: isExpiringSoon
      };
    } catch (error) {
      console.error('Error in getTrialStatus:', error);
      return null;
    }
  }

  /**
   * Prolonge une période d'essai (simulation en décalant la date invited_at)
   */
  static async extendTrial(companyId: string, additionalDays: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: company, error: fetchError } = await supabase
        .from('companies')
        .select('invited_at, created_at')
        .eq('id', companyId)
        .single();

      if (fetchError || !company) {
        return { success: false, error: 'Company non trouvée' };
      }

      // Pour prolonger, on décale la date de début vers le passé
      const currentStart = new Date(company.invited_at || company.created_at);
      const newStartDate = new Date(currentStart.getTime() - (additionalDays * 24 * 60 * 60 * 1000));

      const { error } = await supabase
        .from('companies')
        .update({
          invited_at: newStartDate.toISOString()
        })
        .eq('id', companyId);

      if (error) {
        return { success: false, error: error.message };
      }

      console.log(`✅ Période d'essai prolongée de ${additionalDays} jours pour ${companyId}`);
      return { success: true };
    } catch (error) {
      console.error('Error extending trial:', error);
      return { success: false, error: 'Erreur technique' };
    }
  }

  /**
   * Convertit un compte d'essai en compte payant
   */
  static async upgradeFromTrial(companyId: string, plan: string = 'pro'): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          plan: plan, // Change de 'trial' vers 'pro', 'enterprise', etc.
          status: 'accepted' // Maintient le statut accepté
        })
        .eq('id', companyId);

      if (error) {
        return { success: false, error: error.message };
      }

      console.log(`✅ Company ${companyId} upgradée vers le plan ${plan}`);
      return { success: true };
    } catch (error) {
      console.error('Error upgrading from trial:', error);
      return { success: false, error: 'Erreur technique' };
    }
  }

  /**
   * Vérifie et expire les comptes d'essai périmés (à appeler via cron)
   * Utilise le plan 'trial' et calcule l'expiration depuis invited_at
   */
  static async checkAndExpireTrials(): Promise<{ expiredCount: number; warnings: string[] }> {
    try {
      // Récupérer tous les comptes d'essai actifs
      const { data: trialCompanies, error: trialError } = await supabase
        .from('companies')
        .select('id, name, contact_email, plan, invited_at, created_at')
        .eq('plan', 'trial')
        .eq('status', 'accepted');

      if (trialError) {
        console.error('Error fetching trial companies:', trialError);
        return { expiredCount: 0, warnings: [trialError.message] };
      }

      let expiredCount = 0;
      const warnings: string[] = [];
      const now = new Date();

      if (trialCompanies && trialCompanies.length > 0) {
        // Calculer quels comptes sont expirés
        const expiredCompanies = trialCompanies.filter(company => {
          const startDate = new Date(company.invited_at || company.created_at);
          const expirationDate = new Date(startDate.getTime() + (this.DEFAULT_TRIAL_CONFIG.durationDays * 24 * 60 * 60 * 1000));
          return now > expirationDate;
        });

        // Marquer comme expirés (on change le statut vers 'rejected' pour indiquer l'expiration)
        if (expiredCompanies.length > 0) {
          const { error: updateError } = await supabase
            .from('companies')
            .update({ status: 'rejected' }) // Utilise 'rejected' pour marquer comme expiré
            .in('id', expiredCompanies.map(c => c.id));

          if (updateError) {
            warnings.push(`Erreur lors de la mise à jour: ${updateError.message}`);
          } else {
            expiredCount = expiredCompanies.length;
            console.log(`✅ ${expiredCount} comptes d'essai expirés`);
          }
        }

        // Récupérer les comptes qui expirent bientôt pour les alertes
        const soonExpiring = trialCompanies.filter(company => {
          const startDate = new Date(company.invited_at || company.created_at);
          const expirationDate = new Date(startDate.getTime() + (this.DEFAULT_TRIAL_CONFIG.durationDays * 24 * 60 * 60 * 1000));
          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          return daysUntilExpiration > 0 && daysUntilExpiration <= this.DEFAULT_TRIAL_CONFIG.warningDays;
        });

        if (soonExpiring.length > 0) {
          console.log(`⚠️ ${soonExpiring.length} comptes expirent bientôt`);
          // TODO: Envoyer des emails d'alerte
        }
      }

      return { expiredCount, warnings };
    } catch (error) {
      console.error('Error in checkAndExpireTrials:', error);
      return { expiredCount: 0, warnings: [`Erreur technique: ${error}`] };
    }
  }

  /**
   * Formate une durée restante en texte lisible
   */
  static formatTimeRemaining(daysRemaining: number): string {
    if (daysRemaining <= 0) return 'Expiré';
    if (daysRemaining === 1) return '1 jour restant';
    if (daysRemaining < 7) return `${daysRemaining} jours restants`;
    if (daysRemaining < 30) {
      const weeks = Math.floor(daysRemaining / 7);
      const remainingDays = daysRemaining % 7;
      return weeks === 1 
        ? `1 semaine${remainingDays > 0 ? ` et ${remainingDays} jour${remainingDays > 1 ? 's' : ''}` : ''} restante${remainingDays > 0 ? 's' : ''}`
        : `${weeks} semaines${remainingDays > 0 ? ` et ${remainingDays} jour${remainingDays > 1 ? 's' : ''}` : ''} restantes`;
    }
    
    const months = Math.floor(daysRemaining / 30);
    return months === 1 ? '1 mois restant' : `${months} mois restants`;
  }
}