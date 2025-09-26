import React from 'react';
import { X, Bell } from 'lucide-react';
import { Button } from '../ui/Button';
import { NotificationSettings } from '../settings/NotificationSettings';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userRole: 'freelancer' | 'admin';
  onSuccess: (message: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  userId,
  userRole,
  onSuccess
}) => {
  const handleSave = () => {
    onSuccess('Préférences de notifications mises à jour avec succès');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Bell className="w-5 h-5 text-orange-600" />
            <span>Préférences de notifications</span>
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Configurez vos préférences de notifications pour rester informé des événements importants.
          </p>

          <NotificationSettings
            userId={userId}
            userRole={userRole}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
};