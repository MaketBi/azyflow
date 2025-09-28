// Edge Function: Surveillance automatique des expirations
// Vérifie les comptes d'essai et invitations expirés
// Envoie des notifications et met à jour les statuts

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🕐 Démarrage du contrôle des expirations...');
    
    const now = new Date();
    const results = {
      expiredTrials: 0,
      expiredInvitations: 0,
      warningsSent: 0,
      errors: []
    };

    // --- 1. Vérifier les invitations expirées ---
    console.log('📧 Vérification des invitations expirées...');
    
    const { data: expiredInvitations, error: invitationError } = await supabase
      .from('company_invitations')
      .select('id, company_name, email, expires_at')
      .eq('status', 'pending')
      .lt('expires_at', now.toISOString());

    if (invitationError) {
      console.error('❌ Erreur invitations:', invitationError);
      results.errors.push(`Invitations: ${invitationError.message}`);
    } else if (expiredInvitations && expiredInvitations.length > 0) {
      // Marquer comme expirées
      const { error: updateError } = await supabase
        .from('company_invitations')
        .update({ 
          status: 'expired',
          rejection_reason: 'Invitation expirée automatiquement'
        })
        .in('id', expiredInvitations.map(inv => inv.id));

      if (updateError) {
        results.errors.push(`Update invitations: ${updateError.message}`);
      } else {
        results.expiredInvitations = expiredInvitations.length;
        console.log(`✅ ${expiredInvitations.length} invitations expirées`);
      }
    }

    // --- 2. Vérifier les comptes d'essai expirés ---
    console.log('🏢 Vérification des comptes d\'essai...');
    
    // Note: Pour l'instant on simule avec le champ 'plan'
    // Une fois la migration appliquée, on utilisera trial_expires_at
    
    const { data: trialCompanies, error: trialError } = await supabase
      .from('companies')
      .select('id, name, contact_email, plan, created_at, status')
      .eq('plan', 'trial')
      .eq('status', 'active');

    if (trialError) {
      console.error('❌ Erreur companies:', trialError);
      results.errors.push(`Companies: ${trialError.message}`);
    } else if (trialCompanies && trialCompanies.length > 0) {
      // Calculer manuellement l'expiration (30 jours après création)
      const expiredCompanies = trialCompanies.filter(company => {
        const createdAt = new Date(company.created_at);
        const expirationDate = new Date(createdAt.getTime() + (30 * 24 * 60 * 60 * 1000));
        return now > expirationDate;
      });

      if (expiredCompanies.length > 0) {
        const { error: expireError } = await supabase
          .from('companies')
          .update({ status: 'expired' })
          .in('id', expiredCompanies.map(c => c.id));

        if (expireError) {
          results.errors.push(`Expire companies: ${expireError.message}`);
        } else {
          results.expiredTrials = expiredCompanies.length;
          console.log(`✅ ${expiredCompanies.length} comptes d'essai expirés`);
        }
      }

      // --- 3. Alertes pour les comptes qui expirent bientôt ---
      const warningCompanies = trialCompanies.filter(company => {
        const createdAt = new Date(company.created_at);
        const expirationDate = new Date(createdAt.getTime() + (30 * 24 * 60 * 60 * 1000));
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        return daysUntilExpiration > 0 && daysUntilExpiration <= 7; // Alerte 7 jours avant
      });

      if (warningCompanies.length > 0) {
        results.warningsSent = warningCompanies.length;
        console.log(`⚠️ ${warningCompanies.length} alertes d'expiration à envoyer`);
        
        // TODO: Envoyer des emails d'alerte
        // Pour l'instant on log juste
        for (const company of warningCompanies) {
          console.log(`📧 Alerte à envoyer à: ${company.contact_email} (${company.name})`);
        }
      }
    }

    // --- 4. Nettoyage des données anciennes ---
    console.log('🧹 Nettoyage des anciennes données...');
    
    const cleanupDate = new Date();
    cleanupDate.setMonth(cleanupDate.getMonth() - 3); // Garder 3 mois d'historique

    // Supprimer les anciennes invitations rejetées/expirées
    const { error: cleanupError } = await supabase
      .from('company_invitations')
      .delete()
      .in('status', ['rejected', 'expired'])
      .lt('updated_at', cleanupDate.toISOString());

    if (cleanupError) {
      results.errors.push(`Cleanup: ${cleanupError.message}`);
    }

    // --- 5. Log du résumé ---
    console.log('📊 Résumé du contrôle des expirations:', {
      timestamp: now.toISOString(),
      expiredTrials: results.expiredTrials,
      expiredInvitations: results.expiredInvitations,
      warningsSent: results.warningsSent,
      errorsCount: results.errors.length
    });

    return new Response(JSON.stringify({
      success: true,
      timestamp: now.toISOString(),
      results
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    });

  } catch (error) {
    console.error('💥 Erreur fatale dans check-expirations:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    });
  }
});