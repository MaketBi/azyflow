import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, User, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { AuthService } from '../../lib/auth';

interface NavbarProps {
  user: any;
  isAdmin: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ user, isAdmin }) => {
  const location = useLocation();

  const handleSignOut = async () => {
    await AuthService.signOut();
    window.location.reload();
  };

  const navigation = isAdmin ? [
  { name: 'Tableau de bord', href: '/admin/dashboard' },
  { name: 'Freelances', href: '/admin/freelancers' },
  { name: 'Clients', href: '/admin/clients' },
  { name: 'Contrats', href: '/admin/contracts' },
  { name: 'Feuilles de temps (CRA)', href: '/admin/timesheets' },
  { name: 'Factures', href: '/admin/invoices' },
  ] : [
  { name: 'Feuilles de temps (CRA)', href: '/freelancer/timesheets' },
  { name: 'Factures', href: '/freelancer/invoices' },
  { name: 'Contrats', href: '/freelancer/contracts' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link to={isAdmin ? '/admin/dashboard' : '/freelancer/timesheets'} className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Azyflow
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user?.full_name}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};