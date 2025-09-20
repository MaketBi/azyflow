import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CheckCircle, AlertCircle, Send, Save, Edit } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { TimesheetService, TimesheetWithRelations } from '../../lib/services/timesheets';

interface Client {
  id: string;
  name: string;
}

export const TimesheetsPage: React.FC = () => {
  const [timesheets, setTimesheets] = useState<TimesheetWithRelations[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTimesheet, setEditingTimesheet] = useState<TimesheetWithRelations | null>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    month: '',
    year: new Date().getFullYear(),
    worked_days: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [timesheetsData, clientsData] = await Promise.all([
        TimesheetService.getByCurrentUser(),
        TimesheetService.getAvailableClients(),
      ]);

      setTimesheets(timesheetsData);
      setClients(clientsData as Client[]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation côté client
    if (!formData.client_id) {
      setError('Veuillez sélectionner un client pour créer un CRA');
      return;
    }
    
    if (!formData.month) {
      setError('Veuillez sélectionner un mois');
      return;
    }
    
    if (formData.worked_days <= 0) {
      setError('Le nombre de jours travaillés doit être supérieur à 0');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const result = await TimesheetService.createDraft({
        client_id: formData.client_id,
        month: formData.month,
        year: formData.year,
        worked_days: formData.worked_days,
      });

      if (result) {
        setShowForm(false);
        setFormData({ client_id: '', month: '', year: new Date().getFullYear(), worked_days: 0 });
        await loadData();
      }
    } catch (error) {
      console.error('Error creating draft timesheet:', error);
      if (error instanceof Error) {
        if (error.message.includes('Aucun contrat actif trouvé')) {
          setError('Aucun contrat actif trouvé pour ce client. Veuillez contacter votre administrateur.');
        } else if (error.message.includes('Un CRA existe déjà pour')) {
          setError(error.message);
        } else {
          setError(`Erreur lors de la création du CRA : ${error.message}`);
        }
      } else {
        setError('Une erreur inattendue s\'est produite');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation côté client
    if (!formData.client_id) {
      setError('Veuillez sélectionner un client pour créer un CRA');
      return;
    }
    
    if (!formData.month) {
      setError('Veuillez sélectionner un mois');
      return;
    }
    
    if (formData.worked_days <= 0) {
      setError('Le nombre de jours travaillés doit être supérieur à 0');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const result = await TimesheetService.createSubmitted({
        client_id: formData.client_id,
        month: formData.month,
        year: formData.year,
        worked_days: formData.worked_days,
      });

      if (result) {
        setShowForm(false);
        setFormData({ client_id: '', month: '', year: new Date().getFullYear(), worked_days: 0 });
        await loadData();
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      if (error instanceof Error) {
        if (error.message.includes('Aucun contrat actif trouvé')) {
          setError('Aucun contrat actif trouvé pour ce client. Veuillez contacter votre administrateur.');
        } else if (error.message.includes('Un CRA existe déjà pour')) {
          setError(error.message);
        } else {
          setError(`Erreur lors de la soumission du CRA : ${error.message}`);
        }
      } else {
        setError('Une erreur inattendue s\'est produite');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTimesheet(null);
    setError(null);
    setFormData({ client_id: '', month: '', year: new Date().getFullYear(), worked_days: 0 });
  };

  const handleEditTimesheet = (timesheet: TimesheetWithRelations) => {
    if (timesheet.status !== 'draft') {
      setError('Seuls les CRA en brouillon peuvent être modifiés');
      return;
    }

    setEditingTimesheet(timesheet);
    setFormData({
      client_id: timesheet.contract?.client_id || '',
      month: timesheet.month,
      year: timesheet.year || new Date().getFullYear(),
      worked_days: timesheet.worked_days,
    });
    setShowForm(true);
    setError(null);
  };

  const handleUpdateTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTimesheet) return;

    setError(null);
    
    // Validation côté client
    if (!formData.month) {
      setError('Veuillez sélectionner un mois');
      return;
    }
    
    if (formData.worked_days <= 0) {
      setError('Le nombre de jours travaillés doit être supérieur à 0');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const result = await TimesheetService.updateDraft(editingTimesheet.id, {
        month: formData.month,
        year: formData.year,
        worked_days: formData.worked_days,
      });

      if (result) {
        setShowForm(false);
        setEditingTimesheet(null);
        setFormData({ client_id: '', month: '', year: new Date().getFullYear(), worked_days: 0 });
        await loadData();
      }
    } catch (error) {
      console.error('Error updating timesheet:', error);
      if (error instanceof Error) {
        setError(`Erreur lors de la mise à jour du CRA : ${error.message}`);
      } else {
        setError('Une erreur inattendue s\'est produite');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDraftForApproval = async () => {
    if (!editingTimesheet) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await TimesheetService.submit(editingTimesheet.id);
      if (result) {
        setShowForm(false);
        setEditingTimesheet(null);
        setFormData({ client_id: '', month: '', year: new Date().getFullYear(), worked_days: 0 });
        await loadData();
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      if (error instanceof Error) {
        setError(`Erreur lors de la soumission du CRA : ${error.message}`);
      } else {
        setError('Une erreur inattendue s\'est produite');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'submitted': return 'Soumis';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'submitted': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes CRA</h1>
            <p className="text-gray-600 mt-1">Gérez vos comptes-rendus d'activité</p>
          </div>
          <Button
            onClick={() => {
              setShowForm(true);
              setError(null);
            }}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nouveau CRA
          </Button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingTimesheet ? 'Modifier le CRA' : 'Nouveau CRA'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}
              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.client_id}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                      required
                      disabled={!!editingTimesheet} // Disable client selection when editing
                    >
                      <option value="">Sélectionner un client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                    {editingTimesheet && (
                      <p className="text-xs text-gray-500 mt-1">
                        Le client ne peut pas être modifié pour un CRA existant
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mois
                    </label>
                    <Input
                      type="month"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Année
                    </label>
                    <Input
                      type="number"
                      min="2020"
                      max="2030"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jours travaillés
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="31"
                      step="0.5"
                      value={formData.worked_days}
                      onChange={(e) => setFormData({ ...formData, worked_days: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseForm}
                  >
                    Annuler
                  </Button>
                  
                  {editingTimesheet ? (
                    // Buttons for editing existing draft
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUpdateTimesheet}
                        disabled={submitting}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Sauvegarder modifications
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubmitDraftForApproval}
                        disabled={submitting}
                        className="flex items-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Soumettre pour validation
                      </Button>
                    </>
                  ) : (
                    // Buttons for creating new timesheet
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSubmitDraft}
                        disabled={submitting}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Sauvegarder brouillon
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubmitForApproval}
                        disabled={submitting}
                        className="flex items-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Soumettre pour validation
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total CRA</p>
                  <p className="text-2xl font-bold text-gray-900">{timesheets.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Brouillons</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {timesheets.filter(t => t.status === 'draft').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {timesheets.filter(t => t.status === 'submitted').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Validés</p>
                  <p className="text-2xl font-bold text-green-600">
                    {timesheets.filter(t => t.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des CRA</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Jours</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheets.map((timesheet) => (
                    <TableRow key={timesheet.id}>
                      <TableCell>{timesheet.contract?.client?.name || 'N/A'}</TableCell>
                      <TableCell>{timesheet.month} {timesheet.year}</TableCell>
                      <TableCell>{timesheet.worked_days}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(timesheet.status)}
                          <span className="text-sm">{getStatusText(timesheet.status)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {timesheet.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTimesheet(timesheet)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Modifier
                          </Button>
                        )}
                        {timesheet.status !== 'draft' && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {timesheets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Aucun CRA trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
