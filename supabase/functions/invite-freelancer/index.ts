// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
  const { email, fullName } = body;
  if (!email || !fullName) {
    return new Response(JSON.stringify({ error: "Missing email or fullName" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Auth: extract JWT
  const authHeader = req.headers.get("authorization") || "";
  const jwt = authHeader.replace("Bearer ", "");
  console.log("invite-freelancer: Authorization header (truncated):", authHeader.slice(0, 12) + "...");
  if (!jwt) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Get admin user info from JWT
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  console.log("invite-freelancer: supabase.auth.getUser() result:", { data: userData, error: userError });
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid admin token", details: "check logs" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
  const adminId = userData.user.id;

  // Fetch company_id from public.users
  const { data: userRow, error: userRowError } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", adminId)
    .single();
  console.log("invite-freelancer: public.users query result:", { data: userRow, error: userRowError });
  if (userRowError || !userRow?.company_id) {
    console.log("invite-freelancer: Error fetching company_id:", userRowError);
    return new Response(JSON.stringify({ error: "Could not get company_id for admin", details: "check logs" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
  const companyId = userRow.company_id;

  // Fetch company_name from companies
  const { data: companyData, error: companyError } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .single();
  console.log("invite-freelancer: companies query result:", { data: companyData, error: companyError });
  if (companyError || !companyData?.name) {
    console.log("invite-freelancer: Error fetching company_name:", companyError);
    return new Response(JSON.stringify({ error: "Could not get company_name for admin", details: "check logs" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
  const companyName = companyData.name;

  // Invite user via Auth Admin API (metadata will feed public.users via trigger)
  const metadata = {
    role: "freelancer",
    full_name: fullName,
    company_id: String(companyId), // force as string
    company_name: companyName,
    active: false,
  };

  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: metadata,
  });

  if (inviteError || !inviteData?.user) {
    console.log("invite-freelancer: inviteUserByEmail error:", inviteError);
    return new Response(JSON.stringify({ error: inviteError?.message || "Invitation failed", details: "check logs" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  return new Response(JSON.stringify({ success: true, user: inviteData.user }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});