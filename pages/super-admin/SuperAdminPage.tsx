import React, { useState, useEffect } from 'react';
import SuperAdminDashboard from '../../components/super-admin/SuperAdminDashboard';
import { SuperAdminService } from '../../lib/services/super-admin';
import { Shield, AlertTriangle } from 'lucide-react';

const SuperAdminPage: React.FC = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSuperAdminAccess();
  }, []);

  const checkSuperAdminAccess = async () => {
    try {
      const hasAccess = await SuperAdminService.isSuperAdmin();
      setIsSuperAdmin(hasAccess);
    } catch (error) {
      console.error('Error checking super admin access:', error);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès Refusé</h1>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas les permissions nécessaires pour accéder au dashboard Super Admin.
          </p>
          <p className="text-sm text-gray-500">
            Seuls les Super Administrateurs d'Azyflow peuvent accéder à cette section.
          </p>
          <div className="mt-6">
            <button 
              onClick={() => window.history.back()}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Retour à la page précédente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Azyflow Super Admin</h1>
            <p className="text-gray-600">Gestion B2B Premium - Contrôle des ESN</p>
          </div>
        </div>
        
        <SuperAdminDashboard />
      </div>
    </div>
  );
};

export default SuperAdminPage;