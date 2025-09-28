// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// URL de redirection pour l'onboarding ESN
const frontendUrl = Deno.env.get("VITE_REDIRECT_URL") || "http://localhost:5173";

serve(async (req) => {
  // --- CORS ---
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, x-supabase-auth-token"
      }
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // --- Parse du body ---
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({
      error: "Invalid JSON body"
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  const { email, company_name, siret, estimated_freelancers } = body;

  if (!email || !company_name) {
    return new Response(JSON.stringify({
      error: "Missing email or company_name"
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // --- Auth: vérifier que l'utilisateur est Super Admin ---
  const authHeader = req.headers.get("authorization") || "";
  const jwt = authHeader.replace("Bearer ", "");

  if (!jwt) {
    return new Response(JSON.stringify({
      error: "Missing authorization header"
    }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // --- Vérifier que l'utilisateur existe et est Super Admin ---
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({
      error: "Invalid token"
    }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  const superAdminId = userData.user.id;

  // --- Vérifier le rôle Super Admin ---
  const { data: userRole, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", superAdminId)
    .single();

  if (roleError || userRole?.role !== "super_admin") {
    return new Response(JSON.stringify({
      error: "Access denied: Super Admin role required"
    }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // --- Créer la company ESN ---
  const { data: companyData, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: company_name,
      siret: siret || null,
      estimated_freelancers: estimated_freelancers || 5,
      contact_email: email,
      invited_by: superAdminId,
      invited_at: new Date().toISOString(),
      status: "pending", // Statut pending en attente d'acceptation
      plan: "trial" // Plan d'essai pour les ESN invitées - 30 jours par défaut
    })
    .select("id")
    .single();

  if (companyError || !companyData) {
    console.error("invite-esn: Company creation error:", companyError);
    return new Response(JSON.stringify({
      error: "Failed to create company: " + companyError?.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  const companyId = companyData.id;

  // --- Créer l'invitation ESN avec expiration ---
  const invitationToken = crypto.randomUUID();
  const invitationExpiresAt = new Date();
  invitationExpiresAt.setDate(invitationExpiresAt.getDate() + 7); // 7 jours pour accepter l'invitation

  const { data: invitationData, error: invitationError } = await supabase
    .from("company_invitations")
    .insert({
      company_name: company_name,
      email: email,
      siret: siret || null,
      estimated_freelancers: estimated_freelancers || null,
      invited_by: superAdminId,
      invitation_token: invitationToken,
      expires_at: invitationExpiresAt.toISOString(),
      status: "pending"
    })
    .select("id")
    .single();

  // --- Créer le lien d'onboarding ESN (Supabase Auth gérera le token) ---
  const onboardingLink = `${frontendUrl}/esn/onboarding?company_id=${companyId}`;

  // --- Préparer les métadonnées pour l'invitation ---
  const metadata = {
    role: "admin", // L'ESN recevra un rôle admin de sa company
    full_name: `Admin ${company_name}`,
    company_id: companyId,
    company_name: company_name,
    active: false, // Sera activé après validation de l'email
    invitation_type: "esn_onboarding"
  };

  // --- Envoyer l'invitation par email (Supabase Auth gère le token et l'expiration) ---
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: metadata,
    options: {
      redirectTo: onboardingLink
    }
  });

  if (inviteError || !inviteData?.user) {
    console.error("invite-esn: inviteUserByEmail error:", inviteError);
    
    // Nettoyer la company créée en cas d'erreur
    await supabase.from("companies").delete().eq("id", companyId);
    
    return new Response(JSON.stringify({
      error: inviteError?.message || "ESN invitation failed"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // --- Log de l'activité Super Admin (pour audit) ---
  await supabase.from("users").insert({
    // Note: Ceci créera un log basique dans users, en attendant la vraie table super_admin_activities
    id: crypto.randomUUID(),
    email: `log-${Date.now()}@audit.local`,
    full_name: `[AUDIT] ESN invitation sent to ${email} for ${company_name}`,
    company_id: companyId,
    role: "audit_log",
    active: false
  }).select().single();

  console.log(`[AUDIT] ESN invitation sent: ${email} -> ${company_name} (${companyId})`);

  return new Response(JSON.stringify({
    success: true,
    invitation_id: companyId,
    onboarding_link: onboardingLink,
    company_created: {
      id: companyId,
      name: company_name
    },
    user: inviteData.user
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
});