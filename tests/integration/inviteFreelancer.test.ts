import { supabase } from '../../lib/supabase';
import { inviteFreelancer } from '../../lib/services/users';

describe('inviteFreelancer workflow', () => {
  const adminEmail = 'admin-invite-test@example.com';
  const adminPassword = 'TestPassword123!';
  const freelancerEmail = 'freelancer-invite-test@example.com';
  const freelancerPassword = 'FreelancerPassword123!';
  const freelancerName = 'Jean Testeur';
  let adminAccessToken: string;
  let adminCompanyId: string;
  let invitedUserId: string;

  beforeAll(async () => {
    // Create admin user if not exists
    await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
    });
    // Sign in as admin
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    if (error || !data.session) throw new Error('Admin login failed');
    adminAccessToken = data.session.access_token;

    // Get admin's company_id
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('email', adminEmail)
      .single();
    if (userError || !userRow) throw new Error('Admin user not found');
    adminCompanyId = userRow.company_id;
  });

  afterAll(async () => {
    // Cleanup: delete test users
    await supabase.from('users').delete().eq('email', freelancerEmail);
    await supabase.from('users').delete().eq('email', adminEmail);
    // Optionally: delete auth users if needed
  });

  it('should invite a freelancer and activate on first login', async () => {
    // Invite freelancer via Edge Function
    const inviteResult = await inviteFreelancer(
      freelancerEmail,
      freelancerName,
      adminAccessToken
    );
    expect(inviteResult.success).toBe(true);

    // Check that the user row exists, inactive, correct company_id
    const { data: userRow, error } = await supabase
      .from('users')
      .select('id, email, role, active, company_id')
      .eq('email', freelancerEmail)
      .single();
    expect(error).toBeNull();
    expect(userRow).toBeTruthy();
    if (!userRow) throw new Error('User row is null');
    expect(userRow.role).toBe('freelancer');
    expect(userRow.active).toBe(false);
    expect(userRow.company_id).toBe(adminCompanyId);
    invitedUserId = userRow.id;

    // Simulate first login for freelancer (sign up)
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: freelancerEmail,
      password: freelancerPassword,
    });
    expect(signupError).toBeNull();
    expect(signupData.user).toBeTruthy();

    // Wait for trigger to activate user (may need a short delay)
    await new Promise(res => setTimeout(res, 2000));

    // Check that user is now active
    const { data: updatedUser, error: updatedError } = await supabase
      .from('users')
      .select('active')
      .eq('id', invitedUserId)
      .single();
    expect(updatedError).toBeNull();
    expect(updatedUser).toBeTruthy();
    expect(updatedUser && updatedUser.active).toBe(true);
  });
});
