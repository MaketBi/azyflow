import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { fullName, role, companyName, companyId } = await req.json()

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Initialize regular client to get user info
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    let finalCompanyId = companyId

    // If admin role, create company first
    if (role === 'admin' && companyName) {
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert({
          name: companyName,
          plan: 'standard'
        })
        .select()
        .single()

      if (companyError) {
        throw new Error(`Company creation error: ${companyError.message}`)
      }

      finalCompanyId = company.id
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: fullName,
        role: role,
        company_id: finalCompanyId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (profileError) {
      throw new Error(`Profile creation error: ${profileError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Profile setup completed successfully',
        profile: profile,
        companyId: finalCompanyId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Profile setup error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
