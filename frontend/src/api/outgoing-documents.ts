import { apiClient } from './client';

export interface OutgoingDocument {
  id: number;
  document_number: string;
  issue_date: string;
  document_type_id: number;
  issuing_unit_id: number;
  summary: string;
  drafter_id: number;
  approver_id: number;
  internal_notes?: string;
  status: string;
  file_path?: string;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  document_type: {
    id: number;
    name: string;
    description?: string;
  };
  issuing_unit: {
    id: number;
    name: string;
    description?: string;
  };
  drafter: {
    id: number;
    name: string;
    username: string;
    role: string;
  };
  approver: {
    id: number;
    name: string;
    username: string;
    role: string;
  };
  created_by: {
    id: number;
    name: string;
    username: string;
    role: string;
  };
}

export interface CreateOutgoingDocumentRequest {
  document_number: string;
  issue_date: string;
  document_type_id: number;
  issuing_unit_id: number;
  summary: string;
  drafter_id: number;
  approver_id: number;
  internal_notes?: string;
}

export interface UpdateOutgoingDocumentRequest {
  document_number?: string;
  issue_date?: string;
  document_type_id?: number;
  issuing_unit_id?: number;
  summary?: string;
  drafter_id?: number;
  approver_id?: number;
  internal_notes?: string;
  status?: string;
}

export interface UpdateApprovalStatusRequest {
  status: string;
  notes?: string;
}

export interface OutgoingDocumentFilters {
  status?: string;
  document_type_id?: number;
  issuing_unit_id?: number;
  drafter_id?: number;
  approver_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OutgoingDocumentsResponse {
  documents: OutgoingDocument[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  is_active: boolean;
}

// Status constants
export const OUTGOING_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  SENT: 'sent',
  REJECTED: 'rejected'
} as const;

export const OUTGOING_STATUS_LABELS = {
  [OUTGOING_STATUS.DRAFT]: 'Bản thảo',
  [OUTGOING_STATUS.REVIEW]: 'Đang xem xét',
  [OUTGOING_STATUS.APPROVED]: 'Đã phê duyệt',
  [OUTGOING_STATUS.SENT]: 'Đã gửi',
  [OUTGOING_STATUS.REJECTED]: 'Từ chối'
} as const;

export const outgoingDocumentsApi = {
  // Get all outgoing documents (simplified for dashboard)
  getOutgoingDocuments: async (): Promise<OutgoingDocument[]> => {
    const response = await apiClient.get('/outgoing-documents');
    return Array.isArray(response.data) ? response.data : response.data.documents || [];
  },
};

export const outgoingDocumentApi = {
  // Get all outgoing documents with filters
  getOutgoingDocuments: async (filters?: OutgoingDocumentFilters): Promise<OutgoingDocumentsResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/outgoing-documents?${params.toString()}`);
    return response.data;
  },

  // Get single outgoing document by ID
  getOutgoingDocument: async (id: number): Promise<OutgoingDocument> => {
    const response = await apiClient.get(`/outgoing-documents/${id}`);
    return response.data;
  },

  // Create new outgoing document
  createOutgoingDocument: async (data: CreateOutgoingDocumentRequest): Promise<OutgoingDocument> => {
    const response = await apiClient.post('/outgoing-documents', data);
    return response.data;
  },

  // Update outgoing document
  updateOutgoingDocument: async (id: number, data: UpdateOutgoingDocumentRequest): Promise<OutgoingDocument> => {
    const response = await apiClient.put(`/outgoing-documents/${id}`, data);
    return response.data;
  },

  // Update approval status
  updateApprovalStatus: async (id: number, data: UpdateApprovalStatusRequest): Promise<OutgoingDocument> => {
    const response = await apiClient.post(`/outgoing-documents/${id}/approval`, data);
    return response.data;
  },

  // Delete outgoing document
  deleteOutgoingDocument: async (id: number): Promise<void> => {
    await apiClient.delete(`/outgoing-documents/${id}`);
  },

  // Upload document file
  uploadFile: async (id: number, file: File): Promise<{ message: string; file_path: string; file_name: string; status: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`/outgoing-documents/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get list of users who can be drafters
  getDrafters: async (): Promise<User[]> => {
    const response = await apiClient.get('/outgoing-documents/drafters');
    return response.data;
  },

  // Get list of users who can be approvers
  getApprovers: async (): Promise<User[]> => {
    const response = await apiClient.get('/outgoing-documents/approvers');
    return response.data;
  },

  // Download document file
  downloadFile: async (filePath: string): Promise<Blob> => {
    const response = await apiClient.get(`/files/download?path=${encodeURIComponent(filePath)}`, {
      responseType: 'blob',
    });
    return response.data;
  }
};