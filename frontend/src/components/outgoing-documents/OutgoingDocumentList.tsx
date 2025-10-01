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
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số văn bản
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày ban hành
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại văn bản
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trích yếu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người soạn thảo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người phê duyệt
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
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {document.document_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(document.issue_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {document.document_type.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {document.summary}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {document.drafter.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {document.approver.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(document.status)}`}>
                      {OUTGOING_STATUS_LABELS[document.status as keyof typeof OUTGOING_STATUS_LABELS]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {onView && (
                      <button
                        onClick={() => onView(document)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Xem
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(document)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Sửa
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadFile(document)}
                      className="text-purple-600 hover:text-purple-900"
                      title="Tải xuống files"
                    >
                      Tải xuống
                    </button>
                    {onApprovalAction && (document.status === OUTGOING_STATUS.REVIEW || document.status === OUTGOING_STATUS.DRAFT) && (
                      <button
                        onClick={() => onApprovalAction(document)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Phê duyệt
                      </button>
                    )}
                    {onDelete && document.status !== OUTGOING_STATUS.APPROVED && document.status !== OUTGOING_STATUS.SENT && (
                      <button
                        onClick={() => onDelete(document)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {documents.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Không có văn bản đi nào</p>
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