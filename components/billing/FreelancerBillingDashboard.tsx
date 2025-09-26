import React from 'react';
import PartialPaymentDashboard from './PartialPaymentDashboard';

interface FreelancerBillingDashboardProps {
  companyId: string;
}

export const FreelancerBillingDashboard: React.FC<FreelancerBillingDashboardProps> = ({ companyId }) => {
  return (
    <div className="space-y-6">
      {/* En-tête simplifié */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Paiements Freelancers
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez les versements, paiements partiels et avances à vos freelancers
          </p>
        </div>
      </div>

      {/* Contenu principal : Composant de paiements partiels uniquement */}
      <PartialPaymentDashboard companyId={companyId} />
    </div>
  );
};