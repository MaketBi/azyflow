// Types et enums pour le workflow de progression CRA → Paiement
import React from 'react';

export type WorkflowStatus = 
  | 'cra_submitted'           // CRA soumis par freelancer
  | 'cra_validated'           // CRA validé par admin + facture créée
  | 'invoice_sent'            // Facture envoyée au client
  | 'payment_received_company' // Paiement reçu par la compagnie
  | 'paid_freelancer';        // Freelancer payé (final)

export interface WorkflowStep {
  id: WorkflowStatus;
  label: string;
  description: string;
  iconName: string; // Nom de l'icône Lucide
  color: string;
  bgColor: string;
}

export interface WorkflowProgress {
  timesheetId: string;
  currentStatus: WorkflowStatus;
  completedSteps: WorkflowStatus[];
  estimatedCompletionDate?: string;
  lastUpdateDate: string;
  invoiceId?: string;
  amount?: number;
  commissionRate?: number;
}

// Configuration des étapes du workflow
export const WORKFLOW_STEPS: Record<WorkflowStatus, WorkflowStep> = {
  cra_submitted: {
    id: 'cra_submitted',
    label: 'CRA Soumis',
    description: 'Votre CRA a été soumis et attend validation',
    iconName: 'FileText',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  cra_validated: {
    id: 'cra_validated', 
    label: 'CRA Validé',
    description: 'CRA validé, facture générée automatiquement',
    iconName: 'CheckCircle',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  invoice_sent: {
    id: 'invoice_sent',
    label: 'Facture Envoyée',
    description: 'Facture envoyée au client par l\'admin',
    iconName: 'Send',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  payment_received_company: {
    id: 'payment_received_company',
    label: 'Paiement Reçu',
    description: 'Client a payé la facture à la compagnie',
    iconName: 'CreditCard',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  paid_freelancer: {
    id: 'paid_freelancer',
    label: 'Payé',
    description: 'Vous avez été payé (commission déduite)',
    iconName: 'Banknote',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  }
};

// Ordre des étapes
export const WORKFLOW_ORDER: WorkflowStatus[] = [
  'cra_submitted',
  'cra_validated', 
  'invoice_sent',
  'payment_received_company',
  'paid_freelancer'
];

// Helpers
export function getStepIndex(status: WorkflowStatus): number {
  return WORKFLOW_ORDER.indexOf(status);
}

export function getProgressPercentage(currentStatus: WorkflowStatus): number {
  const currentIndex = getStepIndex(currentStatus);
  return Math.round(((currentIndex + 1) / WORKFLOW_ORDER.length) * 100);
}

export function getCompletedSteps(currentStatus: WorkflowStatus): WorkflowStatus[] {
  const currentIndex = getStepIndex(currentStatus);
  return WORKFLOW_ORDER.slice(0, currentIndex + 1);
}

export function getNextStep(currentStatus: WorkflowStatus): WorkflowStatus | null {
  const currentIndex = getStepIndex(currentStatus);
  if (currentIndex >= WORKFLOW_ORDER.length - 1) return null;
  return WORKFLOW_ORDER[currentIndex + 1];
}

export function isStepCompleted(step: WorkflowStatus, currentStatus: WorkflowStatus): boolean {
  return getStepIndex(step) <= getStepIndex(currentStatus);
}

// Fonction pour déterminer le statut basé sur timesheet + invoice
export function determineWorkflowStatus(
  timesheetStatus: string, 
  invoiceStatus?: string | null,
  invoiceExists?: boolean,
  paidAt?: string | null
): WorkflowStatus {
  // CRA en attente/brouillon
  if (timesheetStatus === 'draft') {
    return 'cra_submitted'; // On considère que draft = soumis pour cette vue
  }
  
  if (timesheetStatus === 'submitted') {
    return 'cra_submitted';
  }
  
  // CRA validé
  if (timesheetStatus === 'approved') {
    if (!invoiceExists) {
      return 'cra_validated'; // Facture pas encore créée
    }
    
    // Facture existe, regarder son statut
    if (invoiceStatus === 'sent') {
      return 'invoice_sent';
    }
    
    if (invoiceStatus === 'paid') {
      return 'payment_received_company';
    }
    
    if (paidAt || invoiceStatus === 'paid_freelancer') {
      return 'paid_freelancer';
    }
    
    // Facture créée mais pas encore envoyée
    return 'cra_validated';
  }
  
  // Par défaut
  return 'cra_submitted';
}