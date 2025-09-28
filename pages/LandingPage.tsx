import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { ArrowRight, Users, Shield, TrendingUp, Mail } from 'lucide-react';
import { DemoRequestService, DemoRequestData } from '../lib/services/demo-requests';
import { NotificationContainer } from '../components/ui/Notification';
import { useNotifications } from '../hooks/useNotifications';

export const LandingPage: React.FC = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    freelancersCount: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { notifications, showSuccess, showError, dismissNotification } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const demoData: DemoRequestData = {
        companyName: formData.companyName,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone || undefined,
        freelancersCount: formData.freelancersCount,
        message: formData.message || undefined
      };

      const result = await DemoRequestService.submitDemoRequest(demoData);
      
      if (result.success) {
        setIsSubmitted(true);
        showSuccess('🎉 Demande de démo envoyée avec succès ! Nous vous recontacterons très prochainement.');
      } else {
        showError(`❌ Erreur : ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting demo request:', error);
      showError('⚠️ Erreur technique lors de l\'envoi de la demande. Veuillez réessayer.');
    }

    setLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Demande reçue !
            </h2>
            <p className="text-gray-600 mb-6">
              Merci pour votre intérêt pour Azyflow. Notre équipe vous contactera dans les plus brefs délais pour planifier votre démonstration personnalisée.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-violet-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Azyflow
              </span>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/login'}>
              Connexion
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                  La plateforme{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                    premium
                  </span>{' '}
                  pour les ESN
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Professionnalisez la gestion de vos freelancers avec Azyflow. 
                  Comptes rendus d'activité, facturation automatisée, conformité HNO - 
                  tout ce dont votre ESN a besoin.
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">100+</div>
                    <div className="text-sm text-gray-600">ESN clientes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-violet-600">5000+</div>
                    <div className="text-sm text-gray-600">Freelancers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">99.9%</div>
                    <div className="text-sm text-gray-600">Uptime</div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-green-500" />
                    <span className="text-gray-700">Conformité HNO et réglementation française</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-blue-500" />
                    <span className="text-gray-700">Gestion multi-freelancers simplifiée</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-6 w-6 text-violet-500" />
                    <span className="text-gray-700">Analytics et reporting avancés</span>
                  </div>
                </div>
              </div>

              {/* Demo Request Form */}
              <Card className="shadow-xl">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Demander une démonstration
                    </h2>
                    <p className="text-gray-600">
                      Découvrez comment Azyflow peut transformer votre ESN
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Nom de votre ESN"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      required
                      placeholder="Ex: Digital Services SARL"
                    />

                    <Input
                      label="Votre nom"
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => handleChange('contactName', e.target.value)}
                      required
                      placeholder="Prénom Nom"
                    />

                    <Input
                      label="Email professionnel"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                      placeholder="contact@votre-esn.com"
                    />

                    <Input
                      label="Téléphone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="01 23 45 67 89"
                    />

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre de freelancers
                      </label>
                      <select
                        value={formData.freelancersCount}
                        onChange={(e) => handleChange('freelancersCount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Sélectionnez</option>
                        <option value="1-10">1-10 freelancers</option>
                        <option value="10-50">10-50 freelancers</option>
                        <option value="50+">Plus de 50 freelancers</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Message (optionnel)
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        placeholder="Parlez-nous de vos besoins..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? 'Envoi...' : 'Demander ma démo gratuite'}
                      {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      Plateforme sur invitation uniquement. Démo personnalisée requise.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Azyflow. Plateforme premium pour ESN françaises.</p>
          </div>
        </div>
      </footer>
      
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};