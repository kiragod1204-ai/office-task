import { apiClient } from './client';

export interface FilterParams {
  search?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DocumentFilterParams extends FilterParams {
  document_type_id?: number;
  issuing_unit_id?: number;
  processor_id?: number;
  drafter_id?: number;
  approver_id?: number;
}

export interface TaskFilterParams extends FilterParams {
  assignee_id?: number;
  created_by_id?: number;
  task_type?: string;
  deadline_type?: string;
  incoming_document_id?: number;
  is_overdue?: string;
  urgency_level?: string;
}

export interface FilterPreset {
  name: string;
  description: string;
  filters: Record<string, any>;
}

export interface FilterOptions {
  statuses?: string[];
  task_types?: string[];
  deadline_types?: string[];
  urgency_levels?: string[];
  sort_fields?: string[];
}

export interface SavedFilter {
  id: number;
  name: string;
  entity_type: string;
  filters: Record<string, any>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Get filter presets
export const getFilterPresets = async (): Promise<{ presets: Record<string, FilterPreset> }> => {
  const response = await apiClient.get('/filters/presets');
  return response.data;
};

// Get filter options for a specific entity type
export const getFilterOptions = async (entityType: string): Promise<{ options: FilterOptions }> => {
  const response = await apiClient.get('/filters/options', {
    params: { type: entityType }
  });
  return response.data;
};

// Get search suggestions
export const getSearchSuggestions = async (
  entityType: string, 
  query: string, 
  limit: number = 10
): Promise<{ suggestions: string[] }> => {
  const response = await apiClient.get('/search/suggestions', {
    params: { type: entityType, q: query, limit }
  });
  return response.data;
};

// Get saved filters
export const getSavedFilters = async (entityType: string): Promise<{ saved_filters: SavedFilter[] }> => {
  const response = await apiClient.get('/filters/saved', {
    params: { type: entityType }
  });
  return response.data;
};

// Save a filter
export const saveFilter = async (
  name: string,
  entityType: string,
  filters: Record<string, any>,
  isDefault: boolean = false
): Promise<{ message: string; filter: SavedFilter }> => {
  const response = await apiClient.post('/filters/saved', {
    name,
    entity_type: entityType,
    filters,
    is_default: isDefault
  });
  return response.data;
};

// Delete a saved filter
export const deleteSavedFilter = async (filterId: number): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/filters/saved/${filterId}`);
  return response.data;
};

// Helper function to build query string from filter params
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
};

// Helper function to parse query string to filter params
export const parseQueryString = (queryString: string): Record<string, any> => {
  const params: Record<string, any> = {};
  const searchParams = new URLSearchParams(queryString);
  
  searchParams.forEach((value, key) => {
    // Convert numeric strings to numbers
    if (['page', 'limit', 'document_type_id', 'issuing_unit_id', 'processor_id', 'drafter_id', 'approver_id', 'assignee_id', 'created_by_id', 'incoming_document_id'].includes(key)) {
      params[key] = parseInt(value, 10);
    } else {
      params[key] = value;
    }
  });
  
  return params;
};