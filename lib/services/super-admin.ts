import { supabase } from '../supabase';
import type { 
  CompanyInvitation, 
  CreateInvitationRequest, 
  SuperAdminActivity, 
  SuperAdminStats,
  ESNCompanyDetails,
  InvitationStatus 
} from '../types/super-admin';

export class SuperAdminService {
  
  // TODO: Après migration, ces méthodes utiliseront les nouveaux champs:
  // - companies.siret
  // - companies.estimated_freelancers  
  // - companies.contact_email
  // - companies.invited_by
  // - companies.invited_at
  
  /**
   * Vérifier si l'utilisateur actuel est super admin
   */
  static async isSuperAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      return userData?.role === 'super_admin';
    } catch (error) {
      console.error('Error checking super admin status:', error);
      return false;
    }
  }

  /**
   * Créer une invitation ESN avec envoi d'email réel via Edge Function
   * 
   * @param data - Données de l'invitation (email, company_name, siret, estimated_freelancers)
   * @returns Promise avec le résultat de l'invitation
   * 
   * Processus :
   * 1. Vérification des droits Super Admin
   * 2. Appel de l'Edge Function invite-esn
   * 3. Création de la company avec statut "pending"
   * 4. Envoi de l'email d'invitation via Supabase Auth
   */
  static async createESNInvitation(data: CreateInvitationRequest): Promise<{ success: boolean; invitation_id?: string; error?: string }> {
    try {
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        return { success: false, error: 'Accès non autorisé' };
      }

      // Obtenir le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { success: false, error: 'Session non trouvée' };
      }

      // Appeler la fonction Edge invite-esn
      const { data: result, error } = await supabase.functions.invoke('invite-esn', {
        body: {
          email: data.email,
          company_name: data.company_name,
          siret: data.siret,
          estimated_freelancers: data.estimated_freelancers
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error calling invite-esn function:', error);
        return { success: false, error: error.message };
      }

      if (!result.success) {
        return { success: false, error: result.error || 'Erreur lors de l\'invitation ESN' };
      }

      return { 
        success: true, 
        invitation_id: result.invitation_id 
      };
    } catch (error) {
      console.error('Error in createESNInvitation:', error);
      return { success: false, error: 'Erreur lors de la création de l\'invitation' };
    }
  }

  /**
   * Récupérer toutes les invitations ESN (version compatible - mise à jour après migration)
   */
  static async getESNInvitations(status?: InvitationStatus): Promise<CompanyInvitation[]> {
    try {
      // Récupérer les companies avec les champs existants pour l'instant
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching companies:', error);
        return [];
      }

      // Transformer les companies en format CompanyInvitation
      const invitations: CompanyInvitation[] = (companies || []).map(company => ({
        id: company.id,
        email: `admin@${company.name.toLowerCase().replace(/\s+/g, '')}.com`, // Email généré
        company_name: company.name,
        siret: undefined, // Sera disponible après migration
        estimated_freelancers: 5, // Valeur par défaut
        status: 'accepted' as InvitationStatus,
        invitation_token: '', // Géré par Supabase Auth
        expires_at: new Date().toISOString(),
        invited_by: '',
        created_at: company.created_at,
        updated_at: company.created_at,
        accepted_at: company.created_at,
        rejected_at: undefined,
        rejection_reason: undefined,
        company_created_id: company.id
      }));

      // Filtrer par statut si spécifié
      if (status) {
        return invitations.filter(inv => inv.status === status);
      }

      return invitations;
    } catch (error) {
      console.error('Error in getESNInvitations:', error);
      return [];
    }
  }

  /**
   * Rejeter une invitation ESN (version temporaire - désactive la compagnie)
   */
  static async rejectESNInvitation(invitationId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        return { success: false, error: 'Accès non autorisé' };
      }

      // Pour l'instant, on pourrait marquer la compagnie comme inactive
      // mais la table companies n'a pas de champ 'active' dans le schéma actuel
      console.log(`Invitation ${invitationId} rejetée. Raison: ${reason || 'Non spécifiée'}`);

      // TODO: Implémenter la logique de rejet réelle quand les tables seront créées
      return { success: true };
    } catch (error) {
      console.error('Error in rejectESNInvitation:', error);
      return { success: false, error: 'Erreur lors du rejet de l\'invitation' };
    }
  }

  /**
   * Resend une invitation ESN (version temporaire)
   */
  static async resendESNInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        return { success: false, error: 'Accès non autorisé' };
      }

      // Pour l'instant, simulation du renvoi d'invitation
      console.log(`Renvoi d'invitation pour l'ID: ${invitationId}`);
      
      // TODO: Implémenter le renvoi d'email réel quand les tables seront créées
      return { success: true };
    } catch (error) {
      console.error('Error in resendESNInvitation:', error);
      return { success: false, error: 'Erreur lors du renvoi de l\'invitation' };
    }
  }

  /**
   * Récupérer les statistiques super admin (version temporaire)
   */
  static async getStats(): Promise<SuperAdminStats> {
    try {
      // Récupérer les stats des entreprises
      const { data: companies } = await supabase
        .from('companies')
        .select('id, created_at');

      // Récupérer les stats des utilisateurs
      const { data: users } = await supabase
        .from('users')
        .select('role, active');

      const stats: SuperAdminStats = {
        total_invitations: companies?.length || 0, // Pour l'instant, chaque company = une invitation
        pending_invitations: 0, // Pas encore implémenté
        accepted_invitations: companies?.length || 0, // Toutes les companies existantes sont "acceptées"
        rejected_invitations: 0, // Pas encore implémenté
        expired_invitations: 0, // Pas encore implémenté
        total_companies: companies?.length || 0,
        active_companies: companies?.length || 0, // TODO: filtrer par activité récente
        total_users: users?.length || 0,
        total_freelancers: users?.filter(u => u.role === 'freelancer')?.length || 0
      };

      return stats;
    } catch (error) {
      console.error('Error fetching super admin stats:', error);
      return {
        total_invitations: 0,
        pending_invitations: 0,
        accepted_invitations: 0,
        rejected_invitations: 0,
        expired_invitations: 0,
        total_companies: 0,
        active_companies: 0,
        total_users: 0,
        total_freelancers: 0
      };
    }
  }

  /**
   * Récupérer les activités super admin (version temporaire - utilise des activités factices)
   */
  static async getActivities(limit = 50): Promise<SuperAdminActivity[]> {
    try {
      // Pour l'instant, retourner des activités factices basées sur l'historique des companies
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!companies) {
        return [];
      }

      // Générer des activités factices pour chaque company
      const mockActivities: SuperAdminActivity[] = companies.map(company => ({
        id: company.id,
        admin_id: '', // ID de l'admin fictif
        activity_type: 'esn_approved',
        description: `Entreprise "${company.name}" créée`,
        metadata: { company_id: company.id, company_name: company.name },
        created_at: company.created_at
      }));

      return mockActivities;
    } catch (error) {
      console.error('Error in getActivities:', error);
      return [];
    }
  }

  /**
   * Récupérer les détails des ESN avec stats
   */
  static async getESNCompanies(): Promise<ESNCompanyDetails[]> {
    try {
      // Récupérer les companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

      if (companiesError) {
        console.error('Error fetching companies:', companiesError);
        return [];
      }

      // Récupérer les stats des utilisateurs pour chaque company
      const companiesWithStats = await Promise.all(
        (companies || []).map(async (company) => {
          const { data: users } = await supabase
            .from('users')
            .select('id, role, active, last_login')
            .eq('company_id', company.id);

          return {
            id: company.id,
            name: company.name,
            siret: undefined, // Sera disponible après migration
            created_at: company.created_at,
            user_count: users?.length || 0,
            freelancer_count: users?.filter(u => u.role === 'freelancer')?.length || 0,
            admin_count: users?.filter(u => u.role === 'admin')?.length || 0,
            last_activity: users?.reduce((latest: string | null, u) => {
              if (!u.last_login) return latest;
              if (!latest || new Date(u.last_login) > new Date(latest)) {
                return u.last_login;
              }
              return latest;
            }, null) || undefined,
            status: 'active' as const
          };
        })
      );

      return companiesWithStats;
    } catch (error) {
      console.error('Error in getESNCompanies:', error);
      return [];
    }
  }

  /**
   * Valider une invitation par token (version temporaire - toujours valide)
   */
  static async validateInvitationToken(token: string): Promise<{ valid: boolean; invitation?: CompanyInvitation; error?: string }> {
    try {
      // Pour l'instant, toujours retourner valide avec une invitation factice
      const mockInvitation: CompanyInvitation = {
        id: token,
        email: 'admin@example.com',
        company_name: 'Entreprise Test',
        estimated_freelancers: 5,
        status: 'pending',
        invitation_token: token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        invited_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        accepted_at: undefined,
        rejected_at: undefined,
        rejection_reason: undefined,
        company_created_id: undefined
      };

      console.log(`Token de validation: ${token}`);
      return { valid: true, invitation: mockInvitation };
    } catch (error) {
      console.error('Error in validateInvitationToken:', error);
      return { valid: false, error: 'Erreur lors de la validation du token' };
    }
  }
}