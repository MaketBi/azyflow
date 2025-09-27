import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CheckCircle, AlertCircle, Send, Save, Edit } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { TimesheetService, TimesheetWithRelations } from '../../lib/services/timesheets';
import { WorkflowProgressBar } from '../../components/workflow/WorkflowProgressBar';
import { WorkflowProgressBadge } from '../../components/workflow/WorkflowProgressBadge';
import { determineWorkflowStatus } from '../../lib/workflow-progress';
import { validateWorkedDays, getMonthWorkingDaysInfo } from '../../lib/utils/working-days';
import { HNOManager } from '../../components/hno/HNOManager';
import { HNOEntry } from '../../lib/types/hno';

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
  const [selectedTimesheet, setSelectedTimesheet] = useState<TimesheetWithRelations | null>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    month: '',
    year: new Date().getFullYear(),
    worked_days: 0,
  });
  const [hnoEntries, setHnoEntries] = useState<HNOEntry[]>([]);

  // Liste des mois pour le sélecteur
  const months = [
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' },
  ];

  // Calculer les informations sur les jours ouvrés pour le mois/année sélectionnés
  const getWorkingDaysInfo = () => {
    if (!formData.month || !formData.year) return null;
    return getMonthWorkingDaysInfo(formData.year, parseInt(formData.month));
  };

  const workingDaysInfo = getWorkingDaysInfo();
  const maxWorkingDays = workingDaysInfo?.workingDays || 0;

  // Obtenir le TJM du client sélectionné ou du timesheet en cours d'édition
  const getCurrentTJM = (): number => {
    if (editingTimesheet?.contract?.tjm) {
      return editingTimesheet.contract.tjm;
    }
    // Pour un nouveau CRA, on peut essayer de trouver le TJM via les timesheets existants du même client
    const existingTimesheet = timesheets.find(t => t.contract?.client_id === formData.client_id);
    return existingTimesheet?.contract?.tjm || 500; // Valeur par défaut
  };

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

    // Validation stricte des jours ouvrés - bloquer si dépassement
    const validation = validateWorkedDays(formData.worked_days, formData.year, parseInt(formData.month));
    if (!validation.isValid || validation.requiresComment) {
      setError(validation.message || `Vous ne pouvez pas saisir plus de ${maxWorkingDays} jours ouvrés pour ce mois.`);
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Créer le format YYYY-MM pour la base de données
      const monthFormatted = `${formData.year}-${formData.month.padStart(2, '0')}`;
      
      const result = await TimesheetService.createDraft({
        client_id: formData.client_id,
        month: monthFormatted,
        year: formData.year,
        worked_days: formData.worked_days,
      });

      if (result) {
        setShowForm(false);
        setFormData({ client_id: '', month: '', year: new Date().getFullYear(), worked_days: 0 });
        setHnoEntries([]);
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

    // Validation stricte des jours ouvrés - bloquer si dépassement
    const validation = validateWorkedDays(formData.worked_days, formData.year, parseInt(formData.month));
    if (!validation.isValid || validation.requiresComment) {
      setError(validation.message || `Vous ne pouvez pas saisir plus de ${maxWorkingDays} jours ouvrés pour ce mois.`);
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Créer le format YYYY-MM pour la base de données
      const monthFormatted = `${formData.year}-${formData.month.padStart(2, '0')}`;
      
      const result = await TimesheetService.createSubmitted({
        client_id: formData.client_id,
        month: monthFormatted,
        year: formData.year,
        worked_days: formData.worked_days,
      });

      if (result) {
        setShowForm(false);
        setFormData({ client_id: '', month: '', year: new Date().getFullYear(), worked_days: 0 });
        setHnoEntries([]);
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
    setHnoEntries([]);
  };

  const handleEditTimesheet = (timesheet: TimesheetWithRelations) => {
    if (timesheet.status !== 'draft') {
      setError('Seuls les CRA en brouillon peuvent être modifiés');
      return;
    }

    setEditingTimesheet(timesheet);
    // Convertir le format YYYY-MM vers mois séparé
    const monthValue = timesheet.month.includes('-') ? timesheet.month.split('-')[1] : timesheet.month.padStart(2, '0');
    setFormData({
      client_id: timesheet.contract?.client_id || '',
      month: monthValue,
      year: timesheet.year || new Date().getFullYear(),
      worked_days: timesheet.worked_days,
    });
    // TODO: Charger les HNO existantes depuis la base de données
    setHnoEntries([]);
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

    // Validation stricte des jours ouvrés - bloquer si dépassement
    const validation = validateWorkedDays(formData.worked_days, formData.year, parseInt(formData.month));
    if (!validation.isValid || validation.requiresComment) {
      setError(validation.message || `Vous ne pouvez pas saisir plus de ${maxWorkingDays} jours ouvrés pour ce mois.`);
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Créer le format YYYY-MM pour la base de données
      const monthFormatted = `${formData.year}-${formData.month.padStart(2, '0')}`;
      
      const result = await TimesheetService.updateDraft(editingTimesheet.id, {
        month: monthFormatted,
        year: formData.year,
        worked_days: formData.worked_days,
      });

      if (result) {
        setShowForm(false);
        setEditingTimesheet(null);
        setFormData({ client_id: '', month: '', year: new Date().getFullYear(), worked_days: 0 });
        setHnoEntries([]);
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
        setHnoEntries([]);
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
                      className="w-full h-10 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                    <select
                      className="w-full h-10 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      required
                    >
                      <option value="">Sélectionner un mois</option>
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Année
                    </label>
                    <select
                      className="w-full h-10 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      required
                    >
                      {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jours travaillés
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max={maxWorkingDays || 31}
                      step="0.5"
                      value={formData.worked_days}
                      onChange={(e) => setFormData({ ...formData, worked_days: parseFloat(e.target.value) })}
                      required
                      className="h-10"
                    />
                    {workingDaysInfo && (
                      <div className="text-xs text-gray-500 mt-1 space-y-1">
                        <p>
                          📅 Ce mois compte <strong>{workingDaysInfo.workingDays} jours ouvrés</strong> 
                          (hors weekends et jours fériés)
                        </p>
                        {formData.worked_days > 0 && (() => {
                          const validation = validateWorkedDays(formData.worked_days, formData.year, parseInt(formData.month));
                          if (!validation.isValid || validation.requiresComment) {
                            return (
                              <p className="text-red-600">
                                ❌ Vous ne pouvez pas saisir plus de {workingDaysInfo.workingDays} jours ouvrés pour ce mois.
                              </p>
                            );
                          }
                          if (formData.worked_days === workingDaysInfo.workingDays) {
                            return (
                              <p className="text-green-600">
                                ✅ Temps complet ce mois
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Gestion des Heures Non Ouvrées (HNO) */}
                <HNOManager
                  entries={hnoEntries}
                  onChange={setHnoEntries}
                  tjm={getCurrentTJM()}
                  hideFinancialInfo={true}
                />

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
                    <TableHead>Workflow</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheets.map((timesheet) => {
                    const workflowStatus = determineWorkflowStatus(
                      timesheet.status,
                      timesheet.invoice?.status,
                      !!timesheet.invoice,
                      timesheet.invoice?.paid_at
                    );
                    const totalAmount = timesheet.worked_days * (timesheet.contract?.tjm || 0);
                    
                    return (
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
                        <WorkflowProgressBadge 
                          currentStatus={workflowStatus}
                          amount={totalAmount}
                          showPercentage={false}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedTimesheet(timesheet)}
                            className="flex items-center gap-1"
                          >
                            <Calendar className="h-3 w-3" />
                            Détails
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  {timesheets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
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

      {/* Modal de détail du workflow */}
      {selectedTimesheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Suivi du workflow - {selectedTimesheet.contract?.client?.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedTimesheet.month} {selectedTimesheet.year} • {selectedTimesheet.worked_days} jours
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedTimesheet(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>

              <WorkflowProgressBar 
                progress={{
                  timesheetId: selectedTimesheet.id,
                  currentStatus: determineWorkflowStatus(
                    selectedTimesheet.status,
                    selectedTimesheet.invoice?.status,
                    !!selectedTimesheet.invoice,
                    selectedTimesheet.invoice?.paid_at
                  ),
                  completedSteps: [], // Sera calculé automatiquement
                  lastUpdateDate: selectedTimesheet.created_at,
                  invoiceId: selectedTimesheet.invoice?.id,
                  amount: selectedTimesheet.worked_days * (selectedTimesheet.contract?.tjm || 0)
                }}
              />

              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTimesheet(null)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};