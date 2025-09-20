import { supabase } from '../supabase';
import { Database } from '../database';

export type ClientFreelancer = Database['public']['Tables']['client_freelancers']['Row'];
export type ClientFreelancerInsert = Database['public']['Tables']['client_freelancers']['Insert'];

export interface FreelancerWithLinkStatus {
  id: string;
  full_name: string;
  email: string;
  is_linked: boolean;
}

export interface LinkedClient {
  id: string;
  name: string;
}

export class ClientFreelancerService {
  /**
   * Récupérer tous les freelances disponibles pour un client avec leur statut de liaison
   */
  static async getAvailableFreelancersForClient(clientId: string): Promise<FreelancerWithLinkStatus[]> {
    // D'abord récupérer tous les freelances de la société
    const { data: client } = await supabase
      .from('clients')
      .select('company_id')
      .eq('id', clientId)
      .single();

    if (!client) {
      throw new Error('Client non trouvé');
    }

    const { data: freelancers, error: freelancersError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'freelancer')
      .eq('company_id', client.company_id);

    if (freelancersError) {
      console.error('Error fetching freelancers:', freelancersError);
      throw freelancersError;
    }

    // Récupérer les relations existantes
    const { data: links, error: linksError } = await supabase
      .from('client_freelancers')
      .select('freelancer_id')
      .eq('client_id', clientId);

    if (linksError) {
      console.error('Error fetching links:', linksError);
      throw linksError;
    }

    const linkedFreelancerIds = new Set(links?.map(link => link.freelancer_id) || []);

    return (freelancers || []).map(freelancer => ({
      id: freelancer.id,
      full_name: freelancer.full_name || '',
      email: freelancer.email || '',
      is_linked: linkedFreelancerIds.has(freelancer.id)
    }));
  }

  /**
   * Récupérer les clients liés à un freelance
   */
  static async getLinkedClientsForFreelancer(freelancerId: string): Promise<LinkedClient[]> {
    const { data, error } = await supabase
      .from('client_freelancers')
      .select(`
        client:clients (
          id,
          name
        )
      `)
      .eq('freelancer_id', freelancerId);

    if (error) {
      console.error('Error fetching linked clients for freelancer:', error);
      throw error;
    }

    return (data || [])
      .map(item => item.client)
      .filter(client => client)
      .map(client => ({
        id: client.id,
        name: client.name
      }));
  }

  /**
   * Lier un freelance à un client
   */
  static async linkFreelancerToClient(clientId: string, freelancerId: string): Promise<ClientFreelancer | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('client_freelancers')
      .insert({
        client_id: clientId,
        freelancer_id: freelancerId,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error linking freelancer to client:', error);
      throw error;
    }

    return data;
  }

  /**
   * Délier un freelance d'un client
   */
  static async unlinkFreelancerFromClient(clientId: string, freelancerId: string): Promise<boolean> {
    const { error } = await supabase
      .from('client_freelancers')
      .delete()
      .eq('client_id', clientId)
      .eq('freelancer_id', freelancerId);

    if (error) {
      console.error('Error unlinking freelancer from client:', error);
      throw error;
    }

    return true;
  }

  /**
   * Récupérer toutes les relations pour un client
   */
  static async getClientFreelancerRelations(clientId: string): Promise<ClientFreelancer[]> {
    const { data, error } = await supabase
      .from('client_freelancers')
      .select('*')
      .eq('client_id', clientId);

    if (error) {
      console.error('Error fetching client freelancer relations:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Vérifier si un freelance est lié à un client
   */
  static async isFreelancerLinkedToClient(clientId: string, freelancerId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('client_freelancers')
      .select('id')
      .eq('client_id', clientId)
      .eq('freelancer_id', freelancerId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking freelancer client link:', error);
      throw error;
    }

    return !!data;
  }
}