// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
// ✅ URL de redirection (différente en dev/prod)
const redirectUrl = Deno.env.get("VITE_REDIRECT_URL");
serve(async (req)=>{
  // --- CORS ---
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type"
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
  } catch  {
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
  const { email, fullName, phone } = body;
  if (!email || !fullName) {
    return new Response(JSON.stringify({
      error: "Missing email or fullName"
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  
  // Fonction de normalisation du numéro de téléphone
  const normalizePhoneNumber = (phone: string): string => {
    if (!phone || !phone.trim()) return "";
    
    const cleanPhone = phone.replace(/[\s\.\-]/g, '');
    
    // Si ça commence par 0 et fait 10 chiffres = numéro français
    if (/^0[1-9]\d{8}$/.test(cleanPhone)) {
      return '+33' + cleanPhone.substring(1);
    }
    
    // Si ça commence déjà par + = format international
    if (cleanPhone.startsWith('+')) {
      return cleanPhone;
    }
    
    // Si c'est 9 chiffres commençant par 1-9 = numéro français sans le 0
    if (/^[1-9]\d{8}$/.test(cleanPhone)) {
      return '+33' + cleanPhone;
    }
    
    return cleanPhone;
  };

  // Validation et normalisation du numéro de téléphone si fourni
  let normalizedPhone = "";
  if (phone && phone.trim()) {
    normalizedPhone = normalizePhoneNumber(phone);
    
    // Validation du format normalisé
    const phoneRegex = /^\+\d{1,3}\d{6,14}$/;
    const frenchPhoneRegex = /^\+33[1-9]\d{8}$/;
    
    if (!phoneRegex.test(normalizedPhone) && !frenchPhoneRegex.test(normalizedPhone)) {
      return new Response(JSON.stringify({
        error: "Invalid phone number format"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
  // --- Auth: extract JWT ---
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
  // --- Vérifier que l'admin existe ---
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({
      error: "Invalid admin token"
    }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  const adminId = userData.user.id;
  // --- Récupérer la compagnie de l’admin ---
  const { data: userRow, error: userRowError } = await supabase.from("users").select("company_id").eq("id", adminId).single();
  if (userRowError || !userRow?.company_id) {
    return new Response(JSON.stringify({
      error: "Could not get company_id for admin"
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  const companyId = userRow.company_id;
  // --- Récupérer le nom de la compagnie ---
  const { data: companyData, error: companyError } = await supabase.from("companies").select("name").eq("id", companyId).single();
  if (companyError || !companyData?.name) {
    return new Response(JSON.stringify({
      error: "Could not get company_name for admin"
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  const companyName = companyData.name;
  // --- Préparer les métadonnées ---
  const metadata = {
    role: "freelancer",
    full_name: fullName,
    phone: normalizedPhone || null, // Utilise le numéro normalisé
    company_id: String(companyId),
    company_name: companyName,
    active: false
  };
  // --- Envoyer l’invitation ---
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: metadata,
    options: {
      redirectTo: redirectUrl
    }
  });
  if (inviteError || !inviteData?.user) {
    console.error("invite-freelancer: inviteUserByEmail error:", inviteError);
    return new Response(JSON.stringify({
      error: inviteError?.message || "Invitation failed"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  return new Response(JSON.stringify({
    success: true,
    user: inviteData.user
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
});
