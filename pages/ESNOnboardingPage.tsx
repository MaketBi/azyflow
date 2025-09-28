import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '../lib/auth';
import { CompanyService } from '../lib/services/companies';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { CheckCircle, Building, User, Mail, Phone, MapPin } from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Configuration du compte',
    description: 'Définissez votre mot de passe et vos informations personnelles',
    icon: <User className="h-6 w-6" />
  },
  {
    id: 2,
    title: 'Informations société',
    description: 'Complétez les détails de votre ESN',
    icon: <Building className="h-6 w-6" />
  },
  {
    id: 3,
    title: 'Finalisation',
    description: 'Validez votre configuration et accédez à votre dashboard',
    icon: <CheckCircle className="h-6 w-6" />
  }
];

export const ESNOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('company_id');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Account setup
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Step 2: Company setup
  const [companyData, setCompanyData] = useState({
    name: '',
    siret: '',
    address: '',
    city: '',
    postalCode: '',
    description: ''
  });

  useEffect(() => {
    if (!companyId) {
      setError('Lien d\'invitation invalide');
      return;
    }
    
    // Load company basic info if available
    loadCompanyInfo();
  }, [companyId]);

  const loadCompanyInfo = async () => {
    if (!companyId) return;
    
    try {
      // TODO: Load company basic info from invitation
      console.log('Loading company info for:', companyId);
    } catch (error) {
      console.error('Error loading company info:', error);
    }
  };

  const handleStep1Submit = async () => {
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Complete password setup via Supabase Auth
      console.log('Setting up password...');
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la configuration du compte');
    }

    setLoading(false);
  };

  const handleStep2Submit = async () => {
    if (!companyData.name.trim()) {
      setError('Le nom de société est requis');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Update company information
      console.log('Updating company info:', companyData);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la configuration de la société');
    }

    setLoading(false);
  };

  const handleFinalize = async () => {
    setLoading(true);
    setError('');

    try {
      // TODO: Finalize onboarding and redirect to dashboard
      console.log('Finalizing onboarding...');
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la finalisation');
    }

    setLoading(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Input
              label="Nom complet"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Prénom Nom"
            />

            <Input
              label="Téléphone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01 23 45 67 89"
            />

            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              helperText="Au moins 8 caractères"
            />

            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <Button
              onClick={handleStep1Submit}
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Configuration...' : 'Continuer'}
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Input
              label="Nom de la société"
              type="text"
              value={companyData.name}
              onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Ex: Digital Services SARL"
            />

            <Input
              label="SIRET"
              type="text"
              value={companyData.siret}
              onChange={(e) => setCompanyData(prev => ({ ...prev, siret: e.target.value }))}
              placeholder="12345678901234"
              helperText="14 chiffres"
            />

            <Input
              label="Adresse"
              type="text"
              value={companyData.address}
              onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 rue de la République"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Code postal"
                type="text"
                value={companyData.postalCode}
                onChange={(e) => setCompanyData(prev => ({ ...prev, postalCode: e.target.value }))}
                placeholder="75001"
              />

              <Input
                label="Ville"
                type="text"
                value={companyData.city}
                onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Paris"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description (optionnel)
              </label>
              <textarea
                value={companyData.description}
                onChange={(e) => setCompanyData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez l'activité de votre ESN..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                onClick={handleStep2Submit}
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Enregistrement...' : 'Continuer'}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Configuration terminée !
              </h3>
              <p className="text-gray-600">
                Votre compte ESN est maintenant configuré. Vous pouvez commencer à gérer vos freelancers.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-blue-900 mb-2">Prochaines étapes :</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Inviter vos freelancers</li>
                <li>• Configurer vos clients</li>
                <li>• Créer vos premiers contrats</li>
                <li>• Paramétrer la facturation</li>
              </ul>
            </div>

            <Button
              onClick={handleFinalize}
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Finalisation...' : 'Accéder à mon dashboard'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Lien invalide
            </h2>
            <p className="text-gray-600 mb-6">
              Ce lien d'invitation n'est pas valide ou a expiré.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-violet-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Bienvenue sur Azyflow
          </h1>
          <p className="text-gray-600 mt-2">
            Configurons votre compte ESN en quelques étapes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors
                  ${currentStep >= step.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="text-center">
                  <div className={`text-sm font-medium ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'}`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 max-w-32">
                    {step.description}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    absolute top-6 w-24 h-0.5 translate-x-16 transition-colors
                    ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {steps.find(s => s.id === currentStep)?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {renderStepContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};