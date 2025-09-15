import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { timesheetId } = await req.json()

    // Get timesheet with contract and client data
    const { data: timesheet, error: timesheetError } = await supabase
      .from('timesheets')
      .select(`
        *,
        contract:contracts(
          *,
          client:clients(*),
          user:users(*)
        )
      `)
      .eq('id', timesheetId)
      .single()

    if (timesheetError || !timesheet) {
      throw new Error('Timesheet not found')
    }

    // Calculate amount
    const amount = timesheet.worked_days * timesheet.contract.tjm

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now()}`

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        timesheet_id: timesheetId,
        client_id: timesheet.contract.client_id,
        company_id: timesheet.contract.company_id,
        number: invoiceNumber,
        amount,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      })
      .select()
      .single()

    if (invoiceError) {
      throw new Error('Error creating invoice')
    }

    return new Response(
      JSON.stringify({ 
        invoiceId: invoice.id,
        invoiceNumber,
        amount,
        pdfUrl: null // PDF generation would be implemented here
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})