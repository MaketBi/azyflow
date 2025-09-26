import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { UserService } from "../../lib/services/users";
import { ContractService } from "../../lib/services/contracts";
import { TimesheetService } from "../../lib/services/timesheets";
import { InvoiceService } from "../../lib/services/invoices";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../components/ui/Table";
import { 
  User, 
  Mail, 
  Calendar, 
  Building2, 
  FileText, 
  Clock, 
  CreditCard,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Phone,
  Receipt
} from "lucide-react";
import TimesheetDetailModal from "../../components/timesheets/TimesheetDetailModal";

export default function FreelancerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [freelancer, setFreelancer] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchFreelancerData = async () => {
      if (!id) return;
      try {
        // Charger les données du freelancer
        const freelancerData = await UserService.getFreelancerById(id);
        setFreelancer(freelancerData);

        // Charger tous les contrats de l'entreprise puis filtrer
        const allContracts = await ContractService.getAllByCompany();
        const userContracts = allContracts.filter(contract => 
          contract.user_id === id
        );
        setContracts(userContracts);

        // Charger toutes les feuilles de temps puis filtrer
        const allTimesheets = await TimesheetService.getAll();
        const userTimesheets = allTimesheets.filter(ts => {
          // Vérifier si ce timesheet appartient à ce freelancer
          return userContracts.some(contract => contract.id === ts.contract_id);
        });
        setTimesheets(userTimesheets);

        // Charger toutes les factures puis filtrer par freelancer
        const allInvoices = await InvoiceService.getAll();
        const userInvoices = allInvoices.filter(invoice => {
          // Vérifier si cette facture correspond à un CRA de ce freelancer
          return userTimesheets.some(timesheet => timesheet.id === invoice.timesheet_id);
        });
        setInvoices(userInvoices);
      } catch (err) {
        console.error("Erreur chargement données freelancer:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFreelancerData();
  }, [id]);

  // Fonctions utilitaires
  const getStatusBadge = (user: any) => {
    if (!user.active && user.last_login === null) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">⏳ En attente d'inscription</span>;
    }
    if (user.active) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">✅ Actif</span>;
    }
    if (!user.active && user.last_login !== null) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">❌ Désactivé</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">—</span>;
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTimesheetStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'submitted':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'draft':
        return <Clock className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTimesheetStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'submitted': return 'Soumis';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const handleViewTimesheet = (timesheet: any) => {
    setSelectedTimesheet(timesheet);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedTimesheet(null);
    setIsModalOpen(false);
  };

  // Calculs de statistiques - seulement CRA soumis et validés
  const validTimesheets = timesheets.filter(ts => 
    ts.status === 'submitted' || ts.status === 'approved'
  );
  
  const totalWorkedDays = validTimesheets.reduce((sum, ts) => sum + (ts.worked_days || 0), 0);
  const totalEarnings = validTimesheets.reduce((sum, ts) => {
    const contract = contracts.find(c => c.id === ts.contract_id);
    return sum + ((ts.worked_days || 0) * (contract?.tjm || 0));
  }, 0);

  // Calculs des KPIs de facturation
  const totalInvoices = invoices.length;
  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + (inv.facturation_ttc || 0), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid' || inv.paid_at).length;
  const pendingInvoices = invoices.filter(inv => 
    inv.status !== 'paid' && !inv.paid_at && (inv.status === 'sent' || inv.status === 'pending')
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Freelancer introuvable</h2>
          <p className="text-gray-600 mb-4">Le freelancer demandé n'existe pas ou n'est plus disponible.</p>
          <Button onClick={() => navigate('/admin/freelancers-timesheets')}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/freelancers-timesheets')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <User className="w-8 h-8 text-blue-600" />
                  <span>{freelancer.full_name}</span>
                </h1>
                <p className="text-gray-600 mt-1">Profil du freelancer</p>
              </div>
            </div>
            {getStatusBadge(freelancer)}
          </div>
        </div>

        {/* Informations générales et statistiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Informations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-gray-900">{freelancer.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Téléphone</p>
                  <p className="text-gray-900">{freelancer.phone || 'Non renseigné'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Dernière connexion</p>
                  <p className="text-gray-900">
                    {freelancer.last_login 
                      ? formatDate(freelancer.last_login)
                      : "Jamais connecté"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span>Statistiques</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{totalWorkedDays}</p>
                <p className="text-sm text-gray-600">Jours travaillés</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
                <p className="text-sm text-gray-600">Revenus générés</p>
              </div>
            </CardContent>
          </Card>

          {/* Activité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span>Activité</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {contracts.filter(c => c.status === 'active').length}
                </p>
                <p className="text-sm text-gray-600">Contrats actifs</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{validTimesheets.length}</p>
                <p className="text-sm text-gray-600">CRA soumis/validés</p>
              </div>
            </CardContent>
          </Card>

          {/* Facturation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span>Facturation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <p className="text-2xl font-bold text-indigo-600">{totalInvoices}</p>
                <p className="text-sm text-gray-600">Factures générées</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-xl font-bold text-amber-600">{formatCurrency(totalInvoiceAmount)}</p>
                <p className="text-sm text-gray-600">Montant facturé</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPIs Facturation détaillés */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Factures payées</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{paidInvoices}</p>
                <p className="text-sm text-gray-600">
                  {totalInvoices > 0 ? `${Math.round((paidInvoices / totalInvoices) * 100)}% du total` : 'Aucune facture'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>Factures en attente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-3xl font-bold text-amber-600">{pendingInvoices}</p>
                <p className="text-sm text-gray-600">
                  {totalInvoices > 0 ? `${Math.round((pendingInvoices / totalInvoices) * 100)}% du total` : 'Aucune facture'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contrats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Contrats et clients ({contracts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun contrat trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>TJM</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date de début</TableHead>
                      <TableHead>Date de fin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span>{contract.client?.name || 'Client non défini'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-600">
                              {formatCurrency(contract.tjm)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            contract.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {contract.status === 'active' ? '✅ Actif' : '⏸️ Inactif'}
                          </span>
                        </TableCell>
                        <TableCell>{contract.start_date ? formatDate(contract.start_date) : '—'}</TableCell>
                        <TableCell>{contract.end_date ? formatDate(contract.end_date) : 'En cours'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feuilles de temps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <span>Feuilles de temps ({timesheets.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timesheets.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune feuille de temps trouvée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Période</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Jours travaillés</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheets.map((timesheet) => {
                      const contract = contracts.find(c => c.id === timesheet.contract_id);
                      const amount = (timesheet.worked_days || 0) * (contract?.tjm || 0);
                      
                      return (
                        <TableRow key={timesheet.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>
                                {timesheet.month && new Date(timesheet.month).toLocaleDateString('fr-FR', { 
                                  year: 'numeric', 
                                  month: 'long' 
                                })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{contract?.client?.name || '—'}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{timesheet.worked_days || 0} jours</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-green-600">
                              {formatCurrency(amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTimesheetStatusIcon(timesheet.status)}
                              <span className="text-sm">
                                {getTimesheetStatusLabel(timesheet.status)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTimesheet(timesheet)}
                              className="flex items-center space-x-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Voir</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de détail des feuilles de temps */}
        <TimesheetDetailModal
          timesheet={selectedTimesheet}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="bg-white rounded-lg shadow p-4 md:p-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{freelancer.full_name}</h1>
          {getStatusBadge(freelancer)}
        </div>
        <div className="space-y-2 md:space-y-4 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <span className="font-medium text-gray-700 w-32">Email :</span>
            <span className="text-gray-900 break-all">{freelancer.email}</span>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <span className="font-medium text-gray-700 w-32">Dernière connexion :</span>
            <span className="text-gray-900">{freelancer.last_login ? new Date(freelancer.last_login).toLocaleString('fr-FR') : "Jamais connecté"}</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-end gap-2">
          <Button
            className="w-full md:w-auto"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Retour
          </Button>
        </div>
      </div>
    </div>
  );
}
