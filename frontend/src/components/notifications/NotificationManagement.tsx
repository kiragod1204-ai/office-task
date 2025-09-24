import React, { useEffect, useState } from 'react';
import { SystemNotification, notificationApi, CreateNotificationRequest, UpdateNotificationRequest } from '../../api/notifications';

interface NotificationManagementProps {
  className?: string;
}

const NotificationManagement: React.FC<NotificationManagementProps> = ({ className = '' }) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<SystemNotification | null>(null);
  const [formData, setFormData] = useState<CreateNotificationRequest>({
    title: '',
    content: '',
    type: 'maintenance',
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await notificationApi.createNotification(formData);
      setShowCreateForm(false);
      setFormData({ title: '', content: '', type: 'maintenance' });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotification) return;
    
    try {
      const updateData: UpdateNotificationRequest = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
      };
      await notificationApi.updateNotification(editingNotification.id, updateData);
      setEditingNotification(null);
      setFormData({ title: '', content: '', type: 'maintenance' });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to update notification:', error);
    }
  };  const 
handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;
    
    try {
      await notificationApi.deleteNotification(id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await notificationApi.deactivateNotification(id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to deactivate notification:', error);
    }
  };

  const startEdit = (notification: SystemNotification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      content: notification.content,
      type: notification.type,
      expires_at: notification.expires_at,
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingNotification(null);
    setFormData({ title: '', content: '', type: 'maintenance' });
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'maintenance':
        return 'Bảo trì hệ thống';
      case 'upgrade':
        return 'Nâng cấp hệ thống';
      case 'action_required':
        return 'Yêu cầu hành động';
      default:
        return 'Thông báo';
    }
  };

  const getStatusBadge = (notification: SystemNotification) => {
    const isExpired = notification.expires_at && new Date(notification.expires_at) < new Date();
    
    if (!notification.is_active) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Không hoạt động</span>;
    }
    if (isExpired) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Hết hạn</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Hoạt động</span>;
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 h-64 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Quản lý thông báo hệ thống</h2>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingNotification(null);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Tạo thông báo mới
          </button>
        </div>
      </div>    
  {(showCreateForm || editingNotification) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={editingNotification ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại thông báo
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="maintenance">Bảo trì hệ thống</option>
                <option value="upgrade">Nâng cấp hệ thống</option>
                <option value="action_required">Yêu cầu hành động</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày hết hạn (tùy chọn)
              </label>
              <input
                type="datetime-local"
                value={formData.expires_at ? new Date(formData.expires_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingNotification ? 'Cập nhật' : 'Tạo thông báo'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  cancelEdit();
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )} 
     <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thông báo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {notifications.map((notification) => (
              <tr key={notification.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {notification.content.length > 100 
                        ? `${notification.content.substring(0, 100)}...` 
                        : notification.content}
                    </div>
                    {notification.expires_at && (
                      <div className="text-xs text-gray-400 mt-1">
                        Hết hạn: {new Date(notification.expires_at).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {getNotificationTypeLabel(notification.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(notification)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(notification.created_at).toLocaleString('vi-VN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => startEdit(notification)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Sửa
                  </button>
                  {notification.is_active && (
                    <button
                      onClick={() => handleDeactivate(notification.id)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      Tắt
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {notifications.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Chưa có thông báo nào
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationManagement;