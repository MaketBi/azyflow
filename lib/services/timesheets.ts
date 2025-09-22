import { supabase } from '../supabase';
import { Database } from '../database';
import { NotificationService, TimesheetNotificationData } from './notifications';
import { InvoiceService, InvoiceInsert } from './invoices';

export type Timesheet = Database['public']['Tables']['timesheets']['Row'];
export type TimesheetInsert = Database['public']['Tables']['timesheets']['Insert'];
export type TimesheetUpdate = Database['public']['Tables']['timesheets']['Update'];

export type TimesheetWithRelations = Timesheet & {
  contract?: {
    client?: {
      id: string;
      name: string;
    };
    user?: {
      full_name: string;
    };
    tjm: number;
    client_id: string;
  };
  client?: {
    id: string;
    name: string;
  };
  invoice?: {
    id: string;
    status: string;
    paid_at: string | null;
  } | null;
};

export class TimesheetService {
  /**
   * Get all timesheets for current company (admin only)
   */
  static async getAll(): Promise<TimesheetWithRelations[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    // Get current user's company_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      throw new Error('Erreur lors de la récupération des informations utilisateur');
    }

    if (userData.role !== 'admin') {
      throw new Error('Accès non autorisé - Admin requis');
    }

    const { data, error } = await supabase
      .from('timesheets')
      .select(`
        *,
        contract:contracts!inner(
          tjm,
          client_id,
          client:clients(id, name),
          user:users(full_name)
        )
      `)
      .eq('contract.company_id', userData.company_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching company timesheets:', error);
      throw new Error('Erreur lors du chargement des timesheets');
    }

    return (data as any) || [];
  }

  /**
   * Get timesheets for current user (freelancer)
   */
  static async getByCurrentUser(): Promise<TimesheetWithRelations[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    const { data, error } = await supabase
      .from('timesheets')
      .select(`
        *,
        contract:contracts!inner(
          tjm,
          client_id,
          client:clients(id, name),
          user:users(full_name)
        ),
        invoice:invoices(
          id,
          status,
          paid_at
        )
      `)
      .eq('contract.user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user timesheets:', error);
      return [];
    }

    return (data as any) || [];
  }

  /**
   * Get clients available for current user to create timesheets
   */
  static async getAvailableClients() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    const { data, error } = await supabase
      .from('client_freelancers')
      .select(`
        client:clients (
          id,
          name
        )
      `)
      .eq('freelancer_id', user.id);

    if (error) {
      console.error('Error fetching available clients:', error);
      return [];
    }

    // Extract clients from the relations
    const clients = data
      ?.map(relation => relation.client)
      .filter(client => client)
      .map(client => ({
        id: client.id,
        name: client.name
      }));

    return clients || [];
  }

  /**
   * Check if a timesheet already exists for a given month/year and contract
   */
  static async checkExistingTimesheet(contractId: string, month: string, year: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('timesheets')
      .select('id')
      .eq('contract_id', contractId)
      .eq('month', month)
      .eq('year', year)
      .limit(1);

    if (error) {
      console.error('Error checking existing timesheet:', error);
      return false;
    }

    return data.length > 0;
  }

  /**
   * Create timesheet as draft
   */
  static async createDraft(data: {
    client_id: string;
    worked_days: number;
    month: string;
    year: number;
  }): Promise<Timesheet | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    // Debug: vérifier les contrats disponibles
    const { data: allContracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .eq('client_id', data.client_id)
      .eq('user_id', user.id);

    console.log('All contracts for client:', allContracts);
    console.log('Contracts error:', contractsError);

    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id')
      .eq('client_id', data.client_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    console.log('Active contract:', contract);
    console.log('Contract error:', contractError);

    if (!contract) {
      throw new Error('Aucun contrat actif trouvé pour ce client');
    }

    // Vérifier s'il existe déjà un CRA pour ce mois
    const existingTimesheet = await this.checkExistingTimesheet(contract.id, data.month, data.year);
    if (existingTimesheet) {
      throw new Error(`Un CRA existe déjà pour ${data.month}/${data.year}. Vous ne pouvez créer qu'un seul CRA par mois.`);
    }

    const { data: result, error } = await supabase
      .from('timesheets')
      .insert({
        contract_id: contract.id,
        worked_days: data.worked_days,
        month: data.month,
        year: data.year,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating draft timesheet:', error);
      throw new Error(`Erreur création CRA brouillon: ${error.message}`);
    }

    return result;
  }

  /**
   * Create timesheet as submitted
   */
  static async createSubmitted(data: {
    client_id: string;
    worked_days: number;
    month: string;
    year: number;
  }): Promise<Timesheet | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    const { data: contract } = await supabase
      .from('contracts')
      .select('id')
      .eq('client_id', data.client_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!contract) {
      throw new Error('Aucun contrat actif trouvé pour ce client');
    }

    // Vérifier s'il existe déjà un CRA pour ce mois
    const existingTimesheet = await this.checkExistingTimesheet(contract.id, data.month, data.year);
    if (existingTimesheet) {
      throw new Error(`Un CRA existe déjà pour ${data.month}/${data.year}. Vous ne pouvez créer qu'un seul CRA par mois.`);
    }

    const { data: result, error } = await supabase
      .from('timesheets')
      .insert({
        contract_id: contract.id,
        worked_days: data.worked_days,
        month: data.month,
        year: data.year,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating submitted timesheet:', error);
      throw new Error(`Erreur soumission CRA: ${error.message}`);
    }

    // Envoyer notification à l'admin après création réussie
    try {
      await this.sendSubmissionNotification(result);
    } catch (notificationError) {
      console.error('Error sending submission notification:', notificationError);
      // Ne pas faire échouer la création du CRA si la notification échoue
    }

    return result;
  }

  /**
   * Submit a draft timesheet
   */
  static async submit(id: string): Promise<Timesheet | null> {
    // First, verify the timesheet exists and belongs to current user
    const { data: currentTimesheet, error: fetchError } = await supabase
      .from('timesheets')
      .select(`
        *,
        contract:contracts(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !currentTimesheet) {
      console.error('Error fetching timesheet for submission:', fetchError);
      throw new Error('CRA non trouvé');
    }

    console.log('Current timesheet before update:', currentTimesheet);

    // Verify it's a draft
    if (currentTimesheet.status !== 'draft') {
      throw new Error('Seuls les CRA en brouillon peuvent être soumis');
    }

    // Verify contract belongs to current user
    const { data: user } = await supabase.auth.getUser();
    if (!user.user || currentTimesheet.contract.user_id !== user.user.id) {
      throw new Error('Vous n\'êtes pas autorisé à soumettre ce CRA');
    }

    console.log('Attempting to update timesheet with status: submitted');

    const { data, error } = await supabase
      .from('timesheets')
      .update({ 
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error submitting timesheet:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw new Error(`Erreur lors de la soumission: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a draft timesheet
   */
  static async updateDraft(id: string, data: {
    worked_days: number;
    month: string;
    year: number;
  }): Promise<Timesheet | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    // Verify that the timesheet belongs to the user and is a draft
    const { data: timesheet, error: fetchError } = await supabase
      .from('timesheets')
      .select(`
        *,
        contract:contracts!inner(user_id)
      `)
      .eq('id', id)
      .eq('status', 'draft')
      .eq('contract.user_id', user.id)
      .single();

    if (fetchError || !timesheet) {
      throw new Error('CRA non trouvé ou non modifiable');
    }

    const { data: result, error } = await supabase
      .from('timesheets')
      .update({
        worked_days: data.worked_days,
        month: data.month,
        year: data.year,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating timesheet:', error);
      throw new Error('Erreur lors de la mise à jour du CRA');
    }

    return result;
  }

  /**
   * Approve a timesheet (admin only)
   */
  static async approve(id: string): Promise<Timesheet | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    // Verify admin role and get company_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      throw new Error('Accès non autorisé - Admin requis');
    }

    if (!userData.company_id) {
      throw new Error('Company ID manquant pour l\'utilisateur');
    }

    // Get timesheet with relations for invoice creation
    const { data: timesheetData, error: timesheetError } = await supabase
      .from('timesheets')
      .select(`
        *,
        contract:contracts(
          user:users(full_name, email),
          client:clients(id, name, billing_email),
          tjm,
          commission_rate,
          client_id
        )
      `)
      .eq('id', id)
      .single();

    if (timesheetError || !timesheetData) {
      throw new Error('Timesheet non trouvé');
    }

    // Update timesheet status
    const { data, error } = await supabase
      .from('timesheets')
      .update({ 
        status: 'approved',
        validated_at: new Date().toISOString(),
        admin_id: user.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error approving timesheet:', error);
      throw new Error('Erreur lors de l\'approbation du timesheet');
    }

    // Automatically create invoice when timesheet is approved
    try {
      const contract = timesheetData.contract;
      if (!contract?.user?.full_name || !contract?.client?.id) {
        throw new Error('Données de contrat insuffisantes pour créer la facture');
      }

      const totalAmount = timesheetData.worked_days * contract.tjm;
      const commissionAmount = contract.commission_rate ? 
        (totalAmount * contract.commission_rate / 100) : 0;
      const netAmount = totalAmount - commissionAmount;

      const invoiceData: InvoiceInsert = {
        timesheet_id: id,
        client_id: contract.client_id,
        company_id: userData.company_id,
        amount: totalAmount,
        commission_amount: commissionAmount,
        facturation_net: netAmount,
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
        status: 'draft',
        number: await this.generateInvoiceNumber()
      };

      await InvoiceService.create(invoiceData);
      console.log('Facture créée automatiquement pour le timesheet:', id);
    } catch (invoiceError) {
      console.error('Error creating automatic invoice:', invoiceError);
      // Ne pas faire échouer l'approbation si la création de facture échoue
      // On peut notifier l'admin plus tard
    }

    // Envoyer notification au freelancer après approbation réussie
    try {
      await this.sendApprovalNotification(data);
    } catch (notificationError) {
      console.error('Error sending approval notification:', notificationError);
      // Ne pas faire échouer l'approbation si la notification échoue
    }

    return data;
  }

  /**
   * Generate a unique invoice number
   */
  private static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get the count of invoices this month
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-${month}-01`)
      .lt('created_at', `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`);

    if (error) {
      console.error('Error counting invoices:', error);
      // Fallback to timestamp
      return `INV-${year}${month}-${Date.now()}`;
    }

    const invoiceNumber = String((count || 0) + 1).padStart(3, '0');
    return `INV-${year}${month}-${invoiceNumber}`;
  }

  /**
   * Reject a timesheet (admin only)
   */
  static async reject(id: string): Promise<Timesheet | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    // Verify admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      throw new Error('Accès non autorisé - Admin requis');
    }

    const { data, error } = await supabase
      .from('timesheets')
      .update({ 
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        admin_id: user.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting timesheet:', error);
      throw new Error('Erreur lors du rejet du timesheet');
    }

    // Envoyer notification au freelancer après rejet
    try {
      await this.sendRejectionNotification(data);
    } catch (notificationError) {
      console.error('Error sending rejection notification:', notificationError);
      // Ne pas faire échouer le rejet si la notification échoue
    }

    return data;
  }

  /**
   * Helper pour envoyer notification de soumission
   */
  private static async sendSubmissionNotification(timesheet: Timesheet): Promise<void> {
    try {
      // Récupérer les détails complets du timesheet avec relations
      const { data: timesheetData, error } = await supabase
        .from('timesheets')
        .select(`
          *,
          contract:contracts (
            *,
            user:users (
              id,
              email,
              full_name
            ),
            client:clients (
              id,
              name
            ),
            company:companies (
              id,
              name
            )
          )
        `)
        .eq('id', timesheet.id)
        .single();

      if (error || !timesheetData) {
        throw new Error('Impossible de récupérer les détails du timesheet');
      }

      // Récupérer l'admin de la compagnie
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('company_id', timesheetData.contract.company.id)
        .eq('role', 'admin')
        .single();

      if (adminError || !adminData) {
        throw new Error('Impossible de trouver l\'admin de la compagnie');
      }

      // Préparer les données de notification
      const notificationData: TimesheetNotificationData = {
        freelancerName: timesheetData.contract.user.full_name,
        freelancerEmail: timesheetData.contract.user.email,
        adminName: adminData.full_name,
        adminEmail: adminData.email,
        clientName: timesheetData.contract.client.name,
        month: timesheetData.month,
        year: timesheetData.year || new Date().getFullYear(),
        workedDays: timesheetData.worked_days,
        timesheetId: timesheet.id
      };

      // Envoyer la notification
      await NotificationService.notifyTimesheetSubmission(notificationData);
    } catch (error) {
      console.error('Error in sendSubmissionNotification:', error);
      throw error;
    }
  }

  /**
   * Helper pour envoyer notification de validation
   */
  private static async sendApprovalNotification(timesheet: Timesheet): Promise<void> {
    try {
      // Récupérer les détails complets du timesheet avec relations
      const { data: timesheetData, error } = await supabase
        .from('timesheets')
        .select(`
          *,
          contract:contracts (
            *,
            user:users (
              id,
              email,
              full_name
            ),
            client:clients (
              id,
              name
            )
          ),
          admin:users!admin_id (
            id,
            email,
            full_name
          )
        `)
        .eq('id', timesheet.id)
        .single();

      if (error || !timesheetData) {
        throw new Error('Impossible de récupérer les détails du timesheet');
      }

      // Préparer les données de notification
      const notificationData: TimesheetNotificationData = {
        freelancerName: timesheetData.contract.user.full_name,
        freelancerEmail: timesheetData.contract.user.email,
        adminName: timesheetData.admin?.full_name || 'Administrateur',
        adminEmail: timesheetData.admin?.email || '',
        clientName: timesheetData.contract.client.name,
        month: timesheetData.month,
        year: timesheetData.year || new Date().getFullYear(),
        workedDays: timesheetData.worked_days,
        timesheetId: timesheet.id
      };

      // Envoyer la notification
      await NotificationService.notifyTimesheetApproval(notificationData);
    } catch (error) {
      console.error('Error in sendApprovalNotification:', error);
      throw error;
    }
  }

  /**
   * Helper pour envoyer notification de rejet
   */
  private static async sendRejectionNotification(timesheet: Timesheet, reason?: string): Promise<void> {
    try {
      // Récupérer les détails complets du timesheet avec relations
      const { data: timesheetData, error } = await supabase
        .from('timesheets')
        .select(`
          *,
          contract:contracts (
            *,
            user:users (
              id,
              email,
              full_name
            ),
            client:clients (
              id,
              name
            )
          ),
          admin:users!admin_id (
            id,
            email,
            full_name
          )
        `)
        .eq('id', timesheet.id)
        .single();

      if (error || !timesheetData) {
        throw new Error('Impossible de récupérer les détails du timesheet');
      }

      // Préparer les données de notification
      const notificationData: TimesheetNotificationData = {
        freelancerName: timesheetData.contract.user.full_name,
        freelancerEmail: timesheetData.contract.user.email,
        adminName: timesheetData.admin?.full_name || 'Administrateur',
        adminEmail: timesheetData.admin?.email || '',
        clientName: timesheetData.contract.client.name,
        month: timesheetData.month,
        year: timesheetData.year || new Date().getFullYear(),
        workedDays: timesheetData.worked_days,
        timesheetId: timesheet.id
      };

      // Envoyer la notification
      await NotificationService.notifyTimesheetRejection(notificationData, reason);
    } catch (error) {
      console.error('Error in sendRejectionNotification:', error);
      throw error;
    }
  }
}