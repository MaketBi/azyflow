import { supabase } from '../lib/supabase.js';

console.log('🔧 Insertion des données de test pour les analytics...\n');

async function insertTestData() {
  try {
    // 1. Créer des utilisateurs de test
    console.log('👥 Création des utilisateurs de test...');
    
    const { data: freelancers, error: freelancerError } = await supabase
      .from('users')
      .insert([
        { email: 'jean.dupont@freelance.com', role: 'freelance', full_name: 'Jean Dupont' },
        { email: 'marie.martin@freelance.com', role: 'freelance', full_name: 'Marie Martin' },
        { email: 'pierre.durand@freelance.com', role: 'freelance', full_name: 'Pierre Durand' }
      ])
      .select();

    if (freelancerError) throw new Error(`Erreur freelancers: ${freelancerError.message}`);

    const { data: companies, error: companyError } = await supabase
      .from('users')
      .insert([
        { email: 'tech-corp@example.com', role: 'company', full_name: 'Tech Corp' },
        { email: 'digital-solutions@example.com', role: 'company', full_name: 'Digital Solutions' }
      ])
      .select();

    if (companyError) throw new Error(`Erreur companies: ${companyError.message}`);

    console.log(`✅ ${freelancers?.length || 0} freelancers créés`);
    console.log(`✅ ${companies?.length || 0} entreprises créées`);

    // 2. Créer des contrats
    console.log('\n📄 Création des contrats...');
    
    const contracts = [];
    for (let i = 0; i < freelancers?.length && i < companies?.length; i++) {
      contracts.push({
        freelance_id: freelancers[i].id,
        company_id: companies[i % companies.length].id,
        title: `Mission ${freelancers[i].full_name}`,
        description: `Développement web pour ${companies[i % companies.length].full_name}`,
        hourly_rate: 400 + Math.random() * 200,
        status: 'active',
        start_date: new Date('2024-01-01').toISOString(),
        end_date: new Date('2024-12-31').toISOString(),
        payment_terms: JSON.stringify({ days: 30, type: 'end_of_month' }),
        payment_terms_type: 'end_of_month',
        vat_applicable: true,
        vat_rate: 0.20
      });
    }

    const { data: createdContracts, error: contractError } = await supabase
      .from('contracts')
      .insert(contracts)
      .select();

    if (contractError) throw new Error(`Erreur contrats: ${contractError.message}`);
    console.log(`✅ ${createdContracts?.length || 0} contrats créés`);

    // 3. Créer des timesheets
    console.log('\n⏰ Création des timesheets...');
    
    const timesheets = [];
    for (const contract of createdContracts || []) {
      // Créer 6 mois de timesheets
      for (let month = 0; month < 6; month++) {
        const date = new Date('2024-01-01');
        date.setMonth(date.getMonth() + month);
        
        timesheets.push({
          contract_id: contract.id,
          month: date.toISOString().substring(0, 7), // YYYY-MM
          days_worked: 15 + Math.random() * 7, // 15-22 jours
          status: Math.random() > 0.7 ? 'submitted' : (Math.random() > 0.3 ? 'approved' : 'rejected'),
          submitted_at: date.toISOString(),
          created_at: date.toISOString(),
          updated_at: date.toISOString()
        });
      }
    }

    const { data: createdTimesheets, error: timesheetError } = await supabase
      .from('timesheets')
      .insert(timesheets)
      .select();

    if (timesheetError) throw new Error(`Erreur timesheets: ${timesheetError.message}`);
    console.log(`✅ ${createdTimesheets?.length || 0} timesheets créées`);

    // 4. Créer des factures
    console.log('\n💰 Création des factures...');
    
    const invoices = [];
    for (const contract of createdContracts || []) {
      // Créer 4 factures par contrat
      for (let i = 0; i < 4; i++) {
        const baseAmount = 3000 + Math.random() * 4000;
        const amountExcludingTax = baseAmount / 1.20;
        const vatAmount = baseAmount - amountExcludingTax;
        
        const generatedDate = new Date('2024-01-01');
        generatedDate.setMonth(generatedDate.getMonth() + i * 2);
        
        const dueDate = new Date(generatedDate);
        dueDate.setMonth(dueDate.getMonth() + 1);
        dueDate.setDate(new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate());

        invoices.push({
          contract_id: contract.id,
          number: `INV-2024-${String(i + 1).padStart(4, '0')}-${contract.id.substring(0, 8)}`,
          amount: Math.round(baseAmount * 100) / 100,
          amount_excluding_tax: Math.round(amountExcludingTax * 100) / 100,
          vat_amount: Math.round(vatAmount * 100) / 100,
          status: Math.random() > 0.3 ? 'paid' : 'pending',
          generated_date: generatedDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          month_year: generatedDate.toISOString().substring(0, 7)
        });
      }
    }

    const { data: createdInvoices, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoices)
      .select();

    if (invoiceError) throw new Error(`Erreur factures: ${invoiceError.message}`);
    console.log(`✅ ${createdInvoices?.length || 0} factures créées`);

    console.log('\n🎉 Données de test créées avec succès !');
    console.log(`
📊 Résumé:
- Freelancers: ${freelancers?.length || 0}
- Entreprises: ${companies?.length || 0}  
- Contrats: ${createdContracts?.length || 0}
- Timesheets: ${createdTimesheets?.length || 0}
- Factures: ${createdInvoices?.length || 0}
    `);

  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error);
  }
}

insertTestData();