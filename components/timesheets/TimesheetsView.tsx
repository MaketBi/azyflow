import React, { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { SearchBox } from '../ui/search';
import { TimesheetService, TimesheetWithRelations } from '../../lib/services/timesheets';

const statusLabel = (status: string) => {
  if (status === 'draft') return 'Brouillon';
  if (status === 'submitted') return 'Soumis';
  if (status === 'approved') return 'Approuvé';
  if (status === 'rejected') return 'Rejeté';
  return status;
};

const statusBadgeClasses = (status: string) => {
  if (status === 'approved') return 'bg-green-100 text-green-800';
  if (status === 'rejected') return 'bg-red-100 text-red-800';
  if (status === 'submitted') return 'bg-blue-100 text-blue-800';
  if (status === 'draft') return 'bg-gray-100 text-gray-800';
  return 'bg-amber-100 text-amber-800';
};

const TimesheetsView: React.FC = () => {
  const [timesheets, setTimesheets] = useState<TimesheetWithRelations[]>([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState<TimesheetWithRelations[]>([]);
  const [timesheetSearch, setTimesheetSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimesheets();
  }, []);

  // Effet pour filtrer les feuilles de temps selon la recherche
  useEffect(() => {
    if (!timesheetSearch.trim()) {
      setFilteredTimesheets(timesheets);
    } else {
      const searchTerm = timesheetSearch.toLowerCase();
      const filtered = timesheets.filter(timesheet => 
        (timesheet.contract?.user?.full_name?.toLowerCase() || '').includes(searchTerm) ||
        (timesheet.month?.toLowerCase() || '').includes(searchTerm) ||
        (timesheet.worked_days?.toString() || '').includes(searchTerm) ||
        (statusLabel(timesheet.status)?.toLowerCase() || '').includes(searchTerm)
      );
      setFilteredTimesheets(filtered);
    }
  }, [timesheets, timesheetSearch]);

  const loadTimesheets = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupère les timesheets pour la company courante (TimesheetService.getAll récupère par company)
      const data = await TimesheetService.getAll();
      setTimesheets(data || []);
      setFilteredTimesheets(data || []);
    } catch (err: any) {
      console.error('Erreur chargement feuilles de temps:', err);
      setError(err?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (timesheetId: string, newStatus: 'approved' | 'rejected') => {
    setError(null);
    setUpdatingIds(prev => {
      const s = new Set(prev);
      s.add(timesheetId);
      return s;
    });

    try {
      // Appel direct au service au lieu de l'API
      if (newStatus === 'approved') {
        await TimesheetService.approve(timesheetId);
      } else {
        await TimesheetService.reject(timesheetId);
      }

      // Mise à jour locale immédiate (sans rechargement)
      setTimesheets(prev =>
        prev.map((t) => (t.id === timesheetId ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      console.error('Erreur mise à jour statut:', err);
      setError(err?.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdatingIds(prev => {
        const s = new Set(prev);
        s.delete(timesheetId);
        return s;
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {filteredTimesheets.length} feuille{filteredTimesheets.length !== 1 ? 's' : ''} de temps
          {timesheetSearch && ` (filtré${filteredTimesheets.length !== 1 ? 's' : ''} sur ${timesheets.length})`}
        </h2>
        <p className="text-sm text-gray-600 mt-1">Consultez et validez les feuilles de temps soumises</p>
      </div>

      {/* Champ de recherche pour les feuilles de temps */}
      <SearchBox
        value={timesheetSearch}
        onChange={setTimesheetSearch}
        placeholder="Rechercher par consultant, mois, jours travaillés ou statut..."
        label="Rechercher une feuille de temps"
        icon="📅"
      />

      <Card>
        <CardHeader>
          <CardTitle>Feuilles de temps - Société</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Consultant</TableHead>
                      <TableHead>Mois</TableHead>
                      <TableHead>Jours travaillés</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredTimesheets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <p className="text-gray-500">
                            {timesheetSearch 
                              ? `Aucune feuille de temps trouvée pour "${timesheetSearch}"` 
                              : 'Aucune feuille de temps trouvée'
                            }
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTimesheets.map((ts) => (
                        <TableRow key={ts.id}>
                          <TableCell className="font-medium">
                            {ts.contract?.user?.full_name || '—'}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              {ts.month
                                ? new Date(ts.month).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
                                : '—'}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-gray-400" />
                              {ts.worked_days ?? 0} {ts.worked_days > 1 ? 'jours' : 'jour'}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClasses(ts.status)}`}>
                              {ts.status === 'draft' && <Clock className="w-3 h-3 mr-1" />}
                              {ts.status === 'submitted' && <AlertCircle className="w-3 h-3 mr-1" />}
                              {ts.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {ts.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                              {statusLabel(ts.status)}
                            </span>
                          </TableCell>

                          <TableCell>
                            {ts.status === 'submitted' ? (
                              // CRA soumis - Afficher les boutons d'action
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => updateStatus(ts.id, 'approved')}
                                  disabled={updatingIds.has(ts.id)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {updatingIds.has(ts.id) ? '...' : 'Valider'}
                                </Button>

                                <Button
                                  onClick={() => updateStatus(ts.id, 'rejected')}
                                  variant="outline"
                                  disabled={updatingIds.has(ts.id)}
                                  size="sm"
                                  className="border-red-300 text-red-700 hover:bg-red-50"
                                >
                                  {updatingIds.has(ts.id) ? '...' : 'Rejeter'}
                                </Button>
                              </div>
                            ) : ts.status === 'approved' ? (
                              // CRA approuvé - Afficher un indicateur positif
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Validé</span>
                              </div>
                            ) : ts.status === 'rejected' ? (
                              // CRA rejeté - Afficher un indicateur négatif  
                              <div className="flex items-center text-red-600">
                                <XCircle className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Rejeté</span>
                              </div>
                            ) : (
                              // CRA en brouillon - Afficher un message d'attente
                              <div className="flex items-center text-gray-500">
                                <Clock className="w-4 h-4 mr-2" />
                                <span className="text-sm">En attente de soumission</span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimesheetsView;