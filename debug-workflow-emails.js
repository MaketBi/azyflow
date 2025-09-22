// Script de debug pour tester les notifications workflow
// À copier-coller dans la console du navigateur

async function testWorkflowNotifications() {
  console.log('🔍 Test des notifications workflow...');
  
  try {
    // Test 1: Vérifier que WorkflowDataHelper est accessible
    const { WorkflowDataHelper } = await import('./lib/services/workflow-data-helper.js');
    console.log('✅ WorkflowDataHelper importé avec succès');
    
    // Test 2: Données de test
    const testData = {
      freelancerName: 'Test Freelancer',
      freelancerEmail: 'mamadou@maketbi.com', // Votre email pour recevoir le test
      adminName: 'Admin Test',
      clientName: 'Client Test',
      month: 9,
      year: 2025,
      workedDays: 20,
      amount: 8000,
      timesheetId: 'test-123',
      invoiceId: 'test-invoice-456',
      invoiceNumber: 'INV-TEST-001'
    };
    
    console.log('📧 Test d\'envoi direct...');
    
    // Test 3: Import du service de notifications
    const { WorkflowNotificationService } = await import('./lib/services/workflow-notifications.js');
    console.log('✅ WorkflowNotificationService importé');
    
    // Test 4: Envoi d'un email de test
    await WorkflowNotificationService.notifyInvoiceSentToClient(testData);
    console.log('✅ Email de test envoyé ! Vérifiez votre boîte mail.');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Détails:', error.stack);
  }
}

// Exécuter le test
testWorkflowNotifications();