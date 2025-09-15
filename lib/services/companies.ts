import { supabase } from '../supabase';
import { Database } from '../database';

export type Company = Database['public']['Tables']['companies']['Row'];
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

export class CompanyService {
  /**
   * Test database connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('count')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Get all companies (for public access during signup)
   */
  static async getAll(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get company by ID
   */
  static async getById(id: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching company:', error);
      return null;
    }

    return data;
  }

  /**
   * Create a new company
   */
  static async create(company: CompanyInsert): Promise<Company | null> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert(company)
        .select()
        .single();

      if (error) {
        console.error('Error creating company:', error);
        throw new Error(`Erreur création société: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Company creation failed:', err);
      throw err;
    }
  }

  /**
   * Update a company
   */
  static async update(id: string, company: CompanyUpdate): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .update(company)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating company:', error);
      return null;
    }

    return data;
  }
}