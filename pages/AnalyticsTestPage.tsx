import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { AnalyticsService } from '../lib/services/analytics';

export const AnalyticsTestPage: React.FC = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAnalytics = async () => {
    setLoading(true);
    try {
      const revenueEvolution = await AnalyticsService.getRevenueEvolution('2024');
      const clientDistribution = await AnalyticsService.getClientDistribution('2024');
      
      setResults({
        revenueEvolution,
        clientDistribution,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur test analytics:', error);
      setResults({ error: error instanceof Error ? error.message : 'Erreur inconnue' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Analytics</h1>
      
      <Button onClick={testAnalytics} disabled={loading} className="mb-6">
        {loading ? 'Chargement...' : 'Tester Analytics'}
      </Button>

      {results && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold mb-2">Résultats:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};