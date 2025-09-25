/**
 * Helper pour calculer les délais de paiement français et la TVA
 * Gère les délais de paiement français : 30/45/60 jours fin de mois
 * @author GitHub Copilot
 * @date 24 septembre 2025
 */

export type PaymentTermsType = 'end_of_month' | 'net_days';

export interface PaymentTermsConfig {
  days: number;
  type: PaymentTermsType;
}

export interface VATConfig {
  rate: number; // Taux de TVA en pourcentage (ex: 20 pour 20%)
  applicable: boolean;
}

export interface InvoiceCalculation {
  amountHT: number; // Hors taxes
  vatAmount: number; // Montant TVA
  amountTTC: number; // TTC (Total)
  dueDate: Date;
  commission: number;
  netAmount: number; // Montant net après commission
}

export class PaymentTermsHelper {
  /**
   * Calcule la date d'échéance selon les règles françaises
   */
  static calculateDueDate(
    issueDate: Date,
    paymentTerms: PaymentTermsConfig
  ): Date {
    const { days, type } = paymentTerms;

    if (type === 'net_days') {
      // Délai simple : X jours nets à partir de la date d'émission
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + days);
      return dueDate;
    }

    if (type === 'end_of_month') {
      // Délai français : X jours fin de mois suivant
      const nextMonth = new Date(issueDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      // Aller au dernier jour du mois suivant
      const lastDayOfMonth = new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth() + 1,
        0
      );
      
      // Ajouter le délai en jours
      lastDayOfMonth.setDate(lastDayOfMonth.getDate() + days);
      
      return lastDayOfMonth;
    }

    throw new Error(`Type de délai de paiement non supporté: ${type}`);
  }

  /**
   * Calcule tous les montants de la facture avec TVA et commission
   */
  static calculateInvoiceAmounts(
    workedDays: number,
    dailyRate: number, // TJM
    vatConfig: VATConfig,
    commissionRate: number = 0 // Taux de commission en pourcentage
  ): Omit<InvoiceCalculation, 'dueDate'> {
    // Montant de base (jours × TJM)
    const baseAmount = workedDays * dailyRate;

    let amountHT: number;
    let vatAmount: number;
    let amountTTC: number;

    if (vatConfig.applicable) {
      // Si TVA applicable, le TJM est considéré HT
      amountHT = baseAmount;
      vatAmount = (amountHT * vatConfig.rate) / 100;
      amountTTC = amountHT + vatAmount;
    } else {
      // Si pas de TVA
      amountHT = baseAmount;
      vatAmount = 0;
      amountTTC = baseAmount;
    }

    // Commission calculée sur le montant TTC
    const commission = (amountTTC * commissionRate) / 100;
    const netAmount = amountTTC - commission;

    return {
      amountHT,
      vatAmount,
      amountTTC,
      commission,
      netAmount
    };
  }

  /**
   * Calcule une facture complète
   */
  static calculateFullInvoice(
    workedDays: number,
    dailyRate: number,
    paymentTerms: PaymentTermsConfig,
    vatConfig: VATConfig,
    commissionRate: number = 0,
    issueDate: Date = new Date()
  ): InvoiceCalculation {
    const amounts = this.calculateInvoiceAmounts(
      workedDays,
      dailyRate,
      vatConfig,
      commissionRate
    );

    const dueDate = this.calculateDueDate(issueDate, paymentTerms);

    return {
      ...amounts,
      dueDate
    };
  }

  /**
   * Obtient les délais de paiement standards français
   */
  static getStandardPaymentTerms(): Record<string, PaymentTermsConfig> {
    return {
      '30_end_month': {
        days: 30,
        type: 'end_of_month'
      },
      '45_end_month': {
        days: 45,
        type: 'end_of_month'
      },
      '60_end_month': {
        days: 60,
        type: 'end_of_month'
      },
      '30_net': {
        days: 30,
        type: 'net_days'
      }
    };
  }

  /**
   * Obtient la configuration TVA française par défaut
   */
  static getFrenchVATConfig(): VATConfig {
    return {
      rate: 20,
      applicable: true
    };
  }

  /**
   * Formate une date d'échéance pour affichage
   */
  static formatDueDate(dueDate: Date): string {
    return dueDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Calcule le nombre de jours de retard
   */
  static getDaysOverdue(dueDate: Date): number {
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Vérifie si une facture est en retard
   */
  static isOverdue(dueDate: Date): boolean {
    return this.getDaysOverdue(dueDate) > 0;
  }
}