import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Save, 
  ArrowLeft, 
  Bell, 
  Shield, 
  Calendar,
  Settings,
  Key
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ChangePasswordModal } from '../components/profile/ChangePasswordModal';
import { NotificationModal } from '../components/profile/NotificationModal';
import { AuthService } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company_id?: string;
  created_at: string;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });
  
  // États pour les modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await AuthService.getCurrentUserProfile();
      if (userProfile) {
        setProfile(userProfile);
        setFormData({
          full_name: userProfile.full_name || '',
          email: userProfile.email || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      // Mise à jour du nom
      if (formData.full_name !== profile?.full_name && profile?.id) {
        const { error: userError } = await supabase
          .from('users')
          .update({ full_name: formData.full_name })
          .eq('id', profile.id);

        if (userError) {
          throw new Error('Erreur lors de la mise à jour du profil');
        }

        // Mettre à jour les métadonnées Supabase Auth
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: formData.full_name }
        });

        if (authError) {
          console.error('Auth metadata update error:', authError);
        }
      }

      // Mise à jour de l'email
      if (formData.email !== profile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        });

        if (emailError) {
          throw new Error('Erreur lors de la mise à jour de l\'email');
        }
      }



      setSuccess('Profil mis à jour avec succès');
      
      // Recharger le profil pour afficher les nouvelles données
      await loadProfile();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erreur inattendue lors de la mise à jour');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleGoBack = () => {
    if (profile?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/freelancer/timesheets');
    }
  };

  const getRoleLabel = (role: string) => {
    return role === 'admin' ? 'Administrateur' : 'Freelancer';
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
          <Shield className="w-4 h-4 mr-2" />
          Administrateur
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
        <User className="w-4 h-4 mr-2" />
        Freelancer
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profil introuvable</h2>
          <p className="text-gray-600 mb-4">Une erreur s'est produite lors du chargement de votre profil.</p>
          <Button onClick={handleGoBack}>
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <Settings className="w-8 h-8 text-blue-600" />
                  <span>Mon profil</span>
                </h1>
                <p className="text-gray-600 mt-1">Gérez vos informations personnelles et préférences</p>
              </div>
            </div>
            {getRoleBadge(profile.role)}
          </div>
        </div>

        {/* Section principale */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations du compte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Informations du compte</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-gray-900">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Rôle</p>
                  <p className="text-gray-900">{getRoleLabel(profile.role)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Membre depuis</p>
                  <p className="text-gray-900">{formatDate(profile.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Nom complet</p>
                  <p className="text-gray-900">{profile.full_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modifier les informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-indigo-600" />
                <span>Modifier les informations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <Input
                  label="Nom complet"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />

                <Input
                  label="Adresse email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={updating}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updating ? 'Mise à jour...' : 'Sauvegarder'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Actions et préférences */}
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-gray-600" />
                <span>Actions et préférences</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sécurité */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Key className="w-5 h-5 text-red-600" />
                    <h3 className="font-medium text-gray-900">Sécurité</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Gérez la sécurité de votre compte
                  </p>
                  <Button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 w-full"
                  >
                    <Key className="h-4 w-4" />
                    Changer le mot de passe
                  </Button>
                </div>

                {/* Notifications */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Bell className="w-5 h-5 text-orange-600" />
                    <h3 className="font-medium text-gray-900">Notifications</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Configurez vos préférences de notifications
                  </p>
                  <Button
                    onClick={() => setShowNotificationModal(true)}
                    className="flex items-center gap-2 w-full"
                  >
                    <Bell className="h-4 w-4" />
                    Gérer les notifications
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={(message) => {
            setSuccess(message);
            setTimeout(() => setSuccess(null), 3000);
          }}
          onError={(message) => {
            setError(message);
            setTimeout(() => setError(null), 3000);
          }}
        />

        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          userId={profile.id}
          userRole={profile.role as 'freelancer' | 'admin'}
          onSuccess={(message) => {
            setSuccess(message);
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      </div>
    </div>
  );
};

export default ProfilePage;