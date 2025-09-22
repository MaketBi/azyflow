import React, { useEffect, useState } from 'react';
import { 
  Download, 
  Mail, 
  MessageCircle, 
  Share2, 
  FileText, 
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign 
} from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InvoiceService, InvoiceWithRelations } from '../../lib/services/invoices';
import { InvoicePreviewModal } from '../../components/invoices/InvoicePreviewModal';
import { WorkflowDataHelper } from '../../lib/services/workflow-data-helper';

const statusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'En attente';
    case 'sent': return 'Envoyée';
    case 'paid': return 'Payée';
    case 'overdue': return 'En retard';
    default: return status;
  }
};

const statusBadgeClasses = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800';
    case 'sent': return 'bg-blue-100 text-blue-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
};

const statusIcon = (status: string) => {
  switch (status) {
    case 'paid': return <CheckCircle className="h-4 w-4" />;
    case 'sent': return <Mail className="h-4 w-4" />;
    case 'overdue': return <AlertCircle className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

const AdminInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceWithRelations | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await InvoiceService.getAll();
      setInvoices(data || []);
    } catch (err: any) {
      console.error('Erreur chargement factures:', err);
      setError(err?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (invoiceId: string, newStatus: 'pending' | 'sent' | 'paid' | 'overdue') => {
    setError(null);
    setUpdatingIds(prev => new Set([...prev, invoiceId]));

    try {
      // Mettre à jour le statut de la facture
      await InvoiceService.updateStatus(invoiceId, newStatus);
      
      // Mettre à jour l'état local
      setInvoices(prev =>
        prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
      );

      // Envoyer la notification workflow appropriée
      try {
        if (newStatus === 'sent') {
          await WorkflowDataHelper.sendWorkflowNotification('invoice_sent', undefined, invoiceId);
        } else if (newStatus === 'paid') {
          await WorkflowDataHelper.sendWorkflowNotification('payment_received', undefined, invoiceId);
        }
      } catch (notifError) {
        console.error('Erreur notification workflow:', notifError);
        // Ne pas faire échouer la mise à jour de statut si la notification échoue
      }
      
    } catch (err: any) {
      console.error('Erreur mise à jour statut:', err);
      setError(err?.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoiceId);
        return newSet;
      });
    }
  };

  const handleDownload = (invoice: InvoiceWithRelations) => {
    InvoiceService.downloadPDF(invoice);
  };

  const handleEmailShare = (invoice: InvoiceWithRelations) => {
    InvoiceService.shareByEmail(invoice);
  };

  const handleWhatsAppShare = (invoice: InvoiceWithRelations) => {
    InvoiceService.shareByWhatsApp(invoice);
  };

  const handleShareLink = async (invoice: InvoiceWithRelations) => {
    try {
      await InvoiceService.shareLink(invoice);
    } catch (err) {
      console.error('Erreur partage lien:', err);
      setError('Erreur lors du partage du lien');
    }
  };

  const handlePreview = (invoice: InvoiceWithRelations) => {
    setPreviewInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewInvoice(null);
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.facturation_ttc || 0), 0);
  const paidAmount = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.facturation_ttc || 0), 0);
  const pendingAmount = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + (inv.facturation_ttc || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Factures</h1>
        <p className="text-gray-600 mt-2">Gérez et partagez les factures de votre société</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total factures</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Montant total</p>
                <p className="text-2xl font-bold text-gray-900">{totalAmount.toFixed(2)}€</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Payées</p>
                <p className="text-2xl font-bold text-green-600">{paidAmount.toFixed(2)}€</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingAmount.toFixed(2)}€</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des factures</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Consultant</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p className="text-gray-500">Aucune facture trouvée</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.number}
                          </TableCell>

                          <TableCell>
                            {invoice.client?.name || '—'}
                          </TableCell>

                          <TableCell>
                            {invoice.timesheet?.contract?.user?.full_name || '—'}
                          </TableCell>

                          <TableCell>
                            {invoice.timesheet?.month} {invoice.timesheet?.year}
                          </TableCell>

                          <TableCell>
                            <div>
                              <div className="font-medium">{invoice.facturation_ttc?.toFixed(2)}€</div>
                              <div className="text-sm text-gray-500">
                                Net: {invoice.facturation_net?.toFixed(2)}€
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClasses(invoice.status)}`}>
                                {statusIcon(invoice.status)}
                                <span className="ml-1">{statusLabel(invoice.status)}</span>
                              </span>
                              
                              <select
                                value={invoice.status}
                                onChange={(e) => updateStatus(invoice.id, e.target.value as any)}
                                disabled={updatingIds.has(invoice.id)}
                                className="text-xs border rounded px-1 py-0.5 max-w-24"
                              >
                                <option value="pending">En attente</option>
                                <option value="sent">Envoyée</option>
                                <option value="paid">Payée</option>
                                <option value="overdue">En retard</option>
                              </select>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePreview(invoice)}
                                className="flex items-center gap-1 text-xs px-2 py-1"
                              >
                                <Eye className="h-3 w-3" />
                                Voir
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(invoice)}
                                className="flex items-center gap-1 text-xs px-2 py-1"
                              >
                                <Download className="h-3 w-3" />
                                PDF
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEmailShare(invoice)}
                                className="flex items-center gap-1 text-xs px-2 py-1"
                              >
                                <Mail className="h-3 w-3" />
                                Email
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWhatsAppShare(invoice)}
                                className="flex items-center gap-1 text-xs px-2 py-1"
                              >
                                <MessageCircle className="h-3 w-3" />
                                WhatsApp
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShareLink(invoice)}
                                className="flex items-center gap-1 text-xs px-2 py-1"
                              >
                                <Share2 className="h-3 w-3" />
                                Lien
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        invoice={previewInvoice}
        canShare={true}
      />
    </div>
  );
};

export default AdminInvoicesPage;