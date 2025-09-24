import React, { useState, useEffect } from 'react';
import { auditApi, AuditLog, formatAuditAction, getActionColor } from '../../api/audit';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AuditTimelineProps {
  entityType: 'incoming_document' | 'outgoing_document';
  entityId: number;
  title?: string;
}

const AuditTimeline: React.FC<AuditTimelineProps> = ({
  entityType,
  entityId,
  title = 'Lịch sử xử lý'
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAuditTrail();
  }, [entityType, entityId]);

  const loadAuditTrail = async () => {
    setLoading(true);
    setError(null);
    try {
      const logs = await auditApi.getDocumentAuditTrail(entityType, entityId);
      setAuditLogs(logs);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải lịch sử xử lý');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  const getTimelineIcon = (action: string, success: boolean) => {
    if (!success) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }

    if (action.includes('create')) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }

    if (action.includes('update')) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }

    if (action.includes('assign') || action.includes('forward')) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
          <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }

    if (action.includes('complete')) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }

    // Default icon
    return (
      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">Lỗi</div>
          <div className="text-red-700 mt-1">{error}</div>
          <button
            onClick={loadAuditTrail}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">{title}</h3>
      
      {auditLogs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Chưa có hoạt động nào được ghi nhận
        </div>
      ) : (
        <div className="flow-root">
          <ul className="-mb-8">
            {auditLogs.map((log, logIdx) => (
              <li key={log.id}>
                <div className="relative pb-8">
                  {logIdx !== auditLogs.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      {getTimelineIcon(log.action, log.success)}
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          <span className={`font-medium ${getActionColor(log.action)}`}>
                            {formatAuditAction(log.action)}
                          </span>
                          {' bởi '}
                          <span className="font-medium text-gray-900">
                            {log.user.name}
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {log.description}
                        </p>
                        {!log.success && log.error_message && (
                          <p className="mt-1 text-sm text-red-600">
                            Lỗi: {log.error_message}
                          </p>
                        )}
                        {log.metadata && (() => {
                          try {
                            const metadata = JSON.parse(log.metadata);
                            return (
                              <div className="mt-2 text-xs text-gray-500">
                                {metadata.notes && (
                                  <div>Ghi chú: {metadata.notes}</div>
                                )}
                                {metadata.status_code && (
                                  <div>Mã trạng thái: {metadata.status_code}</div>
                                )}
                              </div>
                            );
                          } catch {
                            return null;
                          }
                        })()}
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time dateTime={log.timestamp}>
                          {formatTimestamp(log.timestamp)}
                        </time>
                        {log.duration > 0 && (
                          <div className="text-xs text-gray-400">
                            {log.duration < 1000 ? `${log.duration}ms` : `${(log.duration / 1000).toFixed(1)}s`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AuditTimeline;