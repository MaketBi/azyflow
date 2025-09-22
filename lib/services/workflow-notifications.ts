import { NotificationService, EmailNotification } from './notifications';

export interface WorkflowNotificationData {
  freelancerName: string;
  freelancerEmail: string;
  adminName: string;
  clientName: string;
  month: number;
  year: number;
  workedDays: number;
  amount: number;
  timesheetId: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

/**
 * Service dédié aux notifications workflow CRA → Facture → Paiement
 */
export class WorkflowNotificationService extends NotificationService {

  /**
   * 📧 EMAIL: CRA validé + Facture générée automatiquement
   */
  static async notifyTimesheetValidatedWithInvoice(data: WorkflowNotificationData): Promise<void> {
    try {
      const emailNotification = this.getValidatedWithInvoiceEmailTemplate(data);
      await this.sendEmail(emailNotification);
    } catch (error) {
      console.error('Error sending timesheet validated with invoice notification:', error);
      throw error;
    }
  }

  /**
   * 📧 EMAIL: Facture envoyée au client
   */
  static async notifyInvoiceSentToClient(data: WorkflowNotificationData): Promise<void> {
    try {
      const emailNotification = this.getInvoiceSentEmailTemplate(data);
      await this.sendEmail(emailNotification);
    } catch (error) {
      console.error('Erreur dans notifyInvoiceSentToClient:', error);
      throw error;
    }
  }

  /**
   * 📧 EMAIL: Paiement reçu du client
   */
  static async notifyPaymentReceivedFromClient(data: WorkflowNotificationData): Promise<void> {
    try {
      const emailNotification = this.getPaymentReceivedEmailTemplate(data);
      await this.sendEmail(emailNotification);
    } catch (error) {
      console.error('Error sending payment received notification:', error);
      throw error;
    }
  }

  /**
   * 📧 EMAIL: Freelancer payé
   */
  static async notifyFreelancerPaid(data: WorkflowNotificationData): Promise<void> {
    try {
      const emailNotification = this.getFreelancerPaidEmailTemplate(data);
      await this.sendEmail(emailNotification);
    } catch (error) {
      console.error('Error sending freelancer paid notification:', error);
      throw error;
    }
  }

  // 🎨 TEMPLATES EMAIL

  /**
   * Template: CRA validé + Facture générée
   */
  static getValidatedWithInvoiceEmailTemplate(data: WorkflowNotificationData): EmailNotification {
    const subject = `🎉 CRA validé et facture générée - ${data.month}/${data.year}`;
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header avec badge de succès -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 24px; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px;">
              ✅ CRA Validé
            </div>
          </div>

          <!-- Salutation -->
          <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">
            Bonjour ${data.freelancerName} 👋
          </h1>

          <!-- Message principal -->
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Excellente nouvelle ! Votre CRA pour <strong>${data.month}/${data.year}</strong> a été validé par ${data.adminName}.
          </p>

          <!-- Informations CRA -->
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 18px;">📋 Détails du CRA</h3>
            <div style="display: grid; gap: 8px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #374151; font-weight: 500;">Période:</span>
                <span style="color: #1f2937;">${data.month}/${data.year}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #374151; font-weight: 500;">Jours travaillés:</span>
                <span style="color: #1f2937;">${data.workedDays} jours</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #374151; font-weight: 500;">Client:</span>
                <span style="color: #1f2937;">${data.clientName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #d1fae5; padding-top: 8px; margin-top: 8px;">
                <span style="color: #374151; font-weight: 600;">Montant total:</span>
                <span style="color: #059669; font-weight: 700; font-size: 18px;">${data.amount.toLocaleString('fr-FR')} €</span>
              </div>
            </div>
          </div>

          <!-- Action automatique -->
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">🚀 Action automatique effectuée</h3>
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
              La facture a été automatiquement générée et sera envoyée au client ${data.clientName}.
            </p>
          </div>

          <!-- Prochaines étapes -->
          <div style="margin: 25px 0;">
            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">📋 Prochaines étapes</h3>
            <div style="space-y: 8px;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #10b981; margin-right: 10px;">✅</span>
                <span style="color: #6b7280;">CRA validé</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #10b981; margin-right: 10px;">✅</span>
                <span style="color: #6b7280;">Facture générée</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #f59e0b; margin-right: 10px;">⏳</span>
                <span style="color: #374151;">Envoi de la facture au client</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #9ca3af; margin-right: 10px;">⏳</span>
                <span style="color: #6b7280;">Réception du paiement client</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="color: #9ca3af; margin-right: 10px;">⏳</span>
                <span style="color: #6b7280;">Versement de votre paiement</span>
              </div>
            </div>
          </div>

          <!-- Message de remerciement -->
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 25px;">
            Merci pour votre excellent travail ! Nous vous tiendrons informé de l'avancement du processus de facturation.
          </p>

        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            Notification automatique • Azyflow Workflow System
          </p>
        </div>
      </div>
    `;

    return {
      to: data.freelancerEmail,
      subject,
      html
    };
  }

  /**
   * Template: Facture envoyée au client
   */
  static getInvoiceSentEmailTemplate(data: WorkflowNotificationData): EmailNotification {
    const subject = `📨 Facture envoyée au client - ${data.invoiceNumber}`;
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 12px 24px; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px;">
              📨 Facture Envoyée
            </div>
          </div>

          <!-- Salutation -->
          <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">
            Bonjour ${data.freelancerName} 👋
          </h1>

          <!-- Message principal -->
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Votre facture <strong>${data.invoiceNumber}</strong> a été officiellement envoyée au client ${data.clientName}.
          </p>

          <!-- Informations facture -->
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📄 Détails de la facture</h3>
            <div style="display: grid; gap: 8px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #374151; font-weight: 500;">N° Facture:</span>
                <span style="color: #1f2937;">${data.invoiceNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #374151; font-weight: 500;">Période:</span>
                <span style="color: #1f2937;">${data.month}/${data.year}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #374151; font-weight: 500;">Client:</span>
                <span style="color: #1f2937;">${data.clientName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #dbeafe; padding-top: 8px; margin-top: 8px;">
                <span style="color: #374151; font-weight: 600;">Montant:</span>
                <span style="color: #1e40af; font-weight: 700; font-size: 18px;">${data.amount.toLocaleString('fr-FR')} €</span>
              </div>
            </div>
          </div>

          <!-- Prochaines étapes -->
          <div style="margin: 25px 0;">
            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">📋 Suivi du workflow</h3>
            <div style="space-y: 8px;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #10b981; margin-right: 10px;">✅</span>
                <span style="color: #6b7280;">CRA validé</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #10b981; margin-right: 10px;">✅</span>
                <span style="color: #6b7280;">Facture générée</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #10b981; margin-right: 10px;">✅</span>
                <span style="color: #374151; font-weight: 500;">Facture envoyée au client</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #f59e0b; margin-right: 10px;">⏳</span>
                <span style="color: #374151;">Attente du paiement client</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="color: #9ca3af; margin-right: 10px;">⏳</span>
                <span style="color: #6b7280;">Versement de votre paiement</span>
              </div>
            </div>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 25px;">
            Le processus suit son cours ! Nous vous informerons dès réception du paiement par le client.
          </p>

        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            Notification automatique • Azyflow Workflow System
          </p>
        </div>
      </div>
    `;

    return {
      to: data.freelancerEmail,
      subject,
      html
    };
  }

  /**
   * Template: Paiement reçu du client
   */
  static getPaymentReceivedEmailTemplate(data: WorkflowNotificationData): EmailNotification {
    const subject = `💰 Paiement reçu du client - ${data.invoiceNumber}`;
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 12px 24px; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px;">
              💰 Paiement Reçu
            </div>
          </div>

          <!-- Salutation -->
          <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">
            Bonjour ${data.freelancerName} 👋
          </h1>

          <!-- Message principal -->
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Excellente nouvelle ! Le paiement de la facture <strong>${data.invoiceNumber}</strong> a été reçu de la part de ${data.clientName}.
          </p>

          <!-- Informations paiement -->
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 18px;">💳 Détails du paiement</h3>
            <div style="display: grid; gap: 8px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #374151; font-weight: 500;">N° Facture:</span>
                <span style="color: #1f2937;">${data.invoiceNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #374151; font-weight: 500;">Client payeur:</span>
                <span style="color: #1f2937;">${data.clientName}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #374151; font-weight: 500;">Période:</span>
                <span style="color: #1f2937;">${data.month}/${data.year}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #d1fae5; padding-top: 8px; margin-top: 8px;">
                <span style="color: #374151; font-weight: 600;">Montant reçu:</span>
                <span style="color: #059669; font-weight: 700; font-size: 18px;">${data.amount.toLocaleString('fr-FR')} €</span>
              </div>
            </div>
          </div>

          <!-- Prochaine étape -->
          <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">⚡ Prochaine étape</h3>
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              Votre paiement va être traité et versé dans les plus brefs délais. Vous recevrez une confirmation une fois le virement effectué.
            </p>
          </div>

          <!-- Suivi workflow -->
          <div style="margin: 25px 0;">
            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">📋 Suivi du workflow</h3>
            <div style="space-y: 8px;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #10b981; margin-right: 10px;">✅</span>
                <span style="color: #6b7280;">CRA validé</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #10b981; margin-right: 10px;">✅</span>
                <span style="color: #6b7280;">Facture générée</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #10b981; margin-right: 10px;">✅</span>
                <span style="color: #6b7280;">Facture envoyée au client</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #10b981; margin-right: 10px;">✅</span>
                <span style="color: #374151; font-weight: 500;">Paiement reçu du client</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="color: #f59e0b; margin-right: 10px;">⏳</span>
                <span style="color: #374151;">Traitement de votre paiement</span>
              </div>
            </div>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 25px;">
            Nous sommes presque arrivés au bout ! Votre paiement sera traité rapidement.
          </p>

        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            Notification automatique • Azyflow Workflow System
          </p>
        </div>
      </div>
    `;

    return {
      to: data.freelancerEmail,
      subject,
      html
    };
  }

  /**
   * Template: Freelancer payé (fin du workflow)
   */
  static getFreelancerPaidEmailTemplate(data: WorkflowNotificationData): EmailNotification {
    const subject = `🎉 Votre paiement a été effectué - ${data.month}/${data.year}`;
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header de célébration -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #7c3aed, #5b21b6); color: white; padding: 12px 24px; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px;">
              🎉 Paiement Effectué
            </div>
          </div>

          <!-- Salutation -->
          <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">
            Félicitations ${data.freelancerName} ! 🎉
          </h1>

          <!-- Message principal -->
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Votre paiement pour la période <strong>${data.month}/${data.year}</strong> a été effectué avec succès !
          </p>

          <!-- Informations finales -->
          <div style="background-color: #f5f3ff; border: 1px solid #c4b5fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #5b21b6; margin: 0 0 15px 0; font-size: 18px;">💳 Récapitulatif final</h3>
            <div style="display: grid; gap: 8px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #374151; font-weight: 500;">Période:</span>
                <span style="color: #1f2937;">${data.month}/${data.year}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #374151; font-weight: 500;">Client:</span>
                <span style="color: #1f2937;">${data.clientName}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #374151; font-weight: 500;">Jours travaillés:</span>
                <span style="color: #1f2937;">${data.workedDays} jours</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #ddd6fe; padding-top: 8px; margin-top: 8px;">
                <span style="color: #374151; font-weight: 600;">Montant versé:</span>
                <span style="color: #7c3aed; font-weight: 700; font-size: 18px;">${data.amount.toLocaleString('fr-FR')} €</span>
              </div>
            </div>
          </div>

          <!-- Workflow complet -->
          <div style="margin: 25px 0;">
            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">🏁 Workflow terminé</h3>
            <div style="space-y: 8px;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #10b981; margin-right: 10px;">✅</span>
                <span style="color: #6b7280;">CRA validé</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #10b981; margin-right: 10px;">✅</span>
                <span style="color: #6b7280;">Facture générée</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #10b981; margin-right: 10px;">✅</span>
                <span style="color: #6b7280;">Facture envoyée au client</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #10b981; margin-right: 10px;">✅</span>
                <span style="color: #6b7280;">Paiement reçu du client</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="color: #10b981; margin-right: 10px;">✅</span>
                <span style="color: #374151; font-weight: 500;">Votre paiement effectué</span>
              </div>
            </div>
          </div>

          <!-- Message de remerciement -->
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #166534; margin: 0; font-size: 16px; text-align: center;">
              <strong>Merci pour votre excellent travail !</strong><br>
              L'équipe Azyflow vous remercie pour votre professionnalisme.
            </p>
          </div>

        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            Notification automatique • Azyflow Workflow System
          </p>
        </div>
      </div>
    `;

    return {
      to: data.freelancerEmail,
      subject,
      html
    };
  }
}