import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  KPICard 
} from './Charts';
import { 
  AnalyticsService, 
  CompanyAnalytics, 
  FreelancerKPIs 
} from '../../lib/services/analytics';

interface AnalyticsDashboardProps {
  isFreelancer?: boolean;
  freelancerId?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  isFreelancer = false, 
  freelancerId 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyAnalytics, setCompanyAnalytics] = useState<CompanyAnalytics | null>(null);
  const [freelancerKPIs, setFreelancerKPIs] = useState<FreelancerKPIs | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    // Attendre un peu que l'auth soit établie
    const timer = setTimeout(() => {
      loadAnalytics();
    }, 100);
    return () => clearTimeout(timer);
  }, [isFreelancer, freelancerId, selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isFreelancer && freelancerId) {
        const kpis = await AnalyticsService.getFreelancerKPIs(freelancerId, selectedPeriod);
        setFreelancerKPIs(kpis);
      } else {
        const analytics = await AnalyticsService.getCompanyAnalytics(undefined, selectedPeriod);
        setCompanyAnalytics(analytics);
      }
    } catch (err: any) {
      console.error('Erreur analytics:', err);
      setError(err.message || 'Erreur lors du chargement des analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadAnalytics}>
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vue Freelancer
  if (isFreelancer && freelancerKPIs) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Tableau de Bord - {freelancerKPIs.freelancerName}
            </h2>
            <p className="text-gray-600 mt-1">
              Performance du mois en cours
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={selectedPeriod === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('month')}
            >
              Mois
            </Button>
            <Button 
              variant={selectedPeriod === 'quarter' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('quarter')}
            >
              Trimestre
            </Button>
            <Button 
              variant={selectedPeriod === 'year' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('year')}
            >
              Année
            </Button>
          </div>
        </div>

        {/* KPIs Freelancer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="CA Mensuel"
            value={formatCurrency(freelancerKPIs.monthlyRevenue)}
            icon={<DollarSign className="h-6 w-6" />}
            color="green"
          />
          <KPICard
            title="Taux de Validation CRA"
            value={formatPercentage(freelancerKPIs.validationRate)}
            icon={<Target className="h-6 w-6" />}
            color={freelancerKPIs.validationRate >= 80 ? 'green' : 'yellow'}
          />
          <KPICard
            title="Délai de Paiement Moyen"
            value={`${freelancerKPIs.averagePaymentDelay.toFixed(0)} jours`}
            icon={<Clock className="h-6 w-6" />}
            color={freelancerKPIs.averagePaymentDelay <= 30 ? 'green' : 'red'}
          />
          <KPICard
            title="Jours Travaillés"
            value={freelancerKPIs.totalWorkedDays}
            icon={<Calendar className="h-6 w-6" />}
            color="blue"
          />
        </div>

        {/* Détails supplémentaires */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Facturation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total factures</span>
                  <span className="font-semibold">{freelancerKPIs.totalInvoices}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">En attente</span>
                  <span className="font-semibold text-yellow-600">{freelancerKPIs.pendingInvoices}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">En retard</span>
                  <span className="font-semibold text-red-600">{freelancerKPIs.overdueInvoices}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-gray-600">TJM Moyen</span>
                  <span className="font-semibold">{formatCurrency(freelancerKPIs.averageTJM)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Taux de validation</span>
                    <span className="font-semibold">{formatPercentage(freelancerKPIs.validationRate)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        freelancerKPIs.validationRate >= 80 ? 'bg-green-500' : 
                        freelancerKPIs.validationRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(freelancerKPIs.validationRate, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Délai paiement</span>
                    <span className="font-semibold">{freelancerKPIs.averagePaymentDelay.toFixed(0)}j</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {freelancerKPIs.averagePaymentDelay <= 30 ? '✅ Dans les temps' : 
                     freelancerKPIs.averagePaymentDelay <= 45 ? '⚠️ Acceptable' : '❌ Trop long'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Vue Admin/Compagnie
  if (companyAnalytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Tableau de Bord Analytics
            </h2>
            <p className="text-gray-600 mt-1">
              Vue d'ensemble de l'activité de la compagnie
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={selectedPeriod === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('month')}
            >
              Mois
            </Button>
            <Button 
              variant={selectedPeriod === 'quarter' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('quarter')}
            >
              Trimestre
            </Button>
            <Button 
              variant={selectedPeriod === 'year' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('year')}
            >
              Année
            </Button>
          </div>
        </div>

        {/* KPIs Généraux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="CA Total"
            value={formatCurrency(companyAnalytics.totalRevenue)}
            change={companyAnalytics.monthlyGrowth}
            changeLabel="vs mois précédent"
            icon={<DollarSign className="h-6 w-6" />}
            color="green"
          />
          <KPICard
            title="Freelancers Actifs"
            value={companyAnalytics.activeFreelancers}
            icon={<Users className="h-6 w-6" />}
            color="blue"
          />
                    <KPICard
            title="Délai Paiement Moyen"
            value={`${companyAnalytics.averageValidationDelay.toFixed(0)} jours`}
            icon={<Clock className="h-6 w-6" />}
            color={companyAnalytics.averageValidationDelay <= 30 ? 'green' : 'yellow'}
          />
        </div>

        {/* Tables Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution Revenue Table */}
          <Card key={`revenue-table-${selectedPeriod}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Évolution du Chiffre d'Affaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyAnalytics.revenueEvolution.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mois</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CA</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Factures</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jours</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companyAnalytics.revenueEvolution.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.month}</td>
                          <td className="px-4 py-2 text-sm text-green-600 font-semibold">{formatCurrency(item.revenue)}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{item.invoicesCount}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{item.workedDays}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée de revenue disponible
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Distribution Table */}
          <Card key={`clients-table-${selectedPeriod}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Répartition des Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyAnalytics.clientDistribution.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CA</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Factures</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companyAnalytics.clientDistribution.slice(0, 10).map((client, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{client.clientName}</td>
                          <td className="px-4 py-2 text-sm text-green-600 font-semibold">{formatCurrency(client.revenue)}</td>
                          <td className="px-4 py-2 text-sm text-blue-600 font-medium">{client.percentage}%</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{client.invoicesCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée client disponible
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Freelancers Table */}
        <Card key={`performance-table-${selectedPeriod}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance des Freelancers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {companyAnalytics.topFreelancers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Freelancer</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CA Mensuel</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Délai Paiement</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jours Travaillés</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">TJM Moyen</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {companyAnalytics.topFreelancers.map((freelancer, index) => (
                      <tr key={freelancer.freelancerId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold
                              ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'}`}>
                              {index + 1}
                            </div>
                            {freelancer.freelancerName}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-green-600 font-semibold">{formatCurrency(freelancer.monthlyRevenue)}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{freelancer.averagePaymentDelay.toFixed(0)} jours</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{freelancer.totalWorkedDays}</td>
                        <td className="px-4 py-2 text-sm text-purple-600 font-medium">{formatCurrency(freelancer.averageTJM)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucune donnée de performance disponible
              </div>
            )}
          </CardContent>
        </Card>


      </div>
    );
  }

  return null;
};