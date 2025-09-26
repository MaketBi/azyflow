import { supabase } from '../supabase';
import { Database } from '../database';

// Types pour la nouvelle table freelancer_payments
export type FreelancerPayment = Database['public']['Tables']['freelancer_payments']['Row'];
export type FreelancerPaymentInsert = Database['public']['Tables']['freelancer_payments']['Insert'];
export type FreelancerPaymentUpdate = Database['public']['Tables']['freelancer_payments']['Update'];

// Types pour les requêtes avec relations
export interface FreelancerPaymentWithDetails extends FreelancerPayment {
  invoice?: {
    id: string;
    amount: number;
    status: string;
    issue_date: string;
    due_date: string;
    timesheet?: {
      id: string;
      month: string;
      worked_days: number;
      contract?: {
        id: string;
        tjm: number;
        user?: {
          id: string;
          full_name: string;
          email: string;
        };
        client?: {
          id: string;
          name: string;
        };
      };
    };
  };
}

/**
 * 🚀 Service Réel de Gestion des Paiements Freelancers
 * Remplace la simulation par de vraies opérations base de données
 */
export class RealFreelancerPaymentService {
  
  /**
   * 📊 Récupérer tous les paiements de la compagnie avec détails
   */
  static async getAllPayments(companyId: string): Promise<FreelancerPaymentWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('freelancer_payments')
        .select(`
          *,
          invoice:invoices!freelancer_payments_invoice_id_fkey(
            id,
            amount,
            status,
            issue_date,
            due_date,
            timesheet:timesheets!invoices_timesheet_id_fkey(
              id,
              month,
              worked_days,
              contract:contracts!timesheets_contract_id_fkey(
                id,
                tjm,
                user:users!contracts_user_id_fkey(
                  id,
                  full_name,
                  email
                ),
                client:clients!contracts_client_id_fkey(
                  id,
                  name
                )
              )
            )
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur récupération paiements:', error);
        throw new Error('Impossible de récupérer les paiements');
      }

      return data as FreelancerPaymentWithDetails[];
    } catch (error) {
      console.error('❌ Erreur service paiements:', error);
      throw error;
    }
  }

  /**
   * 💰 Ajouter un paiement (normal ou avance)
   */
  static async addPayment(paymentData: {
    invoiceId: string;
    companyId: string;
    amount: number;
    paymentMethod: 'bank_transfer' | 'check' | 'cash' | 'other';
    reference?: string;
    notes?: string;
    isAdvance: boolean;
    advanceReason?: string;
  }): Promise<FreelancerPayment> {
    try {
      // Validation métier pour les avances
      if (paymentData.isAdvance && (!paymentData.advanceReason || paymentData.advanceReason.trim() === '')) {
        throw new Error('La raison est obligatoire pour les avances');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      const insertData: FreelancerPaymentInsert = {
        invoice_id: paymentData.invoiceId,
        company_id: paymentData.companyId,
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        reference: paymentData.reference,
        notes: paymentData.notes,
        is_advance: paymentData.isAdvance,
        advance_reason: paymentData.advanceReason,
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('freelancer_payments')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création paiement:', error);
        throw new Error('Impossible de créer le paiement');
      }

      console.log('✅ Paiement créé:', {
        id: data.id,
        amount: data.amount,
        isAdvance: data.is_advance,
        reason: data.advance_reason
      });

      return data;
    } catch (error) {
      console.error('❌ Erreur ajout paiement:', error);
      throw error;
    }
  }

  /**
   * ✏️ Modifier un paiement existant
   */
  static async updatePayment(
    paymentId: string, 
    updates: Partial<FreelancerPaymentUpdate>
  ): Promise<FreelancerPayment> {
    try {
      // Validation métier pour les avances
      if (updates.is_advance && (!updates.advance_reason || updates.advance_reason.trim() === '')) {
        throw new Error('La raison est obligatoire pour les avances');
      }

      const { data, error } = await supabase
        .from('freelancer_payments')
        .update(updates)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur modification paiement:', error);
        throw new Error('Impossible de modifier le paiement');
      }

      console.log('✅ Paiement modifié:', paymentId);
      return data;
    } catch (error) {
      console.error('❌ Erreur modification paiement:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Supprimer un paiement
   */
  static async deletePayment(paymentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('freelancer_payments')
        .delete()
        .eq('id', paymentId);

      if (error) {
        console.error('❌ Erreur suppression paiement:', error);
        throw new Error('Impossible de supprimer le paiement');
      }

      console.log('✅ Paiement supprimé:', paymentId);
    } catch (error) {
      console.error('❌ Erreur suppression paiement:', error);
      throw error;
    }
  }

  /**
   * 📈 Statistiques des paiements par compagnie
   */
  static async getPaymentStats(companyId: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    totalAdvances: number;
    totalAdvanceAmount: number;
    recentPayments: number;
  }> {
    try {
      // Récupérer tous les paiements
      const { data: allPayments, error: allError } = await supabase
        .from('freelancer_payments')
        .select('amount, is_advance, created_at')
        .eq('company_id', companyId);

      if (allError) throw allError;

      // Récupérer les paiements récents (7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentPayments, error: recentError } = await supabase
        .from('freelancer_payments')
        .select('id')
        .eq('company_id', companyId)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (recentError) throw recentError;

      // Calcul des statistiques
      const totalPayments = allPayments?.length || 0;
      const totalAmount = allPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const advances = allPayments?.filter(p => p.is_advance) || [];
      const totalAdvances = advances.length;
      const totalAdvanceAmount = advances.reduce((sum, p) => sum + Number(p.amount), 0);
      const recentCount = recentPayments?.length || 0;

      return {
        totalPayments,
        totalAmount,
        totalAdvances,
        totalAdvanceAmount,
        recentPayments: recentCount
      };
    } catch (error) {
      console.error('❌ Erreur statistiques paiements:', error);
      return {
        totalPayments: 0,
        totalAmount: 0,
        totalAdvances: 0,
        totalAdvanceAmount: 0,
        recentPayments: 0
      };
    }
  }

  /**
   * 🔍 Rechercher des paiements avec filtres
   */
  static async searchPayments(companyId: string, filters: {
    freelancerName?: string;
    isAdvanceOnly?: boolean;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<FreelancerPaymentWithDetails[]> {
    try {
      let query = supabase
        .from('freelancer_payments')
        .select(`
          *,
          invoice:invoices!freelancer_payments_invoice_id_fkey(
            id,
            amount,
            status,
            timesheet:timesheets!invoices_timesheet_id_fkey(
              contract:contracts!timesheets_contract_id_fkey(
                user:users!contracts_user_id_fkey(
                  full_name
                )
              )
            )
          )
        `)
        .eq('company_id', companyId);

      // Filtres optionnels
      if (filters.isAdvanceOnly) {
        query = query.eq('is_advance', true);
      }

      if (filters.dateFrom) {
        query = query.gte('payment_date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('payment_date', filters.dateTo);
      }

      if (filters.minAmount !== undefined) {
        query = query.gte('amount', filters.minAmount);
      }

      if (filters.maxAmount !== undefined) {
        query = query.lte('amount', filters.maxAmount);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur recherche paiements:', error);
        throw new Error('Impossible de rechercher les paiements');
      }

      // Filtrage par nom de freelancer (côté client car jointure complexe)
      let results = data as FreelancerPaymentWithDetails[];
      
      if (filters.freelancerName) {
        const searchTerm = filters.freelancerName.toLowerCase();
        results = results.filter(payment => 
          payment.invoice?.timesheet?.contract?.user?.full_name
            ?.toLowerCase().includes(searchTerm)
        );
      }

      return results;
    } catch (error) {
      console.error('❌ Erreur recherche paiements:', error);
      throw error;
    }
  }
}

// 🎯 Export par défaut pour compatibilité
export default RealFreelancerPaymentService;