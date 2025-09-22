import { supabase } from '../supabase';

export interface TimesheetNotificationData {
  freelancerName: string;
  freelancerEmail: string;
  adminName: string;
  adminEmail: string;
  clientName: string;
  month: string;
  year: number;
  workedDays: number;
  timesheetId: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
}

export interface WhatsAppNotification {
  to: string;
  message: string;
}

/**
 * Service de notifications pour les CRA
 */
export class NotificationService {
  protected static getAppUrl(): string {
    // Utiliser la variable d'environnement si disponible
    if (import.meta.env.VITE_APP_URL) {
      return import.meta.env.VITE_APP_URL;
    }
    
    // Fallback basé sur l'environnement
    if (typeof window !== 'undefined') {
      // En développement local
      if (window.location.hostname === 'localhost') {
        return 'https://azyflow.netlify.app'; // Votre URL de production
      }
      // En production
      return window.location.origin;
    }
    
    // Fallback final
    return 'https://azyflow.netlify.app';
  }

  /**
   * Notifie l'admin qu'un CRA a été soumis
   */
  static async notifyTimesheetSubmission(data: TimesheetNotificationData): Promise<void> {
    try {
      const emailNotification = this.getSubmissionEmailTemplate(data);
      await this.sendEmail(emailNotification);
      
      // WhatsApp optionnel (si configuré)
      const whatsAppNotification = this.getSubmissionWhatsAppTemplate(data);
      if (whatsAppNotification.to) {
        await this.sendWhatsApp(whatsAppNotification);
      }
    } catch (error) {
      console.error('Error sending timesheet submission notification:', error);
      throw error;
    }
  }

  /**
   * Notifie le freelancer que son CRA a été validé
   */
  static async notifyTimesheetApproval(data: TimesheetNotificationData): Promise<void> {
    try {
      const emailNotification = this.getApprovalEmailTemplate(data);
      await this.sendEmail(emailNotification);
      
      // WhatsApp optionnel (si configuré)
      const whatsAppNotification = this.getApprovalWhatsAppTemplate(data);
      if (whatsAppNotification.to) {
        await this.sendWhatsApp(whatsAppNotification);
      }
    } catch (error) {
      console.error('Error sending timesheet approval notification:', error);
      throw error;
    }
  }

  /**
   * Notifie le freelancer que son CRA a été rejeté
   */
  static async notifyTimesheetRejection(data: TimesheetNotificationData, reason?: string): Promise<void> {
    try {
      const emailNotification = this.getRejectionEmailTemplate(data, reason);
      await this.sendEmail(emailNotification);
      
      // WhatsApp optionnel (si configuré)
      const whatsAppNotification = this.getRejectionWhatsAppTemplate(data, reason);
      if (whatsAppNotification.to) {
        await this.sendWhatsApp(whatsAppNotification);
      }
    } catch (error) {
      console.error('Error sending timesheet rejection notification:', error);
      throw error;
    }
  }

  /**
   * Template email pour notification de soumission CRA (vers admin)
   */
  static getSubmissionEmailTemplate(data: TimesheetNotificationData): EmailNotification {
    const subject = `📋 Nouveau CRA à valider - ${data.freelancerName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Azyflow</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Nouveau CRA à valider</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 20px;">
            📋 Nouveau CRA soumis par ${data.freelancerName}
          </h2>
          
          <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 16px;">Détails du CRA</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Freelancer:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.freelancerName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Client:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.clientName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Période:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.month}/${data.year}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Jours travaillés:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.workedDays} jours</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${this.getAppUrl()}/admin/timesheets" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              🔍 Voir et valider le CRA
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            Cette notification a été envoyée automatiquement par Azyflow
          </p>
        </div>
      </div>
    `;

    return {
      to: data.adminEmail,
      subject,
      html
    };
  }

  /**
   * Template email pour notification de validation CRA (vers freelancer)
   */
  static getApprovalEmailTemplate(data: TimesheetNotificationData): EmailNotification {
    const subject = `✅ CRA validé - ${data.month}/${data.year}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Azyflow</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">CRA validé avec succès</p>
        </div>
        
        <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; border-left: 4px solid #10b981;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <div style="width: 48px; height: 48px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);">
              <div style="width: 24px; height: 24px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 14px; font-weight: bold;">✓</span>
              </div>
            </div>
            <h2 style="color: #065f46; margin: 0; font-size: 20px;">
              Votre CRA a été validé
            </h2>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #10b981; margin: 0 0 15px 0; font-size: 16px;">Détails du CRA validé</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Client:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.clientName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Période:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.month}/${data.year}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Jours travaillés:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.workedDays} jours</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Validé par:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.adminName}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${this.getAppUrl()}/freelancer/timesheets" 
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              📋 Voir mes CRA
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            Cette notification a été envoyée automatiquement par Azyflow
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
   * Template email pour notification de rejet CRA (vers freelancer)
   */
  static getRejectionEmailTemplate(data: TimesheetNotificationData, reason?: string): EmailNotification {
    const subject = `❌ CRA rejeté - ${data.month}/${data.year}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Azyflow</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">CRA rejeté</p>
        </div>
        
        <div style="background: #fef2f2; padding: 25px; border-radius: 8px; border-left: 4px solid #ef4444;">
          <h2 style="color: #991b1b; margin: 0 0 20px 0; font-size: 20px;">
            ❌ Votre CRA a été rejeté
          </h2>
          
          <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #ef4444; margin: 0 0 15px 0; font-size: 16px;">Détails du CRA rejeté</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Client:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.clientName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Période:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.month}/${data.year}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Jours travaillés:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.workedDays} jours</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Rejeté par:</td>
                <td style="padding: 8px 0; color: #64748b;">${data.adminName}</td>
              </tr>
            </table>
          </div>
          
          ${reason ? `
          <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 3px solid #f59e0b;">
            <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 14px;">Motif du rejet:</h4>
            <p style="color: #64748b; margin: 0; font-style: italic;">${reason}</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${this.getAppUrl()}/freelancer/timesheets" 
               style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              📋 Corriger et soumettre à nouveau
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            Cette notification a été envoyée automatiquement par Azyflow
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
   * Template WhatsApp pour notification de soumission CRA (vers admin)
   */
  static getSubmissionWhatsAppTemplate(data: TimesheetNotificationData): WhatsAppNotification {
    const message = `📋 *Nouveau CRA à valider*\n\n` +
                   `👤 Freelancer: ${data.freelancerName}\n` +
                   `🏢 Client: ${data.clientName}\n` +
                   `📅 Période: ${data.month}/${data.year}\n` +
                   `⏰ Jours travaillés: ${data.workedDays}\n\n` +
                   `🔗 Valider: ${this.getAppUrl()}/admin/timesheets`;

    return {
      to: '', // À configurer avec le numéro WhatsApp de l'admin
      message
    };
  }

  /**
   * Template WhatsApp pour notification de validation CRA (vers freelancer)
   */
  static getApprovalWhatsAppTemplate(data: TimesheetNotificationData): WhatsAppNotification {
    const message = `✅ *CRA validé !*\n\n` +
                   `🏢 Client: ${data.clientName}\n` +
                   `📅 Période: ${data.month}/${data.year}\n` +
                   `⏰ Jours travaillés: ${data.workedDays}\n` +
                   `👨‍💼 Validé par: ${data.adminName}\n\n` +
                   `🔗 Voir mes CRA: ${this.getAppUrl()}/freelancer/timesheets`;

    return {
      to: '', // À configurer avec le numéro WhatsApp du freelancer
      message
    };
  }

  /**
   * Template WhatsApp pour notification de rejet CRA (vers freelancer)
   */
  static getRejectionWhatsAppTemplate(data: TimesheetNotificationData, reason?: string): WhatsAppNotification {
    const message = `❌ *CRA rejeté*\n\n` +
                   `🏢 Client: ${data.clientName}\n` +
                   `📅 Période: ${data.month}/${data.year}\n` +
                   `⏰ Jours travaillés: ${data.workedDays}\n` +
                   `👨‍💼 Rejeté par: ${data.adminName}\n` +
                   `${reason ? `\n💬 Motif: ${reason}\n` : ''}\n` +
                   `🔗 Corriger: ${this.getAppUrl()}/freelancer/timesheets`;

    return {
      to: '', // À configurer avec le numéro WhatsApp du freelancer
      message
    };
  }

  /**
   * Envoie un email via l'Edge Function
   */
  static async sendEmail(notification: EmailNotification): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'email',
          notification
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Erreur envoi email: ${error.message}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Envoie un message WhatsApp via l'Edge Function
   */
  static async sendWhatsApp(notification: WhatsAppNotification): Promise<void> {
    try {
      if (!notification.to) {
        console.log('WhatsApp notification skipped: no phone number configured');
        return;
      }

      console.log('Sending WhatsApp notification to:', notification.to);
      
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'whatsapp',
          notification
        }
      });

      if (error) {
        console.error('WhatsApp function error:', error);
        throw new Error(`Erreur envoi WhatsApp: ${error.message}`);
      }

      console.log('WhatsApp sent successfully:', data);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      throw error;
    }
  }
}