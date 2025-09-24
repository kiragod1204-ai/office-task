import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Trash2, RefreshCw, FileText, Image, File } from 'lucide-react';

interface FileInfo {
  id: number;
  original_name: string;
  file_name: string;
  file_path: string;
  thumbnail_path?: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  document_type: string;
  document_id: number;
  access_level: string;
  uploaded_by: number;
}

interface FileFilters {
  documentType: string;
  mimeType: string;
  accessLevel: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

const FileManagement: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [filters, setFilters] = useState<FileFilters>({
    documentType: '',
    mimeType: '',
    accessLevel: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    byType: {} as Record<string, number>
  });

  useEffect(() => {
    fetchFiles();
    fetchStats();
  }, [filters]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/admin/files?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/files/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch file stats:', err);
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

  const handleDelete = async (filePath: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa file này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/files/delete?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setFiles(prev => prev.filter(file => file.file_path !== filePath));
      fetchStats(); // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;

    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedFiles.length} file(s)?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const promises = selectedFiles.map(filePath =>
        fetch(`/api/files/delete?path=${encodeURIComponent(filePath)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );

      await Promise.all(promises);
      setFiles(prev => prev.filter(file => !selectedFiles.includes(file.file_path)));
      setSelectedFiles([]);
      fetchStats(); // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk delete failed');
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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getAccessLevelBadge = (accessLevel: string) => {
    const badges = {
      public: { text: 'Công khai', className: 'bg-green-100 text-green-800' },
      restricted: { text: 'Hạn chế', className: 'bg-yellow-100 text-yellow-800' },
      private: { text: 'Riêng tư', className: 'bg-red-100 text-red-800' }
    };

    const badge = badges[accessLevel as keyof typeof badges] || badges.restricted;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles(prev =>
      prev.includes(filePath)
        ? prev.filter(path => path !== filePath)
        : [...prev, filePath]
    );
  };

  const toggleAllFiles = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(file => file.file_path));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Files</h2>
          <p className="text-sm text-gray-600">
            Tổng cộng: {stats.totalFiles} files ({formatFileSize(stats.totalSize)})
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Bộ lọc
          </button>
          <button
            onClick={fetchFiles}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </button>
          {selectedFiles.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa ({selectedFiles.length})
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại tài liệu
              </label>
              <select
                value={filters.documentType}
                onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Tất cả</option>
                <option value="incoming">Văn bản đến</option>
                <option value="outgoing">Văn bản đi</option>
                <option value="task_report">Báo cáo công việc</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại file
              </label>
              <select
                value={filters.mimeType}
                onChange={(e) => setFilters(prev => ({ ...prev, mimeType: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Tất cả</option>
                <option value="application/pdf">PDF</option>
                <option value="image/">Hình ảnh</option>
                <option value="application/msword">Word</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mức truy cập
              </label>
              <select
                value={filters.accessLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, accessLevel: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Tất cả</option>
                <option value="public">Công khai</option>
                <option value="restricted">Hạn chế</option>
                <option value="private">Riêng tư</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tên file..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Files Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedFiles.length === files.length && files.length > 0}
              onChange={toggleAllFiles}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Chọn tất cả ({files.length} files)
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center">
            <File className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Không có file nào</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {files.map((file) => (
              <li key={file.file_path} className="px-4 py-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.file_path)}
                    onChange={() => toggleFileSelection(file.file_path)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  
                  <div className="flex-shrink-0">
                    {getFileIcon(file.mime_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.original_name}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>{formatDate(file.uploaded_at)}</span>
                          <span className="capitalize">{file.document_type}</span>
                          <span>ID: {file.document_id}</span>
                        </div>
                        <div className="mt-1">
                          {getAccessLevelBadge(file.access_level)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(file.file_path, file.original_name)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          title="Tải xuống"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.file_path)}
                          className="p-2 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FileManagement;