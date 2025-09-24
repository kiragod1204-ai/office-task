import React, { useState, useEffect } from 'react';
import { 
  auditApi, 
  AuditLog, 
  AuditFilters, 
  formatAuditAction, 
  formatEntityType, 
  getActionColor, 
  getSuccessColor, 
  formatDuration 
} from '../../api/audit';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AuditTrailViewerProps {
  entityType?: 'incoming_document' | 'outgoing_document' | 'task' | 'user';
  entityId?: number;
  showFilters?: boolean;
  maxHeight?: string;
}

const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({
  entityType,
  entityId,
  showFilters = true,
  maxHeight = 'max-h-96'
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<AuditFilters>({
    entity_type: entityType,
    entity_id: entityId,
    page: 1,
    limit: 20
  });

  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  const loadAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await auditApi.getAuditLogs(filters);
      setAuditLogs(response.audit_logs);
      setCurrentPage(response.pagination.current_page);
      setTotalPages(response.pagination.total_pages);
      setTotalItems(response.pagination.total_items);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải dữ liệu audit');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AuditFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const toggleLogExpansion = (logId: number) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: vi });
  };

  const renderLogDetails = (log: AuditLog) => {
    const isExpanded = expandedLogs.has(log.id);
    
    return (
      <div className="border rounded-lg p-4 mb-3 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`font-medium ${getActionColor(log.action)}`}>
              {formatAuditAction(log.action)}
            </div>
            <div className="text-sm text-gray-600">
              {formatEntityType(log.entity_type)}
              {log.entity_id > 0 && ` #${log.entity_id}`}
            </div>
            <div className="text-sm text-gray-500">
              {log.user.name} ({log.user.role})
            </div>
            <div className={`text-sm font-medium ${getSuccessColor(log.success)}`}>
              {log.success ? '✓ Thành công' : '✗ Thất bại'}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {formatTimestamp(log.timestamp)}
            </span>
            <button
              onClick={() => toggleLogExpansion(log.id)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {isExpanded ? 'Thu gọn' : 'Chi tiết'}
            </button>
          </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-700">
          {log.description}
        </div>

        {isExpanded && (
          <div className="mt-4 border-t pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">IP Address:</span>
                <span className="ml-2">{log.ip_address}</span>
              </div>
              {log.duration > 0 && (
                <div>
                  <span className="font-medium text-gray-600">Thời gian xử lý:</span>
                  <span className="ml-2">{formatDuration(log.duration)}</span>
                </div>
              )}
            </div>

            {!log.success && log.error_message && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <span className="font-medium text-red-800">Lỗi:</span>
                <span className="ml-2 text-red-700">{log.error_message}</span>
              </div>
            )}

            {log.old_values && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <span className="font-medium text-gray-800">Giá trị cũ:</span>
                <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(JSON.parse(log.old_values), null, 2)}
                </pre>
              </div>
            )}

            {log.new_values && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <span className="font-medium text-blue-800">Giá trị mới:</span>
                <pre className="mt-1 text-xs text-blue-600 whitespace-pre-wrap">
                  {JSON.stringify(JSON.parse(log.new_values), null, 2)}
                </pre>
              </div>
            )}

            {log.metadata && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <span className="font-medium text-yellow-800">Metadata:</span>
                <pre className="mt-1 text-xs text-yellow-600 whitespace-pre-wrap">
                  {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Bộ lọc</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hành động
            </label>
            <select
              value={filters.action || ''}
              onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="document_create">Tạo văn bản</option>
              <option value="document_update">Cập nhật văn bản</option>
              <option value="document_delete">Xóa văn bản</option>
              <option value="task_create">Tạo nhiệm vụ</option>
              <option value="task_update">Cập nhật nhiệm vụ</option>
              <option value="user_login">Đăng nhập</option>
              <option value="user_logout">Đăng xuất</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại đối tượng
            </label>
            <select
              value={filters.entity_type || ''}
              onChange={(e) => handleFilterChange('entity_type', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="incoming_document">Văn bản đến</option>
              <option value="outgoing_document">Văn bản đi</option>
              <option value="task">Nhiệm vụ</option>
              <option value="user">Người dùng</option>
              <option value="system">Hệ thống</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.success === undefined ? '' : filters.success.toString()}
              onChange={(e) => handleFilterChange('success', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="true">Thành công</option>
              <option value="false">Thất bại</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700">
          Hiển thị {auditLogs.length} trong tổng số {totalItems} bản ghi
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Trước
          </button>
          <span className="px-3 py-1 text-sm text-gray-700">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Sau
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">Lỗi</div>
        <div className="text-red-700 mt-1">{error}</div>
        <button
          onClick={loadAuditLogs}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderFilters()}
      
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Nhật ký hoạt động
            {totalItems > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({totalItems} bản ghi)
              </span>
            )}
          </h3>
        </div>
        
        <div className={`p-4 ${maxHeight} overflow-y-auto`}>
          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu audit
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map(log => renderLogDetails(log))}
            </div>
          )}
        </div>
        
        {renderPagination()}
      </div>
    </div>
  );
};

export default AuditTrailViewer;