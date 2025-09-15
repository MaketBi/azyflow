import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { TimesheetService, TimesheetWithRelations } from '../../lib/services/timesheets';
import { ContractService, ContractWithRelations } from '../../lib/services/contracts';

export const TimesheetsPage: React.FC = () => {
  const [timesheets, setTimesheets] = useState<TimesheetWithRelations[]>([]);
  const [contracts, setContracts] = useState<ContractWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    contract_id: '',
    month: '',
    worked_days: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [timesheetsData, contractsData] = await Promise.all([
        TimesheetService.getByCurrentUser(),
        ContractService.getByCurrentUser(),
      ]);

      setTimesheets(timesheetsData);
      setContracts(contractsData.filter(c => c.status === 'active'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await TimesheetService.create({
      ...formData,
      status: 'pending',
    });

    if (result) {
      setShowForm(false);
      setFormData({ contract_id: '', month: '', worked_days: 0 });
      loadData();
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
    <div className="px-2 sm:px-4 md:px-8 lg:px-16 py-6 space-y-8 w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Feuilles de temps (CRA)</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Soumettez et suivez vos jours travaillés</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle feuille de temps
        </Button>
      </div>

      {showForm && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Soumettre une nouvelle feuille de temps</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract
                </label>
                <select
                  value={formData.contract_id}
                  onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionnez un contrat</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.client?.name} - {contract.tjm}€/day
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Mois"
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                required
              />

              <Input
                label="Jours travaillés"
                type="number"
                min="0"
                max="31"
                value={formData.worked_days}
                onChange={(e) => setFormData({ ...formData, worked_days: parseInt(e.target.value) })}
                required
              />

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button type="submit" className="w-full sm:w-auto">Soumettre la feuille de temps</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="w-full sm:w-auto">
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="w-full">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[500px]">
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Mois</TableHead>
                <TableHead>Jours travaillés</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.map((timesheet) => (
                <TableRow key={timesheet.id}>
                  <TableCell className="font-medium">
                    {timesheet.contract?.client?.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(timesheet.month).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      {timesheet.worked_days} jours
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    €{timesheet.worked_days * (timesheet.contract?.tjm || 0)}
                  </TableCell>
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

          {timesheets.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune feuille de temps pour le moment</p>
              <p className="text-gray-400 mt-2">Soumettez votre première feuille de temps pour commencer</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};