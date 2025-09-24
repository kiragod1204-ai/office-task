import { apiClient } from './client';

export interface SystemNotification {
  id: number;
  title: string;
  content: string;
  type: 'maintenance' | 'upgrade' | 'action_required';
  is_active: boolean;
  expires_at?: string;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    name: string;
    username: string;
  };
}

export interface CreateNotificationRequest {
  title: string;
  content: string;
  type: 'maintenance' | 'upgrade' | 'action_required';
  expires_at?: string;
}

export interface UpdateNotificationRequest {
  title?: string;
  content?: string;
  type?: 'maintenance' | 'upgrade' | 'action_required';
  is_active?: boolean;
  expires_at?: string;
}

export const notificationApi = {
  // Get all notifications with optional filtering
  getNotifications: async (params?: {
    active?: boolean;
    type?: string;
    non_expired?: boolean;
  }): Promise<SystemNotification[]> => {
    const searchParams = new URLSearchParams();
    if (params?.active !== undefined) {
      searchParams.append('active', params.active.toString());
    }
    if (params?.type) {
      searchParams.append('type', params.type);
    }
    if (params?.non_expired) {
      searchParams.append('non_expired', 'true');
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get active notifications for display
  getActiveNotifications: async (): Promise<SystemNotification[]> => {
    const response = await apiClient.get('/notifications/active');
    return response.data;
  },

  // Get specific notification by ID
  getNotification: async (id: number): Promise<SystemNotification> => {
    const response = await apiClient.get(`/notifications/${id}`);
    return response.data;
  },

  // Create new notification (admin only)
  createNotification: async (data: CreateNotificationRequest): Promise<SystemNotification> => {
    const response = await apiClient.post('/notifications', data);
    return response.data;
  },

  // Update notification (admin only)
  updateNotification: async (id: number, data: UpdateNotificationRequest): Promise<SystemNotification> => {
    const response = await apiClient.put(`/notifications/${id}`, data);
    return response.data;
  },

  // Delete notification (admin only)
  deleteNotification: async (id: number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },

  // Deactivate notification (admin only)
  deactivateNotification: async (id: number): Promise<void> => {
    await apiClient.post(`/notifications/${id}/deactivate`);
  },
};