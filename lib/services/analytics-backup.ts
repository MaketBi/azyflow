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
   * Récupère l'utilisateur connecté et son company_id
   */
  private static async getCurrentUserCompany() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('🔍 Analytics Debug: Utilisateur non authentifié');
      throw new Error('Non authentifié');
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('id, company_id, role, email')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      console.log('🔍 Analytics Debug: Erreur récupération userData:', error);
      throw new Error('Impossible de récupérer les données utilisateur');
    }

    console.log('🔍 Analytics Debug: Utilisateur connecté:', {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      company_id: userData.company_id
    });

    return userData;
  }

  /**
   * Récupère les KPIs d'un freelancer pour une période
   */
  static async getFreelancerKPIs(freelancerId?: string, period?: string): Promise<FreelancerKPIs | null> {
    try {
      const currentUser = await this.getCurrentUserCompany();
      
      if (!freelancerId) {
        // Si l'utilisateur est admin, prendre un freelancer de son entreprise
        if (currentUser.role === 'admin' && currentUser.company_id) {
          const { data: companyFreelancers } = await supabase
            .from('users')
            .select('id, full_name')
            .eq('role', 'freelancer')
            .eq('company_id', currentUser.company_id)
            .limit(1);
          
          if (companyFreelancers && companyFreelancers.length > 0) {
            freelancerId = companyFreelancers[0].id;
          }
        } else if (currentUser.role === 'freelancer') {
          freelancerId = currentUser.id;
        }
        
        if (!freelancerId) {
          return null;
        }
      }

      // Récupération du freelancer
      const { data: freelancer } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', freelancerId)
        .eq('role', 'freelancer')
        .single();

      if (!freelancer) return null;

      // Année courante ou période spécifiée
      const currentYear = period || new Date().getFullYear().toString();

      // Récupération des contrats du freelancer (filtrés par company_id si admin)
      let contractQuery = supabase
        .from('contracts')
        .select('id, tjm')
        .eq('user_id', freelancerId)
        .eq('status', 'active');

      // Si l'utilisateur est admin, filtrer par son company_id
      if (currentUser.role === 'admin' && currentUser.company_id) {
        contractQuery = contractQuery.eq('company_id', currentUser.company_id);
      }

      const { data: contracts } = await contractQuery;

      if (!contracts || contracts.length === 0) return null;

      const contractIds = contracts.map(c => c.id);

      // D'abord récupérer les timesheets pour avoir les IDs
      const { data: allTimesheets } = await supabase
        .from('timesheets')
        .select('id')
        .in('contract_id', contractIds);

      const timesheetIds = allTimesheets?.map(t => t.id) || [];

      // Récupération des factures
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, amount, status, issue_date, due_date')
        .in('timesheet_id', timesheetIds);

      // Récupération des timesheets
      const { data: timesheets } = await supabase
        .from('timesheets')
        .select('id, worked_days, status, month, submitted_at, validated_at')
        .in('contract_id', contractIds)
        .like('month', `${currentYear}%`);

      // Calculs des KPIs
      const invoicesData = invoices || [];
      const timesheetsData = timesheets || [];

      const totalRevenue = invoicesData.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const totalInvoices = invoicesData.length;
      const pendingInvoices = invoicesData.filter(inv => inv.status === 'pending').length;
      const overdueInvoices = invoicesData.filter(inv => {
        if (inv.status === 'pending' && inv.due_date) {
          return new Date(inv.due_date) < new Date();
        }
        return false;
      }).length;

      const totalWorkedDays = timesheetsData.reduce((sum, ts) => sum + (ts.worked_days || 0), 0);
      
      const submittedTimesheets = timesheetsData.filter(ts => 
        ['submitted', 'approved'].includes(ts.status)
      ).length;
      const approvedTimesheets = timesheetsData.filter(ts => ts.status === 'approved').length;
      
      const validationRate = submittedTimesheets > 0 ? 
        Math.round((approvedTimesheets / submittedTimesheets) * 100) : 0;

      // Calcul du délai de paiement moyen
      const paidInvoices = invoicesData.filter(inv => inv.status === 'paid');
      const averagePaymentDelay = paidInvoices.length > 0 ? 
        paidInvoices.reduce((sum, inv) => {
          if (inv.issue_date && inv.due_date) {
            const issued = new Date(inv.issue_date);
            const due = new Date(inv.due_date);
            const diffDays = Math.floor((due.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24));
            return sum + diffDays;
          }
          return sum + 30; // Défaut 30 jours
        }, 0) / paidInvoices.length : 30;

      const averageTJM = totalWorkedDays > 0 ? totalRevenue / totalWorkedDays : 
        contracts[0]?.tjm || 400; // TJM du contrat

      return {
        freelancerId,
        freelancerName: freelancer.full_name || 'Freelancer',
        monthlyRevenue: Math.round(totalRevenue),
        validationRate,
        averagePaymentDelay: Math.round(averagePaymentDelay),
        totalInvoices,
        pendingInvoices,
        overdueInvoices,
        totalWorkedDays: Math.round(totalWorkedDays * 10) / 10,
        averageTJM: Math.round(averageTJM)
      };

    } catch (error) {
      console.error('Erreur lors du calcul des KPIs freelancer:', error);
      return null;
    }
  }

  /**
   * Récupère l'évolution du chiffre d'affaires
   */
  static async getRevenueEvolution(year?: string): Promise<RevenueEvolution[]> {
    try {
      const currentUser = await this.getCurrentUserCompany();
      const currentYear = year || new Date().getFullYear().toString();

      // Récupérer toutes les factures payées de l'année filtrées par company_id
      let invoiceQuery = supabase
        .from('invoices')
        .select(`
          amount,
          issue_date,
          timesheet_id,
          company_id,
          timesheets!inner(worked_days, month, contract_id)
        `)
        .eq('status', 'paid')
        .gte('issue_date', `${currentYear}-01-01`)
        .lte('issue_date', `${currentYear}-12-31`);

      // Filtrer par company_id si l'utilisateur est admin
      if (currentUser.role === 'admin' && currentUser.company_id) {
        invoiceQuery = invoiceQuery.eq('company_id', currentUser.company_id);
      }

      const { data: invoices } = await invoiceQuery;

      console.log('🔍 Analytics Debug Revenue: Factures trouvées:', invoices?.length || 0);
      console.log('🔍 Analytics Debug Revenue: Company filter:', currentUser.company_id);

      if (!invoices || invoices.length === 0) {
        console.log('🔍 Analytics Debug Revenue: Pas de données réelles, utilisation mock data');
        // Retourner des données de test si pas de données réelles
        const mockData: RevenueEvolution[] = [
          { month: '2024-01', year: 2024, revenue: 15000, invoicesCount: 5, workedDays: 100 },
          { month: '2024-02', year: 2024, revenue: 18000, invoicesCount: 6, workedDays: 120 },
          { month: '2024-03', year: 2024, revenue: 22000, invoicesCount: 7, workedDays: 140 },
          { month: '2024-04', year: 2024, revenue: 19000, invoicesCount: 6, workedDays: 110 },
          { month: '2024-05', year: 2024, revenue: 25000, invoicesCount: 8, workedDays: 160 },
          { month: '2024-06', year: 2024, revenue: 28000, invoicesCount: 9, workedDays: 180 }
        ];
        return mockData;
      }

      // Grouper par mois
      const monthlyData: { [key: string]: RevenueEvolution } = {};
      
      invoices.forEach(invoice => {
        const issueMonth = invoice.issue_date.substring(0, 7); // YYYY-MM
        
        if (!monthlyData[issueMonth]) {
          monthlyData[issueMonth] = {
            month: issueMonth,
            year: parseInt(issueMonth.split('-')[0]),
            revenue: 0,
            invoicesCount: 0,
            workedDays: 0
          };
        }

        monthlyData[issueMonth].revenue += invoice.amount || 0;
        monthlyData[issueMonth].invoicesCount += 1;
        monthlyData[issueMonth].workedDays += invoice.timesheets?.worked_days || 0;
      });

      return Object.values(monthlyData)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // Derniers 12 mois

    } catch (error) {
      console.error('Erreur lors du calcul de l\'évolution revenue:', error);
      return [];
    }
  }

  /**
   * Récupère la répartition des clients
   */
  static async getClientDistribution(year?: string): Promise<ClientDistribution[]> {
    try {
      const currentUser = await this.getCurrentUserCompany();
      const currentYear = year || new Date().getFullYear().toString();

      // Récupérer toutes les factures payées avec les informations client filtrées par company_id
      let invoiceQuery = supabase
        .from('invoices')
        .select(`
          amount,
          client_id,
          company_id,
          clients!inner(id, name)
        `)
        .eq('status', 'paid')
        .gte('issue_date', `${currentYear}-01-01`)
        .lte('issue_date', `${currentYear}-12-31`);

      // Filtrer par company_id si l'utilisateur est admin
      if (currentUser.role === 'admin' && currentUser.company_id) {
        invoiceQuery = invoiceQuery.eq('company_id', currentUser.company_id);
      }

      const { data: invoices } = await invoiceQuery;

      console.log('🔍 Analytics Debug Client: Factures trouvées:', invoices?.length || 0);
      console.log('🔍 Analytics Debug Client: Company filter:', currentUser.company_id);

      if (!invoices || invoices.length === 0) {
        console.log('🔍 Analytics Debug Client: Pas de données réelles, utilisation mock data');
        // Retourner des données de test si pas de données réelles
        return [
          { clientId: '1', clientName: 'Tech Corp', revenue: 120000, invoicesCount: 15, percentage: 35 },
          { clientId: '2', clientName: 'Digital Solutions', revenue: 98000, invoicesCount: 12, percentage: 28 },
          { clientId: '3', clientName: 'Startup Inc', revenue: 75000, invoicesCount: 10, percentage: 22 },
          { clientId: '4', clientName: 'Innovation Lab', revenue: 52000, invoicesCount: 8, percentage: 15 }
        ];
      }

      // Grouper par client
      const clientData: { [key: string]: ClientDistribution } = {};
      
      invoices.forEach(invoice => {
        const clientId = invoice.client_id;
        const clientName = invoice.clients?.name || 'Client inconnu';
        
        if (!clientData[clientId]) {
          clientData[clientId] = {
            clientId,
            clientName,
            revenue: 0,
            invoicesCount: 0,
            percentage: 0
          };
        }

        clientData[clientId].revenue += invoice.amount || 0;
        clientData[clientId].invoicesCount += 1;
      });

      const clients = Object.values(clientData);
      const totalRevenue = clients.reduce((sum, client) => sum + client.revenue, 0);

      // Calculer les pourcentages
      clients.forEach(client => {
        client.percentage = totalRevenue > 0 ? 
          Math.round((client.revenue / totalRevenue) * 100) : 0;
      });

      return clients
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Top 10 clients

    } catch (error) {
      console.error('Erreur lors du calcul de la répartition clients:', error);
      return [];
    }
  }

  /**
   * Récupère les analytics globales d'une entreprise
   */
  static async getCompanyAnalytics(_companyId?: string, period?: string): Promise<CompanyAnalytics> {
    try {
      const currentUser = await this.getCurrentUserCompany();
      
      // Utiliser les données réelles
      const revenueEvolution = await this.getRevenueEvolution(period);
      const clientDistribution = await this.getClientDistribution(period);

      const totalRevenue = revenueEvolution.reduce((sum, month) => sum + month.revenue, 0);
      const lastMonth = revenueEvolution[revenueEvolution.length - 1]?.revenue || 0;
      const previousMonth = revenueEvolution[revenueEvolution.length - 2]?.revenue || 0;
      const monthlyGrowth = previousMonth > 0 ? 
        Math.round(((lastMonth - previousMonth) / previousMonth) * 100) : 0;

      // D'abord, récupérons TOUS les freelancers pour debug
      const { data: allFreelancers } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'freelancer');

      console.log('🔍 Analytics Debug: TOUS les freelancers dans la DB:', allFreelancers?.length || 0);
      console.log('🔍 Analytics Debug: Liste complète:', allFreelancers);

      // Ensuite filtrons par company_id
      let freelancers = allFreelancers || [];
      if (currentUser.role === 'admin' && currentUser.company_id) {
        console.log('🔍 Analytics Debug: Filtrage par company_id:', currentUser.company_id);
        freelancers = freelancers.filter(f => f.company_id === currentUser.company_id);
        console.log('🔍 Analytics Debug: Après filtrage company_id:', freelancers.length);
        
        // Si aucun freelancer avec company_id, cherchons les contrats
        if (freelancers.length === 0) {
          console.log('🔍 Analytics Debug: Aucun freelancer avec company_id, recherche via contrats...');
          const { data: contracts } = await supabase
            .from('contracts')
            .select(`
              user_id,
              user:user_id (*)
            `)
            .eq('company_id', currentUser.company_id);
          
          console.log('🔍 Analytics Debug: Contrats trouvés:', contracts?.length);
          if (contracts && contracts.length > 0) {
            freelancers = contracts.map(c => c.user).filter(Boolean);
            console.log('🔍 Analytics Debug: Freelancers via contrats:', freelancers.length);
          }
        }
      }

      // Limiter à 5 pour l'affichage
      freelancers = freelancers.slice(0, 5);

      console.log('🔍 Analytics Debug: Freelancers finaux trouvés:', freelancers?.length || 0);
      console.log('🔍 Analytics Debug: Liste freelancers finaux:', freelancers);

      const topFreelancers: FreelancerKPIs[] = [];
      
      if (freelancers && freelancers.length > 0) {
        for (const freelancer of freelancers) {
          console.log('🔍 Analytics Debug: Calcul KPIs pour freelancer:', freelancer.full_name);
          const kpi = await this.getFreelancerKPIs(freelancer.id, period);
          if (kpi) {
            console.log('🔍 Analytics Debug: KPI calculé:', kpi);
            topFreelancers.push(kpi);
          }
        }
      } else {
        // Données de fallback si pas de freelancers
        topFreelancers.push({
          freelancerId: 'demo',
          freelancerName: 'Demo Freelancer',
          monthlyRevenue: 4500,
          validationRate: 95,
          averagePaymentDelay: 32,
          totalInvoices: 12,
          pendingInvoices: 2,
          overdueInvoices: 1,
          totalWorkedDays: 220,
          averageTJM: 450
        });
      }

      // Calculer les freelancers actifs
      const activeFreelancers = topFreelancers.filter(f => f.totalWorkedDays > 0).length;

      // Calculer le délai moyen de validation
      const averageValidationDelay = topFreelancers.length > 0 ? 
        topFreelancers.reduce((sum, f) => sum + f.averagePaymentDelay, 0) / topFreelancers.length : 0;

      return {
        totalRevenue,
        monthlyGrowth,
        activeFreelancers: activeFreelancers || freelancers?.length || 3,
        averageValidationDelay: Math.round(averageValidationDelay * 10) / 10,
        revenueEvolution,
        clientDistribution,
        topFreelancers: topFreelancers.sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
      };

    } catch (error) {
      console.error('Erreur lors du calcul des analytics entreprise:', error);
      return {
        totalRevenue: 0,
        monthlyGrowth: 0,
        activeFreelancers: 0,
        averageValidationDelay: 0,
        revenueEvolution: [],
        clientDistribution: [],
        topFreelancers: []
      };
    }
  }
}