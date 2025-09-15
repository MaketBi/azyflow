import { supabase } from '../supabase';
import { Tables, TablesInsert, TablesUpdate } from '../database';

export type Client = Tables<'clients'>;
export type ClientInsert = TablesInsert<'clients'>;
export type ClientUpdate = TablesUpdate<'clients'>;

export class ClientService {
  /**
   * Get all clients in current company
   */
  static async getAll(): Promise<Client[]> {

    // Récupère le company_id via le RPC
    const { data: companyIdData, error: rpcError } = await supabase.rpc('current_company_id');
    const companyId = Array.isArray(companyIdData) ? companyIdData[0] : companyIdData;
    if (!companyId) {
      console.error('Aucun company_id trouvé');
      return [];
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get client by ID
   */
  static async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching client:', error);
      return null;
    }

    return data;
  }

  /**
   * Create a new client
   */
  static async create(client: ClientInsert): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return null;
    }

    return data;
  }

  /**
   * Update a client
   */
  static async update(id: string, client: ClientUpdate): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .update(client)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return null;
    }

    return data;
  }

  /**
   * Delete a client
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting client:', error);
      return false;
    }

    return true;
  }
}