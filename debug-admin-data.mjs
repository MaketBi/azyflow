import { supabase } from './lib/supabase.js';

// Test avec l'utilisateur admin spécifique
const testWithAdmin = async () => {
  console.log('🔍 Test Analytics avec admin mdiop99@gmail.com...\n');

  try {
    // Vérifier les données de l'admin
    const { data: admin } = await supabase
      .from('users')
      .select('id, email, company_id, role')
      .eq('email', 'mdiop99@gmail.com')
      .single();

    if (!admin) {
      console.log('❌ Admin non trouvé');
      return;
    }

    console.log('👤 Admin trouvé:', {
      id: admin.id,
      email: admin.email,
      company_id: admin.company_id,
      role: admin.role
    });

    // Vérifier les freelancers de cette entreprise
    const { data: freelancers } = await supabase
      .from('users')
      .select('id, full_name, email, company_id')
      .eq('role', 'freelance')
      .eq('company_id', admin.company_id);

    console.log(`\n👥 Freelancers trouvés (${freelancers?.length || 0}):`, freelancers);

    // Vérifier les contrats de cette entreprise
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, user_id, company_id, status, tjm')
      .eq('company_id', admin.company_id);

    console.log(`\n📄 Contrats trouvés (${contracts?.length || 0}):`, contracts);

    // Vérifier les factures de cette entreprise
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, amount, status, company_id, issue_date')
      .eq('company_id', admin.company_id);

    console.log(`\n💰 Factures trouvées (${invoices?.length || 0}):`, invoices);

    // Vérifier les timesheets liés aux contrats
    if (contracts && contracts.length > 0) {
      const contractIds = contracts.map(c => c.id);
      const { data: timesheets } = await supabase
        .from('timesheets')
        .select('id, contract_id, worked_days, status, month')
        .in('contract_id', contractIds);

      console.log(`\n⏰ Timesheets trouvés (${timesheets?.length || 0}):`, timesheets);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};

testWithAdmin();