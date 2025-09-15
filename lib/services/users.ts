// supabaseAdmin removed

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
import { supabase } from '../supabase';
import { Tables, TablesInsert, TablesUpdate } from '../database';

export type User = Tables<'users'> & {
  active: boolean;
};
export type UserInsert = TablesInsert<'users'>;
export type UserUpdate = TablesUpdate<'users'>;

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
  static async getAll(): Promise<User[]> {
    const { data: companyIdData, error: rpcError } = await supabase.rpc('current_company_id');
    // DEBUG: Supprime les logs détaillés, ne garde que les erreurs
    // const user = await supabase.auth.getUser();
    // console.log('[UserService.getAll] user.id:', user.data?.user?.id);
    // console.log('[UserService.getAll] RPC result:', companyIdData, 'error:', rpcError);
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
      console.error('Error fetching users:', error);
      return [];
    }

      return (data || []).map(u => ({
        ...u,
        active: u.active ?? false,
      }));
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
   * Get freelancers in current company
   */
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
}