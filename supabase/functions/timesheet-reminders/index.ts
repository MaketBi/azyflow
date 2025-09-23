import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentification service (clé d'API secrète)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Initialiser le client Supabase avec la service key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🚀 Démarrage du processus de rappels automatiques CRA');

    const currentDate = new Date();
    const targetMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const targetYear = currentDate.getFullYear();

    console.log(`📅 Traitement des rappels pour ${targetMonth}/${targetYear}`);

    // Récupérer tous les freelancers actifs avec leurs contrats
    const { data: freelancers, error: freelancersError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        phone,
        contracts!inner(
          id,
          client_id,
          company_id,
          start_date,
          end_date
        )
      `)
      .eq('role', 'freelancer')
      .eq('active', true);

    if (freelancersError) {
      throw new Error(`Erreur récupération freelancers: ${freelancersError.message}`);
    }

    console.log(`👥 ${freelancers?.length || 0} freelancers actifs trouvés`);

    let processed = 0;
    let sent = 0;
    let skipped = 0;
    let errors = 0;

    const missingTimesheets = [];

    // Analyser chaque freelancer
    for (const freelancer of freelancers || []) {
      try {
        // Vérifier s'il a des contrats actifs pour ce mois
        const hasActiveContract = freelancer.contracts?.some((contract: any) => {
          const startDate = new Date(contract.start_date);
          const endDate = contract.end_date ? new Date(contract.end_date) : null;
          const targetDate = new Date(targetYear, parseInt(targetMonth) - 1, 1);
          
          return startDate <= targetDate && (!endDate || endDate >= targetDate);
        });

        if (!hasActiveContract) continue;

        // Vérifier s'il a déjà soumis son CRA pour ce mois
        const { data: existingTimesheet, error: timesheetError } = await supabase
          .from('timesheets')
          .select('id, status')
          .eq('contract_id', freelancer.contracts[0].id)
          .eq('month', targetMonth)
          .eq('year', targetYear)
          .maybeSingle();

        if (timesheetError) {
          console.error(`❌ Erreur vérification CRA pour ${freelancer.full_name}:`, timesheetError);
          continue;
        }

        // Si aucun CRA ou CRA en draft seulement
        if (!existingTimesheet || existingTimesheet.status === 'draft') {
          // Récupérer les infos de dernier rappel
          const { data: lastReminder } = await supabase
            .from('timesheet_reminders')
            .select('last_reminder_date, reminder_count')
            .eq('user_id', freelancer.id)
            .eq('month', targetMonth)
            .eq('year', targetYear)
            .maybeSingle();

          const reminderData = {
            userId: freelancer.id,
            userName: freelancer.full_name,
            userEmail: freelancer.email,
            userPhone: freelancer.phone,
            month: targetMonth,
            year: targetYear,
            lastReminderDate: lastReminder?.last_reminder_date,
            reminderCount: lastReminder?.reminder_count || 0
          };

          missingTimesheets.push(reminderData);
        }
      } catch (error) {
        console.error(`❌ Erreur traitement freelancer ${freelancer.full_name}:`, error);
        errors++;
      }
    }

    console.log(`📋 ${missingTimesheets.length} CRA manquants identifiés`);

    // Traiter les rappels
    for (const reminderData of missingTimesheets) {
      processed++;

      try {
        // Déterminer si on doit envoyer un rappel
        const shouldSend = shouldSendReminder(reminderData, currentDate);

        if (!shouldSend) {
          skipped++;
          console.log(`⏭️  Rappel ignoré pour ${reminderData.userName} (trop tôt)`);
          continue;
        }

        // Envoyer le rappel
        await sendReminder(supabase, reminderData);
        sent++;
        console.log(`✅ Rappel envoyé à ${reminderData.userName}`);

      } catch (error) {
        console.error(`❌ Erreur envoi rappel pour ${reminderData.userName}:`, error);
        errors++;
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        processed,
        sent,
        skipped,
        errors
      },
      message: `Rappels terminés: ${sent} envoyés, ${skipped} ignorés, ${errors} erreurs`
    };

    console.log('🎉 Processus terminé:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Fonction pour déterminer si un rappel doit être envoyé
function shouldSendReminder(reminderData: any, currentDate: Date): boolean {
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Vérifier si on est dans la période de rappel (à partir du 20)
  if (currentDay < 20) return false;

  // Vérifier si c'est le bon mois/année ou le mois suivant
  const targetMonth = parseInt(reminderData.month);
  const targetYear = reminderData.year;
  
  const isCurrentMonth = (currentMonth === targetMonth && currentYear === targetYear);
  const isNextMonth = (currentMonth === targetMonth + 1 && currentYear === targetYear) || 
                     (targetMonth === 12 && currentMonth === 1 && currentYear === targetYear + 1);

  if (!isCurrentMonth && !isNextMonth) return false;

  // Premier rappel : dès le 20 du mois
  if (reminderData.reminderCount === 0) return true;

  // Rappels suivants : tous les 2 jours
  if (reminderData.lastReminderDate) {
    const lastReminderDate = new Date(reminderData.lastReminderDate);
    const daysSinceLastReminder = Math.floor((currentDate.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceLastReminder >= 2;
  }

  return true;
}

// Fonction pour envoyer un rappel
async function sendReminder(supabase: any, reminderData: any): Promise<void> {
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const monthName = monthNames[parseInt(reminderData.month) - 1];
  const isFirstReminder = reminderData.reminderCount === 0;
  const reminderType = isFirstReminder ? 'premier rappel' : `rappel n°${reminderData.reminderCount + 1}`;
  
  // Message personnalisé selon le nombre de rappels
  let urgencyLevel = '';
  if (reminderData.reminderCount >= 3) {
    urgencyLevel = ' ⚠️ URGENT - ';
  } else if (reminderData.reminderCount >= 1) {
    urgencyLevel = ' 🔔 ';
  }

  const emailSubject = `${urgencyLevel}Rappel CRA - ${monthName} ${reminderData.year}`;
  const message = isFirstReminder 
    ? `Bonjour ${reminderData.userName},\n\nNous vous rappelons qu'il est temps de soumettre votre CRA pour ${monthName} ${reminderData.year}.\n\nMerci de vous connecter à AzyFlow pour remplir et soumettre votre CRA.\n\nCordialement,\nL'équipe AzyFlow`
    : `Bonjour ${reminderData.userName},\n\n${reminderType.toUpperCase()} : Votre CRA pour ${monthName} ${reminderData.year} n'a toujours pas été soumis.\n\nMerci de vous connecter rapidement à AzyFlow pour régulariser votre situation.\n\nCordialement,\nL'équipe AzyFlow`;

  // Envoyer les notifications via la fonction existante
  try {
    // Vérifier les préférences de notification de l'utilisateur
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('timesheet_submitted')
      .eq('user_id', reminderData.userId)
      .maybeSingle();

    const shouldSendEmail = preferences?.timesheet_submitted?.email !== false;
    const shouldSendWhatsApp = preferences?.timesheet_submitted?.whatsapp !== false;

    // Envoyer email si autorisé et disponible
    if (shouldSendEmail && reminderData.userEmail) {
      const { error: emailError } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'email',
          notification: {
            to: reminderData.userEmail,
            subject: emailSubject,
            html: message.replace(/\n/g, '<br>')
          }
        }
      });

      if (emailError) {
        console.error('Erreur envoi email:', emailError);
      }
    }

    // Envoyer WhatsApp si autorisé et disponible
    if (shouldSendWhatsApp && reminderData.userPhone) {
      const { error: whatsappError } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'whatsapp',
          notification: {
            to: reminderData.userPhone,
            message: message
          }
        }
      });

      if (whatsappError) {
        console.error('Erreur envoi WhatsApp:', whatsappError);
      }
    }
  } catch (error) {
    console.error('Erreur invocation fonction notification:', error);
  }

  // Enregistrer le rappel
  const now = new Date().toISOString();
  const { error: recordError } = await supabase
    .from('timesheet_reminders')
    .upsert({
      user_id: reminderData.userId,
      month: reminderData.month,
      year: reminderData.year,
      last_reminder_date: now,
      reminder_count: reminderData.reminderCount + 1,
      updated_at: now
    }, {
      onConflict: 'user_id,month,year'
    });

  if (recordError) {
    console.error('Erreur enregistrement rappel:', recordError);
    throw recordError;
  }
}