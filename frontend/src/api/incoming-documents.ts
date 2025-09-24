import { apiClient } from './client';

export interface IncomingDocument {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  arrival_date: string;
  arrival_number: number;
  original_number: string;
  document_date: string;
  document_type_id: number;
  issuing_unit_id: number;
  summary: string;
  internal_notes: string;
  processor_id: number | null;
  status: string;
  file_path: string;
  created_by_id: number;
  document_type: {
    id: number;
    name: string;
    description: string;
  };
  issuing_unit: {
    id: number;
    name: string;
    description: string;
  };
  processor: {
    ID: number;
    name: string;
    role: string;
  } | null;
  created_by: {
    ID: number;
    name: string;
    role: string;
  };
  tasks: Array<{
    ID: number;
    description: string;
    status: string;
    assigned_to: {
      ID: number;
      name: string;
      role: string;
    } | null;
  }>;
}

export interface CreateIncomingDocumentRequest {
  arrival_date: string;
  original_number: string;
  document_date: string;
  document_type_id: number;
  issuing_unit_id: number;
  summary: string;
  internal_notes?: string;
  processor_id?: number;
}

export interface UpdateIncomingDocumentRequest {
  original_number?: string;
  document_date?: string;
  document_type_id?: number;
  issuing_unit_id?: number;
  summary?: string;
  internal_notes?: string;
  processor_id?: number;
  status?: string;
}

export interface AssignProcessorRequest {
  processor_id: number;
}

export interface IncomingDocumentFilters {
  status?: string;
  document_type_id?: number;
  issuing_unit_id?: number;
  processor_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface IncomingDocumentsResponse {
  documents: IncomingDocument[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface Processor {
  ID: number;
  name: string;
  role: string;
  is_active: boolean;
}

// Status constants
export const INCOMING_DOCUMENT_STATUS = {
  RECEIVED: 'received',
  FORWARDED: 'forwarded',
  ASSIGNED: 'assigned',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
} as const;

export const INCOMING_DOCUMENT_STATUS_LABELS = {
  [INCOMING_DOCUMENT_STATUS.RECEIVED]: 'Đã tiếp nhận',
  [INCOMING_DOCUMENT_STATUS.FORWARDED]: 'Đã chuyển tiếp',
  [INCOMING_DOCUMENT_STATUS.ASSIGNED]: 'Đã giao việc',
  [INCOMING_DOCUMENT_STATUS.PROCESSING]: 'Đang xử lý',
  [INCOMING_DOCUMENT_STATUS.COMPLETED]: 'Hoàn thành',
} as const;

export const incomingDocumentApi = {
  // Get all incoming documents with filtering and pagination
  getAll: async (filters?: IncomingDocumentFilters): Promise<IncomingDocumentsResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/incoming-documents?${params.toString()}`);
    return response.data;
  },

  // Get single incoming document by ID
  getById: async (id: number): Promise<IncomingDocument> => {
    const response = await apiClient.get(`/incoming-documents/${id}`);
    return response.data;
  },

  // Create new incoming document
  create: async (data: CreateIncomingDocumentRequest): Promise<IncomingDocument> => {
    const response = await apiClient.post('/incoming-documents', data);
    return response.data;
  },

  // Update incoming document
  update: async (id: number, data: UpdateIncomingDocumentRequest): Promise<IncomingDocument> => {
    const response = await apiClient.put(`/incoming-documents/${id}`, data);
    return response.data;
  },

  // Delete incoming document
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/incoming-documents/${id}`);
  },

  // Assign processor to document
  assignProcessor: async (id: number, data: AssignProcessorRequest): Promise<IncomingDocument> => {
    const response = await apiClient.post(`/incoming-documents/${id}/assign`, data);
    return response.data;
  },

  // Upload file for document
  uploadFile: async (id: number, file: File): Promise<{ message: string; file_path: string; file_name: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`/incoming-documents/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get list of processors (Team Leaders and Deputies)
  getProcessors: async (): Promise<Processor[]> => {
    const response = await apiClient.get('/incoming-documents/processors');
    return response.data;
  },

  // Download document file
  downloadFile: async (filePath: string): Promise<Blob> => {
    const response = await apiClient.get('/files/download', {
      params: { path: filePath },
      responseType: 'blob',
    });
    return response.data;
  },
};