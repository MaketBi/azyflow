import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  Send, 
  CreditCard, 
  Banknote,
  Clock,
  Euro
} from 'lucide-react';
import { 
  WorkflowStatus, 
  WorkflowProgress, 
  WORKFLOW_STEPS, 
  WORKFLOW_ORDER,
  getProgressPercentage,
  isStepCompleted,
  getNextStep
} from '../../lib/workflow-progress';

// Map des icônes
const ICON_MAP = {
  FileText,
  CheckCircle, 
  Send,
  CreditCard,
  Banknote
} as const;

interface WorkflowProgressBarProps {
  progress: WorkflowProgress;
  className?: string;
  showDetails?: boolean;
}

export const WorkflowProgressBar: React.FC<WorkflowProgressBarProps> = ({
  progress,
  className = '',
  showDetails = true
}) => {
  const progressPercentage = getProgressPercentage(progress.currentStatus);
  const nextStep = getNextStep(progress.currentStatus);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            Suivi de votre CRA
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {progress.amount && (
              <span className="inline-flex items-center">
                <Euro className="w-4 h-4 mr-1" />
                {progress.amount.toLocaleString('fr-FR')} €
              </span>
            )}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {progressPercentage}%
          </div>
          <div className="text-xs text-gray-500">
            Progression
          </div>
        </div>
      </div>

      {/* Barre de progression principale */}
      <div className="relative mb-8">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        
        {/* Points d'étape sur la barre */}
        <div className="absolute top-0 left-0 w-full h-2 flex justify-between">
          {WORKFLOW_ORDER.map((stepId, index) => {
            const step = WORKFLOW_STEPS[stepId];
            const isCompleted = isStepCompleted(stepId, progress.currentStatus);
            const isCurrent = stepId === progress.currentStatus;
            const position = (index / (WORKFLOW_ORDER.length - 1)) * 100;
            
            return (
              <motion.div
                key={stepId}
                className="relative"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div 
                  className={`w-4 h-4 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-blue-500 border-blue-500' 
                      : isCurrent
                      ? 'bg-white border-blue-500 ring-2 ring-blue-200'
                      : 'bg-gray-200 border-gray-300'
                  }`}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Étapes détaillées */}
      {showDetails && (
        <div className="space-y-4">
          {WORKFLOW_ORDER.map((stepId, index) => {
            const step = WORKFLOW_STEPS[stepId];
            const isCompleted = isStepCompleted(stepId, progress.currentStatus);
            const isCurrent = stepId === progress.currentStatus;
            const IconComponent = ICON_MAP[step.iconName as keyof typeof ICON_MAP];
            
            return (
              <motion.div
                key={stepId}
                className={`flex items-center p-4 rounded-lg border transition-all ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : isCurrent
                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100'
                    : 'bg-gray-50 border-gray-200'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Icône */}
                <div 
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : isCurrent
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {IconComponent && <IconComponent className="w-5 h-5" />}
                </div>
                
                {/* Contenu */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${
                      isCompleted ? 'text-green-900' : isCurrent ? 'text-blue-900' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </h4>
                    
                    {isCompleted && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    
                    {isCurrent && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Clock className="w-5 h-5 text-blue-500" />
                      </motion.div>
                    )}
                  </div>
                  
                  <p className={`text-sm mt-1 ${
                    isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-400'
                  }`}>
                    {step.description}
                  </p>
                  
                  {/* Informations supplémentaires pour l'étape actuelle */}
                  {isCurrent && (
                    <div className="mt-2 text-xs text-blue-600">
                      {stepId === 'cra_submitted' && (
                        <span>⏱️ En attente de validation par l'administrateur</span>
                      )}
                      {stepId === 'cra_validated' && (
                        <span>📄 Facture générée, en attente d'envoi au client</span>
                      )}
                      {stepId === 'invoice_sent' && (
                        <span>📬 Facture envoyée, en attente de paiement client</span>
                      )}
                      {stepId === 'payment_received_company' && (
                        <span>💼 Paiement reçu, traitement du versement freelancer</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Prochaine étape */}
      {nextStep && (
        <motion.div 
          className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-gray-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Prochaine étape : {WORKFLOW_STEPS[nextStep].label}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {WORKFLOW_STEPS[nextStep].description}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Dernière mise à jour */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Dernière mise à jour : {new Date(progress.lastUpdateDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
};