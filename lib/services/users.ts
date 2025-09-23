import { supabase } from '../supabase';

export async function inviteFreelancer(
  email: string,
  fullName: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/invite-freelancer`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, full_name: fullName }),
      }
    );
    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || 'Erreur lors de l\'invitation' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur réseau' };
  }
}

import type { Database } from '../database';

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type Freelancer = User;

export class UserService {
  /**
   * Récupère l'id de la société courante
   */
  static async getCurrentCompanyId(): Promise<string | null> {
    const { data } = await supabase.rpc('current_company_id');
    if (Array.isArray(data)) {
      return data[0] ?? null;
    }
    return data ?? null;
  }
  /**
   * Get all users in current company
   */
  /**
   * Récupère tous les freelances de la société courante avec last_login
   */
  static async getAllFreelancers(): Promise<Freelancer[]> {
    const { data: companyIdData } = await supabase.rpc('current_company_id');
    const companyId = Array.isArray(companyIdData) ? companyIdData[0] : companyIdData;
    if (!companyId) {
      console.error('Aucun company_id trouvé');
      return [];
    }
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('company_id', companyId)
      .eq('role', 'freelancer')
      .order('full_name');

    if (error) {
      console.error('Erreur lors du chargement des freelances:', error);
      return [];
    }

    return (data || []).map((u) => ({
      ...u,
      active: u.active ?? false,
      last_login: u.last_login ?? null,
    }));
  }

  /**
   * Met à jour le statut actif/inactif d'un utilisateur
   */
  static async updateUserStatus(id: string, active: boolean): Promise<Freelancer | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ active })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        return null;
      }

      return data ? {
        ...data,
        active: data.active ?? false,
        last_login: data.last_login ?? null,
      } : null;
    } catch (err) {
      console.error('Exception updateUserStatus:', err);
      return null;
    }
  }

  /**
   * Met à jour le numéro de téléphone d'un utilisateur
   */
  static async updateUserPhone(id: string, phone: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ phone })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du téléphone:', error);
        return null;
      }

      return data ? {
        ...data,
        active: data.active ?? false,
        last_login: data.last_login ?? null,
      } : null;
    } catch (err) {
      console.error('Exception updateUserPhone:', err);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  static async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

  return data ? { ...data, active: data.active ?? false } : null;
  }

  /**
   * Create a new user
   */
  static async create(user: UserInsert): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

  return data ? { ...data, active: data.active ?? false } : null;
  }

  /**
   * Update a user
   */
  static async update(id: string, user: UserUpdate): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(user)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }

  return data ? { ...data, active: data.active ?? false } : null;
  }

  /**
   * Récupère un freelance par son id
   */
  static async getFreelancerById(id: string): Promise<Freelancer | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('role', 'freelancer')
      .single();

    if (error) {
      console.error('Erreur chargement freelance:', error);
      return null;
    }

    return data ? { ...data, active: data.active ?? false, last_login: data.last_login ?? null } : null;
  }
  static async getFreelancers(): Promise<User[]> {
    const { data: companyIdData } = await supabase.rpc('current_company_id');
    const companyId = Array.isArray(companyIdData) ? companyIdData[0] : companyIdData;
    if (!companyId) {
      console.error('Aucun company_id trouvé');
      return [];
    }
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('company_id', companyId)
      .eq('role', 'freelancer')
      .order('full_name');

    if (error) {
      console.error('Error fetching freelancers:', error);
      return [];
    }

    return (data || []).map(u => ({
      ...u,
      active: u.active ?? false,
    }));
  }
    /**
     * Désactive un utilisateur (active: false)
     */
    static async deactivateUser(id: string): Promise<User | null> {
      console.log('[UserService.deactivateUser] Tentative de désactivation', { id });
      const { data, error } = await supabase
        .from('users')
        .update({ active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[UserService.deactivateUser] ERREUR lors de la désactivation', {
          id,
          update: { active: false },
          error,
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message,
        });
        return null;
      }

      console.log('[UserService.deactivateUser] Succès', { id, data });
      return data ? { ...data, active: data.active ?? false } : null;
    }
}