import React, { useState, useEffect } from 'react';
import { Clock, Download, Eye, User, FileText } from 'lucide-react';

interface FileVersion {
  id: number;
  version: number;
  file_path: string;
  original_name: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: number;
  uploaded_by_name: string;
  change_notes?: string;
  is_current: boolean;
}

interface FileVersionHistoryProps {
  documentType: string;
  documentId: number;
  currentFilePath?: string;
  onVersionSelect?: (version: FileVersion) => void;
  className?: string;
}

const FileVersionHistory: React.FC<FileVersionHistoryProps> = ({
  documentType,
  documentId,
  onVersionSelect,
  className = ''
}) => {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVersionHistory();
  }, [documentType, documentId]);

  const fetchVersionHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/files/versions?document_type=${documentType}&document_id=${documentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch version history');
      }

      const data = await response.json();
      setVersions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/files/download?path=${encodeURIComponent(filePath)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handlePreview = (version: FileVersion) => {
    if (onVersionSelect) {
      onVersionSelect(version);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <FileText className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Chưa có phiên bản nào</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <Clock className="h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900">Lịch sử phiên bản</h3>
        <span className="text-sm text-gray-500">({versions.length} phiên bản)</span>
      </div>

      <div className="space-y-3">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className={`border rounded-lg p-4 transition-colors ${
              version.is_current
                ? 'border-blue-200 bg-blue-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    version.is_current
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    v{version.version}
                  </span>
                  {version.is_current && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Hiện tại
                    </span>
                  )}
                </div>

                <h4 className="mt-2 text-sm font-medium text-gray-900 truncate">
                  {version.original_name}
                </h4>

                <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{version.uploaded_by_name}</span>
                  </div>
                  <span>{formatDate(version.uploaded_at)}</span>
                  <span>{formatFileSize(version.file_size)}</span>
                </div>

                {version.change_notes && (
                  <p className="mt-2 text-sm text-gray-600 italic">
                    "{version.change_notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handlePreview(version)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Xem trước"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownload(version.file_path, version.original_name)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Tải xuống"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Version comparison indicator */}
            {index < versions.length - 1 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center text-xs text-gray-500">
                  <div className="flex-1 border-t border-dashed border-gray-300"></div>
                  <span className="px-2 bg-white">Phiên bản trước</span>
                  <div className="flex-1 border-t border-dashed border-gray-300"></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Version statistics */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Thống kê</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Tổng phiên bản:</span>
            <span className="ml-2 font-medium">{versions.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Tổng dung lượng:</span>
            <span className="ml-2 font-medium">
              {formatFileSize(versions.reduce((sum, v) => sum + v.file_size, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileVersionHistory;