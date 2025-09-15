import React, { useState, useEffect } from 'react';
import SuccessModal from '../components/SuccessModal';
import { AuthService } from '../lib/auth';
import { CompanyService } from '../lib/services/companies';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'freelancer'>('freelancer');
  const [companyName, setCompanyName] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignUp || role !== 'freelancer') {
      setCompanies([]);
      return;
    }
    CompanyService.getAll()
      .then((data) => {
        setCompanies(data);
      })
      .catch((err) => {
        setError(`Erreur chargement sociétés: ${err.message || err}`);
      });
  }, [isSignUp, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (isSignUp) {
      if (!fullName.trim()) {
        setError('Le nom complet est requis');
        setLoading(false);
        return;
      }
      if (!companyName.trim()) {
        setError(role === 'admin' ? 'Le nom de votre société est requis' : 'Veuillez sélectionner une société');
        setLoading(false);
        return;
      }
      const { error } = await AuthService.signUp(email, password, {
        fullName: fullName.trim(),
        role,
        companyId: role === 'freelancer' ? companyName.trim() : undefined,
        companyName: role === 'admin' ? companyName.trim() : '',
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte.');
        setShowSuccess(true);
        setEmail('');
        setPassword('');
        setFullName('');
        setCompanyName('');
      }
    } else {
      const { error } = await AuthService.signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        window.location.reload();
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Azyflow
          </h1>
          <p className="text-gray-600 mt-2">
            {isSignUp ? 'Créez votre compte' : 'Connectez-vous à votre compte'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? 'Créer un compte' : 'Bon retour'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <Input
                    label="Nom complet"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Entrez votre nom complet"
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Rôle
                    </label>
                    <select
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value as 'admin' | 'freelancer');
                        setCompanyName('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="freelancer">Freelance</option>
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
                      helperText="En tant qu'administrateur, vous créez une nouvelle société"
                    />
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Société
                      </label>
                      <select
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
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
                      <p className="text-sm text-gray-500">
                        Choisissez la société pour laquelle vous travaillez
                      </p>
                    </div>
                  )}
                </>
              )}
              <Input
                label="Adresse e-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Entrez votre email"
              />
              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Entrez votre mot de passe"
              />
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {/* SuccessModal remplace l'ancien message de succès */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading 
                  ? (isSignUp ? 'Création du compte...' : 'Connexion...') 
                  : (isSignUp ? 'Créer le compte' : 'Se connecter')
                }
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setSuccess('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {isSignUp 
                  ? 'Vous avez déjà un compte ? Connectez-vous' 
                  : 'Pas encore de compte ? Créer un compte'
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
      <SuccessModal
        isOpen={showSuccess}
        message="Vérifiez votre email pour confirmer votre compte."
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
};