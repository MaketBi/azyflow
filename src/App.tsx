import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthService, UserProfile } from '../lib/auth';
import { Navbar } from '../components/layout/Navbar';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { TimesheetsPage } from '../pages/freelancer/TimesheetsPage';
import AdminTimesheetsPage from '../pages/admin/timesheets';
import AdminFreelancersPage from '../pages/admin/freelancers';
import ClientsPage from '../pages/admin/clients';
import FreelancerProfile from '../pages/admin/FreelancerProfile';

// ✅ Ajout des routes auth
import AuthCallback from '../pages/auth/callback';
import SetPasswordPage from '../pages/auth/set-password';

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
           


            {!user ? (
              <Route path="*" element={<LoginPage />} />
            ) : user.role === 'admin' ? (
              <>
                <Route path="/admin/dashboard" element={<DashboardPage />} />
                <Route path="/admin/timesheets" element={<AdminTimesheetsPage />} />
                <Route path="/admin/freelancers" element={<AdminFreelancersPage />} />
                <Route path="/admin/clients" element={<ClientsPage />} />
                 <Route path="/admin/freelancers/:id" element={<FreelancerProfile />} />
                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              </>
            ) : (
              <>
                <Route path="/freelancer/timesheets" element={<TimesheetsPage />} />
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
