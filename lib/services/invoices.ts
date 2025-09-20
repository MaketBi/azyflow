import { supabase } from '../supabase';
import { Tables, TablesInsert, TablesUpdate } from '../database';
import jsPDF from 'jspdf';

export type Invoice = Tables<'invoices'>;
export type InvoiceInsert = TablesInsert<'invoices'>;
export type InvoiceUpdate = TablesUpdate<'invoices'>;

export interface InvoiceWithRelations extends Invoice {
  company: {
    name: string;
    id: string;
  };
  client: {
    name: string;
    billing_email?: string;
    address?: string;
  };
  timesheet: {
    month: string;
    year?: number | null;
    worked_days: number;
    contract: {
      user: {
        full_name: string;
        email?: string | null;
      };
      tjm: number;
      commission_rate?: number | null;
    };
  };
}

export class InvoiceService {
  static async getAll(): Promise<InvoiceWithRelations[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        company:companies(name, id),
        client:clients(name),
        timesheet:timesheets(
          month,
          year,
          worked_days,
          contract:contracts(
            tjm,
            commission_rate,
            user:users(full_name, email)
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      throw new Error(`Erreur lors du chargement des factures: ${error.message}`);
    }

    return data || [];
  }

  static async getByCurrentUser(): Promise<InvoiceWithRelations[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        company:companies(name, id),
        client:clients(name),
        timesheet:timesheets(
          month,
          year,
          worked_days,
          contract:contracts(
            tjm,
            commission_rate,
            user:users(full_name, email)
          )
        )
      `)
      .eq('timesheet.contract.user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user invoices:', error);
      return [];
    }

    return data || [];
  }

  static async getById(id: string): Promise<InvoiceWithRelations | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        company:companies(name, id),
        client:clients(name),
        timesheet:timesheets(
          month,
          year,
          worked_days,
          contract:contracts(
            tjm,
            commission_rate,
            user:users(full_name, email)
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

  static async create(invoice: InvoiceInsert): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      throw new Error(`Erreur lors de la création: ${error.message}`);
    }

    return data;
  }

  static async update(id: string, invoice: InvoiceUpdate): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .update(invoice)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice:', error);
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting invoice:', error);
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }
  }

  static async getUnpaidCount(): Promise<number> {
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'paid');

    if (error) {
      console.error('Error counting unpaid invoices:', error);
      return 0;
    }

    return count || 0;
  }

  static async updateStatus(id: string, status: 'pending' | 'sent' | 'paid' | 'overdue'): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .update({ 
        status,
        ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {})
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice status:', error);
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }

    return data;
  }

  static async generatePDF(invoice: InvoiceWithRelations): Promise<Blob> {
    const doc = new jsPDF();
    
    // Configuration de la police
    doc.setFontSize(20);
    doc.text('FACTURE', 20, 30);
    doc.setFontSize(16);
    doc.text(invoice.number || '', 20, 45);
    
    // Informations générales
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}`, 20, 50);
    
    // De (Compagnie)
    doc.setFontSize(14);
    doc.text('DE (COMPAGNIE)', 20, 70);
    doc.setFontSize(10);
    doc.text(invoice.company?.name || '', 20, 80);
    doc.text('contact@azyflow.com', 20, 90);
    
    // À (Freelance)
    doc.setFontSize(14);
    doc.text('À (FREELANCE)', 120, 70);
    doc.setFontSize(10);
    doc.text(invoice.timesheet?.contract?.user?.full_name || '', 120, 80);
    doc.text(invoice.timesheet?.contract?.user?.email || '', 120, 90);
    
    // Mission
    doc.setFontSize(14);
    doc.text('MISSION', 20, 110);
    doc.setFontSize(10);
    doc.text(invoice.client?.name || '', 20, 120);
    
    // Détails
    doc.setFontSize(14);
    doc.text('DÉTAILS', 20, 140);
    doc.setFontSize(10);
    doc.text(`Période: ${invoice.timesheet?.month} ${invoice.timesheet?.year}`, 20, 150);
    doc.text(`Jours travaillés: ${invoice.timesheet?.worked_days}`, 20, 160);
    doc.text(`TJM: ${invoice.timesheet?.contract?.tjm}€`, 20, 170);
    
    // Montants
    doc.setFontSize(14);
    doc.text('MONTANTS', 20, 190);
    doc.setFontSize(10);
    doc.text(`Facturation HT: ${invoice.facturation_ht?.toFixed(2)}€`, 20, 200);
    doc.text(`Commission (${invoice.timesheet?.contract?.commission_rate}%): -${invoice.commission_amount?.toFixed(2)}€`, 20, 210);
    doc.setFontSize(12);
    doc.text(`Total: ${invoice.facturation_net?.toFixed(2)}€`, 20, 225);
    
    if (invoice.amount_cfa) {
      doc.setFontSize(10);
      doc.text(`Équivalent CFA: ${invoice.amount_cfa?.toFixed(2)} FCFA`, 20, 235);
    }
    
    // Statut
    doc.setFontSize(10);
    doc.text(`Statut: ${invoice.status.toUpperCase()}`, 20, 250);
    
    // Footer
    doc.setFontSize(8);
    doc.text('Facture générée automatiquement par Azyflow', 20, 280);
    
    return doc.output('blob');
  }

  static downloadPDF(invoice: InvoiceWithRelations): void {
    this.generatePDF(invoice).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  static shareByEmail(invoice: InvoiceWithRelations): void {
    const subject = `Facture ${invoice.number} - ${invoice.company?.name}`;
    const body = `Bonjour ${invoice.timesheet?.contract?.user?.full_name},

Veuillez trouver ci-joint la facture ${invoice.number} pour la période ${invoice.timesheet?.month} ${invoice.timesheet?.year}.

Mission: ${invoice.client?.name}
Montant net: ${invoice.facturation_net?.toFixed(2)}€
Montant CFA: ${invoice.amount_cfa?.toFixed(2)} FCFA

Cordialement,
${invoice.company?.name}`;

    const emailUrl = `mailto:${invoice.timesheet?.contract?.user?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
  }

  static shareByWhatsApp(invoice: InvoiceWithRelations): void {
    const message = `📄 Facture ${invoice.number} - ${invoice.company?.name}

👤 Destinataire: ${invoice.timesheet?.contract?.user?.full_name}
📅 Période: ${invoice.timesheet?.month} ${invoice.timesheet?.year}
💼 Mission: ${invoice.client?.name}

💰 Net consultant: ${invoice.facturation_net?.toFixed(2)}€
💱 Montant CFA: ${invoice.amount_cfa?.toFixed(2)} FCFA

📋 Statut: ${invoice.status.toUpperCase()}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  static async copyLink(invoiceId: string): Promise<void> {
    const link = `${window.location.origin}/admin/invoices/${invoiceId}`;
    await navigator.clipboard.writeText(link);
  }

  static async shareLink(invoice: InvoiceWithRelations): Promise<void> {
    const link = `${window.location.origin}/admin/invoices/${invoice.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Facture ${invoice.number}`,
          text: `Facture pour ${invoice.timesheet?.contract?.user?.full_name} - ${invoice.facturation_net?.toFixed(2)}€`,
          url: link
        });
      } catch (err) {
        await this.copyLink(invoice.id);
        alert('Lien copié dans le presse-papier !');
      }
    } else {
      await this.copyLink(invoice.id);
      alert('Lien copié dans le presse-papier !');
    }
  }
}
