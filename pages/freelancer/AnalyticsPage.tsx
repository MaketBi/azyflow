import React from 'react';
import { AnalyticsDashboard } from '../../components/analytics/AnalyticsDashboard';

export const FreelancerAnalyticsPage: React.FC = () => {
  return (
    <div className="px-2 sm:px-4 md:px-8 lg:px-16 py-6 space-y-8 w-full max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mon tableau de bord</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Analyse de votre performance freelance</p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
};