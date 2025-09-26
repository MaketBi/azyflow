import React, { useState, useEffect } from 'react';
import { X, Phone, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';

interface UpdatePhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhone?: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const UpdatePhoneModal: React.FC<UpdatePhoneModalProps> = ({
  isOpen,
  onClose,
  currentPhone = '',
  onSuccess,
  onError
}) => {
  const [phone, setPhone] = useState(currentPhone);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhone(currentPhone || '');
    }
  }, [isOpen, currentPhone]);

  // Fonction de normalisation du numéro de téléphone
  const normalizePhoneNumber = (phone: string): string => {
    if (!phone.trim()) return '';
    
    const cleanPhone = phone.replace(/[\s\.\-]/g, '');
    
    // Si ça commence par 0 et fait 10 chiffres = numéro français
    if (/^0[1-9]\d{8}$/.test(cleanPhone)) {
      return '+33' + cleanPhone.substring(1); // Remplace le 0 par +33
    }
    
    // Si ça commence déjà par + = format international
    if (cleanPhone.startsWith('+')) {
      return cleanPhone;
    }
    
    // Si c'est 9 chiffres commençant par 1-9 = numéro français sans le 0
    if (/^[1-9]\d{8}$/.test(cleanPhone)) {
      return '+33' + cleanPhone;
    }
    
    return cleanPhone; // Retourne tel quel pour autres formats internationaux
  };

  // Fonction de validation du numéro de téléphone
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone.trim()) return true; // Le téléphone est optionnel
    
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Validation des formats internationaux normalisés
    const phoneRegex = /^\+\d{1,3}\d{6,14}$/;
    
    // Validation spécifique pour les numéros français
    const frenchPhoneRegex = /^\+33[1-9]\d{8}$/;
    
    return phoneRegex.test(normalizedPhone) || frenchPhoneRegex.test(normalizedPhone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      // Validation du numéro de téléphone
      if (phone && !validatePhoneNumber(phone)) {
        throw new Error('Le numéro de téléphone n\'est pas valide. Utilisez un format comme +33 1 23 45 67 89 ou 01 23 45 67 89');
      }

      // Normalisation du numéro de téléphone
      const normalizedPhone = normalizePhoneNumber(phone);

      // Récupération de l'utilisateur actuel
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Utilisateur non connecté');
      }

      // Mise à jour du numéro de téléphone dans la table users
      const { error: updateError } = await supabase
        .from('users')
        .update({ phone: normalizedPhone || null })
        .eq('id', user.id);

      if (updateError) {
        throw new Error('Erreur lors de la mise à jour du numéro de téléphone');
      }

      // Mise à jour des métadonnées Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: { phone: normalizedPhone || null }
      });

      if (authError) {
        console.error('Auth metadata update error:', authError);
      }

      onSuccess('Numéro de téléphone mis à jour avec succès');
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        onError(error.message);
      } else {
        onError('Erreur inattendue lors de la mise à jour du numéro de téléphone');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    setPhone(currentPhone || '');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Phone className="w-5 h-5 text-blue-600" />
            <span>Modifier le numéro de téléphone</span>
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
            Saisissez votre nouveau numéro de téléphone. Laissez vide pour supprimer.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de téléphone
                <span className="text-gray-500 text-sm font-normal"> (optionnel)</span>
              </label>
              <input
                type="tel"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${
                  phone && !validatePhoneNumber(phone)
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ex: +33 1 23 45 67 89 ou 01 23 45 67 89"
              />
              {phone && !validatePhoneNumber(phone) && (
                <p className="mt-1 text-sm text-red-600">
                  Format invalide. Utilisez +33 1 23 45 67 89 ou 01 23 45 67 89
                </p>
              )}
              {phone && validatePhoneNumber(phone) && phone !== normalizePhoneNumber(phone) && (
                <p className="mt-1 text-sm text-blue-600">
                  📱 Sera automatiquement converti en : {normalizePhoneNumber(phone)}
                </p>
              )}
            </div>

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
                disabled={updating || (!!phone && !validatePhoneNumber(phone))}
                className="flex items-center gap-2"
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