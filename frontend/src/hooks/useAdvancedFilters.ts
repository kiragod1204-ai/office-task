import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FilterParams, 
  DocumentFilterParams, 
  TaskFilterParams, 
  PaginationInfo,
  buildQueryString,
  parseQueryString
} from '../api/filters';

type FilterType = FilterParams | DocumentFilterParams | TaskFilterParams;

interface UseAdvancedFiltersOptions<T extends FilterType> {
  defaultFilters: T;
  entityType: 'incoming_documents' | 'outgoing_documents' | 'tasks';
  syncWithUrl?: boolean;
}

interface UseAdvancedFiltersReturn<T extends FilterType> {
  filters: T;
  pagination: PaginationInfo | null;
  setFilters: (filters: T) => void;
  updateFilter: (key: keyof T, value: any) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  setPagination: (pagination: PaginationInfo) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function useAdvancedFilters<T extends FilterType>({
  defaultFilters,
  syncWithUrl = true
}: UseAdvancedFiltersOptions<T>): UseAdvancedFiltersReturn<T> {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [filters, setFiltersState] = useState<T>(defaultFilters);
  const [pagination, setPaginationState] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize filters from URL on mount
  useEffect(() => {
    if (syncWithUrl && location.search) {
      const urlParams = parseQueryString(location.search.substring(1));
      const mergedFilters = { ...defaultFilters, ...urlParams } as T;
      setFiltersState(mergedFilters);
    }
  }, []);

  // Update URL when filters change (debounced)
  useEffect(() => {
    if (!syncWithUrl) return;

    const timeoutId = setTimeout(() => {
      const queryString = buildQueryString(filters);
      const newUrl = queryString ? `${location.pathname}?${queryString}` : location.pathname;
      
      if (newUrl !== `${location.pathname}${location.search}`) {
        navigate(newUrl, { replace: true });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, syncWithUrl, location.pathname, navigate]);

  const setFilters = useCallback((newFilters: T) => {
    setFiltersState(newFilters);
  }, []);

  const updateFilter = useCallback((key: keyof T, value: any) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value,
      // Reset page when filters change (except for page and limit changes)
      ...(key !== 'page' && key !== 'limit' ? { page: 1 } : {})
    }));
  }, []);

  const clearFilters = useCallback(() => {
    const clearedFilters = {
      ...defaultFilters,
      page: 1,
      limit: filters.limit || defaultFilters.limit
    } as T;
    setFiltersState(clearedFilters);
    setPaginationState(null);
  }, [defaultFilters, filters.limit]);

  const applyFilters = useCallback(() => {
    // This function can be used to trigger immediate filter application
    // The actual filtering should be handled by the component using this hook
    setFiltersState(prev => ({ ...prev }));
  }, []);

  const setPagination = useCallback((newPagination: PaginationInfo) => {
    setPaginationState(newPagination);
    
    // Update filters with new pagination info
    setFiltersState(prev => ({
      ...prev,
      page: newPagination.page,
      limit: newPagination.limit
    }));
  }, []);

  return {
    filters,
    pagination,
    setFilters,
    updateFilter,
    clearFilters,
    applyFilters,
    setPagination,
    isLoading,
    setIsLoading
  };
}

// Specific hooks for different entity types
export function useIncomingDocumentFilters(syncWithUrl: boolean = true) {
  const defaultFilters: DocumentFilterParams = {
    page: 1,
    limit: 20,
    sort_by: 'arrival_date',
    sort_order: 'desc'
  };

  return useAdvancedFilters({
    defaultFilters,
    entityType: 'incoming_documents',
    syncWithUrl
  });
}

export function useOutgoingDocumentFilters(syncWithUrl: boolean = true) {
  const defaultFilters: DocumentFilterParams = {
    page: 1,
    limit: 20,
    sort_by: 'issue_date',
    sort_order: 'desc'
  };

  return useAdvancedFilters({
    defaultFilters,
    entityType: 'outgoing_documents',
    syncWithUrl
  });
}

export function useTaskFilters(syncWithUrl: boolean = true) {
  const defaultFilters: TaskFilterParams = {
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  };

  return useAdvancedFilters({
    defaultFilters,
    entityType: 'tasks',
    syncWithUrl
  });
}

// Helper hook for managing filter presets
export function useFilterPresets() {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const applyPreset = useCallback((presetKey: string, presetFilters: Record<string, any>, updateFilters: (filters: any) => void) => {
    updateFilters(presetFilters);
    setActivePreset(presetKey);
  }, []);

  const clearPreset = useCallback(() => {
    setActivePreset(null);
  }, []);

  return {
    activePreset,
    applyPreset,
    clearPreset
  };
}