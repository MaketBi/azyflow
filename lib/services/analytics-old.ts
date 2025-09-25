import { supabase } from '../supabase';

export type FreelancerKPIs = {
  freelancerId: string;
  freelancerName: string;
  monthlyRevenue: number; // CA mensuel
  validationRate: number; // Taux de validation CRA
  averagePaymentDelay: number; // Délai moyen de paiement
  totalInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalWorkedDays: number;
  averageTJM: number;
};

export type RevenueEvolution = {
  month: string;
  year: number;
  revenue: number;
  invoicesCount: number;
  workedDays: number;
};

export type ClientDistribution = {
  clientId: string;
  clientName: string;
  revenue: number;
  invoicesCount: number;
  percentage: number;
};

export type CompanyAnalytics = {
  totalRevenue: number;
  monthlyGrowth: number;
  activeFreelancers: number;
  averageValidationDelay: number;
  revenueEvolution: RevenueEvolution[];
  clientDistribution: ClientDistribution[];
  topFreelancers: FreelancerKPIs[];
};

export class AnalyticsService {
  /**
   * Récupère les KPIs d'un freelancer pour une période
   */
  static async getFreelancerKPIs(freelancerId?: string, period?: string): Promise<FreelancerKPIs | null> {
    try {
      // Données de test pour la démonstration
      if (!freelancerId) {
        return {
          freelancerId: 'demo-freelancer',
          freelancerName: 'Jean Dupont',
          monthlyRevenue: 4500,
          validationRate: 95,
          averagePaymentDelay: 32,
          totalInvoices: 12,
          pendingInvoices: 2,
          overdueInvoices: 1,
          totalWorkedDays: 220,
          averageTJM: 450
        };
      }

      const currentYear = new Date().getFullYear();
      const yearStr = period || currentYear.toString();

      // Récupération des données réelles
      const { data: freelancer } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', freelancerId)
        .eq('role', 'freelance')
        .single();

      if (!freelancer) return null;

      // Récupération des contrats du freelancer
      const { data: contracts } = await supabase
        .from('contracts')
        .select(`
          id,
          timesheets(*),
          invoices(*)
        `)
        .eq('freelance_id', freelancerId)
        .eq('status', 'active');

      if (!contracts || contracts.length === 0) return null;

      // Calcul des KPIs
      let totalRevenue = 0;
      let totalInvoices = 0;
      let pendingInvoices = 0;
      let overdueInvoices = 0;
      let totalWorkedDays = 0;
      let approvedTimesheets = 0;
      let submittedTimesheets = 0;
      let totalPaymentDelays = 0;
      let paidInvoices = 0;

      contracts.forEach(contract => {
        // Calculs des factures
        const invoices = (contract.invoices || []).filter(inv => 
          inv && inv.month_year?.startsWith(yearStr)
        );
        
        invoices.forEach(invoice => {
          if (invoice) {
            totalInvoices++;
            totalRevenue += Number(invoice.amount || 0);
            
            if (invoice.status === 'pending') pendingInvoices++;
            else if (invoice.status === 'overdue') overdueInvoices++;
            else if (invoice.status === 'paid') {
              paidInvoices++;
              // Calcul approximatif du délai de paiement (30 jours par défaut)
              totalPaymentDelays += 30;
            }
          }
        });

        // Calculs des timesheets
        const timesheets = (contract.timesheets || []).filter(ts => 
          ts && ts.month?.startsWith(yearStr)
        );
        
        timesheets.forEach(timesheet => {
          if (timesheet) {
            totalWorkedDays += Number(timesheet.days_worked || 0);
            
            if (timesheet.status === 'submitted') submittedTimesheets++;
            if (timesheet.status === 'approved') {
              approvedTimesheets++;
              submittedTimesheets++;
            }
          }
        });
      });

      const validationRate = submittedTimesheets > 0 ? 
        Math.round((approvedTimesheets / submittedTimesheets) * 100) : 0;
      
      const averagePaymentDelay = paidInvoices > 0 ? 
        Math.round(totalPaymentDelays / paidInvoices) : 0;
      
      const averageTJM = totalWorkedDays > 0 ? 
        Math.round(totalRevenue / totalWorkedDays) : 0;

      return {
        freelancerId,
        freelancerName: freelancer.full_name || 'Freelancer',
        monthlyRevenue: Math.round(totalRevenue),
        validationRate,
        averagePaymentDelay,
        totalInvoices,
        pendingInvoices,
        overdueInvoices,
        totalWorkedDays: Math.round(totalWorkedDays),
        averageTJM
      };

    } catch (error) {
      console.error('Erreur lors du calcul des KPIs freelancer:', error);
      return null;
    }
  }

  /**
   * Récupère l'évolution du chiffre d'affaires
   */
  static async getRevenueEvolution(year: string): Promise<RevenueEvolution[]> {
    try {
      // Données de test pour la démonstration
      const mockData: RevenueEvolution[] = [
        { month: '2024-01', year: 2024, revenue: 15000, invoicesCount: 5, workedDays: 100 },
        { month: '2024-02', year: 2024, revenue: 18000, invoicesCount: 6, workedDays: 120 },
        { month: '2024-03', year: 2024, revenue: 22000, invoicesCount: 7, workedDays: 140 },
        { month: '2024-04', year: 2024, revenue: 19000, invoicesCount: 6, workedDays: 110 },
        { month: '2024-05', year: 2024, revenue: 25000, invoicesCount: 8, workedDays: 160 },
        { month: '2024-06', year: 2024, revenue: 28000, invoicesCount: 9, workedDays: 180 },
        { month: '2024-07', year: 2024, revenue: 31000, invoicesCount: 10, workedDays: 200 },
        { month: '2024-08', year: 2024, revenue: 27000, invoicesCount: 8, workedDays: 170 },
        { month: '2024-09', year: 2024, revenue: 30000, invoicesCount: 9, workedDays: 190 },
        { month: '2024-10', year: 2024, revenue: 33000, invoicesCount: 11, workedDays: 210 },
        { month: '2024-11', year: 2024, revenue: 29000, invoicesCount: 9, workedDays: 180 },
        { month: '2024-12', year: 2024, revenue: 35000, invoicesCount: 12, workedDays: 220 }
      ];

      return mockData;

    } catch (error) {
      console.error('Erreur lors du calcul de l\'évolution revenue:', error);
      return [];
    }
  }

  /**
   * Récupère la répartition des clients
   */
  static async getClientDistribution(year: string): Promise<ClientDistribution[]> {
    try {
      // Données de test pour la démonstration
      return [
        { clientId: '1', clientName: 'Tech Corp', revenue: 120000, invoicesCount: 15, percentage: 35 },
        { clientId: '2', clientName: 'Digital Solutions', revenue: 98000, invoicesCount: 12, percentage: 28 },
        { clientId: '3', clientName: 'Startup Inc', revenue: 75000, invoicesCount: 10, percentage: 22 },
        { clientId: '4', clientName: 'Innovation Lab', revenue: 52000, invoicesCount: 8, percentage: 15 }
      ];

    } catch (error) {
      console.error('Erreur lors du calcul de la répartition clients:', error);
      return [];
    }
  }

  /**
   * Récupère les KPIs de tous les freelancers actifs
   */
  static async getAllFreelancersKPIs(month?: string, year?: number): Promise<FreelancerKPIs[]> {
    try {
      // Récupérer tous les freelancers actifs avec des contrats
      const { data: freelancers, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          contracts!inner(id)
        `)
        .eq('role', 'freelancer')
        .eq('contracts.status', 'active');

      if (error || !freelancers) {
        console.error('Erreur récupération freelancers:', error);
        return [];
      }

      const kpisPromises = freelancers.map(freelancer => 
        this.getFreelancerKPIs(freelancer.id, month, year)
      );

      const kpisResults = await Promise.all(kpisPromises);
      return kpisResults.filter((kpi): kpi is FreelancerKPIs => kpi !== null);

    } catch (error) {
      console.error('Erreur récupération KPIs freelancers:', error);
      return [];
    }
  }

  /**
   * Récupère l'évolution du chiffre d'affaires sur les 12 derniers mois
   */
  static async getRevenueEvolution(companyId?: string): Promise<RevenueEvolution[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer company_id si non fourni
      let targetCompanyId = companyId;
      if (!targetCompanyId) {
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single();
        targetCompanyId = userData?.company_id;
      }

      if (!targetCompanyId) {
        throw new Error('Company ID non trouvé');
      }

      // Date il y a 12 mois
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          amount_ttc,
          created_at,
          timesheet:timesheets!inner(
            worked_days,
            month,
            year
          )
        `)
        .eq('company_id', targetCompanyId)
        .gte('created_at', twelveMonthsAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur récupération évolution revenus:', error);
        return [];
      }

      // Grouper par mois
      const monthlyData = new Map<string, RevenueEvolution>();

      invoices?.forEach(invoice => {
        const date = new Date(invoice.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const month = date.toLocaleString('fr-FR', { month: 'long' });
        const year = date.getFullYear();

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            month,
            year,
            revenue: 0,
            invoicesCount: 0,
            workedDays: 0
          });
        }

        const data = monthlyData.get(monthKey)!;
        data.revenue += invoice.amount_ttc || 0;
        data.invoicesCount += 1;
        data.workedDays += invoice.timesheet?.worked_days || 0;
      });

      return Array.from(monthlyData.values()).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const monthsOrder = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                           'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        return monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month);
      });

    } catch (error) {
      console.error('Erreur calcul évolution revenus:', error);
      return [];
    }
  }

  /**
   * Récupère la répartition du chiffre d'affaires par client
   */
  static async getClientDistribution(companyId?: string, period?: { start: Date, end: Date }): Promise<ClientDistribution[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer company_id si non fourni
      let targetCompanyId = companyId;
      if (!targetCompanyId) {
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single();
        targetCompanyId = userData?.company_id;
      }

      if (!targetCompanyId) {
        throw new Error('Company ID non trouvé');
      }

      // Période par défaut : année en cours
      const startDate = period?.start || new Date(new Date().getFullYear(), 0, 1);
      const endDate = period?.end || new Date();

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          amount_ttc,
          client:clients!inner(
            id,
            name
          )
        `)
        .eq('company_id', targetCompanyId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        console.error('Erreur récupération répartition clients:', error);
        return [];
      }

      // Grouper par client
      const clientData = new Map<string, { name: string, revenue: number, count: number }>();

      invoices?.forEach(invoice => {
        const clientId = invoice.client.id;
        const clientName = invoice.client.name;

        if (!clientData.has(clientId)) {
          clientData.set(clientId, { name: clientName, revenue: 0, count: 0 });
        }

        const data = clientData.get(clientId)!;
        data.revenue += invoice.amount_ttc || 0;
        data.count += 1;
      });

      const totalRevenue = Array.from(clientData.values()).reduce((sum, client) => sum + client.revenue, 0);

      return Array.from(clientData.entries())
        .map(([clientId, data]) => ({
          clientId,
          clientName: data.name,
          revenue: data.revenue,
          invoicesCount: data.count,
          percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
        }))
        .sort((a, b) => b.revenue - a.revenue);

    } catch (error) {
      console.error('Erreur calcul répartition clients:', error);
      return [];
    }
  }

  /**
   * Récupère les analytics globaux de la compagnie
   */
  static async getCompanyAnalytics(): Promise<CompanyAnalytics | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: userData } = await supabase
        .from('users')
        .select('company_id, role')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id || userData.role !== 'admin') {
        throw new Error('Accès non autorisé');
      }

      const companyId = userData.company_id;

      // Exécuter les requêtes en parallèle
      const [
        revenueEvolution,
        clientDistribution,
        freelancersKPIs
      ] = await Promise.all([
        this.getRevenueEvolution(companyId),
        this.getClientDistribution(companyId),
        this.getAllFreelancersKPIs()
      ]);

      // Calculs globaux
      const totalRevenue = clientDistribution.reduce((sum, client) => sum + client.revenue, 0);
      const currentMonthRevenue = revenueEvolution[revenueEvolution.length - 1]?.revenue || 0;
      const previousMonthRevenue = revenueEvolution[revenueEvolution.length - 2]?.revenue || 0;
      const monthlyGrowth = previousMonthRevenue > 0 
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : 0;

      const activeFreelancers = freelancersKPIs.filter(kpi => kpi.monthlyRevenue > 0).length;
      const averageValidationDelay = freelancersKPIs.length > 0
        ? freelancersKPIs.reduce((sum, kpi) => sum + kpi.averagePaymentDelay, 0) / freelancersKPIs.length
        : 0;

      return {
        totalRevenue,
        monthlyGrowth,
        activeFreelancers,
        averageValidationDelay,
        revenueEvolution,
        clientDistribution,
        topFreelancers: freelancersKPIs.sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).slice(0, 5)
      };

    } catch (error) {
      console.error('Erreur calcul analytics compagnie:', error);
      return null;
    }
  }
}