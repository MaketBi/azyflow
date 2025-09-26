import React, { useState } from 'react';
import { X, Key, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError
}) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [updating, setUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
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

      setFormData({ newPassword: '', confirmPassword: '' });
      onSuccess('Mot de passe mis à jour avec succès');
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        onError(error.message);
      } else {
        onError('Erreur inattendue lors de la mise à jour du mot de passe');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    setFormData({ newPassword: '', confirmPassword: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Key className="w-5 h-5 text-red-600" />
            <span>Nouveau mot de passe</span>
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Saisissez votre nouveau mot de passe ci-dessous.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nouveau mot de passe"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Minimum 6 caractères"
              required
            />

            <Input
              label="Confirmer le nouveau mot de passe"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Répétez le nouveau mot de passe"
              required
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updating}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={updating || !formData.newPassword}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              >
                <Save className="h-4 w-4" />
                {updating ? 'Mise à jour...' : 'Sauvegarder'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};