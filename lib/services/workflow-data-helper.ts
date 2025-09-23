import { supabase } from '../supabase';
import { 
  WorkflowNotificationData, 
  WorkflowNotificationService 
} from './workflow-notifications.js';

/**
 * Service helper pour récupérer les données nécessaires aux notifications workflow
 */
export class WorkflowDataHelper {

  /**
   * Récupère toutes les données nécessaires pour les notifications workflow
   * à partir d'un ID de timesheet ou d'invoice
   */
  static async getNotificationDataFromTimesheet(timesheetId: string): Promise<WorkflowNotificationData | null> {
    try {
      const { data: timesheetData, error: timesheetError } = await supabase
        .from('timesheets')
        .select(`
          *,
          contract:contracts(
            user_id,
            user:users(id, full_name, email, phone),
            client:clients(id, name),
            tjm,
            commission_rate
          ),
          invoice:invoices(
            id,
            number,
            amount,
            status
          )
        `)
        .eq('id', timesheetId)
        .single();

      if (timesheetError || !timesheetData) {
        console.error('Error fetching timesheet data:', timesheetError);
        return null;
      }

      // Récupérer les infos admin actuelles
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return null;
      }

      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (adminError) {
        console.error('Error fetching admin data:', adminError);
      }

      const contract = timesheetData.contract;
      if (!contract?.user?.full_name || !contract?.client?.name) {
        console.error('Missing contract or user/client data');
        return null;
      }

      const notificationData: WorkflowNotificationData = {
        freelancerName: contract.user.full_name,
        freelancerEmail: contract.user.email || '',
        freelancerPhone: contract.user.phone || undefined,
        freelancerId: contract.user_id, // ✅ Ajouté pour les préférences
        adminName: adminData?.full_name || 'Admin',
        adminId: user.id, // ✅ Ajouté pour les préférences  
        clientName: contract.client.name,
        month: typeof timesheetData.month === 'number' ? timesheetData.month : new Date().getMonth() + 1,
        year: timesheetData.year || new Date().getFullYear(),
        workedDays: timesheetData.worked_days,
        amount: timesheetData.worked_days * contract.tjm,
        timesheetId: timesheetId,
        invoiceId: timesheetData.invoice?.id,
        invoiceNumber: timesheetData.invoice?.number
      };

      return notificationData;
    } catch (error) {
      console.error('Error in getNotificationDataFromTimesheet:', error);
      return null;
    }
  }

  /**
   * Récupère les données de notification à partir d'un ID d'invoice
   */
  static async getNotificationDataFromInvoice(invoiceId: string): Promise<WorkflowNotificationData | null> {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          timesheet:timesheets(
            id,
            month,
            year,
            worked_days,
            contract:contracts(
              user_id,
              user:users(id, full_name, email, phone),
              client:clients(id, name),
              tjm
            )
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoiceData) {
        console.error('Error fetching invoice data:', invoiceError);
        return null;
      }

      // Récupérer les infos admin actuelles
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return null;
      }

      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (adminError) {
        console.error('Error fetching admin data:', adminError);
      }

      const timesheet = invoiceData.timesheet;
      const contract = timesheet?.contract;
      
      if (!contract?.user?.full_name || !contract?.client?.name) {
        console.error('Missing contract or user/client data');
        return null;
      }

      const notificationData: WorkflowNotificationData = {
        freelancerName: contract.user.full_name,
        freelancerEmail: contract.user.email || '',
        freelancerPhone: contract.user.phone || undefined,
        freelancerId: contract.user_id, // ✅ Ajouté pour les préférences
        adminName: adminData?.full_name || 'Admin',
        adminId: user.id, // ✅ Ajouté pour les préférences
        clientName: contract.client.name,
        month: typeof timesheet.month === 'number' ? timesheet.month : new Date().getMonth() + 1,
        year: timesheet.year || new Date().getFullYear(),
        workedDays: timesheet.worked_days,
        amount: invoiceData.amount,
        timesheetId: timesheet.id,
        invoiceId: invoiceId,
        invoiceNumber: invoiceData.number
      };

      return notificationData;
    } catch (error) {
      console.error('Error in getNotificationDataFromInvoice:', error);
      return null;
    }
  }

  /**
   * Wrapper pour envoyer facilement une notification workflow
   * en récupérant automatiquement les données nécessaires
   */
  static async sendWorkflowNotification(
    type: 'timesheet_validated' | 'invoice_sent' | 'payment_received' | 'freelancer_paid',
    timesheetId?: string,
    invoiceId?: string
  ): Promise<boolean> {
    try {
      let notificationData: WorkflowNotificationData | null = null;

      if (timesheetId) {
        notificationData = await this.getNotificationDataFromTimesheet(timesheetId);
      } else if (invoiceId) {
        notificationData = await this.getNotificationDataFromInvoice(invoiceId);
      }

      if (!notificationData) {
        console.error('Impossible de récupérer les données de notification');
        return false;
      }

      switch (type) {
        case 'timesheet_validated':
          await WorkflowNotificationService.notifyTimesheetValidatedWithInvoice(notificationData);
          break;
        case 'invoice_sent':
          await WorkflowNotificationService.notifyInvoiceSentToClient(notificationData);
          break;
        case 'payment_received':
          await WorkflowNotificationService.notifyPaymentReceivedFromClient(notificationData);
          break;
        case 'freelancer_paid':
          await WorkflowNotificationService.notifyFreelancerPaid(notificationData);
          break;
        default:
          console.error('Type de notification inconnu:', type);
          return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification workflow:', error);
      return false;
    }
  }
}