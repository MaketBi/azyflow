import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uxwgbsyeuhetokzfemqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4d2dic3lldWhldG9remZlbXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1Nzk3NzIsImV4cCI6MjA1MDE1NTc3Mn0.Y2McvJhbL5u2Dho6gFaBlRI7-tOHXJYZw2O-mjzh9zA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWithAuth() {
  console.log('�� Debug: Connexion admin...');
  
  // Connexion en tant qu'admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'mdiop99@gmail.com',
    password: 'password123' // Remplace par le bon mot de passe si différent
  });
  
  if (authError) {
    console.log('❌ Erreur auth:', authError.message);
    return;
  }
  
  console.log('✅ Connecté comme:', authData.user?.email);
  
  // Maintenant cherchons les freelancers
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('*');
    
  console.log('👥 Tous les users:', allUsers?.length);
  
  if (allUsers) {
    const freelancers = allUsers.filter(u => u.role === 'freelancer');
    console.log('💼 Freelancers trouvés:', freelancers.length);
    
    const companyId = 'ae3eabdc-dbb9-4ef8-b8f3-8d20e0c58b2d';
    const companyFreelancers = freelancers.filter(u => u.company_id === companyId);
    console.log('🏢 Freelancers de cette company:', companyFreelancers.length);
    
    console.log('📋 Détail freelancers:');
    freelancers.forEach(f => {
      console.log(`- ${f.full_name} (${f.email}) - company: ${f.company_id} - match: ${f.company_id === companyId}`);
    });
  }
}

debugWithAuth().catch(console.error);
