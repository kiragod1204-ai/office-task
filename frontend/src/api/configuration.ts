import { apiClient } from './client';

export interface DocumentType {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IssuingUnit {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReceivingUnit {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentTypeRequest {
  name: string;
  description?: string;
}

export interface CreateIssuingUnitRequest {
  name: string;
  description?: string;
}

export interface CreateReceivingUnitRequest {
  name: string;
  description?: string;
}

// Document Types API
export const documentTypeApi = {
  getAll: () => apiClient.get<{ data: DocumentType[] }>('/document-types'),
  getAllIncludingInactive: () => apiClient.get<{ data: DocumentType[] }>('/document-types/all'),
  getById: (id: number) => apiClient.get<{ data: DocumentType }>(`/document-types/${id}`),
  create: (data: CreateDocumentTypeRequest) => apiClient.post<{ data: DocumentType }>('/document-types', data),
  update: (id: number, data: CreateDocumentTypeRequest & { is_active: boolean }) => 
    apiClient.put<{ data: DocumentType }>(`/document-types/${id}`, data),
  delete: (id: number) => apiClient.delete(`/document-types/${id}`),
  toggleStatus: (id: number) => apiClient.post<{ data: DocumentType }>(`/document-types/${id}/toggle-status`),
};

// Issuing Units API
export const issuingUnitApi = {
  getAll: () => apiClient.get<{ data: IssuingUnit[] }>('/issuing-units'),
  getAllIncludingInactive: () => apiClient.get<{ data: IssuingUnit[] }>('/issuing-units/all'),
  getById: (id: number) => apiClient.get<{ data: IssuingUnit }>(`/issuing-units/${id}`),
  create: (data: CreateIssuingUnitRequest) => apiClient.post<{ data: IssuingUnit }>('/issuing-units', data),
  update: (id: number, data: CreateIssuingUnitRequest & { is_active: boolean }) => 
    apiClient.put<{ data: IssuingUnit }>(`/issuing-units/${id}`, data),
  delete: (id: number) => apiClient.delete(`/issuing-units/${id}`),
  toggleStatus: (id: number) => apiClient.post<{ data: IssuingUnit }>(`/issuing-units/${id}/toggle-status`),
};

// Receiving Units API
export const receivingUnitApi = {
  getAll: () => apiClient.get<{ data: ReceivingUnit[] }>('/receiving-units'),
  getAllIncludingInactive: () => apiClient.get<{ data: ReceivingUnit[] }>('/receiving-units/all'),
  getById: (id: number) => apiClient.get<{ data: ReceivingUnit }>(`/receiving-units/${id}`),
  create: (data: CreateReceivingUnitRequest) => apiClient.post<{ data: ReceivingUnit }>('/receiving-units', data),
  update: (id: number, data: CreateReceivingUnitRequest & { is_active: boolean }) => 
    apiClient.put<{ data: ReceivingUnit }>(`/receiving-units/${id}`, data),
  delete: (id: number) => apiClient.delete(`/receiving-units/${id}`),
  toggleStatus: (id: number) => apiClient.post<{ data: ReceivingUnit }>(`/receiving-units/${id}/toggle-status`),
};