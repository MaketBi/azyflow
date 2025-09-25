import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uxwgbsyeuhetokzfemqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4d2dic3lldWhldG9remZlbXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1Nzk3NzIsImV4cCI6MjA1MDE1NTc3Mn0.Y2McvJhbL5u2Dho6gFaBlRI7-tOHXJYZw2O-mjzh9zA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFreelancers() {
  console.log('🔍 Debug: Recherche de tous les freelancers...');
  
  // Tous les freelancers
  const { data: allFreelancers, error: allError } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'freelancer');
    
  console.log('📊 Tous les freelancers:', allFreelancers?.length);
  console.log('📋 Liste complète:', allFreelancers);
  
  // Freelancers avec le company_id spécifique
  const companyId = 'ae3eabdc-dbb9-4ef8-b8f3-8d20e0c58b2d';
  const { data: companyFreelancers, error: companyError } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'freelancer')
    .eq('company_id', companyId);
    
  console.log('🏢 Freelancers de la company', companyId + ':', companyFreelancers?.length);
  console.log('📋 Liste company:', companyFreelancers);
  
  // Vérifions aussi les contrats
  const { data: contracts, error: contractsError } = await supabase
    .from('contracts')
    .select(`
      *,
      user:user_id (full_name, email, role, company_id)
    `)
    .eq('company_id', companyId);
    
  console.log('📄 Contrats de la company:', contracts?.length);
  console.log('📋 Liste contrats:', contracts);
}

debugFreelancers().catch(console.error);
