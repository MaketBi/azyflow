import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Euro } from 'lucide-react';
import { 
  WorkflowStatus, 
  WORKFLOW_STEPS,
  getProgressPercentage
} from '../../lib/workflow-progress';

interface WorkflowProgressBadgeProps {
  currentStatus: WorkflowStatus;
  amount?: number;
  className?: string;
  showPercentage?: boolean;
}

export const WorkflowProgressBadge: React.FC<WorkflowProgressBadgeProps> = ({
  currentStatus,
  amount,
  className = '',
  showPercentage = true
}) => {
  const step = WORKFLOW_STEPS[currentStatus];
  const progressPercentage = getProgressPercentage(currentStatus);
  const isCompleted = currentStatus === 'paid_freelancer';

  return (
    <motion.div 
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Icône de statut */}
      <div className={`w-2 h-2 rounded-full ${
        isCompleted ? 'bg-green-500' : 'bg-blue-500'
      }`} />
      
      {/* Label du statut */}
      <span className={`text-sm font-medium ${
        isCompleted ? 'text-green-700' : 'text-blue-700'
      }`}>
        {step.label}
      </span>
      
      {/* Pourcentage */}
      {showPercentage && (
        <span className="text-xs text-gray-500">
          {progressPercentage}%
        </span>
      )}
      
      {/* Montant */}
      {amount && (
        <span className="text-xs text-gray-600 flex items-center">
          <Euro className="w-3 h-3 mr-1" />
          {amount.toLocaleString('fr-FR')}
        </span>
      )}
      
      {/* Icône d'action */}
      {isCompleted ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Clock className="w-4 h-4 text-blue-500" />
        </motion.div>
      )}
    </motion.div>
  );
};