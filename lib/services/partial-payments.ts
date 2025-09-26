import { supabase } from '../supabase';
import { RealFreelancerPaymentService } from './real-partial-payments';

export interface FreelancerPartialPayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: 'bank_transfer' | 'check' | 'cash' | 'other';
  reference?: string;
  notes?: string;
  created_at: string;
  created_by: string;
  // Nouveau : Traçage des avances
  is_advance: boolean; // True si c'est une avance (client pas encore payé)
  advance_reason?: string; // Raison de l'avance si applicable
}

export interface InvoiceWithFreelancerPayments {
  id: string;
  total_amount: number;
  status: 'pending' | 'partially_paid' | 'paid' | 'paid_freelancer' | 'overdue' | 'sent' | 'draft';
  issue_date: string;
  due_date: string | null;
  freelancer_name: string;
  freelancer_id: string;
  client_name: string;
  month: string;
  worked_days: number;
  tjm: number;
  // Paiements de la compagnie vers le freelancer
  freelancer_payments: FreelancerPartialPayment[];
  total_paid_to_freelancer: number;
  remaining_to_pay_freelancer: number;
  freelancer_payment_progress: number; // Pourcentage versé au freelancer (0-100)
  // Statut client (facture payée par le client ou pas)
  client_has_paid: boolean;
  // Calcul de marge
  company_margin_taken: number;
  // Nouveaux champs pour traçage des avances
  has_advances: boolean; // True si contient des avances
  total_advances: number; // Montant total des avances faites
  can_receive_advance: boolean; // True si facture éligible aux avances (envoyée au client)
}

export interface FreelancerPaymentSummary {
  total_invoices: number;
  total_invoice_amount: number;
  total_paid_to_freelancers: number;
  total_remaining_to_pay: number;
  fully_paid_to_freelancer_count: number;
  partially_paid_to_freelancer_count: number;
  unpaid_to_freelancer_count: number;
  // Revenus de la compagnie (différence entre factures et paiements freelancers)
  total_company_margin: number;
}

export class FreelancerPartialPaymentService {
  /**
   * 🚀 Ajoute un paiement de la compagnie vers un freelancer - VERSION RÉELLE
   */
  static async addPaymentToFreelancer(
    invoiceId: string,
    amount: number,
    paymentMethod: FreelancerPartialPayment['payment_method'],
    reference?: string,
    notes?: string,
    isAdvance?: boolean,
    advanceReason?: string
  ): Promise<{ success: boolean; payment?: FreelancerPartialPayment; error?: string }> {
    try {
      // Récupérer la facture avec les infos
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          id, 
          amount, 
          status,
          timesheet:timesheet_id!inner(
            contract:contract_id!inner(
              company_id,
              user:user_id!inner(full_name)
            )
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        return { success: false, error: 'Facture introuvable' };
      }

      if (amount <= 0) {
        return { success: false, error: 'Le montant doit être supérieur à 0€' };
      }

      if (amount > invoice.amount) {
        return { 
          success: false, 
          error: `Le montant dépasse le montant total de la facture (${invoice.amount.toFixed(2)}€)` 
        };
      }

      // Extraire le company_id
      const companyId = invoice.timesheet?.contract?.company_id;
      if (!companyId) {
        return { success: false, error: 'Company ID introuvable' };
      }

      // Vérifier si c'est une avance (client pas encore payé)
      const clientHasPaid = ['paid', 'paid_freelancer'].includes(invoice.status);
      const isActualAdvance = isAdvance || !clientHasPaid;

      // 🔥 UTILISER LE SERVICE RÉEL pour créer le paiement en base
      const realPayment = await RealFreelancerPaymentService.addPayment({
        invoiceId: invoiceId,
        companyId: companyId,
        amount: amount,
        paymentMethod: paymentMethod,
        reference: reference,
        notes: notes,
        isAdvance: isActualAdvance,
        advanceReason: isActualAdvance ? (advanceReason || 'Avance sur facture en attente de paiement client') : undefined
      });

      // Mettre à jour le statut de la facture
      let newStatus = invoice.status;
      if (amount >= invoice.amount) {
        newStatus = 'paid_freelancer';
      } else if (invoice.status === 'pending') {
        newStatus = 'partially_paid';
      }

      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (updateError) {
        console.error('Erreur mise à jour statut facture:', updateError);
        // On continue même si la mise à jour du statut échoue
      }

      // Convertir le paiement réel vers le format attendu
      const payment: FreelancerPartialPayment = {
        id: realPayment.id,
        amount: Number(realPayment.amount),
        payment_method: realPayment.payment_method as FreelancerPartialPayment['payment_method'],
        reference: realPayment.reference || '',
        notes: realPayment.notes || '',
        payment_date: realPayment.payment_date || new Date().toISOString().split('T')[0],
        created_at: realPayment.created_at,
        created_by: realPayment.created_by,
        is_advance: realPayment.is_advance,
        advance_reason: realPayment.advance_reason || undefined
      };

      console.log('✅ Paiement créé avec succès - PERSISTANCE RÉELLE:', payment.id);
      return { success: true, payment };

    } catch (error) {
      console.error('❌ Erreur lors du paiement au freelancer:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur technique lors du paiement' };
    }
  }

  /**
   * 🔧 Helper: Récupère les vrais paiements depuis la base de données
   */
  private static async getRealFreelancerPayments(companyId: string): Promise<Map<string, FreelancerPartialPayment[]>> {
    try {
      const realPayments = await RealFreelancerPaymentService.getAllPayments(companyId);
      const paymentsByInvoice = new Map<string, FreelancerPartialPayment[]>();

      realPayments.forEach(payment => {
        const invoiceId = payment.invoice_id;
        if (!paymentsByInvoice.has(invoiceId)) {
          paymentsByInvoice.set(invoiceId, []);
        }
        
        // Convertir le paiement réel vers le format attendu
        paymentsByInvoice.get(invoiceId)!.push({
          id: payment.id,
          amount: Number(payment.amount),
          payment_method: payment.payment_method as FreelancerPartialPayment['payment_method'],
          reference: payment.reference || '',
          notes: payment.notes || '',
          payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
          created_at: payment.created_at,
          created_by: payment.created_by,
          is_advance: payment.is_advance,
          advance_reason: payment.advance_reason || undefined
        });
      });

      return paymentsByInvoice;
    } catch (error) {
      console.error('❌ Erreur récupération paiements réels:', error);
      return new Map();
    }
  }

  /**
   * 🚀 Récupère toutes les factures avec les paiements aux freelancers - VERSION HYBRIDE RÉELLE
   * NOUVEAU: Utilise les vrais paiements de la base de données + simulation pour le reste
   */
  static async getInvoicesWithFreelancerPayments(companyId: string): Promise<InvoiceWithFreelancerPayments[]> {
    try {
      // 🔥 Récupérer les vrais paiements de la base de données
      const realPaymentsMap = await this.getRealFreelancerPayments(companyId);
      console.log(`✅ ${realPaymentsMap.size} factures ont des paiements réels en base`);

      // Récupération des factures avec les informations complètes
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          amount,
          status,
          issue_date,
          due_date,
          timesheet:timesheet_id!inner(
            month,
            worked_days,
            contract:contract_id!inner(
              tjm,
              user:user_id!inner(id, full_name),
              client:client_id!inner(name)
            )
          )
        `)
        .eq('timesheet.contract.company_id', companyId)
        .in('status', ['sent', 'pending', 'partially_paid', 'paid', 'paid_freelancer', 'overdue']);

      if (invoicesError || !invoicesData) {
        console.error('Erreur récupération factures:', invoicesError);
        return [];
      }

      // Construction des factures avec informations de paiement freelancer
      const invoicesWithFreelancerPayments: InvoiceWithFreelancerPayments[] = invoicesData.map(invoice => {
        // 🚀 UTILISER LES VRAIS PAIEMENTS si disponibles, sinon simulation
        const realPayments = realPaymentsMap.get(invoice.id) || [];
        
        let freelancerPayments: FreelancerPartialPayment[];
        let totalPaidToFreelancer = 0;
        let totalAdvances = 0;
        let hasAdvances = false;

        if (realPayments.length > 0) {
          // 🔥 UTILISER LES DONNÉES RÉELLES
          freelancerPayments = realPayments;
          totalPaidToFreelancer = realPayments.reduce((sum, p) => sum + p.amount, 0);
          totalAdvances = realPayments.filter(p => p.is_advance).reduce((sum, p) => sum + p.amount, 0);
          hasAdvances = realPayments.some(p => p.is_advance);
          console.log(`📊 Facture ${invoice.id}: ${realPayments.length} paiements réels (${totalPaidToFreelancer}€, avances: ${totalAdvances}€)`);
        } else {
          // 📋 FALLBACK: Simulation pour les anciennes données (compatibilité)
          freelancerPayments = [];
          
          // Calculer si la facture peut recevoir des avances (envoyée au client)
          const canReceiveAdvance = ['sent', 'pending', 'partially_paid', 'paid', 'paid_freelancer', 'overdue'].includes(invoice.status);
          
          // Déterminer si le client a payé
          const clientHasPaid = ['paid', 'paid_freelancer'].includes(invoice.status);

          // Simuler les paiements selon le statut (pour compatibilité)
          if (invoice.status === 'paid_freelancer') {
            totalPaidToFreelancer = invoice.amount;
            freelancerPayments.push({
              id: 'simulated-freelancer-1',
              amount: invoice.amount,
              payment_method: 'bank_transfer',
              reference: 'Paiement complet freelancer',
              notes: 'Paiement intégral au freelancer (simulé)',
              payment_date: invoice.issue_date,
              created_at: new Date().toISOString(),
              created_by: 'system',
              is_advance: false,
              advance_reason: undefined
            });
          } else if (invoice.status === 'partially_paid') {
            totalPaidToFreelancer = invoice.amount * 0.6;
            const isAdvancePayment = !clientHasPaid;
          
            if (isAdvancePayment) {
              totalAdvances = totalPaidToFreelancer;
              hasAdvances = true;
            }

            freelancerPayments.push({
              id: 'simulated-freelancer-2',
              amount: totalPaidToFreelancer,
              payment_method: 'bank_transfer',
              reference: isAdvancePayment ? 'Avance freelancer 60%' : 'Acompte freelancer 60%',
              notes: isAdvancePayment ? 'Avance au freelancer (60% - client pas encore payé)' : 'Paiement partiel au freelancer (60%)',
              payment_date: invoice.issue_date,
              created_at: new Date().toISOString(),
              created_by: 'system',
              is_advance: isAdvancePayment,
              advance_reason: isAdvancePayment ? 'Avance sur facture en attente de paiement client' : undefined
            });
          } else if (invoice.status === 'sent' && Math.random() > 0.7) {
            // Simuler quelques avances sur factures juste envoyées (30% de chance)
            totalPaidToFreelancer = invoice.amount * 0.4;
            totalAdvances = totalPaidToFreelancer;
            hasAdvances = true;

            freelancerPayments.push({
              id: 'simulated-advance-1',
              amount: totalPaidToFreelancer,
              payment_method: 'bank_transfer',
              reference: 'Avance 40% - facture envoyée',
              notes: 'Avance au freelancer sur facture envoyée au client',
              payment_date: invoice.issue_date,
              created_at: new Date().toISOString(),
              created_by: 'system',
              is_advance: true,
              advance_reason: 'Avance exceptionnelle - facture envoyée au client'
            });
          }
        }

        // Calculer si la facture peut recevoir des avances (envoyée au client)
        const canReceiveAdvance = ['sent', 'pending', 'partially_paid', 'paid', 'paid_freelancer', 'overdue'].includes(invoice.status);
        
        // Déterminer si le client a payé (pour les calculs)
        const clientHasPaid = ['paid', 'paid_freelancer'].includes(invoice.status);

        const remainingToPayFreelancer = invoice.amount - totalPaidToFreelancer;
        const freelancerPaymentProgress = invoice.amount > 0 ? (totalPaidToFreelancer / invoice.amount) * 100 : 0;
        
        // Calculer la marge de la compagnie (ce qui a été payé par le client moins ce qui a été versé au freelancer)
        const companyMarginTaken = clientHasPaid ? (invoice.amount - totalPaidToFreelancer) : 0;        return {
          id: invoice.id,
          total_amount: invoice.amount,
          status: invoice.status as InvoiceWithFreelancerPayments['status'],
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          freelancer_name: invoice.timesheet?.contract?.user?.full_name || 'Freelancer',
          freelancer_id: invoice.timesheet?.contract?.user?.id || '',
          client_name: invoice.timesheet?.contract?.client?.name || 'Client',
          month: invoice.timesheet?.month || '',
          worked_days: invoice.timesheet?.worked_days || 0,
          tjm: invoice.timesheet?.contract?.tjm || 0,
          freelancer_payments: freelancerPayments,
          total_paid_to_freelancer: totalPaidToFreelancer,
          remaining_to_pay_freelancer: remainingToPayFreelancer,
          freelancer_payment_progress: Math.round(freelancerPaymentProgress),
          client_has_paid: clientHasPaid,
          company_margin_taken: companyMarginTaken,
          // Nouveaux champs pour traçage des avances
          has_advances: hasAdvances,
          total_advances: totalAdvances,
          can_receive_advance: canReceiveAdvance
        };
      });

      return invoicesWithFreelancerPayments.sort((a, b) => 
        new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
      );

    } catch (error) {
      console.error('Erreur lors de la récupération des factures avec paiements freelancer:', error);
      return [];
    }
  }

  /**
   * Récupère le résumé des paiements aux freelancers pour une entreprise
   */
  static async getFreelancerPaymentSummary(companyId: string): Promise<FreelancerPaymentSummary> {
    try {
      const invoices = await this.getInvoicesWithFreelancerPayments(companyId);
      
      const summary: FreelancerPaymentSummary = {
        total_invoices: invoices.length,
        total_invoice_amount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
        total_paid_to_freelancers: invoices.reduce((sum, inv) => sum + inv.total_paid_to_freelancer, 0),
        total_remaining_to_pay: invoices.reduce((sum, inv) => sum + inv.remaining_to_pay_freelancer, 0),
        fully_paid_to_freelancer_count: invoices.filter(inv => inv.remaining_to_pay_freelancer === 0).length,
        partially_paid_to_freelancer_count: invoices.filter(inv => inv.total_paid_to_freelancer > 0 && inv.remaining_to_pay_freelancer > 0).length,
        unpaid_to_freelancer_count: invoices.filter(inv => inv.total_paid_to_freelancer === 0).length,
        total_company_margin: invoices.reduce((sum, inv) => sum + inv.company_margin_taken, 0)
      };

      return summary;

    } catch (error) {
      console.error('Erreur lors du calcul du résumé des paiements freelancer:', error);
      return {
        total_invoices: 0,
        total_invoice_amount: 0,
        total_paid_to_freelancers: 0,
        total_remaining_to_pay: 0,
        fully_paid_to_freelancer_count: 0,
        partially_paid_to_freelancer_count: 0,
        unpaid_to_freelancer_count: 0,
        total_company_margin: 0
      };
    }
  }

  /**
   * Supprime un paiement partiel au freelancer (en cas d'erreur)
   */
  static async deleteFreelancerPayment(invoiceId: string): Promise<boolean> {
    try {
      // Pour l'instant, on simule en remettant le statut à pending
      // (dans la vraie implémentation, on supprimerait le paiement de la table)
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'pending' })
        .eq('id', invoiceId);

      return !error;

    } catch (error) {
      console.error('Erreur lors de la suppression du paiement freelancer:', error);
      return false;
    }
  }

  /**
   * Marque une facture comme complètement payée au freelancer
   */
  static async markInvoiceAsFullyPaidToFreelancer(invoiceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid_freelancer' })
        .eq('id', invoiceId);

      return !error;

    } catch (error) {
      console.error('Erreur lors du marquage comme payée au freelancer:', error);
      return false;
    }
  }
}