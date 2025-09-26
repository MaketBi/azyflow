import React, { useState } from 'react';
import FreelancersView from '../../components/freelancers/FreelancersView';
import TimesheetsView from '../../components/timesheets/TimesheetsView';

const FreelancersTimesheetsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'freelancers' | 'timesheets'>('freelancers');

  const getPageTitle = () => {
    switch (activeTab) {
      case 'freelancers':
        return 'Gestion des Freelancers';
      case 'timesheets':
        return 'Gestion des Feuilles de Temps';
      default:
        return 'Gestion des Freelancers & Feuilles de Temps';
    }
  };

  const getPageDescription = () => {
    switch (activeTab) {
      case 'freelancers':
        return 'Gérez vos freelancers, invitez de nouveaux talents et suivez leur statut';
      case 'timesheets':
        return 'Consultez et validez les feuilles de temps soumises par vos freelancers';
      default:
        return 'Gestion des freelancers et feuilles de temps';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header avec titre dynamique */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="mt-1 text-sm text-gray-600">{getPageDescription()}</p>
          </div>

          {/* Navigation par onglets */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('freelancers')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'freelancers'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Freelancers
              </button>
              <button
                onClick={() => setActiveTab('timesheets')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'timesheets'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Feuilles de Temps
              </button>
            </div>
          </div>

          {/* Contenu des onglets */}
          <div className="p-0">
            {activeTab === 'freelancers' && <FreelancersView />}
            {activeTab === 'timesheets' && <TimesheetsView />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancersTimesheetsPage;