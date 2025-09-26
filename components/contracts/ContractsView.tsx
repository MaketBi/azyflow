import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar, 
  DollarSign, 
  Users, 
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { SearchBox } from '../ui/search';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { PaymentTermsConfig } from '../forms/PaymentTermsConfig';
import { 
  ContractService, 
  ContractWithRelations, 
  ContractFormData 
} from '../../lib/services/contracts';

interface Freelancer {
  id: string;
  full_name: string;
  email: string;
}

interface Client {
  id: string;
  name: string;
}

const ContractsView: React.FC = () => {
  const [contracts, setContracts] = useState<ContractWithRelations[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContractWithRelations[]>([]);
  const [contractSearch, setContractSearch] = useState<string>('');
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractWithRelations | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ContractFormData>({
    user_id: '',
    client_id: '',
    tjm: 0,
    start_date: '',
    end_date: '',
    commission_rate: 15.00,
    currency: 'EUR',
    status: 'active',
    payment_terms: 30,
    payment_terms_type: 'end_of_month',
    vat_rate: 20.00,
    vat_applicable: true
  });

  useEffect(() => {
    loadData();
  }, []);

  // Effet pour filtrer les contrats selon la recherche
  useEffect(() => {
    if (!contractSearch.trim()) {
      setFilteredContracts(contracts);
    } else {
      const searchTerm = contractSearch.toLowerCase();
      const filtered = contracts.filter(contract => 
        (contract.user?.full_name?.toLowerCase() || '').includes(searchTerm) ||
        (contract.client?.name?.toLowerCase() || '').includes(searchTerm) ||
        (contract.tjm?.toString() || '').includes(searchTerm) ||
        (contract.commission_rate?.toString() || '').includes(searchTerm) ||
        (contract.currency?.toLowerCase() || '').includes(searchTerm)
      );
      setFilteredContracts(filtered);
    }
  }, [contracts, contractSearch]);

  const loadData = async () => {
    try {
      const [contractsData, freelancersData, clientsData] = await Promise.all([
        ContractService.getAllByCompany(),
        ContractService.getAvailableFreelancers(),
        ContractService.getAvailableClients(),
      ]);

      setContracts(contractsData);
      setFilteredContracts(contractsData);
      setFreelancers(freelancersData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      client_id: '',
      tjm: 0,
      start_date: '',
      end_date: '',
      commission_rate: 15.00,
      currency: 'EUR',
      status: 'active',
      payment_terms: 30,
      payment_terms_type: 'end_of_month',
      vat_rate: 20.00,
      vat_applicable: true
    });
    setEditingContract(null);
    setError(null);
  };

  const handleOpenModal = (contract?: ContractWithRelations) => {
    if (contract) {
      setEditingContract(contract);
      setFormData({
        user_id: contract.user_id,
        client_id: contract.client_id,
        tjm: contract.tjm,
        start_date: contract.start_date,
        end_date: contract.end_date,
        commission_rate: contract.commission_rate || 15.00,
        currency: contract.currency || 'EUR',
        status: contract.status as 'active' | 'expired' | 'renewed',
        payment_terms: contract.payment_terms || 30,
        payment_terms_type: (contract.payment_terms_type as 'end_of_month' | 'net_days') || 'end_of_month',
        vat_rate: contract.vat_rate || 20.00,
        vat_applicable: contract.vat_applicable ?? true
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingContract) {
        await ContractService.updateContract(editingContract.id, formData);
      } else {
        await ContractService.createContract(formData);
      }
      
      handleCloseModal();
      loadData();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (contract: ContractWithRelations) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le contrat entre ${contract.user?.full_name} et ${contract.client?.name} ?`)) {
      return;
    }

    try {
      await ContractService.deleteContract(contract.id);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Actif', color: 'bg-green-100 text-green-800' },
      expired: { label: 'Expiré', color: 'bg-red-100 text-red-800' },
      renewed: { label: 'Renouvelé', color: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nouveau Contrat
        </Button>
      </div>

      {/* Champ de recherche pour les contrats */}
      <SearchBox
        value={contractSearch}
        onChange={setContractSearch}
        placeholder="Rechercher par freelancer, client, TJM ou commission..."
        label="Rechercher un contrat"
        icon="📋"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contrats</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredContracts.length}
                  {contractSearch && ` / ${contracts.length}`}
                </p>
                {contractSearch && (
                  <p className="text-xs text-blue-600 mt-1">Filtré pour: {contractSearch}</p>
                )}
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contrats Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredContracts.filter(c => c.status === 'active').length}
                </p>
                {contractSearch && (
                  <p className="text-xs text-blue-600 mt-1">Dans la sélection</p>
                )}
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">TJM Moyen</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredContracts.length > 0 
                    ? formatCurrency(filteredContracts.reduce((sum, c) => sum + c.tjm, 0) / filteredContracts.length)
                    : formatCurrency(0)
                  }
                </p>
                {contractSearch && (
                  <p className="text-xs text-blue-600 mt-1">Moyenne filtrée</p>
                )}
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Freelances Actifs</p>
                <p className="text-2xl font-bold text-orange-600">
                  {new Set(filteredContracts.filter(c => c.status === 'active').map(c => c.user_id)).size}
                </p>
                {contractSearch && (
                  <p className="text-xs text-blue-600 mt-1">Dans la sélection</p>
                )}
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Contrats</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Freelance</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>TJM</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-gray-500">
                        {contractSearch 
                          ? `Aucun contrat trouvé pour "${contractSearch}"` 
                          : 'Aucun contrat trouvé'
                        }
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contract.user?.full_name || 'N/A'}</div>
                        <div className="text-sm text-gray-900">{contract.user?.email || ''}</div>
                      </div>
                    </TableCell>
                    <TableCell>{contract.client?.name || 'N/A'}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(contract.tjm, contract.currency || 'EUR')}
                    </TableCell>
                    <TableCell>{contract.commission_rate || 15}%</TableCell>
                    <TableCell>{formatDate(contract.start_date)}</TableCell>
                    <TableCell>{formatDate(contract.end_date)}</TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(contract)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contract)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingContract ? 'Modifier le contrat' : 'Nouveau contrat'}
              </h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Freelance *
                  </label>
                  <select
                    value={formData.user_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un freelance</option>
                    {freelancers.map((freelancer) => (
                      <option key={freelancer.id} value={freelancer.id}>
                        {freelancer.full_name} ({freelancer.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TJM (€) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tjm}
                    onChange={(e) => setFormData(prev => ({ ...prev, tjm: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission (%)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 15 }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début *
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin *
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Devise
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'expired' | 'renewed' }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Actif</option>
                    <option value="expired">Expiré</option>
                    <option value="renewed">Renouvelé</option>
                  </select>
                </div>
              </div>

              {/* Configuration des délais de paiement et TVA */}
              <div className="mt-6">
                <PaymentTermsConfig
                  initialPaymentTerms={formData.payment_terms}
                  initialPaymentType={formData.payment_terms_type}
                  initialVatRate={formData.vat_rate}
                  initialVatApplicable={formData.vat_applicable}
                  onChange={(config) => {
                    setFormData(prev => ({
                      ...prev,
                      payment_terms: config.payment_terms,
                      payment_terms_type: config.payment_terms_type,
                      vat_rate: config.vat_rate,
                      vat_applicable: config.vat_applicable
                    }));
                  }}
                  disabled={submitting}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseModal}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Sauvegarde...' : (editingContract ? 'Mettre à jour' : 'Créer')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsView;