import React, { useState, useEffect } from 'react';
import { DemoRequestService } from '../../lib/services/demo-requests';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

interface DemoRequest {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  freelancersCount: string;
  message?: string;
  status: 'pending' | 'contacted' | 'invited' | 'rejected';
  created_at: string;
  updated_at?: string;
  notes?: string;
}

export const DemoRequestsManagement: React.FC = () => {
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDemoRequests();
  }, []);

  const loadDemoRequests = async () => {
    setLoading(true);
    try {
      const data = await DemoRequestService.getAllDemoRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading demo requests:', error);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, status: string, notes?: string) => {
    try {
      const result = await DemoRequestService.updateDemoRequestStatus(
        id, 
        status as any, 
        notes
      );
      
      if (result.success) {
        loadDemoRequests(); // Recharger la liste
        alert('Statut mis à jour');
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      alert('Erreur technique');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      contacted: 'bg-blue-100 text-blue-800',
      invited: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  if (loading) {
    return <div>Chargement des demandes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Demandes de démonstration</h2>
        <Button onClick={loadDemoRequests}>
          Actualiser
        </Button>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{request.companyName}</CardTitle>
                  <p className="text-gray-600">{request.contactName} - {request.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                  {request.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm"><strong>Téléphone:</strong> {request.phone || 'Non renseigné'}</p>
                  <p className="text-sm"><strong>Freelancers:</strong> {request.freelancersCount}</p>
                  <p className="text-sm"><strong>Date:</strong> {new Date(request.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  {request.message && (
                    <div>
                      <p className="text-sm font-medium mb-1">Message:</p>
                      <p className="text-sm text-gray-600 italic">"{request.message}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {request.status === 'pending' && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusChange(request.id, 'contacted', 'Première prise de contact')}
                    >
                      Marquer comme contacté
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const reason = prompt('Raison du rejet:');
                        if (reason) handleStatusChange(request.id, 'rejected', reason);
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
                      // TODO: Intégrer avec le système d'invitation ESN
                      handleStatusChange(request.id, 'invited', 'Invitation ESN envoyée');
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
            </CardContent>
          </Card>
        ))}
      </div>

      {requests.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Aucune demande de démonstration pour le moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};