import React, { useState } from 'react';
import { AuthService } from '../lib/auth';
import { CompanyService } from '../lib/services/companies';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface ProfileSetupPageProps {
  userData: {
    id: string;
    email: string;
    metadata: any;
  };
  onSetupComplete: () => void;
}

export const ProfileSetupPage: React.FC<ProfileSetupPageProps> = ({
  userData,
  onSetupComplete
}) => {
  const [fullName, setFullName] = useState(userData.metadata?.full_name || '');
  const [role, setRole] = useState<'admin' | 'freelancer'>(userData.metadata?.role || 'freelancer');
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (role === 'freelancer') {
      loadCompanies();
    }
  }, [role]);

  const loadCompanies = async () => {
    const companiesData = await CompanyService.getAll();
    setCompanies(companiesData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Valider les données
      if (role === 'admin' && !companyName.trim()) {
        setError('Le nom de la société est requis');
        setLoading(false);
        return;
      }

      if (role === 'freelancer' && !companyId) {
        setError('Veuillez sélectionner une société');
        setLoading(false);
        return;
      }

      // Utiliser la Edge Function pour compléter le setup
      const { error } = await AuthService.completeProfileSetup({
        fullName: fullName.trim(),
        role,
        companyName: role === 'admin' ? companyName.trim() : undefined,
        companyId: role === 'freelancer' ? companyId : undefined,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Setup terminé avec succès
      onSetupComplete();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la configuration');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Configuration du profil
          </h1>
          <p className="text-gray-600 mt-2">Finalisons votre inscription</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations de profil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nom complet"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Votre nom complet"
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Rôle
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'freelancer')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="freelancer">Freelancer</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              {role === 'admin' ? (
                <Input
                  label="Nom de votre société"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="Ex: Mon Entreprise SARL"
                  helperText="Vous pourrez configurer votre société dans le Tableau de bord après cette étape"
                />
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Société
                  </label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionnez votre société</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Configuration...' : 'Finaliser mon profil'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
