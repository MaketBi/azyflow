/**
 * Script pour mettre à jour le numéro de téléphone de l'admin
 * À exécuter dans la console du navigateur ou via un endpoint admin
 */

import { supabase } from './supabase';

export async function updateAdminPhone(adminEmail: string, phoneNumber: string) {
  try {
    console.log(`Mise à jour du numéro de téléphone pour l'admin: ${adminEmail}`);
    
    // Vérifier si l'admin existe
    const { data: adminUser, error: findError } = await supabase
      .from('users')
      .select('id, email, full_name, role, phone')
      .eq('email', adminEmail)
      .eq('role', 'admin')
      .single();

    if (findError || !adminUser) {
      console.error('Admin non trouvé:', findError);
      return false;
    }

    console.log('Admin trouvé:', adminUser);

    // Mettre à jour le numéro de téléphone
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({ phone: phoneNumber })
      .eq('id', adminUser.id)
      .select('id, email, full_name, phone')
      .single();

    if (updateError) {
      console.error('Erreur lors de la mise à jour:', updateError);
      return false;
    }

    console.log('Numéro de téléphone mis à jour avec succès:', updateResult);
    return true;

  } catch (error) {
    console.error('Erreur dans updateAdminPhone:', error);
    return false;
  }
}

// Fonction pour tester les notifications
export async function testNotificationSystem() {
  try {
    console.log('Test du système de notifications...');
    
    // Récupérer un admin avec son numéro de téléphone
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role')
      .eq('role', 'admin')
      .single();

    if (adminError || !admin) {
      console.error('Aucun admin trouvé:', adminError);
      return;
    }

    console.log('Admin configuré:', {
      name: admin.full_name,
      email: admin.email,
      phone: admin.phone,
      hasWhatsApp: !!admin.phone
    });

    if (admin.phone) {
      console.log('✅ WhatsApp configuré - Les notifications seront envoyées par email + WhatsApp');
    } else {
      console.log('⚠️  WhatsApp non configuré - Seules les notifications email seront envoyées');
      console.log('Pour activer WhatsApp, exécutez: updateAdminPhone("' + admin.email + '", "+33761604943")');
    }

  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

// Pour exécuter dans la console du navigateur :
// 1. updateAdminPhone('email@admin.com', '+33761604943')
// 2. testNotificationSystem()

console.log('Scripts disponibles:');
console.log('- updateAdminPhone(email, phone)');
console.log('- testNotificationSystem()');