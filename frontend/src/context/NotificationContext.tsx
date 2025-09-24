import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SystemNotification, notificationApi } from '../api/notifications';

interface NotificationContextType {
  notifications: SystemNotification[];
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  dismissNotification: (id: number) => void;
  dismissedNotifications: Set<number>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<number>>(new Set());

  const refreshNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getActiveNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = (id: number) => {
    setDismissedNotifications(prev => new Set([...prev, id]));
  };

  useEffect(() => {
    refreshNotifications();
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(refreshNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const value: NotificationContextType = {
    notifications,
    loading,
    refreshNotifications,
    dismissNotification,
    dismissedNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};