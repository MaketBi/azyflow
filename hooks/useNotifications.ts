import { useState, useCallback } from 'react';
import { Notification, NotificationType } from '../components/ui/Notification';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string,
    options?: {
      duration?: number;
      persistent?: boolean;
    }
  ) => {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type,
      title,
      message,
      duration: options?.duration || 4000,
      persistent: options?.persistent || false,
    };

    setNotifications(prev => [notification, ...prev]);

    return notification.id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Méthodes de commodité
  const showSuccess = useCallback((title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => {
    return addNotification('success', title, message, options);
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => {
    return addNotification('error', title, message, options);
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => {
    return addNotification('warning', title, message, options);
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => {
    return addNotification('info', title, message, options);
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};