import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Calendar,
  User,
  FileText,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  FreelancerBillingService, 
  FreelancerBillingStats, 
  FreelancerInvoice 
} from '../../lib/services/freelancer-billing';

interface FreelancerBillingDashboardProps {
  companyId: string;
}

type InvoiceFilter = 'all' | 'pending' | 'paid' | 'paid_freelancer' | 'awaiting_transfer';

export const FreelancerBillingDashboard: React.FC<FreelancerBillingDashboardProps> = ({ companyId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freelancers, setFreelancers] = useState<FreelancerBillingStats[]>([]);
  const [selectedFreelancer, setSelectedFreelancer] = useState<FreelancerBillingStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>('all');
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    loadFreelancersData();
  }, [companyId]);

  const loadFreelancersData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await FreelancerBillingService.getCompanyFreelancersWithBilling(companyId);
      setFreelancers(data);
    } catch (err) {
      setError('Erreur lors du chargement des données de facturation');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    setProcessingPayment(invoiceId);
    try {
      const success = await FreelancerBillingService.markInvoiceAsPaidToFreelancer(invoiceId);
      if (success) {
        await loadFreelancersData();
        // Mettre à jour le freelancer sélectionné
        if (selectedFreelancer) {
          const updated = await FreelancerBillingService.getFreelancerBillingStats(
            selectedFreelancer.freelancerId, 
            companyId
          );
          if (updated) setSelectedFreelancer(updated);
        }
      } else {
        setError('Erreur lors du marquage du paiement');
      }
    } catch (err) {
      setError('Erreur lors du traitement du paiement');
    } finally {
      setProcessingPayment(null);
    }
  };

  const filteredFreelancers = freelancers.filter(freelancer =>
    freelancer.freelancerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilteredInvoices = (invoices: FreelancerInvoice[]): FreelancerInvoice[] => {
    switch (invoiceFilter) {
      case 'pending':
        return invoices.filter(inv => inv.status === 'pending');
      case 'paid':
        return invoices.filter(inv => inv.status === 'paid');
      case 'paid_freelancer':
        return invoices.filter(inv => inv.status === 'paid_freelancer');
      case 'awaiting_transfer':
        return invoices.filter(inv => inv.status === 'paid');
      default:
        return invoices;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusColor = (status: FreelancerInvoice['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'paid': return 'text-blue-600 bg-blue-50';
      case 'paid_freelancer': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: FreelancerInvoice['status']) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'paid': return 'À verser';
      case 'paid_freelancer': return 'Versé';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des données de facturation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <Button onClick={loadFreelancersData} className="mt-2">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Paiements Freelancers</h2>
          <p className="text-gray-600">Suivez les factures et paiements de vos freelancers</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un freelancer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={loadFreelancersData} variant="outline">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des freelancers */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Freelancers ({filteredFreelancers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredFreelancers.map((freelancer) => (
                  <div
                    key={freelancer.freelancerId}
                    onClick={() => setSelectedFreelancer(freelancer)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedFreelancer?.freelancerId === freelancer.freelancerId
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{freelancer.freelancerName}</p>
                        <p className="text-sm text-gray-600">
                          {freelancer.invoicesCount.total} facture{freelancer.invoicesCount.total > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(freelancer.totalRevenue)}
                        </p>
                        {freelancer.awaitingTransfer > 0 && (
                          <p className="text-xs text-blue-600">
                            {formatCurrency(freelancer.awaitingTransfer)} à verser
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredFreelancers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun freelancer trouvé
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Détails du freelancer sélectionné */}
        <div className="lg:col-span-2">
          {selectedFreelancer ? (
            <div className="space-y-6">
              {/* Statistiques */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-600">Total Revenue</p>
                        <p className="font-bold text-green-600">
                          {formatCurrency(selectedFreelancer.totalRevenue)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="text-xs text-gray-600">En attente</p>
                        <p className="font-bold text-yellow-600">
                          {formatCurrency(selectedFreelancer.pendingPayment)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-600">À verser</p>
                        <p className="font-bold text-blue-600">
                          {formatCurrency(selectedFreelancer.awaitingTransfer)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-600">Versé</p>
                        <p className="font-bold text-green-600">
                          {formatCurrency(selectedFreelancer.paidToFreelancer)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtres des factures */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Factures de {selectedFreelancer.freelancerName}
                    </CardTitle>
                    <div className="flex gap-2">
                      <select
                        value={invoiceFilter}
                        onChange={(e) => setInvoiceFilter(e.target.value as InvoiceFilter)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="all">Toutes ({selectedFreelancer.invoicesCount.total})</option>
                        <option value="pending">En attente ({selectedFreelancer.invoicesCount.pending})</option>
                        <option value="awaiting_transfer">À verser ({selectedFreelancer.invoicesCount.awaitingTransfer})</option>
                        <option value="paid_freelancer">Versées ({selectedFreelancer.invoicesCount.paidToFreelancer})</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getFilteredInvoices(selectedFreelancer.invoices).map((invoice) => (
                      <div
                        key={invoice.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                {getStatusLabel(invoice.status)}
                              </span>
                              <span className="text-sm text-gray-600">
                                {invoice.client_name} • {invoice.month}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Émise:</span> {formatDate(invoice.issue_date)}
                              </div>
                              <div>
                                <span className="font-medium">Échéance:</span> {invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Jours:</span> {invoice.worked_days} j × {formatCurrency(invoice.tjm)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold text-lg">{formatCurrency(invoice.amount)}</p>
                            </div>
                            
                            {invoice.status === 'paid' && (
                              <Button
                                onClick={() => handleMarkAsPaid(invoice.id)}
                                disabled={processingPayment === invoice.id}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {processingPayment === invoice.id ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Marquer versé
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {getFilteredInvoices(selectedFreelancer.invoices).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Aucune facture pour ce filtre
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sélectionnez un freelancer
                </h3>
                <p className="text-gray-600">
                  Cliquez sur un freelancer à gauche pour voir ses factures et gérer ses paiements
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};