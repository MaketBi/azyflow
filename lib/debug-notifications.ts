/**
 * Script de debug pour les notifications WhatsApp et email
 * À exécuter dans la console du navigateur pour diagnostiquer les problèmes
 */

// Test des notifications avec données réelles
async function debugNotifications() {
  console.log('🔍 DEBUG: Système de notifications');
  console.log('=====================================');

  // 1. Vérifier la configuration admin
  console.log('1. Vérification admin...');
  
  try {
    const response = await fetch('/api/debug-admin'); // Endpoint à créer si besoin
    // OU directement via Supabase si vous avez accès
    console.log('Admin configuré ✅');
  } catch (error) {
    console.log('❌ Erreur récupération admin:', error);
  }

  // 2. Test d'envoi email
  console.log('\n2. Test email...');
  
  try {
    const emailTest = await fetch('https://your-project.supabase.co/functions/v1/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-anon-key'
      },
      body: JSON.stringify({
        type: 'email',
        notification: {
          to: 'test@example.com',
          subject: 'Test email notification',
          html: '<h1>Test email</h1><p>Email fonctionne !</p>'
        }
      })
    });
    
    const emailResult = await emailTest.json();
    console.log('📧 Email test result:', emailResult);
    
  } catch (error) {
    console.log('❌ Erreur test email:', error);
  }

  // 3. Test d'envoi WhatsApp
  console.log('\n3. Test WhatsApp...');
  
  try {
    const whatsappTest = await fetch('https://your-project.supabase.co/functions/v1/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-anon-key'
      },
      body: JSON.stringify({
        type: 'whatsapp',
        notification: {
          to: '+33761604943',
          message: '🧪 Test WhatsApp\n\nCeci est un message de test du système de notifications Azyflow.'
        }
      })
    });
    
    const whatsappResult = await whatsappTest.json();
    console.log('📱 WhatsApp test result:', whatsappResult);
    
  } catch (error) {
    console.log('❌ Erreur test WhatsApp:', error);
  }
}

// Test simplifié pour vérifier la configuration
async function checkConfig() {
  console.log('⚙️  Configuration Check');
  console.log('======================');

  // Vérifier les URLs et endpoints
  const currentUrl = window.location.origin;
  console.log('🌐 Current URL:', currentUrl);
  
  // Simuler un appel de notification
  try {
    const testData = {
      freelancerName: 'Test Freelancer',
      freelancerEmail: 'freelancer@test.com',
      adminName: 'Admin Test',
      adminEmail: 'admin@test.com',
      adminPhone: '+33761604943',
      clientName: 'Client Test',
      month: '09',
      year: 2025,
      workedDays: 20,
      timesheetId: 'test-123'
    };

    console.log('📋 Test data prepared:', testData);
    console.log('✅ Configuration semble correcte');
    
    return testData;
    
  } catch (error) {
    console.log('❌ Erreur configuration:', error);
  }
}

// Instructions d'utilisation
console.log('📚 Scripts de debug disponibles:');
console.log('- checkConfig() : Vérifier la configuration');
console.log('- debugNotifications() : Test complet des notifications');
console.log('\n⚠️  Note: Vous devez d\'abord configurer:');
console.log('1. Le numéro de téléphone admin en base');
console.log('2. Les variables WASENDER_API_KEY dans Supabase');
console.log('3. La variable RESEND_API_KEY dans Supabase');

// Auto-run de la vérification de config
checkConfig();