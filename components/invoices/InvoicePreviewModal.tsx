import React from 'react';
import { Download, Mail, MessageCircle, Share2, Printer } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { InvoiceWithRelations, InvoiceService } from '../../lib/services/invoices';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceWithRelations | null;
  canShare?: boolean;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoice,
  canShare = false
}) => {
  if (!invoice) return null;

  const handleDownload = () => {
    InvoiceService.downloadPDF(invoice);
  };

  const handleEmailShare = () => {
    InvoiceService.shareByEmail(invoice);
  };

  const handleWhatsAppShare = () => {
    InvoiceService.shareByWhatsApp(invoice);
  };

  const handleShareLink = async () => {
    try {
      await InvoiceService.shareLink(invoice);
    } catch (err) {
      console.error('Erreur partage lien:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'sent': return 'Envoyée';
      case 'paid': return 'Payée';
      case 'overdue': return 'En retard';
      default: return status;
    }
  };

  const statusBadgeClasses = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Facture ${invoice.number}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
          <Button
            onClick={handleDownload}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>

          <Button
            onClick={handlePrint}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>

          {canShare && (
            <>
              <Button
                onClick={handleEmailShare}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>

              <Button
                onClick={handleWhatsAppShare}
                className="flex items-center gap-2"
                variant="outline"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>

              <Button
                onClick={handleShareLink}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Share2 className="h-4 w-4" />
                Partager
              </Button>
            </>
          )}
        </div>

        {/* Invoice Preview */}
        <div className="bg-white border rounded-lg p-8 print:shadow-none print:border-none">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">FACTURE</h1>
              <p className="text-lg text-gray-600">{invoice.number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Date d'émission</p>
              <p className="text-lg font-semibold">{formatDate(invoice.issue_date)}</p>
              {invoice.due_date && (
                <>
                  <p className="text-sm text-gray-500 mt-2">Date d'échéance</p>
                  <p className="text-lg font-semibold">{formatDate(invoice.due_date)}</p>
                </>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="mb-8">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadgeClasses(invoice.status)}`}>
              {statusLabel(invoice.status)}
            </span>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* De */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                De (Compagnie)
              </h3>
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">
                  {invoice.company?.name || '—'}
                </p>
                <p className="text-gray-600">
                  contact@azyflow.com
                </p>
              </div>
            </div>

            {/* À */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                À (Freelance)
              </h3>
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">
                  {invoice.timesheet?.contract?.user?.full_name || '—'}
                </p>
                <p className="text-gray-600">
                  {invoice.timesheet?.contract?.user?.email || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Détails de la mission */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails de la mission</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Période</p>
                  <p className="font-medium">
                    {invoice.timesheet?.month} {invoice.timesheet?.year}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jours travaillés</p>
                  <p className="font-medium">{invoice.timesheet?.worked_days} jours</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">TJM</p>
                  <p className="font-medium">{invoice.timesheet?.contract?.tjm}€</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Montant journalier total</p>
                  <p className="font-medium">
                    {((invoice.timesheet?.worked_days || 0) * (invoice.timesheet?.contract?.tjm || 0)).toFixed(2)}€
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Calculs */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculs</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Facturation HT</span>
                <span className="font-medium">{invoice.facturation_ht?.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Commission ({invoice.timesheet?.contract?.commission_rate}%)</span>
                <span className="font-medium">-{invoice.commission_amount?.toFixed(2)}€</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">{invoice.facturation_net?.toFixed(2)}€</span>
                </div>
              </div>
              {invoice.amount_cfa && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Équivalent CFA</span>
                  <span>{invoice.amount_cfa?.toFixed(2)} FCFA</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Facture générée automatiquement par Azyflow</p>
            <p>Date de génération : {formatDate(invoice.created_at || new Date().toISOString())}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};