import { supabase } from '../lib/supabase';

/**
 * Script de test pour la fonction de rappels CRA
 * À exécuter depuis la console du navigateur ou via Node.js
 */
export async function testTimesheetReminders() {
  try {
    console.log('🧪 Test de la fonction de rappels CRA...');
    
    const { data, error } = await supabase.functions.invoke('timesheet-reminders', {
      body: { test: true }
    });

    if (error) {
      console.error('❌ Erreur lors du test:', error);
      return { success: false, error };
    }

    console.log('✅ Test réussi:', data);
    return { success: true, data };
  } catch (err) {
    console.error('💥 Erreur fatale:', err);
    return { success: false, error: err };
  }
}

/**
 * Test de la fonction send-notification avec le bon format
 */
export async function testSendNotification() {
  try {
    console.log('📧 Test de la fonction send-notification...');
    
    // Test email
    const emailResult = await supabase.functions.invoke('send-notification', {
      body: {
        type: 'email',
        notification: {
          to: 'test@example.com',
          subject: 'Test Rappel CRA',
          html: 'Ceci est un test de rappel CRA.'
        }
      }
    });

    console.log('Email test result:', emailResult);

    // Test WhatsApp (si configuré)
    const whatsappResult = await supabase.functions.invoke('send-notification', {
      body: {
        type: 'whatsapp',
        notification: {
          to: '+33123456789',
          message: 'Test rappel CRA via WhatsApp'
        }
      }
    });

    console.log('WhatsApp test result:', whatsappResult);

    return { emailResult, whatsappResult };
  } catch (err) {
    console.error('💥 Erreur test notifications:', err);
    return { error: err };
  }
}

/**
 * Afficher les logs récents de la fonction
 */
export async function showRecentLogs() {
  console.log('📋 Pour voir les logs récents:');
  console.log('1. Aller sur https://supabase.com/dashboard/project/awcigvezoaxblkqmunmi/functions');
  console.log('2. Cliquer sur "timesheet-reminders"');
  console.log('3. Voir l\'onglet "Logs"');
}

// Export pour utilisation directe
if (typeof window !== 'undefined') {
  (window as any).testTimesheetReminders = testTimesheetReminders;
  (window as any).testSendNotification = testSendNotification;
  (window as any).showRecentLogs = showRecentLogs;
}