import React, { useState, useEffect } from 'react';
import { auditApi, UserActivity } from '../../api/audit';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';

interface UserActivityReportProps {
  userId?: number;
  showUserSelector?: boolean;
}

const UserActivityReport: React.FC<UserActivityReportProps> = ({
  userId,
  showUserSelector = false
}) => {
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number>(userId || 0);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [users, setUsers] = useState<Array<{ id: number; name: string; role: string }>>([]);

  useEffect(() => {
    if (showUserSelector) {
      loadUsers();
    }
  }, [showUserSelector]);

  useEffect(() => {
    if (selectedUserId > 0) {
      loadUserActivity();
    }
  }, [selectedUserId, dateRange]);

  const loadUsers = async () => {
    try {
      // This would typically come from a users API
      // For now, we'll skip this as it's not implemented in the audit API
      setUsers([]);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadUserActivity = async () => {
    if (!selectedUserId) return;
    
    setLoading(true);
    setError(null);
    try {
      const activityData = await auditApi.getUserActivity(
        selectedUserId,
        dateRange.start,
        dateRange.end
      );
      setActivity(activityData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải báo cáo hoạt động');
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

  const formatLastActivity = (timestamp: string) => {
    if (!timestamp) return 'Chưa có hoạt động';
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  const getActivityScore = (activity: UserActivity) => {
    const totalPossibleActions = activity.total_actions + activity.failed_actions;
    if (totalPossibleActions === 0) return 0;
    return Math.round((activity.total_actions / totalPossibleActions) * 100);
  };

  const renderActivityCard = (title: string, value: number, color: string, icon: React.ReactNode) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-md ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Đang tải báo cáo...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">Lỗi</div>
          <div className="text-red-700 mt-1">{error}</div>
          <button
            onClick={loadUserActivity}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Báo cáo hoạt động người dùng</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {showUserSelector && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người dùng
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Chọn người dùng</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      {activity && (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Thông tin người dùng</h4>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                getActivityScore(activity) >= 90 ? 'bg-green-100 text-green-800' :
                getActivityScore(activity) >= 70 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                Điểm hoạt động: {getActivityScore(activity)}%
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tên người dùng</p>
                <p className="text-lg font-medium text-gray-900">{activity.user_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vai trò</p>
                <p className="text-lg font-medium text-gray-900">{activity.user_role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hoạt động cuối</p>
                <p className="text-lg font-medium text-gray-900">
                  {formatLastActivity(activity.last_activity)}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderActivityCard(
              'Tổng hoạt động',
              activity.total_actions,
              'bg-blue-100',
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}

            {renderActivityCard(
              'Hoạt động văn bản',
              activity.document_actions,
              'bg-green-100',
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            )}

            {renderActivityCard(
              'Hoạt động nhiệm vụ',
              activity.task_actions,
              'bg-purple-100',
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            )}

            {renderActivityCard(
              'Số lần đăng nhập',
              activity.login_count,
              'bg-indigo-100',
              <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Failed Actions */}
          {activity.failed_actions > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-red-900">Hoạt động thất bại</h4>
                  <p className="text-sm text-red-700">
                    Có {activity.failed_actions} hoạt động thất bại trong khoảng thời gian này.
                    Điều này có thể cần được kiểm tra và xử lý.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!activity && selectedUserId > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu hoạt động cho người dùng này trong khoảng thời gian đã chọn
          </div>
        </div>
      )}

      {selectedUserId === 0 && showUserSelector && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8 text-gray-500">
            Vui lòng chọn người dùng để xem báo cáo hoạt động
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActivityReport;