import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { InvoiceWithFreelancerPayments, FreelancerPaymentSummary, FreelancerPartialPaymentService } from '../../lib/services/partial-payments';
import PartialPaymentDialog from './PartialPaymentDialog';
import { CreditCard, Eye } from 'lucide-react';

// Fonction de traduction des méthodes de paiement
const translatePaymentMethod = (method: string): string => {
  const translations: Record<string, string> = {
    'bank_transfer': 'Virement bancaire',
    'check': 'Chèque',
    'cash': 'Espèces',
    'other': 'Autre'
  };
  return translations[method] || method;
};

// Composant complet pour afficher les factures (reprend l'ancienne page admin/invoices)
const InvoicesView: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  useEffect(() => {
    loadInvoices();
  }, [companyId]);

  const loadInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      // Utiliser InvoiceService pour charger les vraies factures
      const { InvoiceService } = await import('../../lib/services/invoices');
      const data = await InvoiceService.getAll();
      setInvoices(data || []);
    } catch (err: any) {
      console.error('Erreur chargement factures:', err);
      setError(err?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (invoiceId: string, newStatus: string) => {
    setError(null);
    setUpdatingIds(prev => new Set([...prev, invoiceId]));

    try {
      const { InvoiceService } = await import('../../lib/services/invoices');
      await InvoiceService.updateStatus(invoiceId, newStatus as any);
      
      setInvoices(prev =>
        prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
      );

      try {
        const { WorkflowDataHelper } = await import('../../lib/services/workflow-data-helper');
        if (newStatus === 'sent') {
          await WorkflowDataHelper.sendWorkflowNotification('invoice_sent', undefined, invoiceId);
        } else if (newStatus === 'paid') {
          await WorkflowDataHelper.sendWorkflowNotification('payment_received', undefined, invoiceId);
        } else if (newStatus === 'paid_freelancer') {
          await WorkflowDataHelper.sendWorkflowNotification('freelancer_paid', undefined, invoiceId);
        }
      } catch (notifError) {
        console.error('Erreur notification workflow:', notifError);
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

  const handleDownload = async (invoice: any) => {
    try {
      const { InvoiceService } = await import('../../lib/services/invoices');
      InvoiceService.downloadPDF(invoice);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
    }
  };

  const handleEmailShare = async (invoice: any) => {
    try {
      const { InvoiceService } = await import('../../lib/services/invoices');
      InvoiceService.shareByEmail(invoice);
    } catch (err) {
      console.error('Erreur partage email:', err);
    }
  };

  const handleWhatsAppShare = async (invoice: any) => {
    try {
      const { InvoiceService } = await import('../../lib/services/invoices');
      InvoiceService.shareByWhatsApp(invoice);
    } catch (err) {
      console.error('Erreur partage WhatsApp:', err);
    }
  };

  const handleShareLink = async (invoice: any) => {
    try {
      const { InvoiceService } = await import('../../lib/services/invoices');
      await InvoiceService.shareLink(invoice);
    } catch (err) {
      console.error('Erreur partage lien:', err);
      setError('Erreur lors du partage du lien');
    }
  };

  const handlePreview = (invoice: any) => {
    setPreviewInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewInvoice(null);
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'sent': return 'Envoyée';
      case 'paid': return 'Payée par client';
      case 'paid_freelancer': return 'Freelancer payé';
      case 'overdue': return 'En retard';
      default: return status;
    }
  };

  const statusBadgeClasses = (status: string) => {
    switch (status) {
      case 'paid_freelancer': return 'bg-emerald-100 text-emerald-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'paid_freelancer': return <span className="inline-block w-4 h-4">✅</span>;
      case 'paid': return <span className="inline-block w-4 h-4">💰</span>;
      case 'sent': return <span className="inline-block w-4 h-4">📧</span>;
      case 'overdue': return <span className="inline-block w-4 h-4">⚠️</span>;
      default: return <span className="inline-block w-4 h-4">⏳</span>;
    }
  };

  // Calculs des statistiques
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.facturation_ttc || 0), 0);
  const paidByClientAmount = invoices
    .filter(inv => inv.status === 'paid' || inv.status === 'paid_freelancer')
    .reduce((sum, inv) => sum + (inv.facturation_ttc || 0), 0);
  const freelancerPaidAmount = invoices
    .filter(inv => inv.status === 'paid_freelancer')
    .reduce((sum, inv) => sum + (inv.facturation_ttc || 0), 0);
  const pendingAmount = invoices
    .filter(inv => inv.status === 'pending' || inv.status === 'sent')
    .reduce((sum, inv) => sum + (inv.facturation_ttc || 0), 0);

  return (
    <div className="space-y-8">
      {/* Stats Cards - Reprend l'ancienne interface complète */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total factures</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
              <span className="text-2xl">📄</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Montant total</p>
                <p className="text-2xl font-bold text-gray-900">{totalAmount.toFixed(2)}€</p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Reçues clients</p>
                <p className="text-2xl font-bold text-green-600">{paidByClientAmount.toFixed(2)}€</p>
              </div>
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Versées freelancers</p>
                <p className="text-2xl font-bold text-emerald-600">{freelancerPaidAmount.toFixed(2)}€</p>
              </div>
              <span className="text-2xl">💸</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingAmount.toFixed(2)}€</p>
              </div>
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
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
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultant</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center">
                          <p className="text-gray-500 text-sm">Aucune facture trouvée</p>
                        </td>
                      </tr>
                    ) : (
                      invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {invoice.number}
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {invoice.client?.name || '—'}
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {invoice.timesheet?.contract?.user?.full_name || '—'}
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {invoice.timesheet?.month} {invoice.timesheet?.year}
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{invoice.facturation_ttc?.toFixed(2)}€</div>
                              <div className="text-xs text-gray-500">
                                Net: {invoice.facturation_net?.toFixed(2)}€
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClasses(invoice.status)}`}>
                                {statusIcon(invoice.status)}
                                <span className="ml-1">{statusLabel(invoice.status)}</span>
                              </span>
                              
                              <select
                                value={invoice.status}
                                onChange={(e) => updateStatus(invoice.id, e.target.value)}
                                disabled={updatingIds.has(invoice.id)}
                                className="text-xs border rounded px-1 py-0.5 max-w-28"
                              >
                                <option value="pending">En attente</option>
                                <option value="sent">Envoyée</option>
                                <option value="paid">Payée par client</option>
                                <option value="paid_freelancer">Freelancer payé</option>
                                <option value="overdue">En retard</option>
                              </select>
                            </div>
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePreview(invoice)}
                                className="flex items-center gap-1 text-xs px-1.5 py-1"
                              >
                                👁️
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(invoice)}
                                className="flex items-center gap-1 text-xs px-1.5 py-1"
                              >
                                📥
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEmailShare(invoice)}
                                className="flex items-center gap-1 text-xs px-1.5 py-1"
                              >
                                📧
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWhatsAppShare(invoice)}
                                className="flex items-center gap-1 text-xs px-1.5 py-1"
                              >
                                💬
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShareLink(invoice)}
                                className="flex items-center gap-1 text-xs px-1.5 py-1"
                              >
                                🔗
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Invoice Preview Modal */}
      {previewInvoice && isPreviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleClosePreview}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Aperçu de la facture {previewInvoice.number}
                      </h3>
                      <Button variant="outline" onClick={handleClosePreview}>
                        Fermer
                      </Button>
                    </div>
                    
                    <div className="mt-3">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Client</p>
                            <p className="mt-1 text-sm text-gray-900">{previewInvoice.client?.name || '—'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Consultant</p>
                            <p className="mt-1 text-sm text-gray-900">{previewInvoice.timesheet?.contract?.user?.full_name || '—'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Période</p>
                            <p className="mt-1 text-sm text-gray-900">{previewInvoice.timesheet?.month} {previewInvoice.timesheet?.year}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Statut</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClasses(previewInvoice.status)}`}>
                              {statusIcon(previewInvoice.status)}
                              <span className="ml-1">{statusLabel(previewInvoice.status)}</span>
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Montant HT</p>
                            <p className="mt-1 text-sm text-gray-900">{previewInvoice.facturation_net?.toFixed(2)}€</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Montant TTC</p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{previewInvoice.facturation_ttc?.toFixed(2)}€</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button onClick={() => handleDownload(previewInvoice)} className="mr-2">
                  📥 Télécharger PDF
                </Button>
                <Button variant="outline" onClick={() => handleEmailShare(previewInvoice)} className="mr-2">
                  📧 Envoyer par email
                </Button>
                <Button variant="outline" onClick={handleClosePreview}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface FreelancerPaymentDashboardProps {
  companyId: string;
}

const PartialPaymentDashboard: React.FC<FreelancerPaymentDashboardProps> = ({ companyId }) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'invoices'>('payments');
  const [invoices, setInvoices] = useState<InvoiceWithFreelancerPayments[]>([]);
  const [summary, setSummary] = useState<FreelancerPaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithFreelancerPayments | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'fully_paid' | 'advances' | 'sent'>('all');

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invoicesData, summaryData] = await Promise.all([
        FreelancerPartialPaymentService.getInvoicesWithFreelancerPayments(companyId),
        FreelancerPartialPaymentService.getFreelancerPaymentSummary(companyId)
      ]);
      
      setInvoices(invoicesData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAdded = () => {
    loadData(); // Rechargement des données
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      partially_paid: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      paid_freelancer: 'bg-gray-100 text-gray-800',
      overdue: 'bg-red-100 text-red-800',
      sent: 'bg-purple-100 text-purple-800'
    };
    
    const labels = {
      pending: 'En attente',
      partially_paid: 'Partiellement payé',
      paid: 'Payé',
      paid_freelancer: 'Versé freelancer',
      overdue: 'En retard',
      sent: 'Envoyée au client'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getAdvanceBadge = (invoice: InvoiceWithFreelancerPayments) => {
    if (!invoice.has_advances) return null;
    
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 ml-2">
        🚀 Avance {invoice.total_advances.toFixed(0)}€
      </span>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'unpaid') return invoice.total_paid_to_freelancer === 0;
    if (filterStatus === 'fully_paid') return invoice.remaining_to_pay_freelancer === 0;
    if (filterStatus === 'advances') return invoice.has_advances;
    if (filterStatus === 'sent') return invoice.status === 'sent';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {activeTab === 'invoices' ? 'Gestion des Factures' : 'Gestion des Paiements Freelancers'}
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              {activeTab === 'invoices' 
                ? 'Consultez et gérez toutes vos factures clients' 
                : 'Gérez les paiements vers vos freelancers'
              }
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={activeTab === 'payments' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('payments')}
              className="flex items-center"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Paiements
            </Button>
            <Button
              variant={activeTab === 'invoices' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('invoices')}
              className="flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir factures
            </Button>
          </div>
        </div>
      </div>

      {activeTab === 'invoices' ? (
        <InvoicesView companyId={companyId} />
      ) : (
        <>
          {/* Résumé des paiements */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Total factures</p>
                <p className="text-2xl font-semibold">{summary.total_invoices}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Montant factures</p>
                <p className="text-2xl font-semibold">{summary.total_invoice_amount.toFixed(2)}€</p>
              </div>
            </div>
          </Card>



          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Marge compagnie</p>
                <p className="text-2xl font-semibold text-blue-600">{summary.total_company_margin.toFixed(2)}€</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtres améliorés avec gestion des avances */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setFilterStatus('all')}
          variant={filterStatus === 'all' ? 'primary' : 'outline'}
          size="sm"
        >
          Toutes ({invoices.length})
        </Button>
        <Button
          onClick={() => setFilterStatus('sent')}
          variant={filterStatus === 'sent' ? 'primary' : 'outline'}
          size="sm"
          className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
        >
          🚀 Factures envoyées ({invoices.filter(inv => inv.status === 'sent').length})
        </Button>
        <Button
          onClick={() => setFilterStatus('advances')}
          variant={filterStatus === 'advances' ? 'primary' : 'outline'}
          size="sm"
          className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
        >
          💰 Avec avances ({invoices.filter(inv => inv.has_advances).length})
        </Button>
        <Button
          onClick={() => setFilterStatus('unpaid')}
          variant={filterStatus === 'unpaid' ? 'primary' : 'outline'}
          size="sm"
        >
          Non payées ({summary?.unpaid_to_freelancer_count || 0})
        </Button>
        <Button
          onClick={() => setFilterStatus('fully_paid')}
          variant={filterStatus === 'fully_paid' ? 'primary' : 'outline'}
          size="sm"
        >
          Payées ({summary?.fully_paid_to_freelancer_count || 0})
        </Button>
      </div>

      {/* Liste des factures */}
      <div className="space-y-4">
        {filteredInvoices.map(invoice => (
          <Card key={invoice.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* En-tête avec informations principales et bouton d'action */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{invoice.freelancer_name} {invoice.total_amount.toFixed(2)}€</h3>
                      {getStatusBadge(invoice.status)}
                      {getAdvanceBadge(invoice)}
                      {invoice.can_receive_advance && !invoice.client_has_paid && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          🚀 Éligible avance
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Client: {invoice.client_name}</p>
                    <p className={`text-sm font-medium ${invoice.client_has_paid ? 'text-green-600' : 'text-red-600'}`}>
                      {invoice.client_has_paid ? '✅ Client payé' : '❌ Client non payé'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {invoice.remaining_to_pay_freelancer > 0 && (
                      <Button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowPaymentDialog(true);
                        }}
                        size="sm"
                        variant="primary"
                        className={invoice.can_receive_advance && !invoice.client_has_paid ? 'bg-orange-600 hover:bg-orange-700 border-orange-600' : 'bg-blue-600 hover:bg-blue-700'}
                      >
                        💰 Payer
                      </Button>
                    )}
                    
                    {invoice.remaining_to_pay_freelancer === 0 && (
                      <div className="text-sm text-green-600 font-medium px-3 py-1 bg-green-50 rounded-full">
                        ✅ Payé
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations complémentaires compactes */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    📊 {invoice.freelancer_payments.length} versement{invoice.freelancer_payments.length > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    💰 Marge: {invoice.company_margin_taken.toFixed(2)}€
                  </span>
                  <span className="flex items-center gap-1">
                    📅 {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                  </span>
                  {invoice.has_advances && (
                    <span className="flex items-center gap-1 text-orange-600 font-medium">
                      🚀 Avances: {invoice.total_advances.toFixed(2)}€
                    </span>
                  )}
                  {invoice.can_receive_advance && !invoice.client_has_paid && (
                    <span className="text-blue-600 font-medium">💡 Avance possible</span>
                  )}
                </div>

                {/* Liste des paiements aux freelancers avec traçage des avances */}
                {invoice.freelancer_payments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Versements au freelancer:</p>
                    <div className="space-y-2">
                      {invoice.freelancer_payments.map(payment => (
                        <div key={payment.id} className={`p-2 rounded-md border-l-4 ${payment.is_advance ? 'bg-orange-50 border-orange-400' : 'bg-green-50 border-green-400'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {payment.amount.toFixed(2)}€ - {translatePaymentMethod(payment.payment_method)}
                                </span>
                                {payment.is_advance && (
                                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                    🚀 AVANCE
                                  </span>
                                )}
                              </div>
                              {payment.reference && (
                                <p className="text-xs text-gray-600 mt-1">Réf: {payment.reference}</p>
                              )}
                              {payment.is_advance && payment.advance_reason && (
                                <p className="text-xs text-orange-600 mt-1 italic">
                                  ⚠️ {payment.advance_reason}
                                </p>
                              )}
                              {payment.notes && (
                                <p className="text-xs text-gray-600 mt-1">{payment.notes}</p>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(payment.payment_date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>


            </div>
          </Card>
        ))}

        {filteredInvoices.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Aucune facture trouvée pour ce filtre.</p>
          </Card>
        )}
      </div>
        </>
      )}

      {/* Dialog pour ajouter un paiement */}
      {selectedInvoice && (
        <PartialPaymentDialog
          invoice={selectedInvoice}
          isOpen={showPaymentDialog}
          onClose={() => {
            setShowPaymentDialog(false);
            setSelectedInvoice(null);
          }}
          onPaymentAdded={handlePaymentAdded}
        />
      )}
    </div>
  );
};

export default PartialPaymentDashboard;