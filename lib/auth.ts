import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { Database } from './database';

export type UserProfile = Database['public']['Tables']['users']['Row'];

export class AuthService {
  static completeProfileSetup(arg0: { fullName: any; role: "admin" | "freelancer"; companyName: string | undefined; companyId: string | undefined; }): { error: any; } | PromiseLike<{ error: any; }> {
      throw new Error('Method not implemented.');
  }
  static needsProfileSetup(): { needsSetup: any; userData: any; } | PromiseLike<{ needsSetup: any; userData: any; }> {
    throw new Error('Method not implemented.');
  }
  /**
   * Sign up with email and password + metadata
   */
  static async signUp(
    email: string,
    password: string,
    fullName: string,
    role: string,
    companyName?: string
  ) {
    const redirectUrl = import.meta.env.VITE_REDIRECT_URL;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          company_name: companyName,
        },
        emailRedirectTo: redirectUrl, // ✅ redirection dynamique dev/prod
      },
    });

    if (error) {
      console.error("[AuthService.signUp] Erreur :", error.message);
      throw error;
    }

    return data;
  }


  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  /**
   * Get current user session
   */
  static async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Get current user profile from the users table (includes phone number)
   */
  static async getCurrentUserProfile(): Promise<any | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    try {
      // Récupérer le profil complet depuis la table users
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('id, email, full_name, phone, role, company_id, created_at, active, last_login')
        .eq('id', user.id)
        .single();

      if (error || !userProfile) {
        console.error('Error fetching user profile:', error);
        
        // Fallback sur les métadonnées si la table users ne contient pas l'utilisateur
        const metadata = user.user_metadata;
        return {
          id: user.id,
          email: user.email,
          full_name: metadata.full_name,
          role: metadata.role,
          company_name: metadata.company_name,
          created_at: user.created_at,
          phone: null,
        };
      }

      return userProfile;
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error);
      return null;
    }
  }

  /**
   * Check if current user is admin (from metadata)
   */
  static async isAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;
    
    return user.user_metadata?.role === 'admin';
  }
}
