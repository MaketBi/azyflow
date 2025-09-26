import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthService, UserProfile } from '../lib/auth';
import { Navbar } from '../components/layout/Navbar';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { TimesheetsPage } from '../pages/freelancer/TimesheetsPage';
import { FreelancerContractsPage } from '../pages/freelancer/ContractsPage';
import AdminTimesheetsPage from '../pages/admin/timesheets';
import AdminFreelancersPage from '../pages/admin/freelancers';
import ClientsPage from '../pages/admin/clients';
import { ContractsPage } from '../pages/admin/ContractsPage';
import ClientsContractsPage from '../pages/admin/ClientsContractsPage';
import FreelancersTimesheetsPage from '../pages/admin/FreelancersTimesheetsPage';
import FreelancerProfile from '../pages/admin/FreelancerProfile';
import AdminInvoicesPage from '../pages/admin/invoices';
import FreelancerInvoicesPage from '../pages/freelancer/invoices';
import { BillingManagementPage } from '../pages/admin/BillingManagementPage';

// ✅ Ajout des routes auth
import AuthCallback from '../pages/auth/callback';
import SetPasswordPage from '../pages/auth/set-password';
import { RegistrationSuccessPage } from '../pages/auth/RegistrationSuccessPage';

// ✅ Ajout route profil
import ProfilePage from '../pages/ProfilePage';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const profile = await AuthService.getCurrentUserProfile();
      setUser(profile);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && <Navbar user={user} isAdmin={user.role === 'admin'} />}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* ✅ Ajout simple des routes auth */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/set-password" element={<SetPasswordPage />} />
            <Route path="/auth/registration-success" element={<RegistrationSuccessPage />} />
           


            {!user ? (
              <Route path="*" element={<LoginPage />} />
            ) : user.role === 'admin' ? (
              <>
                <Route path="/admin/dashboard" element={<DashboardPage />} />
                <Route path="/admin/timesheets" element={<AdminTimesheetsPage />} />
                <Route path="/admin/freelancers" element={<AdminFreelancersPage />} />
                <Route path="/admin/freelancers-timesheets" element={<FreelancersTimesheetsPage />} />
                <Route path="/admin/clients" element={<ClientsPage />} />
                <Route path="/admin/contracts" element={<ContractsPage />} />
                <Route path="/admin/clients-contracts" element={<ClientsContractsPage />} />
                <Route path="/admin/invoices" element={<AdminInvoicesPage />} />
                <Route path="/admin/billing" element={<BillingManagementPage />} />
                <Route path="/admin/freelancers/:id" element={<FreelancerProfile />} />
                <Route path="/admin/profile" element={<ProfilePage />} />
                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              </>
            ) : (
              <>
                <Route path="/freelancer/timesheets" element={<TimesheetsPage />} />
                <Route path="/freelancer/contracts" element={<FreelancerContractsPage />} />
                <Route path="/freelancer/invoices" element={<FreelancerInvoicesPage />} />
                <Route path="/freelancer/profile" element={<ProfilePage />} />
                <Route path="/" element={<Navigate to="/freelancer/timesheets" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
