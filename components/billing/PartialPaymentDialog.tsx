import React, { useState } from 'react';
import { InvoiceWithFreelancerPayments, FreelancerPartialPaymentService } from '../../lib/services/partial-payments';

interface FreelancerPaymentDialogProps {
  invoice: InvoiceWithFreelancerPayments;
  isOpen: boolean;
  onClose: () => void;
  onPaymentAdded: () => void;
}

const PartialPaymentDialog: React.FC<FreelancerPaymentDialogProps> = ({
  invoice,
  isOpen,
  onClose,
  onPaymentAdded
}) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'check' | 'cash' | 'other'>('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdvance, setIsAdvance] = useState(!invoice.client_has_paid);
  const [advanceReason, setAdvanceReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await FreelancerPartialPaymentService.addPaymentToFreelancer(
      invoice.id,
      parseFloat(amount),
      paymentMethod,
      reference,
      notes,
      isAdvance,
      advanceReason
    );

    if (result.success) {
      setAmount('');
      setReference('');
      setNotes('');
      setIsAdvance(false);
      setAdvanceReason('');
      onPaymentAdded();
      onClose();
    } else {
      setError(result.error || 'Erreur lors du paiement au freelancer');
    }

    setLoading(false);
  };

  const maxAmount = invoice.remaining_to_pay_freelancer;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            💰 Payer le freelancer
          </h2>
          
          {/* Info facture */}
          <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm">
            <p><strong>Freelancer:</strong> {invoice.freelancer_name} - {invoice.month}</p>
            <p><strong>Montant facture:</strong> {invoice.total_amount.toFixed(2)}€</p>
            <p><strong>Déjà versé au freelancer:</strong> {invoice.total_paid_to_freelancer.toFixed(2)}€</p>
            <p><strong>Restant à verser:</strong> {invoice.remaining_to_pay_freelancer.toFixed(2)}€</p>
            <p className={invoice.client_has_paid ? 'text-green-600' : 'text-red-600'}>
              <strong>Client a payé:</strong> {invoice.client_has_paid ? 'Oui ✅' : 'Non ❌'}
            </p>
            {invoice.has_advances && (
              <p className="text-orange-600 font-medium">
                <strong>⚠️ Avances déjà faites:</strong> {invoice.total_advances.toFixed(2)}€
              </p>
            )}
          </div>

          {/* Alerte avance */}
          {!invoice.client_has_paid && (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-3 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-orange-800">
                    🚀 <strong>Attention:</strong> Le client n'a pas encore payé cette facture. 
                    Ce versement sera considéré comme une <strong>avance</strong> et sera tracé comme tel.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Montant */}
            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Montant à verser au freelancer (€)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                max={maxAmount}
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Max: ${maxAmount.toFixed(2)}€`}
              />
            </div>

            {/* Méthode de paiement */}
            <div className="mb-4">
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                Méthode de paiement
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="bank_transfer">Virement bancaire</option>
                <option value="check">Chèque</option>
                <option value="cash">Espèces</option>
                <option value="other">Autre</option>
              </select>
            </div>

            {/* Référence */}
            <div className="mb-4">
              <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
                Référence (optionnel)
              </label>
              <input
                type="text"
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="N° de virement, chèque..."
              />
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optionnel)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Commentaires supplémentaires..."
              />
            </div>

            {/* Gestion des avances - uniquement si le client n'a pas payé */}
            {!invoice.client_has_paid && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="isAdvance"
                    checked={isAdvance || !invoice.client_has_paid}
                    onChange={(e) => setIsAdvance(e.target.checked)}
                    disabled={!invoice.client_has_paid}
                    className="mr-2"
                  />
                  <label htmlFor="isAdvance" className="text-sm font-medium text-orange-800">
                    🚀 Marquer comme avance (client pas encore payé)
                  </label>
                </div>
                
                {(isAdvance || !invoice.client_has_paid) && (
                  <div>
                    <label htmlFor="advanceReason" className="block text-sm font-medium text-orange-700 mb-1">
                      Raison de l'avance
                    </label>
                    <input
                      type="text"
                      id="advanceReason"
                      value={advanceReason || 'Avance exceptionnelle avant paiement client'}
                      onChange={(e) => setAdvanceReason(e.target.value)}
                      className="w-full px-3 py-2 border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Ex: Urgence financière, avance sur délai client..."
                    />
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Cette avance sera clairement tracée pour le freelancer et l'administration
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Boutons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  (isAdvance || !invoice.client_has_paid) 
                    ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' 
                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                {loading 
                  ? 'Traitement...' 
                  : (isAdvance || !invoice.client_has_paid) 
                    ? '🚀 Avancer le freelancer' 
                    : '💰 Payer le freelancer'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartialPaymentDialog;