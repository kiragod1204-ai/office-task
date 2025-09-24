import React, { useState, useEffect } from 'react';
import { auditApi, SystemStatistics } from '../../api/audit';
import { format, subDays } from 'date-fns';


interface AuditDashboardProps {
  className?: string;
}

const AuditDashboard: React.FC<AuditDashboardProps> = ({ className = '' }) => {
  const [statistics, setStatistics] = useState<SystemStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    loadStatistics();
  }, [dateRange]);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await auditApi.getSystemStatistics(dateRange.start, dateRange.end);
      setStatistics(stats);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải thống kê hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const setQuickDateRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
  };

  const formatDuration = (milliseconds: number) => {
    if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    return `${(milliseconds / 60000).toFixed(1)}m`;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'document_create': 'bg-green-100 text-green-800',
      'document_update': 'bg-blue-100 text-blue-800',
      'document_delete': 'bg-red-100 text-red-800',
      'task_create': 'bg-purple-100 text-purple-800',
      'task_update': 'bg-indigo-100 text-indigo-800',
      'user_login': 'bg-yellow-100 text-yellow-800',
      'user_logout': 'bg-gray-100 text-gray-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getEntityColor = (entityType: string) => {
    const colors: Record<string, string> = {
      'incoming_document': 'bg-green-100 text-green-800',
      'outgoing_document': 'bg-blue-100 text-blue-800',
      'task': 'bg-purple-100 text-purple-800',
      'user': 'bg-orange-100 text-orange-800',
      'system': 'bg-gray-100 text-gray-800',
    };
    return colors[entityType] || 'bg-gray-100 text-gray-800';
  };

  const renderStatCard = (title: string, value: number | string, color: string, icon: React.ReactNode) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-md ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Đang tải thống kê...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">Lỗi</div>
          <div className="text-red-700 mt-1">{error}</div>
          <button
            onClick={loadStatistics}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Date Range Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Thống kê Audit Hệ thống</h3>
        
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Khoảng thời gian
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setQuickDateRange(7)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                7 ngày
              </button>
              <button
                onClick={() => setQuickDateRange(30)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                30 ngày
              </button>
              <button
                onClick={() => setQuickDateRange(90)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                90 ngày
              </button>
            </div>
          </div>
        </div>
      </div>

      {statistics && (
        <>
          {/* Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderStatCard(
              'Tổng hoạt động',
              statistics.total_activities,
              'bg-blue-100',
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}

            {renderStatCard(
              'Hoạt động thất bại',
              statistics.failed_activities,
              'bg-red-100',
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}

            {renderStatCard(
              'Thời gian xử lý TB',
              formatDuration(statistics.average_processing_time),
              'bg-green-100',
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            )}

            {renderStatCard(
              'Tỷ lệ thành công',
              `${Math.round(((statistics.total_activities - statistics.failed_activities) / statistics.total_activities) * 100)}%`,
              'bg-purple-100',
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Action Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Thống kê theo hành động</h4>
              <div className="space-y-3">
                {statistics.action_statistics.slice(0, 10).map((stat, index) => (
                  <div key={stat.action} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {index + 1}.
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(stat.action)}`}>
                        {stat.action}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {stat.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Thống kê theo đối tượng</h4>
              <div className="space-y-3">
                {statistics.entity_statistics.map((stat, index) => (
                  <div key={stat.entity_type} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {index + 1}.
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEntityColor(stat.entity_type)}`}>
                        {stat.entity_type}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {stat.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Most Active Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Người dùng hoạt động nhiều nhất</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thứ hạng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên người dùng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số hoạt động
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tỷ lệ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {statistics.user_statistics.map((user, index) => (
                    <tr key={user.user_id} className={index < 3 ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                        {index === 0 && <span className="ml-1 text-yellow-500">🥇</span>}
                        {index === 1 && <span className="ml-1 text-gray-400">🥈</span>}
                        {index === 2 && <span className="ml-1 text-yellow-600">🥉</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.user_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.round((user.count / statistics.total_activities) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AuditDashboard;