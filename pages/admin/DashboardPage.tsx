import React, { useState, useEffect } from 'react';
import { Users, FileText, Clock, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { KPICard } from '../../components/dashboard/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { UserService } from '../../lib/services/users';
import { TimesheetService, TimesheetWithRelations } from '../../lib/services/timesheets';
import { InvoiceService, InvoiceWithRelations } from '../../lib/services/invoices';
import { ContractService, ContractWithRelations } from '../../lib/services/contracts';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    freelancers: 0,
    pendingTimesheets: 0,
    unpaidInvoices: 0,
    activeContracts: 0,
  });
  const [recentTimesheets, setRecentTimesheets] = useState<TimesheetWithRelations[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [freelancers, timesheets, invoices, contracts] = await Promise.all([
        UserService.getFreelancers(),
        TimesheetService.getAll(),
        InvoiceService.getAll(),
        ContractService.getAll(),
      ]);

      const pendingTimesheets = timesheets.filter(t => t.status === 'pending').length;
      const unpaidInvoices = invoices.filter(i => i.status === 'pending').length;
      const activeContracts = contracts.filter(c => c.status === 'active').length;

      setStats({
        freelancers: freelancers.length,
        pendingTimesheets,
        unpaidInvoices,
        activeContracts,
      });

      // Get recent items
      setRecentTimesheets(timesheets.slice(0, 5));
      setRecentInvoices(invoices.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 md:px-8 lg:px-16 py-6 space-y-8 w-full max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Aperçu de vos opérations de staffing</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          title="Freelances actifs"
          value={stats.freelancers}
          icon={Users}
          gradient="from-blue-600 to-violet-600"
        />
        <KPICard
          title="Feuilles de temps en attente"
          value={stats.pendingTimesheets}
          icon={Clock}
          gradient="from-amber-500 to-orange-600"
        />
        <KPICard
          title="Factures impayées"
          value={stats.unpaidInvoices}
          icon={DollarSign}
          gradient="from-red-500 to-pink-600"
        />
        <KPICard
          title="Contrats actifs"
          value={stats.activeContracts}
          icon={FileText}
          gradient="from-green-500 to-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Recent Timesheets */}
        <Card className="mb-6 lg:mb-0">
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Clock className="w-5 h-5 mr-2" />
              Dernières feuilles de temps
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[400px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Freelance</TableHead>
                  <TableHead>Mois</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTimesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell className="font-medium">
                      {timesheet.contract?.user?.full_name}
                    </TableCell>
                    <TableCell>{timesheet.month}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        timesheet.status === 'approved' ? 'bg-green-100 text-green-800' :
                        timesheet.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {timesheet.status === 'pending' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {timesheet.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {timesheet.status === 'pending' ? 'En attente' : timesheet.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <DollarSign className="w-5 h-5 mr-2" />
              Dernières factures
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[400px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>€{invoice.amount}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {invoice.status === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {invoice.status === 'pending' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {invoice.status === 'paid' ? 'Payée' : invoice.status === 'pending' ? 'En attente' : 'Non payée'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};