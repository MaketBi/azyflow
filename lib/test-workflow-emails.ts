// Test script pour vérifier l'envoi d'emails workflow
// À exécuter dans la console du navigateur pour tester

import { WorkflowNotificationService } from './services/workflow-notifications';

/**
 * Données de test pour les notifications workflow
 */
const testData = {
  freelancerName: 'John Doe',
  freelancerEmail: 'mamadou@maketbi.com', // Utiliser votre email pour tester
  adminName: 'Marie Admin',
  clientName: 'Acme Corp',
  month: 9, // Septembre = mois 9
  year: 2025,
  workedDays: 20,
  amount: 8000,
  timesheetId: 'test-timesheet-123',
  invoiceId: 'test-invoice-456',
  invoiceNumber: 'INV-202509-001'
};

/**
 * Test des emails workflow
 */
export async function testWorkflowEmails() {
  console.log('🧪 Test des emails workflow...');

  try {
    // Test 1: CRA validé + Facture créée
    console.log('📧 Test 1: CRA validé + Facture créée');
    await WorkflowNotificationService.notifyTimesheetValidatedWithInvoice(testData);
    console.log('✅ Email "CRA validé + Facture créée" envoyé');

    // Attendre 2 secondes entre les emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Facture envoyée au client  
    console.log('📧 Test 2: Facture envoyée au client');
    await WorkflowNotificationService.notifyInvoiceSentToClient(testData);
    console.log('✅ Email "Facture envoyée" envoyé');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Paiement reçu du client
    console.log('📧 Test 3: Paiement reçu du client');
    await WorkflowNotificationService.notifyPaymentReceivedFromClient(testData);
    console.log('✅ Email "Paiement reçu" envoyé');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Freelancer payé - Workflow terminé
    console.log('📧 Test 4: Freelancer payé');
    await WorkflowNotificationService.notifyFreelancerPaid(testData);
    console.log('✅ Email "Freelancer payé" envoyé');

    console.log('🎉 Tous les tests d\'emails workflow sont terminés !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Pour exécuter dans la console:
// testWorkflowEmails();