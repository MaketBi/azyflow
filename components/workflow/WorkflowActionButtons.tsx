import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { WorkflowStatus } from '../../lib/workflow-progress';
import { InvoiceService } from '../../lib/services/invoices';
import { WorkflowDataHelper } from '../../lib/services/workflow-data-helper';
import { Button } from '../ui/Button';

interface WorkflowActionButtonsProps {
  invoiceId: string;
  currentStatus: WorkflowStatus;
  onStatusChange: (newStatus: WorkflowStatus) => void;
  className?: string;
}

export const WorkflowActionButtons: React.FC<WorkflowActionButtonsProps> = ({
  invoiceId,
  currentStatus,
  onStatusChange,
  className = ''
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: string, newStatus: WorkflowStatus) => {
    setLoading(action);
    setError(null);

    try {
      switch (action) {
        case 'send_invoice':
          await InvoiceService.update(invoiceId, { 
            status: 'sent'
          });
          onStatusChange('invoice_sent');
          
          // Envoyer notification: Facture envoyée au client
          try {
            await WorkflowDataHelper.sendWorkflowNotification('invoice_sent', undefined, invoiceId);
          } catch (notificationError) {
            console.error('Erreur notification "invoice_sent":', notificationError);
          }
          break;

        case 'mark_paid_by_client':
          await InvoiceService.update(invoiceId, { 
            status: 'paid_by_client',
            paid_at: new Date().toISOString()
          });
          onStatusChange('payment_received_company');
          
          // Envoyer notification: Paiement reçu du client
          try {
            await WorkflowDataHelper.sendWorkflowNotification('payment_received', undefined, invoiceId);
          } catch (notificationError) {
            console.error('Erreur notification "payment_received":', notificationError);
          }
          break;

        case 'pay_freelancer':
          await InvoiceService.update(invoiceId, { 
            status: 'paid_freelancer'
          });
          onStatusChange('paid_freelancer');
          
          // Envoyer notification: Freelancer payé - Workflow terminé
          try {
            await WorkflowDataHelper.sendWorkflowNotification('freelancer_paid', undefined, invoiceId);
          } catch (notificationError) {
            console.error('Error sending freelancer paid notification:', notificationError);
          }
          break;

        default:
          throw new Error('Action inconnue');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      console.error('Error in workflow action:', err);
    } finally {
      setLoading(null);
    }
  };

  const getAvailableActions = () => {
    const actions = [];

    switch (currentStatus) {
      case 'cra_validated':
        actions.push({
          key: 'send_invoice',
          label: 'Envoyer la facture',
          icon: Send,
          variant: 'primary' as const,
          description: 'Envoyer la facture au client'
        });
        break;

      case 'invoice_sent':
        actions.push({
          key: 'mark_paid_by_client',
          label: 'Marquer payé par le client',
          icon: DollarSign,
          variant: 'primary' as const,
          description: 'Le client a payé la facture'
        });
        break;

      case 'payment_received_company':
        actions.push({
          key: 'pay_freelancer',
          label: 'Payer le freelancer',
          icon: CheckCircle,
          variant: 'primary' as const,
          description: 'Effectuer le paiement au freelancer'
        });
        break;

      case 'paid_freelancer':
        // Aucune action disponible - workflow terminé
        break;

      default:
        // Pour 'cra_submitted', aucune action car l'approbation se fait ailleurs
        break;
    }

    return actions;
  };

  const actions = getAvailableActions();

  if (actions.length === 0) {
    if (currentStatus === 'paid_freelancer') {
      return (
        <motion.div 
          className={`flex items-center gap-2 text-green-600 ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Workflow terminé</span>
        </motion.div>
      );
    }

    return (
      <motion.div 
        className={`flex items-center gap-2 text-gray-500 ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Clock className="w-4 h-4" />
        <span className="text-sm">En attente d'action</span>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`space-y-3 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {error && (
        <motion.div 
          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </motion.div>
      )}

      {actions.map((action) => {
        const Icon = action.icon;
        const isLoading = loading === action.key;
        
        return (
          <motion.div
            key={action.key}
            className="flex flex-col gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant={action.variant}
              onClick={() => handleAction(action.key, getNextStatus(action.key))}
              disabled={isLoading || !!loading}
              className="w-full justify-start"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Icon className="w-4 h-4 mr-2" />
              )}
              {action.label}
            </Button>
            <p className="text-xs text-gray-500 ml-6">
              {action.description}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// Helper function to determine next status based on action
function getNextStatus(action: string): WorkflowStatus {
  switch (action) {
    case 'send_invoice':
      return 'invoice_sent';
    case 'mark_paid_by_client':
      return 'payment_received_company';
    case 'pay_freelancer':
      return 'paid_freelancer';
    default:
      throw new Error('Action inconnue');
  }
}