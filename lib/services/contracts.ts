import { supabase } from '../supabase';
import { Database } from '../database';

export type Contract = Database['public']['Tables']['contracts']['Row'];
export type ContractInsert = Database['public']['Tables']['contracts']['Insert'];
export type ContractUpdate = Database['public']['Tables']['contracts']['Update'];

export type ContractWithRelations = Contract & {
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  client?: {
    id: string;
    name: string;
  };
  company?: {
    id: string;
    name: string;
  };
};

export interface ContractFormData {
  user_id: string;
  client_id: string;
  tjm: number;
  start_date: string;
  end_date: string;
  commission_rate?: number;
  currency?: string;
  contract_file_url?: string;
  status?: 'active' | 'expired' | 'renewed';
}

export class ContractService {
  /**
   * Get current user data with company_id
   */
  private static async getCurrentUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      throw new Error('Erreur lors de la récupération des informations utilisateur');
    }

    return { user, userData };
  }

  /**
   * Get all contracts for the current company (alias for getAllByCompany)
   */
  static async getAll(): Promise<ContractWithRelations[]> {
    return this.getAllByCompany();
  }

  /**
   * Get all contracts for the current company (admin only)
   */
  static async getAllByCompany(): Promise<ContractWithRelations[]> {
    const { userData } = await this.getCurrentUserData();

    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        user:users!contracts_user_id_fkey(
          id,
          full_name,
          email
        ),
        client:clients!contracts_client_id_fkey(
          id,
          name
        ),
        company:companies!contracts_company_id_fkey(
          id,
          name
        )
      `)
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching company contracts:', error);
      throw new Error('Erreur lors du chargement des contrats');
    }

    return data as ContractWithRelations[] || [];
  }

  /**
   * Get contracts for current freelancer
   */
  static async getByFreelancer(): Promise<ContractWithRelations[]> {
    const { user } = await this.getCurrentUserData();

    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        client:clients!contracts_client_id_fkey(
          id,
          name
        ),
        company:companies!contracts_company_id_fkey(
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching freelancer contracts:', error);
      throw new Error('Erreur lors du chargement des contrats');
    }

    return data as ContractWithRelations[] || [];
  }

  /**
   * Create a new contract
   */
  static async createContract(contractData: ContractFormData): Promise<Contract> {
    const { userData } = await this.getCurrentUserData();

    // Check for existing active contracts for this user-client pair
    const { data: existingContracts, error: checkError } = await supabase
      .from('contracts')
      .select('id, start_date, end_date')
      .eq('user_id', contractData.user_id)
      .eq('client_id', contractData.client_id)
      .eq('status', 'active');

    if (checkError) {
      throw new Error('Erreur lors de la vérification des contrats existants');
    }

    // Check for date overlap
    const newStartDate = new Date(contractData.start_date);
    const newEndDate = new Date(contractData.end_date);

    const hasOverlap = existingContracts?.some(contract => {
      const existingStart = new Date(contract.start_date);
      const existingEnd = new Date(contract.end_date);
      
      return (newStartDate <= existingEnd && newEndDate >= existingStart);
    });

    if (hasOverlap) {
      throw new Error('Un contrat actif existe déjà pour cette période entre ce freelance et ce client');
    }

    const insertData: ContractInsert = {
      ...contractData,
      company_id: userData.company_id,
      commission_rate: contractData.commission_rate || 15.00,
      currency: contractData.currency || 'EUR',
      status: contractData.status || 'active',
    };

    const { data, error } = await supabase
      .from('contracts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating contract:', error);
      throw new Error('Erreur lors de la création du contrat');
    }

    return data;
  }

  /**
   * Update an existing contract
   */
  static async updateContract(id: string, updates: Partial<ContractFormData>): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contract:', error);
      throw new Error('Erreur lors de la mise à jour du contrat');
    }

    return data;
  }

  /**
   * Delete a contract
   */
  static async deleteContract(id: string): Promise<void> {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting contract:', error);
      throw new Error('Erreur lors de la suppression du contrat');
    }
  }

  /**
   * Get active contract for freelancer and client
   */
  static async getActiveContract(userId: string, clientId: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('user_id', userId)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString().split('T')[0])
      .gte('end_date', new Date().toISOString().split('T')[0])
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active contract:', error);
      return null;
    }

    return data;
  }

  /**
   * Get available freelancers for contracts
   */
  static async getAvailableFreelancers() {
    const { userData } = await this.getCurrentUserData();

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'freelancer')
      .eq('company_id', userData.company_id)
      .order('full_name');

    if (error) {
      console.error('Error fetching freelancers:', error);
      throw new Error('Erreur lors du chargement des freelances');
    }

    return data || [];
  }

  /**
   * Get available clients for contracts
   */
  static async getAvailableClients() {
    const { userData } = await this.getCurrentUserData();

    const { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .eq('company_id', userData.company_id)
      .order('name');

    if (error) {
      console.error('Error fetching clients:', error);
      throw new Error('Erreur lors du chargement des clients');
    }

    return data || [];
  }
}