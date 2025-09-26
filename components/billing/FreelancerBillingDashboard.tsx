import React from 'react';
import PartialPaymentDashboard from './PartialPaymentDashboard';

interface FreelancerBillingDashboardProps {
  companyId: string;
}

export const FreelancerBillingDashboard: React.FC<FreelancerBillingDashboardProps> = ({ companyId }) => {
  return (
    <div>
      {/* Contenu principal : Composant de paiements partiels avec header dynamique intégré */}
      <PartialPaymentDashboard companyId={companyId} />
    </div>
  );
};