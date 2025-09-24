import React, { useState } from 'react';
import { auditApi, AuditFilters } from '../../api/audit';
import { format } from 'date-fns';

interface AuditExportProps {
  onExportComplete?: (success: boolean, message: string) => void;
}

const AuditExport: React.FC<AuditExportProps> = ({ onExportComplete }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<AuditFilters>({
    start_date: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleFilterChange = (key: keyof AuditFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await auditApi.exportAuditLogs(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current timestamp
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      link.download = `audit_logs_${timestamp}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onExportComplete?.(true, 'Xuất dữ liệu audit thành công');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Không thể xuất dữ liệu audit';
      onExportComplete?.(false, message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Xuất dữ liệu Audit</h3>
      
      <div className="space-y-4">
        {/* Export Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
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
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
              ID người dùng
            </label>
            <input
              type="number"
              value={filters.user_id || ''}
              onChange={(e) => handleFilterChange('user_id', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Tất cả người dùng"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Export Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-900">Thông tin xuất dữ liệu</h4>
              <div className="mt-1 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Dữ liệu sẽ được xuất dưới định dạng CSV</li>
                  <li>Tối đa 10,000 bản ghi sẽ được xuất trong một lần</li>
                  <li>Tệp sẽ bao gồm tất cả thông tin chi tiết của audit log</li>
                  <li>Sử dụng bộ lọc để giới hạn dữ liệu cần xuất</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Đang xuất...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Xuất CSV
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditExport;