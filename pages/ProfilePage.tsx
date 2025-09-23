import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { NotificationSettings } from '../components/settings/NotificationSettings';
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
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

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
          email: userProfile.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
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
        const { data: userData, error: userError } = await supabase
          .from('users')
          .update({ full_name: formData.full_name })
          .eq('id', profile.id)
          .select()
          .single();

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

      // Mise à jour du mot de passe
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('Les mots de passe ne correspondent pas');
        }

        if (formData.newPassword.length < 6) {
          throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (passwordError) {
          throw new Error('Erreur lors de la mise à jour du mot de passe');
        }

        // Réinitialiser les champs de mot de passe
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center text-red-600">
            Erreur : Profil non trouvé
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
            <p className="text-gray-600">Gérez vos informations personnelles</p>
          </div>
        </div>

        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                  {getRoleLabel(profile.role)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Membre depuis
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                  {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire de modification */}
        <Card>
          <CardHeader>
            <CardTitle>Modifier les informations</CardTitle>
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

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Informations personnelles */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Informations personnelles</h3>
                
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
              </div>

              {/* Modification du mot de passe */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900">Changer le mot de passe</h3>
                <p className="text-sm text-gray-600">
                  Laissez vide si vous ne souhaitez pas changer votre mot de passe
                </p>

                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Minimum 6 caractères"
                />

                <Input
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Répétez le nouveau mot de passe"
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updating ? 'Mise à jour...' : 'Sauvegarder les modifications'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoBack}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Section Préférences de notifications */}
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Préférences de notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationSettings
                userId={profile.id}
                userRole={profile.role as 'freelancer' | 'admin'}
                onSave={(preferences) => {
                  setSuccess('Préférences de notifications mises à jour avec succès');
                  setTimeout(() => setSuccess(null), 3000);
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;