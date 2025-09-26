import React, { useState } from 'react';
import { Users, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import ClientsView from '../../components/clients/ClientsView.tsx';
import ContractsView from '../../components/contracts/ContractsView.tsx';

const ClientsContractsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clients' | 'contracts'>('clients');

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {activeTab === 'contracts' ? 'Gestion des Contrats' : 'Gestion des Clients'}
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              {activeTab === 'contracts' 
                ? 'Gérez les contrats et conditions de collaboration avec vos freelancers' 
                : 'Gérez votre portefeuille clients et leurs informations'
              }
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={activeTab === 'clients' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('clients')}
              className="flex items-center"
            >
              <Users className="w-4 h-4 mr-2" />
              Clients
            </Button>
            <Button
              variant={activeTab === 'contracts' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('contracts')}
              className="flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Contrats
            </Button>
          </div>
        </div>
      </div>

      {activeTab === 'contracts' ? (
        <ContractsView />
      ) : (
        <ClientsView />
      )}
    </div>
  );
};

export default ClientsContractsPage;