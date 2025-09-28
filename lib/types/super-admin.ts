/**
 * Types pour le système Super Admin et invitations ESN
 * Phase 1 - Migration B2B Premium
 */

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface CompanyInvitation {
  id: string;
  email: string;
  company_name: string;
  siret?: string;
  business_sector?: string;
  estimated_freelancers: number;
  status: InvitationStatus;
  invitation_token: string;
  expires_at: string;
  invited_by: string;
  company_created_id?: string;
  accepted_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInvitationRequest {
  email: string;
  company_name: string;
  siret?: string;
  estimated_freelancers?: number;
}

export interface SuperAdminActivity {
  id: string;
  admin_id: string;
  activity_type: SuperAdminActivityType;
  target_type?: 'company_invitation' | 'company' | 'user';
  target_id?: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export type SuperAdminActivityType = 
  | 'invitation_sent'
  | 'esn_invitation_accepted'
  | 'esn_invitation_rejected'
  | 'esn_approved'
  | 'esn_suspended'
  | 'plan_changed'
  | 'manual_override';

export interface SuperAdminStats {
  total_invitations: number;
  pending_invitations: number;
  accepted_invitations: number;
  rejected_invitations: number;
  expired_invitations: number;
  total_companies: number;
  active_companies: number;
  total_users: number;
  total_freelancers: number;
}

export interface ESNCompanyDetails {
  id: string;
  name: string;
  siret?: string;
  created_at: string;
  invitation_id?: string;
  user_count: number;
  freelancer_count: number;
  admin_count: number;
  last_activity?: string;
  status: 'active' | 'inactive' | 'suspended';
}

// Note: Secteurs d'activité supprimés - Toutes les ESN sont dans l'IT par définition

// Plans futurs (Phase 3)
export interface ESNPlan {
  id: string;
  name: 'starter' | 'pro' | 'enterprise';
  price_monthly: number;
  max_freelancers: number | null; // null = unlimited
  features: string[];
}

export const ESN_PLANS: Record<string, ESNPlan> = {
  starter: {
    id: 'starter',
    name: 'starter',
    price_monthly: 49,
    max_freelancers: 10,
    features: ['CRA Management', 'Basic Invoicing', 'Email Support']
  },
  pro: {
    id: 'pro', 
    name: 'pro',
    price_monthly: 149,
    max_freelancers: 50,
    features: ['Everything in Starter', 'HNO Management', 'Analytics Dashboard', 'Priority Support']
  },
  enterprise: {
    id: 'enterprise',
    name: 'enterprise', 
    price_monthly: 349,
    max_freelancers: null,
    features: ['Everything in Pro', 'API Access', 'Custom Integrations', 'Dedicated Support', 'SLA 99.9%']
  }
};