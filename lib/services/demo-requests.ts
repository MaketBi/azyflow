import { supabase } from '../supabase';

export interface DemoRequestData {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  freelancersCount: string;
  message?: string;
}

export class DemoRequestService {
  /**
   * Envoyer une demande de démo au Super Admin
   * Version finale : stockage en base Supabase
   */
  static async submitDemoRequest(data: DemoRequestData): Promise<{ success: boolean; error?: string }> {
    try {
      // Validation des données
      if (!data.companyName.trim() || !data.contactName.trim() || !data.email.trim()) {
        return { success: false, error: 'Veuillez remplir tous les champs obligatoires' };
      }

      // Validation email basique
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return { success: false, error: 'Format d\'email invalide' };
      }

      // Insérer en base de données Supabase
      const { error: insertError } = await supabase
        .from('demo_requests')
        .insert({
          company_name: data.companyName.trim(),
          contact_name: data.contactName.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone?.trim() || null,
          freelancers_count: data.freelancersCount,
          message: data.message?.trim() || null,
          status: 'pending'
        });

      if (insertError) {
        console.error('Error saving demo request to Supabase:', insertError);
        return { success: false, error: 'Erreur lors de l\'enregistrement de votre demande' };
      }

      console.log('✅ Demande de démo enregistrée avec succès pour:', data.companyName);
      return { success: true };
    } catch (error) {
      console.error('Demo request service error:', error);
      return { success: false, error: 'Erreur technique lors de l\'envoi de la demande' };
    }
  }

  /**
   * Récupérer toutes les demandes de démo (pour Super Admin)
   * Version finale : depuis Supabase
   */
  static async getAllDemoRequests(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('demo_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching demo requests from Supabase:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllDemoRequests:', error);
      return [];
    }
  }

  /**
   * Mettre à jour le statut d'une demande de démo
   * Version finale : mise à jour en Supabase
   */
  static async updateDemoRequestStatus(
    id: string, 
    status: 'pending' | 'contacted' | 'invited' | 'rejected',
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('demo_requests')
        .update({ 
          status, 
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating demo request in Supabase:', error);
        return { success: false, error: 'Erreur lors de la mise à jour' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateDemoRequestStatus:', error);
      return { success: false, error: 'Erreur technique' };
    }
  }

  /**
   * Obtenir les statistiques des demandes de démo
   */
  static async getDemoRequestsStats(): Promise<{
    total: number;
    pending: number;
    contacted: number;
    invited: number;
    rejected: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('demo_requests')
        .select('status');

      if (error) {
        console.error('Error fetching demo requests stats:', error);
        return { total: 0, pending: 0, contacted: 0, invited: 0, rejected: 0 };
      }

      const stats = {
        total: data.length,
        pending: data.filter(r => r.status === 'pending').length,
        contacted: data.filter(r => r.status === 'contacted').length,
        invited: data.filter(r => r.status === 'invited').length,
        rejected: data.filter(r => r.status === 'rejected').length
      };

      return stats;
    } catch (error) {
      console.error('Error in getDemoRequestsStats:', error);
      return { total: 0, pending: 0, contacted: 0, invited: 0, rejected: 0 };
    }
  }

  /**
   * Supprimer une demande de démo (pour Super Admin)
   */
  static async deleteDemoRequest(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('demo_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting demo request:', error);
        return { success: false, error: 'Erreur lors de la suppression' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteDemoRequest:', error);
      return { success: false, error: 'Erreur technique' };
    }
  }

  /**
   * Vérifier si un email a déjà fait une demande
   */
  static async checkExistingRequest(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('demo_requests')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (error) {
        console.error('Error checking existing request:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error in checkExistingRequest:', error);
      return false;
    }
  }
}