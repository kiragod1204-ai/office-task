import React, { useState, useEffect } from 'react';
import { 
  OutgoingDocument, 
  OutgoingDocumentFilters,
  outgoingDocumentApi,
  OUTGOING_STATUS_LABELS,
  OUTGOING_STATUS
} from '../../api/outgoing-documents';
import { DocumentTypeSelect } from '../common/DocumentTypeSelect';
import { IssuingUnitSelect } from '../common/IssuingUnitSelect';

interface OutgoingDocumentListProps {
  onEdit?: (document: OutgoingDocument) => void;
  onDelete?: (document: OutgoingDocument) => void;
  onView?: (document: OutgoingDocument) => void;
  onApprovalAction?: (document: OutgoingDocument) => void;
  refreshTrigger?: number;
}

export const OutgoingDocumentList: React.FC<OutgoingDocumentListProps> = ({
  onEdit,
  onDelete,
  onView,
  onApprovalAction,
  refreshTrigger = 0
}) => {
  const [documents, setDocuments] = useState<OutgoingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OutgoingDocumentFilters>({
    page: 1,
    limit: 20
  });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Load documents
  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await outgoingDocumentApi.getOutgoingDocuments(filters);
      setDocuments(response.documents);
      setTotalPages(response.pages);
      setTotal(response.total);
    } catch (err) {
      setError('Không thể tải danh sách văn bản đi');
      console.error('Error loading outgoing documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [filters, refreshTrigger]);

  const handleFilterChange = (key: keyof OutgoingDocumentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case OUTGOING_STATUS.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case OUTGOING_STATUS.REVIEW:
        return 'bg-yellow-100 text-yellow-800';
      case OUTGOING_STATUS.APPROVED:
        return 'bg-green-100 text-green-800';
      case OUTGOING_STATUS.SENT:
        return 'bg-blue-100 text-blue-800';
      case OUTGOING_STATUS.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleDownloadFile = async (document: OutgoingDocument) => {
    try {
      // Import the files API
      const { getFilesByDocument, downloadFile } = await import('../../api/files');
      
      // Get all files for this document
      const files = await getFilesByDocument('outgoing', document.id);
      
      if (files.length === 0) {
        // Fallback to old file_path if no files found in new system
        if (document.file_path) {
          const blob = await outgoingDocumentApi.downloadFile(document.file_path);
          const url = window.URL.createObjectURL(blob);
          const a = window.document.createElement('a');
          a.href = url;
          a.download = `${document.document_number}.pdf`;
          window.document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          window.document.body.removeChild(a);
          return;
        }
        
        console.log('No files found for this document');
        return;
      }

      // If only one file, download it directly
      if (files.length === 1) {
        await downloadFile(files[0].file_path, files[0].original_name);
        return;
      }

      // If multiple files, download them one by one
      for (const file of files) {
        try {
          await downloadFile(file.file_path, file.original_name);
        } catch (error) {
          console.error(`Error downloading file ${file.original_name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error downloading files:', error);
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải danh sách văn bản đi...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bộ lọc</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(OUTGOING_STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>{label}</option>
              ))}
            </select>
          </div>

          {/* Document Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại văn bản
            </label>
            <DocumentTypeSelect
              value={filters.document_type_id || 0}
              onChange={(value) => handleFilterChange('document_type_id', value || undefined)}
              allowEmpty={true}
            />
          </div>

          {/* Issuing Unit Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đơn vị ban hành
            </label>
            <IssuingUnitSelect
              value={filters.issuing_unit_id || 0}
              onChange={(value) => handleFilterChange('issuing_unit_id', value || undefined)}
              allowEmpty={true}
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
              placeholder="Số văn bản, trích yếu..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Xóa bộ lọc
          </button>
          <span className="text-sm text-gray-500">
            Tìm thấy {total} văn bản
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số văn bản
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày ban hành
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại VB
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trích yếu
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn vị BH
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người soạn thảo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người phê duyệt
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Công việc
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((document) => (
                <tr 
                  key={document.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onView && onView(document)}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-600">
                    {document.document_number}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(document.issue_date)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {document.document_type.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="truncate max-w-md" title={document.summary}>
                      {document.summary}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="truncate max-w-[200px]" title={document.issuing_unit.name}>
                        {document.issuing_unit.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {document.drafter.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {document.approver.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(document.status)}`}>
                      {OUTGOING_STATUS_LABELS[document.status as keyof typeof OUTGOING_STATUS_LABELS]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {document.linked_tasks && document.linked_tasks.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {document.linked_tasks.length} CV
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {onView && (
                        <button
                          onClick={() => onView(document)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Xem chi tiết"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(document)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Chỉnh sửa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadFile(document)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        title="Tải xuống"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      {onApprovalAction && (document.status === OUTGOING_STATUS.REVIEW || document.status === OUTGOING_STATUS.DRAFT) && (
                        <button
                          onClick={() => onApprovalAction(document)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Phê duyệt"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      {onDelete && document.status !== OUTGOING_STATUS.APPROVED && document.status !== OUTGOING_STATUS.SENT && (
                        <button
                          onClick={() => onDelete(document)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Xóa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {documents.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">Không có văn bản đi nào</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
              disabled={filters.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, (filters.page || 1) + 1))}
              disabled={filters.page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị{' '}
                <span className="font-medium">{((filters.page || 1) - 1) * (filters.limit || 20) + 1}</span>
                {' '}đến{' '}
                <span className="font-medium">
                  {Math.min((filters.page || 1) * (filters.limit || 20), total)}
                </span>
                {' '}trong tổng số{' '}
                <span className="font-medium">{total}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Trang trước</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        filters.page === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, (filters.page || 1) + 1))}
                  disabled={filters.page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Trang sau</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};