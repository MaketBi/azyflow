import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Plus, 
  Send, 
  Users, 
  Building, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { SuperAdminService } from '../../lib/services/super-admin';
import { DemoRequestService } from '../../lib/services/demo-requests';
import { TrialStatusBadge } from '../ui/TrialStatus';
import { 
  CompanyInvitation, 
  CreateInvitationRequest, 
  SuperAdminStats
} from '../../lib/types/super-admin';
import { NotificationContainer } from '../ui/Notification';
import { useNotifications } from '../../hooks/useNotifications';

const SuperAdminDashboard: React.FC = () => {
  const { 
    notifications, 
    dismissNotification, 
    showSuccess, 
    showError, 
    showWarning 
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<'invitations' | 'demo-requests'>('invitations');
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([]);
  const [demoRequests, setDemoRequests] = useState<any[]>([]);
  const [demoStats, setDemoStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState<CreateInvitationRequest>({
    email: '',
    company_name: '',
    estimated_freelancers: 1
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

    const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, invitationsData, demoRequestsData, demoStatsData] = await Promise.all([
        SuperAdminService.getStats(),
        SuperAdminService.getESNInvitations(),
        DemoRequestService.getAllDemoRequests(),
        DemoRequestService.getDemoRequestsStats()
      ]);
      
      setStats(statsData);
      setInvitations(invitationsData);
      setDemoRequests(demoRequestsData);
      setDemoStats(demoStatsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setLoading(false);
  };

  const handleDemoRequestStatusChange = async (id: string, status: string, notes?: string) => {
    try {
      const result = await DemoRequestService.updateDemoRequestStatus(id, status as any, notes);
      
      if (result.success) {
        const statusMessages = {
          contacted: 'Demande marquée comme contactée',
          invited: 'Invitation ESN envoyée avec succès',
          rejected: 'Demande rejetée'
        };
        
        showSuccess(
          'Statut mis à jour',
          statusMessages[status as keyof typeof statusMessages] || 'Changement effectué avec succès'
        );
        loadDashboardData(); // Recharger les données
      } else {
        showError('Erreur de mise à jour', result.error || 'Impossible de mettre à jour le statut');
      }
    } catch (error) {
      showError('Erreur technique', 'Une erreur inattendue s\'est produite');
      console.error('Error updating demo request status:', error);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteData.email || !inviteData.company_name) {
      showWarning('Champs requis', 'Veuillez remplir l\'email et le nom de société');
      return;
    }

    try {
      const result = await SuperAdminService.createESNInvitation(inviteData);
      
      if (result.success) {
        showSuccess(
          'Invitation envoyée',
          `L'invitation a été envoyée avec succès à ${inviteData.email}`
        );
        setShowInviteModal(false);
        setInviteData({
          email: '',
          company_name: '',
          estimated_freelancers: 1
        });
        loadDashboardData(); // Refresh data
      } else {
        showError('Erreur d\'invitation', result.error || 'Impossible d\'envoyer l\'invitation');
      }
    } catch (error) {
      showError('Erreur technique', 'Une erreur inattendue s\'est produite lors de l\'envoi');
      console.error('Invitation error:', error);
    }
  };

  const handleRejectInvitation = async (id: string) => {
    // TODO: Remplacer par un modal élégant
    const reason = prompt('💭 Raison du rejet (optionnel):');
    if (reason === null) return; // Utilisateur a annulé
    
    const result = await SuperAdminService.rejectESNInvitation(id, reason || undefined);
    
    if (result.success) {
      showSuccess(
        'Invitation rejetée', 
        reason ? `Raison: ${reason}` : 'L\'invitation a été rejetée avec succès'
      );
      loadDashboardData();
    } else {
      showError('Erreur de rejet', result.error || 'Impossible de rejeter l\'invitation');
    }
  };

  const handleResendInvitation = async (id: string) => {
    const result = await SuperAdminService.resendESNInvitation(id);
    
    if (result.success) {
      showSuccess('Invitation renvoyée', 'L\'invitation a été envoyée à nouveau avec succès');
      loadDashboardData();
    } else {
      showError('Erreur de renvoi', result.error || 'Impossible de renvoyer l\'invitation');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired': return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'pending': return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'accepted': return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected': return `${baseClasses} bg-red-100 text-red-800`;
      case 'expired': return `${baseClasses} bg-gray-100 text-gray-800`;
      default: return baseClasses;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <>
      <NotificationContainer 
        notifications={notifications} 
        onDismiss={dismissNotification} 
      />
      
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Super Admin</h1>
          <p className="text-gray-600">Gestion des ESN et invitations B2B Premium</p>
        </div>
        <Button 
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Inviter une ESN
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total ESN</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_companies}</p>
                </div>
                <Building className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Invitations En Attente</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending_invitations}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Freelancers</p>
                  <p className="text-2xl font-bold text-green-600">{stats.total_freelancers}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Taux Acceptation</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.total_invitations > 0 
                      ? Math.round((stats.accepted_invitations / stats.total_invitations) * 100)
                      : 0}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('invitations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invitations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Invitations ESN
            <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
              {invitations.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('demo-requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'demo-requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Demandes de Démo
            <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
              {demoRequests.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'invitations' && (
        <>
          {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Invitations ESN Récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Société</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Freelancers Est.</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {invitation.company_name}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {invitation.email}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {invitation.estimated_freelancers}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invitation.status)}
                        <span className={getStatusBadge(invitation.status)}>
                          {invitation.status}
                        </span>
                        {invitation.company_created_id && (
                          <TrialStatusBadge companyId={invitation.company_created_id} />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {invitation.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleResendInvitation(invitation.id)}
                            >
                              Renvoyer
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleRejectInvitation(invitation.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Rejeter
                            </Button>
                          </>
                        )}
                        {invitation.status === 'accepted' && (
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Voir ESN
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {invitations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucune invitation ESN trouvée
              </div>
            )}
          </div>
        </CardContent>
      </Card>
        </>
      )}

      {/* Demo Requests Tab */}
      {activeTab === 'demo-requests' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Demandes de démonstration</CardTitle>
              <div className="flex gap-2">
                {demoStats && (
                  <div className="text-sm text-gray-600">
                    {demoStats.pending} en attente • {demoStats.contacted} contactées • {demoStats.invited} invitées
                  </div>
                )}
                <Button onClick={loadDashboardData} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{request.company_name}</h3>
                      <p className="text-gray-600">{request.contact_name} • {request.email}</p>
                      {request.phone && (
                        <p className="text-gray-500 text-sm">{request.phone}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'invited' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm"><strong>Freelancers estimés:</strong> {request.freelancers_count}</p>
                    </div>
                    {request.message && (
                      <div>
                        <p className="text-sm"><strong>Message:</strong></p>
                        <p className="text-sm text-gray-600 italic">"{request.message}"</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {request.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => handleDemoRequestStatusChange(request.id, 'contacted', 'Premier contact établi')}
                        >
                          Marquer comme contacté
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const reason = prompt('💭 Raison du rejet:');
                            if (reason) {
                              handleDemoRequestStatusChange(request.id, 'rejected', reason);
                            }
                          }}
                        >
                          Rejeter
                        </Button>
                      </>
                    )}
                    
                    {request.status === 'contacted' && (
                      <Button 
                        size="sm"
                        onClick={() => {
                          // Ouvrir le modal d'invitation ESN avec les données pré-remplies
                          setInviteData({
                            email: request.email,
                            company_name: request.company_name,
                            estimated_freelancers: parseInt(request.freelancers_count.split('-')[0]) || 5
                          });
                          setShowInviteModal(true);
                          // Marquer comme invité
                          handleDemoRequestStatusChange(request.id, 'invited', 'Invitation ESN envoyée');
                        }}
                      >
                        Inviter comme ESN
                      </Button>
                    )}
                  </div>

                  {request.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">
                        <strong>Notes:</strong> {request.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {demoRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucune demande de démonstration pour le moment.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Invitation */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Inviter une nouvelle ESN</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email de contact *
                </label>
                <Input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="contact@esn-example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la société *
                </label>
                <Input
                  value={inviteData.company_name}
                  onChange={(e) => setInviteData({ ...inviteData, company_name: e.target.value })}
                  placeholder="ESN Solutions"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SIRET (optionnel)
                </label>
                <Input
                  value={inviteData.siret || ''}
                  onChange={(e) => setInviteData({ ...inviteData, siret: e.target.value })}
                  placeholder="12345678901234"
                  maxLength={14}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de freelancers estimé
                </label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={inviteData.estimated_freelancers}
                  onChange={(e) => setInviteData({ ...inviteData, estimated_freelancers: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            {/* Information sur la période d'essai */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-800">Période d'essai automatique</h4>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Durée d'invitation :</strong> 7 jours pour accepter</p>
                <p>• <strong>Essai gratuit :</strong> 30 jours après activation</p>
                <p>• <strong>Plan :</strong> Trial → Pro (après upgrade)</p>
                <p>• <strong>Accès :</strong> Toutes fonctionnalités pendant l'essai</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleSendInvitation}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Envoyer l'invitation
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default SuperAdminDashboard;