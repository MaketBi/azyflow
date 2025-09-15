import { supabase } from '../supabase';
import { Tables, TablesInsert, TablesUpdate } from '../database';

export type Contract = Tables<'contracts'>;
export type ContractInsert = TablesInsert<'contracts'>;
export type ContractUpdate = TablesUpdate<'contracts'>;

export interface ContractWithRelations extends Contract {
  client: {
    name: string;
  };
  user: {
    full_name: string;
  };
}

export class ContractService {
  /**
   * Get all contracts in current company
   */
  static async getAll(): Promise<ContractWithRelations[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        client:clients(name),
        user:users(full_name)
      `)
      .eq('company_id', supabase.rpc('current_company_id'))
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching contracts:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get contracts for current user
   */
  static async getByCurrentUser(): Promise<ContractWithRelations[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        client:clients(name),
        user:users(full_name)
      `)
      .eq('user_id', supabase.rpc('current_user_id'))
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching user contracts:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get contract by ID
   */
  static async getById(id: string): Promise<ContractWithRelations | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        client:clients(name),
        user:users(full_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching contract:', error);
      return null;
    }

    return data;
  }

  /**
   * Create a new contract
   */
  static async create(contract: ContractInsert): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .insert(contract)
      .select()
      .single();

    if (error) {
      console.error('Error creating contract:', error);
      return null;
    }

    return data;
  }

  /**
   * Update a contract
   */
  static async update(id: string, contract: ContractUpdate): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .update(contract)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contract:', error);
      return null;
    }

    return data;
  }

  /**
   * Delete a contract
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting contract:', error);
      return false;
    }

    return true;
  }

  /**
   * Upload contract file
   */
  static async uploadFile(contractId: string, file: File): Promise<string | null> {
    const fileName = `contracts/${contractId}/${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // Update contract with file URL
    await this.update(contractId, { contract_file_url: publicUrl });

    return publicUrl;
  }
}