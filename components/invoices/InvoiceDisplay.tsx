import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { PaymentTermsHelper } from '../../lib/payment-terms-helper';
import { CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';

export interface InvoiceDisplayData {
  id: string;
  number: string;
  amountHT: number;
  amountTTC: number;
  vatAmount: number;
  vatRate: number;
  commissionAmount: number;
  netAmount: number;
  issueDate: string;
  dueDate: string;
  status: 'pending' | 'sent' | 'paid' | 'overdue';
  clientName: string;
  freelancerName: string;
  workedDays: number;
  dailyRate: number;
}

interface InvoiceDisplayProps {
  invoice: InvoiceDisplayData;
  showDetails?: boolean;
  compact?: boolean;
}

export const InvoiceDisplay: React.FC<InvoiceDisplayProps> = ({
  invoice,
  showDetails = true,
  compact = false
}) => {
  const isOverdue = invoice.status === 'overdue' || (
    invoice.status === 'sent' && 
    PaymentTermsHelper.isOverdue(new Date(invoice.dueDate))
  );

  const daysOverdue = isOverdue ? PaymentTermsHelper.getDaysOverdue(new Date(invoice.dueDate)) : 0;

  const getStatusBadge = () => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (invoice.status) {
      case 'pending':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </span>
        );
      case 'sent':
        if (isOverdue) {
          return (
            <span className={`${baseClasses} bg-red-100 text-red-800`}>
              <AlertCircle className="h-3 w-3 mr-1" />
              En retard ({daysOverdue}j)
            </span>
          );
        }
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <Calendar className="h-3 w-3 mr-1" />
            Envoyée
          </span>
        );
      case 'paid':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Payée
          </span>
        );
      case 'overdue':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <AlertCircle className="h-3 w-3 mr-1" />
            En retard ({daysOverdue}j)
          </span>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
        <div>
          <div className="font-medium">{invoice.number}</div>
          <div className="text-sm text-gray-600">{invoice.clientName}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold">{formatCurrency(invoice.amountTTC)}</div>
          <div className="text-sm">{getStatusBadge()}</div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Facture {invoice.number}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Client</h4>
            <p className="text-gray-600">{invoice.clientName}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Freelancer</h4>
            <p className="text-gray-600">{invoice.freelancerName}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Date d'émission</h4>
            <p className="text-gray-600">{formatDate(invoice.issueDate)}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Date d'échéance</h4>
            <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
              {formatDate(invoice.dueDate)}
              {isOverdue && (
                <span className="ml-2 text-sm text-red-500">
                  (En retard de {daysOverdue} jour{daysOverdue > 1 ? 's' : ''})
                </span>
              )}
            </p>
          </div>
        </div>

        {showDetails && (
          <>
            {/* Détails de prestation */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Détails de prestation</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between text-sm">
                  <span>{invoice.workedDays} jour{invoice.workedDays > 1 ? 's' : ''} × {formatCurrency(invoice.dailyRate)}</span>
                  <span>{formatCurrency(invoice.workedDays * invoice.dailyRate)}</span>
                </div>
              </div>
            </div>

            {/* Calculs financiers */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Calculs financiers</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Montant HT</span>
                  <span className="font-medium">{formatCurrency(invoice.amountHT)}</span>
                </div>
                {invoice.vatAmount > 0 && (
                  <div className="flex justify-between">
                    <span>TVA ({invoice.vatRate}%)</span>
                    <span className="font-medium">{formatCurrency(invoice.vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total TTC</span>
                  <span>{formatCurrency(invoice.amountTTC)}</span>
                </div>
                {invoice.commissionAmount > 0 && (
                  <>
                    <div className="flex justify-between text-red-600">
                      <span>Commission</span>
                      <span>-{formatCurrency(invoice.commissionAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold text-green-600">
                      <span>Net freelancer</span>
                      <span>{formatCurrency(invoice.netAmount)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Informations TVA */}
            {invoice.vatAmount > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Informations TVA</h4>
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                  <div className="flex items-start space-x-2">
                    <div className="text-blue-600">ℹ️</div>
                    <div>
                      TVA française de {invoice.vatRate}% appliquée selon la réglementation en vigueur.
                      {invoice.vatAmount > 0 && (
                        <div className="mt-1">
                          <strong>Montant de TVA :</strong> {formatCurrency(invoice.vatAmount)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rappel de délais */}
            {invoice.status === 'sent' && !isOverdue && (
              <div className="border-t pt-4">
                <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md">
                  <div className="flex items-start space-x-2">
                    <div className="text-yellow-600">⏰</div>
                    <div>
                      <strong>Échéance dans {Math.ceil((new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jour{Math.ceil((new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''}</strong>
                      <br />
                      Paiement attendu avant le {formatDate(invoice.dueDate)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};