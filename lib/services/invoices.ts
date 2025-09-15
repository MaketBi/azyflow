import { supabase } from '../supabase';
import { Tables, TablesInsert, TablesUpdate } from '../database';

export type Invoice = Tables<'invoices'>;
export type InvoiceInsert = TablesInsert<'invoices'>;
export type InvoiceUpdate = TablesUpdate<'invoices'>;

export interface InvoiceWithRelations extends Invoice {
  client: {
    name: string;
  };
  timesheet: {
    month: string;
    worked_days: number;
    contract: {
      user: {
        full_name: string;
      };
      tjm: number;
    };
  };
}

export class InvoiceService {
  /**
   * Get all invoices in current company
   */
  static async getAll(): Promise<InvoiceWithRelations[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(name),
        timesheet:timesheets(
          month,
          worked_days,
          contract:contracts(
            tjm,
            user:users(full_name)
          )
        )
      `)
      .eq('company_id', supabase.rpc('current_company_id'))
      .order('issue_date', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get invoices for current user
   */
  static async getByCurrentUser(): Promise<InvoiceWithRelations[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(name),
        timesheet:timesheets(
          month,
          worked_days,
          contract:contracts(
            tjm,
            user:users(full_name)
          )
        )
      `)
      .eq('timesheet.contract.user_id', supabase.rpc('current_user_id'))
      .order('issue_date', { ascending: false });

    if (error) {
      console.error('Error fetching user invoices:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get invoice by ID
   */
  static async getById(id: string): Promise<InvoiceWithRelations | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(name),
        timesheet:timesheets(
          month,
          worked_days,
          contract:contracts(
            tjm,
            user:users(full_name)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }

    return data;
  }

  /**
   * Create a new invoice
   */
  static async create(invoice: InvoiceInsert): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      return null;
    }

    return data;
  }

  /**
   * Update an invoice
   */
  static async update(id: string, invoice: InvoiceUpdate): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .update(invoice)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice:', error);
      return null;
    }

    return data;
  }

  /**
   * Mark invoice as paid
   */
  static async markAsPaid(id: string): Promise<boolean> {
    const result = await this.update(id, { status: 'paid' });
    return result !== null;
  }

  /**
   * Generate invoice number
   */
  static generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();
    return `INV-${year}${month}-${timestamp}`;
  }

  /**
   * Get unpaid invoices count
   */
  static async getUnpaidCount(): Promise<number> {
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('company_id', supabase.rpc('current_company_id'));

    if (error) {
      console.error('Error counting unpaid invoices:', error);
      return 0;
    }

    return count || 0;
  }
}