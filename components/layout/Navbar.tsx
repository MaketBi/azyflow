import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, User, Settings, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { AuthService } from '../../lib/auth';

interface NavbarProps {
  user: any;
  isAdmin: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ user, isAdmin }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  { name: 'Paiements Freelancers', href: '/admin/billing' },
  ] : [
  { name: 'Feuilles de temps (CRA)', href: '/freelancer/timesheets' },
  { name: 'Factures', href: '/freelancer/invoices' },
  { name: 'Contrats', href: '/freelancer/contracts' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* User Menu - Mobile : déplacé avant le logo pour être à droite */}
          <div className="flex items-center space-x-2 md:hidden order-3">
            <Link 
              to={isAdmin ? '/admin/profile' : '/freelancer/profile'}
              className="w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <User className="w-4 h-4 text-white" />
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          <div className="flex items-center order-1">
            {/* Logo */}
            <Link to={isAdmin ? '/admin/dashboard' : '/freelancer/timesheets'} className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Azyflow
              </span>
            </Link>

            {/* Navigation Links - Desktop */}
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

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center space-x-4 order-2">
            <Link 
              to={isAdmin ? '/admin/profile' : '/freelancer/profile'}
              className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user?.full_name}
              </span>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Section utilisateur mobile */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-center px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.full_name}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="w-full justify-start px-3 py-2 text-left"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};