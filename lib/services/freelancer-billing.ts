import { supabase } from '../supabase';

export interface FreelancerInvoice {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'paid_freelancer' | 'overdue';
  issue_date: string;
  due_date: string | null;
  timesheet_id: string;
  freelancer_name: string;
  freelancer_id: string;
  client_name?: string;
  month: string;
  worked_days: number;
  tjm: number;
}

export interface FreelancerBillingStats {
  freelancerId: string;
  freelancerName: string;
  totalRevenue: number;
  paidByClient: number;      // Factures payées par le client
  paidToFreelancer: number;  // Montants déjà versés au freelancer
  pendingPayment: number;    // En attente de paiement client
  awaitingTransfer: number;  // Payé par client mais pas encore versé au freelancer
  invoicesCount: {
    total: number;
    pending: number;
    paidByClient: number;
    paidToFreelancer: number;
    awaitingTransfer: number;
  };
  invoices: FreelancerInvoice[];
}

export class FreelancerBillingService {
  /**
   * Récupère tous les freelancers d'une entreprise avec leurs statistiques de facturation
   */
  static async getCompanyFreelancersWithBilling(companyId: string): Promise<FreelancerBillingStats[]> {
    try {
      // Récupération de tous les freelancers de l'entreprise
      const { data: freelancers, error: freelancersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('company_id', companyId)
        .eq('role', 'freelancer');

      if (freelancersError || !freelancers) {
        throw new Error('Erreur lors de la récupération des freelancers');
      }

      const freelancerStats: FreelancerBillingStats[] = [];

      for (const freelancer of freelancers) {
        const stats = await this.getFreelancerBillingStats(freelancer.id, companyId);
        if (stats) {
          freelancerStats.push(stats);
        }
      }

      return freelancerStats.sort((a, b) => b.totalRevenue - a.totalRevenue);

    } catch (error) {
      console.error('Erreur lors de la récupération des freelancers avec facturation:', error);
      return [];
    }
  }

  /**
   * Récupère les statistiques de facturation d'un freelancer spécifique
   */
  static async getFreelancerBillingStats(freelancerId: string, companyId: string): Promise<FreelancerBillingStats | null> {
    try {
      // Récupération du freelancer
      const { data: freelancer, error: freelancerError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', freelancerId)
        .eq('role', 'freelancer')
        .single();

      if (freelancerError || !freelancer) {
        return null;
      }

      // Récupération des contrats du freelancer pour cette entreprise
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('id, tjm, client:client_id!inner(name)')
        .eq('user_id', freelancerId)
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (contractsError || !contracts || contracts.length === 0) {
        return {
          freelancerId,
          freelancerName: freelancer.full_name || 'Freelancer',
          totalRevenue: 0,
          paidByClient: 0,
          paidToFreelancer: 0,
          pendingPayment: 0,
          awaitingTransfer: 0,
          invoicesCount: {
            total: 0,
            pending: 0,
            paidByClient: 0,
            paidToFreelancer: 0,
            awaitingTransfer: 0
          },
          invoices: []
        };
      }

      const contractIds = contracts.map(c => c.id);

      // Récupération des timesheets
      const { data: timesheets, error: timesheetsError } = await supabase
        .from('timesheets')
        .select('id, worked_days, month, contract_id')
        .in('contract_id', contractIds);

      if (timesheetsError || !timesheets) {
        return null;
      }

      const timesheetIds = timesheets.map(t => t.id);

      // Récupération des factures avec détails
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, amount, status, issue_date, due_date, timesheet_id')
        .in('timesheet_id', timesheetIds);

      if (invoicesError) {
        return null;
      }

      const invoicesData = invoices || [];

      // Construire les factures avec informations complètes
      const freelancerInvoices: FreelancerInvoice[] = invoicesData.map(invoice => {
        const timesheet = timesheets.find(t => t.id === invoice.timesheet_id);
        const contract = contracts.find(c => c.id === timesheet?.contract_id);
        
        return {
          id: invoice.id,
          amount: invoice.amount,
          status: invoice.status as FreelancerInvoice['status'],
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          timesheet_id: invoice.timesheet_id,
          freelancer_name: freelancer.full_name || 'Freelancer',
          freelancer_id: freelancer.id,
          client_name: contract?.client?.name || 'Client inconnu',
          month: timesheet?.month || '',
          worked_days: timesheet?.worked_days || 0,
          tjm: contract?.tjm || 0
        };
      });

      // Calculs des statistiques
      const totalRevenue = invoicesData.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      const paidByClientInvoices = invoicesData.filter(inv => ['paid', 'paid_freelancer'].includes(inv.status));
      const paidByClient = paidByClientInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      const paidToFreelancerInvoices = invoicesData.filter(inv => inv.status === 'paid_freelancer');
      const paidToFreelancer = paidToFreelancerInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      const pendingInvoices = invoicesData.filter(inv => inv.status === 'pending');
      const pendingPayment = pendingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      const awaitingTransferInvoices = invoicesData.filter(inv => inv.status === 'paid');
      const awaitingTransfer = awaitingTransferInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

      return {
        freelancerId,
        freelancerName: freelancer.full_name || 'Freelancer',
        totalRevenue,
        paidByClient,
        paidToFreelancer,
        pendingPayment,
        awaitingTransfer,
        invoicesCount: {
          total: invoicesData.length,
          pending: pendingInvoices.length,
          paidByClient: paidByClientInvoices.length,
          paidToFreelancer: paidToFreelancerInvoices.length,
          awaitingTransfer: awaitingTransferInvoices.length
        },
        invoices: freelancerInvoices.sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
      };

    } catch (error) {
      console.error('Erreur lors du calcul des stats de facturation freelancer:', error);
      return null;
    }
  }

  /**
   * Marque une facture comme payée au freelancer
   */
  static async markInvoiceAsPaidToFreelancer(invoiceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid_freelancer' })
        .eq('id', invoiceId)
        .eq('status', 'paid'); // Seulement si déjà payée par le client

      return !error;
    } catch (error) {
      console.error('Erreur lors du marquage de paiement freelancer:', error);
      return false;
    }
  }

  /**
   * Récupère les factures filtrées par statut pour un freelancer
   */
  static async getFreelancerInvoicesByStatus(
    freelancerId: string, 
    companyId: string, 
    status?: FreelancerInvoice['status']
  ): Promise<FreelancerInvoice[]> {
    try {
      const stats = await this.getFreelancerBillingStats(freelancerId, companyId);
      if (!stats) return [];

      if (!status) {
        return stats.invoices;
      }

      return stats.invoices.filter(invoice => invoice.status === status);

    } catch (error) {
      console.error('Erreur lors du filtrage des factures:', error);
      return [];
    }
  }
}