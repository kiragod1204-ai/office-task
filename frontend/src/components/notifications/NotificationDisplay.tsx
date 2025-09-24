import React, { useEffect, useState } from 'react';
import { SystemNotification, notificationApi } from '../../api/notifications';

interface NotificationDisplayProps {
  className?: string;
}

const NotificationDisplay: React.FC<NotificationDisplayProps> = ({ className = '' }) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchActiveNotifications();
  }, []);

  const fetchActiveNotifications = async () => {
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'upgrade':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        );
      case 'action_required':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'maintenance':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-600',
          button: 'text-yellow-600 hover:text-yellow-800'
        };
      case 'upgrade':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-600',
          button: 'text-blue-600 hover:text-blue-800'
        };
      case 'action_required':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-600',
          button: 'text-red-600 hover:text-red-800'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: 'text-gray-600',
          button: 'text-gray-600 hover:text-gray-800'
        };
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'maintenance':
        return 'Bảo trì hệ thống';
      case 'upgrade':
        return 'Nâng cấp hệ thống';
      case 'action_required':
        return 'Yêu cầu hành động';
      default:
        return 'Thông báo';
    }
  };

  const handleDismiss = (notificationId: number) => {
    setDismissedNotifications(prev => new Set([...prev, notificationId]));
  };

  const visibleNotifications = notifications.filter(
    notification => !dismissedNotifications.has(notification.id)
  );

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 h-16 rounded-lg"></div>
      </div>
    );
  }

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleNotifications.map((notification) => {
        const styles = getNotificationStyles(notification.type);
        return (
          <div
            key={notification.id}
            className={`border-l-4 p-4 rounded-lg shadow-md ${styles.container} animate-fade-in`}
          >
            <div className="flex items-start">
              <div className={`flex-shrink-0 ${styles.icon}`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium">
                      {notification.title}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-50">
                      {getNotificationTypeLabel(notification.type)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDismiss(notification.id)}
                    className={`flex-shrink-0 ml-4 ${styles.button} hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors`}
                    title="Đóng thông báo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 text-sm">
                  <p>{notification.content}</p>
                </div>
                {notification.expires_at && (
                  <div className="mt-2 text-xs opacity-75">
                    Hết hạn: {new Date(notification.expires_at).toLocaleString('vi-VN')}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationDisplay;