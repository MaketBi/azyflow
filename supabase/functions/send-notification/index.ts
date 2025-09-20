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
        from: emailData.from || 'Azyflow <onboarding@resend.dev>',
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
        details: error.message 
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
    // Configuration WhatsApp Business API (Twilio, WhatsApp Cloud API, etc.)
    const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      console.log('WhatsApp not configured, skipping WhatsApp notification');
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

    // Envoyer message WhatsApp via Meta WhatsApp Business API
    const response = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: whatsappData.to.replace(/\D/g, ''), // Garder seulement les chiffres
        type: 'text',
        text: {
          body: whatsappData.message
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('WhatsApp API error:', errorData);
      throw new Error(`WhatsApp API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('WhatsApp message sent successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.messages?.[0]?.id,
        message: 'WhatsApp message sent successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send WhatsApp message',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}