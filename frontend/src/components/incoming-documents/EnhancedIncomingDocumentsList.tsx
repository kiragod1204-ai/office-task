import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  IncomingDocument, 
  incomingDocumentApi, 
  INCOMING_DOCUMENT_STATUS_LABELS 
} from '../../api/incoming-documents';
import { useIncomingDocumentFilters } from '../../hooks/useAdvancedFilters';
import AdvancedFilter from '../common/AdvancedFilter';
import SearchWithAutocomplete from '../common/SearchWithAutocomplete';
import PaginationControls from '../common/PaginationControls';
import { DocumentFilterParams } from '../../api/filters';

interface EnhancedIncomingDocumentsListProps {
  className?: string;
}

const EnhancedIncomingDocumentsList: React.FC<EnhancedIncomingDocumentsListProps> = ({
  className = ''
}) => {
  const [documents, setDocuments] = useState<IncomingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    filters,
    pagination,
    updateFilter,
    clearFilters,
    applyFilters,
    setPagination
  } = useIncomingDocumentFilters();

  // Load documents
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await incomingDocumentApi.getAll(filters);
      setDocuments(response.documents);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Không thể tải danh sách văn bản đến');
    } finally {
      setLoading(false);
    }
  }, [filters, setPagination]);

  // Load documents when filters change
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: DocumentFilterParams) => {
    Object.entries(newFilters).forEach(([key, value]) => {
      updateFilter(key as keyof DocumentFilterParams, value);
    });
  }, [updateFilter]);

  // Handle search
  const handleSearch = useCallback(() => {
    applyFilters();
  }, [applyFilters]);

  // Handle pagination changes
  const handlePageChange = useCallback((page: number) => {
    updateFilter('page', page);
  }, [updateFilter]);

  const handleLimitChange = useCallback((limit: number) => {
    updateFilter('limit', limit);
    updateFilter('page', 1); // Reset to first page
  }, [updateFilter]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-yellow-100 text-yellow-800';
      case 'forwarded':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'processing':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDocuments}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <SearchWithAutocomplete
          entityType="incoming_documents"
          value={filters.search || ''}
          onChange={(value) => updateFilter('search', value)}
          onSearch={handleSearch}
          placeholder="Tìm kiếm theo số văn bản, tóm tắt nội dung..."
          className="w-full"
        />
      </div>

      {/* Advanced Filters */}
      <AdvancedFilter
        entityType="incoming_documents"
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={applyFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Danh sách văn bản đến
            </h2>
            <Link
              to="/incoming-documents/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Thêm văn bản mới
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Table */}
        {!loading && (
          <>
            {documents.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-gray-500 mb-2">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có văn bản nào</h3>
                <p className="text-gray-600">Chưa có văn bản đến nào được tạo hoặc không có kết quả phù hợp với bộ lọc.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số đến
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số văn bản
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày đến
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đơn vị ban hành
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tóm tắt nội dung
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Người xử lý
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((document) => (
                      <tr key={document.ID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {document.arrival_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {document.original_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(document.arrival_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {document.issuing_unit.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {document.summary}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {document.processor ? document.processor.name : 'Chưa giao'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(document.status)}`}>
                            {INCOMING_DOCUMENT_STATUS_LABELS[document.status as keyof typeof INCOMING_DOCUMENT_STATUS_LABELS] || document.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/incoming-documents/${document.ID}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Xem
                            </Link>
                            <Link
                              to={`/incoming-documents/${document.ID}/edit`}
                              className="text-green-600 hover:text-green-900"
                            >
                              Sửa
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && documents.length > 0 && (
              <PaginationControls
                pagination={pagination}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EnhancedIncomingDocumentsList;