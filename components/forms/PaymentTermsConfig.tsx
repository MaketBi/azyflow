import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PaymentTermsHelper } from '../../lib/payment-terms-helper';

interface PaymentTermsConfigProps {
  initialPaymentTerms?: number;
  initialPaymentType?: 'end_of_month' | 'net_days';
  initialVatRate?: number;
  initialVatApplicable?: boolean;
  onChange: (config: {
    payment_terms: number;
    payment_terms_type: 'end_of_month' | 'net_days';
    vat_rate: number;
    vat_applicable: boolean;
  }) => void;
  disabled?: boolean;
}

export const PaymentTermsConfig: React.FC<PaymentTermsConfigProps> = ({
  initialPaymentTerms = 30,
  initialPaymentType = 'end_of_month',
  initialVatRate = 20,
  initialVatApplicable = true,
  onChange,
  disabled = false
}) => {
  const [paymentTerms, setPaymentTerms] = useState(initialPaymentTerms);
  const [paymentType, setPaymentType] = useState<'end_of_month' | 'net_days'>(initialPaymentType);
  const [vatRate, setVatRate] = useState(initialVatRate);
  const [vatApplicable, setVatApplicable] = useState(initialVatApplicable);

  const standardTerms = PaymentTermsHelper.getStandardPaymentTerms();

  const handleChange = () => {
    onChange({
      payment_terms: paymentTerms,
      payment_terms_type: paymentType,
      vat_rate: vatRate,
      vat_applicable: vatApplicable
    });
  };

  React.useEffect(() => {
    handleChange();
  }, [paymentTerms, paymentType, vatRate, vatApplicable]);

  const applyStandardTerms = (key: string) => {
    const terms = standardTerms[key];
    if (terms) {
      setPaymentTerms(terms.days);
      setPaymentType(terms.type);
    }
  };

  // Calcul d'exemple pour prévisualisation
  const exampleCalculation = PaymentTermsHelper.calculateFullInvoice(
    10, // 10 jours travaillés
    500, // 500€ TJM
    { days: paymentTerms, type: paymentType },
    { rate: vatRate, applicable: vatApplicable },
    15 // 15% commission
  );

  return (
    <div className="space-y-6">
      {/* Configuration des délais de paiement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Délais de paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Boutons délais standards */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Délais standards français
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyStandardTerms('30_end_month')}
                disabled={disabled}
                className={paymentTerms === 30 && paymentType === 'end_of_month' 
                  ? 'bg-blue-50 border-blue-300' : ''
                }
              >
                30 j fin de mois
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyStandardTerms('45_end_month')}
                disabled={disabled}
                className={paymentTerms === 45 && paymentType === 'end_of_month' 
                  ? 'bg-blue-50 border-blue-300' : ''
                }
              >
                45 j fin de mois
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyStandardTerms('60_end_month')}
                disabled={disabled}
                className={paymentTerms === 60 && paymentType === 'end_of_month' 
                  ? 'bg-blue-50 border-blue-300' : ''
                }
              >
                60 j fin de mois
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyStandardTerms('30_net')}
                disabled={disabled}
                className={paymentTerms === 30 && paymentType === 'net_days' 
                  ? 'bg-blue-50 border-blue-300' : ''
                }
              >
                30 j nets
              </Button>
            </div>
          </div>

          {/* Configuration personnalisée */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de jours
              </label>
              <Input
                type="number"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(parseInt(e.target.value) || 30)}
                disabled={disabled}
                min="1"
                max="180"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de délai
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as 'end_of_month' | 'net_days')}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="end_of_month">Fin de mois suivant</option>
                <option value="net_days">Jours nets</option>
              </select>
            </div>
          </div>

          {/* Explication */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <strong>Type sélectionné :</strong> {
              paymentType === 'end_of_month' 
                ? `${paymentTerms} jours à compter de la fin du mois suivant la date de facture`
                : `${paymentTerms} jours à compter de la date de facture`
            }
            <br />
            <strong>Exemple :</strong> Facture émise le 15 janvier → 
            Échéance le {PaymentTermsHelper.formatDueDate(
              PaymentTermsHelper.calculateDueDate(
                new Date('2024-01-15'), 
                { days: paymentTerms, type: paymentType }
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration TVA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Taxe sur la Valeur Ajoutée (TVA)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="vat_applicable"
              checked={vatApplicable}
              onChange={(e) => setVatApplicable(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="vat_applicable" className="text-sm font-medium text-gray-700">
              TVA applicable
            </label>
          </div>

          {vatApplicable && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taux de TVA (%)
                </label>
                <Input
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(parseFloat(e.target.value) || 20)}
                  disabled={disabled}
                  min="0"
                  max="50"
                  step="0.1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVatRate(20)}
                  disabled={disabled}
                  className={vatRate === 20 ? 'bg-blue-50 border-blue-300' : ''}
                >
                  Taux français (20%)
                </Button>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            {vatApplicable ? (
              <>
                <strong>TVA de {vatRate}% applicable</strong>
                <br />
                Le TJM sera considéré hors taxes, la TVA sera ajoutée automatiquement.
              </>
            ) : (
              <>
                <strong>Pas de TVA</strong>
                <br />
                Le TJM sera considéré comme le montant final à facturer.
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Aperçu des calculs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aperçu des calculs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2 bg-blue-50 p-4 rounded-md">
            <div className="font-medium text-blue-900 mb-2">
              Exemple : 10 jours × 500€ TJM (commission 15%)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span>Montant HT :</span>
              <span className="font-medium">{exampleCalculation.amountHT.toFixed(2)}€</span>
              {vatApplicable && (
                <>
                  <span>TVA ({vatRate}%) :</span>
                  <span className="font-medium">{exampleCalculation.vatAmount.toFixed(2)}€</span>
                </>
              )}
              <span>Montant TTC :</span>
              <span className="font-medium">{exampleCalculation.amountTTC.toFixed(2)}€</span>
              <span>Commission :</span>
              <span className="font-medium text-red-600">-{exampleCalculation.commission.toFixed(2)}€</span>
              <span className="font-semibold">Net freelancer :</span>
              <span className="font-semibold text-green-600">{exampleCalculation.netAmount.toFixed(2)}€</span>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-200">
              <span>Date d'échéance :</span>
              <span className="font-medium ml-2">
                {PaymentTermsHelper.formatDueDate(exampleCalculation.dueDate)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};