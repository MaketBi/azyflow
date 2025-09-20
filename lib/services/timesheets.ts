import { supabase } from '../supabase';
import { Database } from '../database';

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

    return data;
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

    return data;
  }
}