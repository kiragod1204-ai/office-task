import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api';

// Types for audit data
export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  user_id: number;
  ip_address: string;
  user_agent: string;
  description: string;
  old_values: string;
  new_values: string;
  metadata: string;
  success: boolean;
  error_message: string;
  duration: number;
  timestamp: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    role: string;
  };
}

export interface UserActivity {
  user_id: number;
  user_name: string;
  user_role: string;
  last_activity: string;
  total_actions: number;
  document_actions: number;
  task_actions: number;
  login_count: number;
  failed_actions: number;
}

export interface DocumentAuditSummary {
  document_id: number;
  document_type: string;
  document_number: string;
  summary: string;
  created_at: string;
  created_by: string;
  current_status: string;
  processor_name: string;
  total_actions: number;
  last_activity: string;
  processing_time: number;
}

export interface TaskAuditSummary {
  task_id: number;
  description: string;
  created_at: string;
  created_by: string;
  assigned_to: string;
  current_status: string;
  deadline: string;
  completed_at: string;
  total_actions: number;
  processing_time: number;
}

export interface AuditFilters {
  user_id?: number;
  action?: string;
  entity_type?: string;
  entity_id?: number;
  success?: boolean;
  start_date?: string;
  end_date?: string;
  ip_address?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

export interface AuditLogsResponse {
  audit_logs: AuditLog[];
  pagination: PaginationInfo;
}

export interface SystemStatistics {
  total_activities: number;
  action_statistics: Array<{
    action: string;
    count: number;
  }>;
  entity_statistics: Array<{
    entity_type: string;
    count: number;
  }>;
  user_statistics: Array<{
    user_id: number;
    user_name: string;
    count: number;
  }>;
  failed_activities: number;
  average_processing_time: number;
}

// API functions
export const auditApi = {
  // Get audit logs with filtering and pagination
  getAuditLogs: async (filters: AuditFilters = {}): Promise<AuditLogsResponse> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await axios.get(`${API_BASE_URL}/audit/logs?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Get user activity summary
  getUserActivity: async (userId: number, startDate?: string, endDate?: string): Promise<UserActivity> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await axios.get(`${API_BASE_URL}/audit/user-activity/${userId}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Get document audit trail
  getDocumentAuditTrail: async (entityType: 'incoming_document' | 'outgoing_document', documentId: number): Promise<AuditLog[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/audit/document-trail/${entityType}/${documentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.audit_trail;
  },

  // Get document audit summary
  getDocumentAuditSummary: async (entityType: 'incoming_document' | 'outgoing_document', startDate?: string, endDate?: string): Promise<DocumentAuditSummary[]> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    params.append('entity_type', entityType);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await axios.get(`${API_BASE_URL}/audit/document-summary?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.document_summary;
  },

  // Get task audit summary
  getTaskAuditSummary: async (startDate?: string, endDate?: string): Promise<TaskAuditSummary[]> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await axios.get(`${API_BASE_URL}/audit/task-summary?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.task_summary;
  },

  // Get system statistics
  getSystemStatistics: async (startDate?: string, endDate?: string): Promise<SystemStatistics> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await axios.get(`${API_BASE_URL}/audit/statistics?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Export audit logs
  exportAuditLogs: async (filters: AuditFilters = {}): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await axios.get(`${API_BASE_URL}/audit/export?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob',
    });
    return response.data;
  },

  // Cleanup old audit logs (Admin only)
  cleanupOldAuditLogs: async (daysToKeep: number = 365): Promise<{ message: string }> => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_BASE_URL}/audit/cleanup?days=${daysToKeep}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

// Helper functions
export const formatAuditAction = (action: string): string => {
  const actionMap: Record<string, string> = {
    'document_create': 'Tạo văn bản',
    'document_update': 'Cập nhật văn bản',
    'document_delete': 'Xóa văn bản',
    'document_forward': 'Chuyển tiếp văn bản',
    'document_assign': 'Phân công xử lý',
    'document_process': 'Xử lý văn bản',
    'document_complete': 'Hoàn thành văn bản',
    'task_create': 'Tạo nhiệm vụ',
    'task_update': 'Cập nhật nhiệm vụ',
    'task_delete': 'Xóa nhiệm vụ',
    'task_assign': 'Phân công nhiệm vụ',
    'task_forward': 'Chuyển tiếp nhiệm vụ',
    'task_delegate': 'Ủy quyền nhiệm vụ',
    'task_start': 'Bắt đầu nhiệm vụ',
    'task_complete': 'Hoàn thành nhiệm vụ',
    'user_login': 'Đăng nhập',
    'user_logout': 'Đăng xuất',
    'user_create': 'Tạo người dùng',
    'user_update': 'Cập nhật người dùng',
    'user_delete': 'Xóa người dùng',
    'user_activate': 'Kích hoạt tài khoản',
    'user_deactivate': 'Vô hiệu hóa tài khoản',
    'system_config': 'Cấu hình hệ thống',
    'file_upload': 'Tải lên tệp',
    'file_download': 'Tải xuống tệp',
    'file_delete': 'Xóa tệp',
    'report_generate': 'Tạo báo cáo',
    'report_export': 'Xuất báo cáo',
  };
  return actionMap[action] || action;
};

export const formatEntityType = (entityType: string): string => {
  const entityMap: Record<string, string> = {
    'incoming_document': 'Văn bản đến',
    'outgoing_document': 'Văn bản đi',
    'task': 'Nhiệm vụ',
    'user': 'Người dùng',
    'system': 'Hệ thống',
    'file': 'Tệp tin',
    'report': 'Báo cáo',
  };
  return entityMap[entityType] || entityType;
};

export const getActionColor = (action: string): string => {
  if (action.includes('create')) return 'text-green-600';
  if (action.includes('update')) return 'text-blue-600';
  if (action.includes('delete')) return 'text-red-600';
  if (action.includes('login')) return 'text-purple-600';
  if (action.includes('logout')) return 'text-gray-600';
  if (action.includes('assign') || action.includes('forward') || action.includes('delegate')) return 'text-orange-600';
  return 'text-gray-800';
};

export const getSuccessColor = (success: boolean): string => {
  return success ? 'text-green-600' : 'text-red-600';
};

export const formatDuration = (duration: number): string => {
  if (duration < 1000) return `${duration}ms`;
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
  return `${(duration / 60000).toFixed(1)}m`;
};

export const formatProcessingTime = (hours: number): string => {
  if (hours < 1) return `${Math.round(hours * 60)} phút`;
  if (hours < 24) return `${hours.toFixed(1)} giờ`;
  return `${(hours / 24).toFixed(1)} ngày`;
};