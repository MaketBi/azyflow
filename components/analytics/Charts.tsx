import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface RevenueEvolutionChartProps {
  data: Array<{
    month: string;
    year: number;
    revenue: number;
    invoicesCount: number;
  }>;
}

export const RevenueEvolutionChart: React.FC<RevenueEvolutionChartProps> = ({ data }) => {
  // Gérer le cas où il n'y a pas de données
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Évolution du Chiffre d'Affaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-gray-500">
            Aucune donnée disponible pour cette période
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    labels: data.map(item => `${item.month} ${item.year}`),
    datasets: [
      {
        label: 'Chiffre d\'affaires (€)',
        data: data.map(item => item.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Évolution du chiffre d\'affaires'
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR'
            }).format(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              notation: 'compact'
            }).format(value);
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution du Chiffre d'Affaires</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '400px' }}>
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};

interface ClientDistributionChartProps {
  data: Array<{
    clientName: string;
    revenue: number;
    percentage: number;
  }>;
}

export const ClientDistributionChart: React.FC<ClientDistributionChartProps> = ({ data }) => {
  // Gérer le cas où il n'y a pas de données
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Répartition des Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-gray-500">
            Aucune donnée client disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prendre les 5 plus gros clients + regrouper le reste
  const topClients = data.slice(0, 5);
  const othersRevenue = data.slice(5).reduce((sum, client) => sum + client.revenue, 0);
  const othersPercentage = data.slice(5).reduce((sum, client) => sum + client.percentage, 0);

  const chartData = {
    labels: [
      ...topClients.map(client => client.clientName),
      ...(othersRevenue > 0 ? ['Autres clients'] : [])
    ],
    datasets: [
      {
        data: [
          ...topClients.map(client => client.revenue),
          ...(othersRevenue > 0 ? [othersRevenue] : [])
        ],
        backgroundColor: [
          '#ef4444', // red-500
          '#f97316', // orange-500
          '#eab308', // yellow-500
          '#22c55e', // green-500
          '#3b82f6', // blue-500
          '#8b5cf6'  // violet-500
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: 'Répartition du CA par client'
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const revenue = context.parsed;
            const percentage = context.dataIndex < topClients.length 
              ? topClients[context.dataIndex].percentage 
              : othersPercentage;
            
            return `${context.label}: ${new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR'
            }).format(revenue)} (${percentage.toFixed(1)}%)`;
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par Client</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '400px' }}>
          <Doughnut data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};

interface FreelancerPerformanceChartProps {
  data: Array<{
    freelancerName: string;
    monthlyRevenue: number;
    validationRate: number;
    averagePaymentDelay: number;
  }>;
}

export const FreelancerPerformanceChart: React.FC<FreelancerPerformanceChartProps> = ({ data }) => {
  // Gérer le cas où il n'y a pas de données
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance des Freelancers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-gray-500">
            Aucune donnée de performance disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    labels: data.map(item => item.freelancerName),
    datasets: [
      {
        label: 'CA mensuel (€)',
        data: data.map(item => item.monthlyRevenue),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        yAxisID: 'y'
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Performance des Freelancers'
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context: any) {
            const index = context.dataIndex;
            const freelancer = data[index];
            return [
              `Taux validation: ${freelancer.validationRate.toFixed(1)}%`,
              `Délai paiement: ${freelancer.averagePaymentDelay.toFixed(0)} jours`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              notation: 'compact'
            }).format(value);
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Freelancers</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '400px' }}>
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  change, 
  changeLabel,
  icon, 
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    red: 'bg-red-500 text-white'
  };

  const changeColorClasses = change && change > 0 ? 'text-green-600' : 'text-red-600';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {change !== undefined && (
              <p className={`text-sm mt-1 ${changeColorClasses}`}>
                {change > 0 ? '+' : ''}{change.toFixed(1)}% {changeLabel}
              </p>
            )}
          </div>
          {icon && (
            <div className={`p-3 rounded-full ${colorClasses[color]}`}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};