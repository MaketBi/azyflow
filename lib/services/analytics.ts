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
  averageValidationDelay: number; // Délai moyen de paiement (en jours)
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
      throw new Error('Utilisateur non authentifié');
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('id, company_id, role, email')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      throw new Error('Impossible de récupérer les données utilisateur');
    }



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

      if (!freelancer) {
        return null;
      }

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

      // Si pas de contrats, retourner des KPIs à zéro au lieu de null
      if (!contracts || contracts.length === 0) {
        return {
          freelancerId,
          freelancerName: freelancer.full_name || 'Freelancer',
          monthlyRevenue: 0,
          validationRate: 0,
          averagePaymentDelay: 0,
          totalInvoices: 0,
          pendingInvoices: 0,
          overdueInvoices: 0,
          totalWorkedDays: 0,
          averageTJM: 0
        };
      }

      const contractIds = contracts.map(c => c.id);

      // Récupération de TOUS les timesheets pour les factures
      const { data: allTimesheets } = await supabase
        .from('timesheets')
        .select('id, worked_days, status, month, submitted_at, validated_at')
        .in('contract_id', contractIds);

      const allTimesheetIds = allTimesheets?.map(t => t.id) || [];

      // Récupération des factures (toutes périodes)
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, amount, status, issue_date, due_date')
        .in('timesheet_id', allTimesheetIds);

      // Filtrer les timesheets par année SEULEMENT pour le calcul des jours travaillés
      const timesheets = allTimesheets?.filter(t => 
        t.month && t.month.toString().startsWith(currentYear)
      ) || [];

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

      // Calcul du délai de paiement moyen (inclut les factures payées et payées au freelancer)
      const paidInvoices = invoicesData.filter(inv => ['paid', 'paid_freelancer'].includes(inv.status));
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
      // Inclut les factures 'paid' (payées par le client) ET 'paid_freelancer' (payées au freelancer)
      let invoiceQuery = supabase
        .from('invoices')
        .select(`
          amount,
          issue_date,
          timesheet_id,
          company_id,
          timesheets!inner(worked_days, month, contract_id)
        `)
        .in('status', ['paid', 'paid_freelancer'])
        .gte('issue_date', `${currentYear}-01-01`)
        .lte('issue_date', `${currentYear}-12-31`);

      // Filtrer par company_id si l'utilisateur est admin
      if (currentUser.role === 'admin' && currentUser.company_id) {
        invoiceQuery = invoiceQuery.eq('company_id', currentUser.company_id);
      }

      const { data: invoices } = await invoiceQuery;



      if (!invoices || invoices.length === 0) {
        // Pas de données = retourner des valeurs zéro
        return [];
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
      // Inclut les factures 'paid' (payées par le client) ET 'paid_freelancer' (payées au freelancer)
      let invoiceQuery = supabase
        .from('invoices')
        .select(`
          amount,
          client_id,
          company_id,
          clients!inner(id, name)
        `)
        .in('status', ['paid', 'paid_freelancer'])
        .gte('issue_date', `${currentYear}-01-01`)
        .lte('issue_date', `${currentYear}-12-31`);

      // Filtrer par company_id si l'utilisateur est admin
      if (currentUser.role === 'admin' && currentUser.company_id) {
        invoiceQuery = invoiceQuery.eq('company_id', currentUser.company_id);
      }

      const { data: invoices } = await invoiceQuery;



      if (!invoices || invoices.length === 0) {
        // Pas de données = retourner des valeurs vides
        return [];
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
      
      // Convertir la période en année pour les requêtes
      let yearForQuery = new Date().getFullYear().toString();
      if (period && period.includes('202')) {
        // Si c'est déjà une année (ex: "2024"), l'utiliser
        yearForQuery = period;
      }
      
      // Utiliser les données réelles
      const revenueEvolution = await this.getRevenueEvolution(yearForQuery);
      const clientDistribution = await this.getClientDistribution(yearForQuery);

      const totalRevenue = revenueEvolution.reduce((sum, month) => sum + month.revenue, 0);
      const lastMonth = revenueEvolution[revenueEvolution.length - 1]?.revenue || 0;
      const previousMonth = revenueEvolution[revenueEvolution.length - 2]?.revenue || 0;
      const monthlyGrowth = previousMonth > 0 ? 
        Math.round(((lastMonth - previousMonth) / previousMonth) * 100) : 0;

      // Récupérer TOUS les freelancers actifs de l'entreprise (même logique que l'onglet Accueil)
      let allCompanyFreelancers: any[] = [];
      
      if (currentUser.role === 'admin' && currentUser.company_id) {
        // D'abord essayer de trouver les freelancers avec company_id direct
        const { data: directFreelancers } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'freelancer')
          .eq('company_id', currentUser.company_id);
        

        
        if (directFreelancers && directFreelancers.length > 0) {
          allCompanyFreelancers = directFreelancers;
        } else {
          // Si pas de freelancers avec company_id direct, chercher via les contrats actifs
          const { data: contractsWithUsers } = await supabase
            .from('contracts')
            .select(`
              user_id,
              user:user_id!inner (
                id,
                full_name,
                email,
                role,
                company_id
              )
            `)
            .eq('company_id', currentUser.company_id)
            .eq('status', 'active');
          

          
          if (contractsWithUsers && contractsWithUsers.length > 0) {
            allCompanyFreelancers = contractsWithUsers
              .map(c => c.user)
              .filter(Boolean)
              .filter((user, index, self) => 
                index === self.findIndex(u => u.id === user.id)
              ); // Dédoublonner
          }
        }
      }



      // Le nombre total de freelancers actifs (même calcul que l'onglet Accueil)
      const totalActiveFreelancers = allCompanyFreelancers.length;

      // Calculer les KPIs pour tous les freelancers EN PARALLÈLE (optimisé mais sûr)
      const topFreelancers: FreelancerKPIs[] = [];
      if (allCompanyFreelancers && allCompanyFreelancers.length > 0) {
        const freelancerKPIsPromises = allCompanyFreelancers.map(freelancer => 
          this.getFreelancerKPIs(freelancer.id, period)
        );
        const results = await Promise.all(freelancerKPIsPromises);
        results.forEach(kpi => {
          if (kpi) {
            topFreelancers.push(kpi);
          }
        });
      }

      // Si pas de KPIs calculés, laisser le tableau vide (pas de fallback de démo)

      // Calculer le délai moyen de paiement
      const averageValidationDelay = topFreelancers.length > 0 ? 
        topFreelancers.reduce((sum: number, f: FreelancerKPIs) => sum + f.averagePaymentDelay, 0) / topFreelancers.length : 0;

      return {
        totalRevenue,
        monthlyGrowth,
        activeFreelancers: totalActiveFreelancers, // Utiliser le vrai compte de freelancers actifs
        averageValidationDelay: Math.round(averageValidationDelay * 10) / 10,
        revenueEvolution,
        clientDistribution,
        topFreelancers: topFreelancers.sort((a: FreelancerKPIs, b: FreelancerKPIs) => b.monthlyRevenue - a.monthlyRevenue)
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