// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface WhatsAppRequest {
  to: string;
  message: string;
}

interface NotificationRequest {
  type: 'email' | 'whatsapp';
  notification: EmailRequest | WhatsAppRequest;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { type, notification }: NotificationRequest = await req.json();
    
    console.log('Received notification request:', { type, notification });

    if (type === 'email') {
      return await handleEmailNotification(notification as EmailRequest, corsHeaders);
    } else if (type === 'whatsapp') {
      return await handleWhatsAppNotification(notification as WhatsAppRequest, corsHeaders);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid notification type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error processing notification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleEmailNotification(emailData: EmailRequest, corsHeaders: any) {
  try {
    // Configuration Resend (vous pouvez aussi utiliser SendGrid, Mailgun, etc.)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Envoyer email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailData.from || 'Azyflow <notifications@azyflow.com>',
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Resend API error:', errorData);
      throw new Error(`Resend API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        message: 'Email sent successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleWhatsAppNotification(whatsappData: WhatsAppRequest, corsHeaders: any) {
  try {
    // Configuration WasenderAPI
    const WASENDER_API_URL = Deno.env.get('WASENDER_API_URL') || 'https://www.wasenderapi.com/api/send-message';
    const WASENDER_API_KEY = Deno.env.get('WASENDER_API_KEY');
    
    if (!WASENDER_API_KEY) {
      console.log('WasenderAPI not configured, skipping WhatsApp notification');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'WhatsApp not configured, notification skipped' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Sending WhatsApp via WasenderAPI:', { 
      to: whatsappData.to, 
      messageLength: whatsappData.message.length 
    });

    // Envoyer message WhatsApp via WasenderAPI
    const response = await fetch(WASENDER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WASENDER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: whatsappData.to,
        text: whatsappData.message
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('WasenderAPI error:', {
        status: response.status,
        statusText: response.statusText,
        result
      });
      throw new Error(`WasenderAPI error: ${response.status} - ${result.message || result.error || 'Unknown error'}`);
    }

    console.log('WhatsApp message sent successfully via WasenderAPI:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.data?.msgId || result.msgId || 'sent',
        message: 'WhatsApp message sent successfully via WasenderAPI',
        details: result
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error sending WhatsApp message via WasenderAPI:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send WhatsApp message',
        service: 'WasenderAPI',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}