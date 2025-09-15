import { supabase } from '../supabase';
import { Database } from '../database';

export type Timesheet = Database['public']['Tables']['timesheets']['Row'];
export type TimesheetInsert = Database['public']['Tables']['timesheets']['Insert'];
export type TimesheetUpdate = Database['public']['Tables']['timesheets']['Update'];

export interface TimesheetWithRelations extends Timesheet {
  contract: {
    client: {
      name: string;
    };
    user: {
      full_name: string;
    };
    tjm: number;
  };
}

export class TimesheetService {
  /**
   * Get all timesheets in current company
   */
  static async getAll(): Promise<TimesheetWithRelations[]> {
    // Récupérer l'utilisateur actuel pour obtenir sa company_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    // Récupérer le profil utilisateur pour obtenir company_id
    const { data: profile } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      // Retourner un tableau vide au lieu d'une erreur si pas de société
      console.log('Utilisateur sans société - retour tableau vide');
      return [];
    }

    const { data, error } = await supabase
      .from('timesheets')
      .select(`
        *,
        contract:contracts!inner(
          tjm,
          company_id,
          client:clients(name),
          user:users(full_name)
        )
      `)
      .eq('contract.company_id', profile.company_id)
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching timesheets:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get timesheets for current user
   */
  static async getByCurrentUser(): Promise<TimesheetWithRelations[]> {
    const { data, error } = await supabase
      .from('timesheets')
      .select(`
        *,
        contract:contracts(
          tjm,
          client:clients(name),
          user:users(full_name)
        )
      `)
      .eq('contract.user_id', supabase.rpc('current_user_id'))
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching user timesheets:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get timesheet by ID
   */
  static async getById(id: string): Promise<TimesheetWithRelations | null> {
    const { data, error } = await supabase
      .from('timesheets')
      .select(`
        *,
        contract:contracts(
          tjm,
          client:clients(name),
          user:users(full_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching timesheet:', error);
      return null;
    }

    return data;
  }

  /**
   * Create a new timesheet
   */
  static async create(timesheet: TimesheetInsert): Promise<Timesheet | null> {
    const { data, error } = await supabase
      .from('timesheets')
      .insert(timesheet)
      .select()
      .single();

    if (error) {
      console.error('Error creating timesheet:', error);
      return null;
    }

    return data;
  }

  /**
   * Update a timesheet
   */
  static async update(id: string, timesheet: TimesheetUpdate): Promise<Timesheet | null> {
    const { data, error } = await supabase
      .from('timesheets')
      .update(timesheet)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating timesheet:', error);
      return null;
    }

    return data;
  }

  /**
   * Approve a timesheet
   */
  static async approve(id: string): Promise<boolean> {
    const result = await this.update(id, { status: 'approved' });
    return result !== null;
  }

  /**
   * Reject a timesheet
   */
  static async reject(id: string): Promise<boolean> {
    const result = await this.update(id, { status: 'rejected' });
    return result !== null;
  }

  /**
   * Get pending timesheets count
   */
  static async getPendingCount(): Promise<number> {
    const { count, error } = await supabase
      .from('timesheets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('contract.company_id', supabase.rpc('current_company_id'));

    if (error) {
      console.error('Error counting pending timesheets:', error);
      return 0;
    }

    return count || 0;
  }
}