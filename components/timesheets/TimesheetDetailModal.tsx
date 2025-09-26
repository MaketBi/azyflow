import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Calendar, Clock, CheckCircle, AlertCircle, XCircle, User, Building2, CreditCard, FileText } from 'lucide-react';
import { TimesheetWithRelations } from '../../lib/services/timesheets';

interface TimesheetDetailModalProps {
  timesheet: TimesheetWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusLabel = (status: string) => {
  if (status === 'draft') return 'Brouillon';
  if (status === 'submitted') return 'Soumis';
  if (status === 'approved') return 'Approuvé';
  if (status === 'rejected') return 'Rejeté';
  return status;
};

const statusBadgeClasses = (status: string) => {
  if (status === 'approved') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'rejected') return 'bg-red-100 text-red-800 border-red-200';
  if (status === 'submitted') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (status === 'draft') return 'bg-gray-100 text-gray-800 border-gray-200';
  return 'bg-amber-100 text-amber-800 border-amber-200';
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="w-4 h-4" />;
    case 'rejected':
      return <XCircle className="w-4 h-4" />;
    case 'submitted':
      return <AlertCircle className="w-4 h-4" />;
    case 'draft':
      return <Clock className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const TimesheetDetailModal: React.FC<TimesheetDetailModalProps> = ({ timesheet, isOpen, onClose }) => {
  if (!isOpen || !timesheet) return null;

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculs
  const tjm = timesheet.contract?.tjm || 0;
  const workedDays = timesheet.worked_days || 0;
  const totalAmount = tjm * workedDays;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Feuille de temps - {timesheet.month} {timesheet.year}
                </h2>
              </div>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${statusBadgeClasses(timesheet.status)}`}>
                {getStatusIcon(timesheet.status)}
                <span className="text-sm font-medium">{statusLabel(timesheet.status)}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Freelancer & Client */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>Freelancer & Client</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Freelancer</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {timesheet.contract?.user?.full_name || 'Non défini'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Client</p>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <p className="text-lg font-semibold text-gray-900">
                      {timesheet.contract?.client?.name || timesheet.client?.name || 'Non défini'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">TJM (Taux Journalier Moyen)</p>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(tjm)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Détails temporels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span>Détails temporels</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Période</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {timesheet.month} {timesheet.year}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Jours travaillés</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {workedDays} jours
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Dates</p>
                  <div className="text-sm text-gray-900">
                    <p>Créé le: {formatDate(timesheet.created_at)}</p>
                    {timesheet.submitted_at && (
                      <p>Soumis le: {formatDate(timesheet.submitted_at)}</p>
                    )}
                    {timesheet.validated_at && (
                      <p>Validé le: {formatDate(timesheet.validated_at)}</p>
                    )}
                    {timesheet.rejected_at && (
                      <p>Rejeté le: {formatDate(timesheet.rejected_at)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calculs financiers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                <span>Calculs financiers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 mb-2">TJM</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(tjm)}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 mb-2">Jours travaillés</p>
                  <p className="text-2xl font-bold text-purple-600">{workedDays}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 mb-2">Montant total</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statut et facturation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <span>Statut et facturation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Statut actuel</p>
                  <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${statusBadgeClasses(timesheet.status)}`}>
                    {getStatusIcon(timesheet.status)}
                    <span className="font-medium">{statusLabel(timesheet.status)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Facturation</p>
                  {timesheet.invoice ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-600">✅ Facture générée</p>
                      <p className="text-xs text-gray-500">ID: {timesheet.invoice.id}</p>
                      <p className="text-xs text-gray-500">
                        Statut: {timesheet.invoice.status}
                        {timesheet.invoice.paid_at && ` - Payée le ${formatDate(timesheet.invoice.paid_at)}`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600">⏳ En attente de facturation</p>
                  )}
                </div>
              </div>

              {/* Description du workflow */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Workflow de validation</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• <strong>Brouillon:</strong> CRA en cours de création par le freelancer</p>
                  <p>• <strong>Soumis:</strong> CRA envoyé pour validation</p>
                  <p>• <strong>Approuvé:</strong> CRA validé, prêt pour facturation</p>
                  <p>• <strong>Rejeté:</strong> CRA nécessite des modifications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section des factures liées (optionnel) */}
          {timesheet.invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Facture associée</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-blue-900">Facture #{timesheet.invoice.id}</p>
                      <p className="text-sm text-blue-700">Statut: {timesheet.invoice.status}</p>
                      {timesheet.invoice.paid_at && (
                        <p className="text-sm text-green-700">Payée le {formatDate(timesheet.invoice.paid_at)}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      Voir la facture
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer avec actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            {timesheet.status === 'submitted' && (
              <>
                <Button 
                  variant="outline" 
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Rejeter
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Valider
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimesheetDetailModal;