import React, { useState, useEffect } from 'react';
import { FreelancerBillingDashboard } from '../../components/billing/FreelancerBillingDashboard';
import { supabase } from '../../lib/supabase';

export const BillingManagementPage: React.FC = () => {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserCompany();
  }, []);

  const getCurrentUserCompany = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Utilisateur non authentifié');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id, role')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        setError('Erreur lors de la récupération des données utilisateur');
        return;
      }

      if (userData.role !== 'admin') {
        setError('Accès réservé aux administrateurs');
        return;
      }

      if (!userData.company_id) {
        setError('Aucune entreprise associée');
        return;
      }

      setCompanyId(userData.company_id);
    } catch (err) {
      setError('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur d'accès</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <FreelancerBillingDashboard companyId={companyId} />
      </div>
    </div>
  );
};