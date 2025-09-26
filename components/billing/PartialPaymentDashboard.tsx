import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { InvoiceWithFreelancerPayments, FreelancerPaymentSummary, FreelancerPartialPaymentService } from '../../lib/services/partial-payments';
import PartialPaymentDialog from './PartialPaymentDialog';

interface FreelancerPaymentDashboardProps {
  companyId: string;
}

const PartialPaymentDashboard: React.FC<FreelancerPaymentDashboardProps> = ({ companyId }) => {
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

  const handleMarkAsFullyPaid = async (invoiceId: string) => {
    const success = await FreelancerPartialPaymentService.markInvoiceAsFullyPaidToFreelancer(invoiceId);
    if (success) {
      loadData();
    }
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
    if (filterStatus === 'sent') return invoice.status === 'sent' || invoice.can_receive_advance;
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
                <p className="text-sm text-gray-600">Versé aux freelancers</p>
                <p className="text-2xl font-semibold text-green-600">{summary.total_paid_to_freelancers.toFixed(2)}€</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Restant à verser</p>
                <p className="text-2xl font-semibold text-red-600">{summary.total_remaining_to_pay.toFixed(2)}€</p>
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
          🚀 Factures envoyées ({invoices.filter(inv => inv.status === 'sent' || inv.can_receive_advance).length})
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
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-medium text-gray-900">
                    {invoice.freelancer_name} - {invoice.month}
                  </h3>
                  {getStatusBadge(invoice.status)}
                  {getAdvanceBadge(invoice)}
                  {invoice.can_receive_advance && !invoice.client_has_paid && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      🚀 Éligible avance
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium">Client: {invoice.client_name}</p>
                    <p>Montant facture: {invoice.total_amount.toFixed(2)}€</p>
                    <p className={invoice.client_has_paid ? 'text-green-600' : 'text-red-600'}>
                      Client: {invoice.client_has_paid ? 'Payé ✅' : 'Non payé ❌'}
                    </p>
                  </div>
                  <div>
                    <p>Versé au freelancer: {invoice.total_paid_to_freelancer.toFixed(2)}€</p>
                    {invoice.has_advances && (
                      <p className="text-orange-600">
                        Dont avances: {invoice.total_advances.toFixed(2)}€ 🚀
                      </p>
                    )}
                    <p>Restant à verser: {invoice.remaining_to_pay_freelancer.toFixed(2)}€</p>
                  </div>
                  <div>
                    <p>Progression paiement: {invoice.freelancer_payment_progress}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${invoice.has_advances ? 'bg-orange-500' : 'bg-green-600'}`}
                        style={{ width: `${invoice.freelancer_payment_progress}%` }}
                      ></div>
                    </div>
                    {invoice.has_advances && (
                      <p className="text-xs text-orange-600 mt-1">⚠️ Contient des avances</p>
                    )}
                  </div>
                  <div>
                    <p>Versements: {invoice.freelancer_payments.length}</p>
                    <p>Marge: {invoice.company_margin_taken.toFixed(2)}€</p>
                    <p>Émise: {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</p>
                    {invoice.can_receive_advance && !invoice.client_has_paid && (
                      <p className="text-xs text-blue-600 mt-1">💡 Avance possible</p>
                    )}
                  </div>
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
                                  {payment.amount.toFixed(2)}€ - {payment.payment_method}
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

              <div className="flex flex-col space-y-2 ml-4">
                {invoice.remaining_to_pay_freelancer > 0 && (
                  <>
                    <Button
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setShowPaymentDialog(true);
                      }}
                      size="sm"
                      variant="primary"
                      className={invoice.can_receive_advance && !invoice.client_has_paid ? 'bg-orange-600 hover:bg-orange-700 border-orange-600' : ''}
                    >
                      {invoice.can_receive_advance && !invoice.client_has_paid ? '🚀 Avancer freelancer' : '💰 Payer freelancer'}
                    </Button>
                    
                    <Button
                      onClick={() => handleMarkAsFullyPaid(invoice.id)}
                      size="sm"
                      variant="outline"
                    >
                      Payer intégralement
                    </Button>
                  </>
                )}
                
                {invoice.remaining_to_pay_freelancer === 0 && (
                  <div className="text-sm text-green-600 font-medium">
                    ✅ Freelancer payé
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