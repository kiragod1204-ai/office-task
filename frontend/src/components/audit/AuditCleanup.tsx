import React, { useState } from 'react';
import { auditApi } from '../../api/audit';

interface AuditCleanupProps {
  onCleanupComplete?: (success: boolean, message: string) => void;
}

const AuditCleanup: React.FC<AuditCleanupProps> = ({ onCleanupComplete }) => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [daysToKeep, setDaysToKeep] = useState(365);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const result = await auditApi.cleanupOldAuditLogs(daysToKeep);
      onCleanupComplete?.(true, result.message);
      setShowConfirmation(false);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Không thể dọn dẹp audit logs';
      onCleanupComplete?.(false, message);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const getEstimatedDeletionDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - daysToKeep);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-medium text-gray-900">Dọn dẹp Audit Logs</h3>
          <p className="mt-1 text-sm text-gray-500">
            Xóa các audit logs cũ để tiết kiệm dung lượng lưu trữ. Thao tác này không thể hoàn tác.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số ngày muốn giữ lại (tối thiểu 30 ngày)
              </label>
              <input
                type="number"
                min="30"
                max="3650"
                value={daysToKeep}
                onChange={(e) => setDaysToKeep(Math.max(30, parseInt(e.target.value) || 30))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Các audit logs trước ngày {getEstimatedDeletionDate()} sẽ bị xóa
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">Cảnh báo</h4>
                  <div className="mt-1 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Thao tác này sẽ xóa vĩnh viễn các audit logs cũ</li>
                      <li>Dữ liệu đã xóa không thể khôi phục</li>
                      <li>Nên xuất dữ liệu trước khi thực hiện dọn dẹp</li>
                      <li>Chỉ quản trị viên mới có thể thực hiện thao tác này</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {!showConfirmation ? (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowConfirmation(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 2a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  Dọn dẹp Audit Logs
                </button>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-red-800">Xác nhận dọn dẹp</h4>
                    <p className="mt-1 text-sm text-red-700">
                      Bạn có chắc chắn muốn xóa tất cả audit logs cũ hơn {daysToKeep} ngày?
                      Thao tác này không thể hoàn tác.
                    </p>
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={handleCleanup}
                        disabled={isCleaningUp}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCleaningUp ? (
                          <>
                            <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Đang dọn dẹp...
                          </>
                        ) : (
                          'Xác nhận xóa'
                        )}
                      </button>
                      <button
                        onClick={() => setShowConfirmation(false)}
                        disabled={isCleaningUp}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Hủy bỏ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditCleanup;