import React, { useState } from 'react';
import { Download, Eye, Trash2, File, Image, FileText } from 'lucide-react';

interface FileInfo {
  id?: number;
  original_name: string;
  file_name: string;
  file_path: string;
  thumbnail_path?: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  access_level: string;
  uploaded_by?: number;
}

interface FilePreviewProps {
  files: FileInfo[];
  onDownload?: (filePath: string, fileName: string) => void;
  onDelete?: (filePath: string) => void;
  onPreview?: (filePath: string, fileName: string) => void;
  showActions?: boolean;
  showThumbnails?: boolean;
  className?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  files,
  onDownload,
  onDelete,
  onPreview,
  showActions = true,
  showThumbnails = true,
  className = ''
}) => {
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

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
      return <Image className="w-6 h-6 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="w-6 h-6 text-red-500" />;
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="w-6 h-6 text-blue-600" />;
    }
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    if (!onDownload) return;

    setLoadingStates(prev => ({ ...prev, [filePath]: true }));
    try {
      await onDownload(filePath, fileName);
    } finally {
      setLoadingStates(prev => ({ ...prev, [filePath]: false }));
    }
  };

  const handleDelete = async (filePath: string) => {
    if (!onDelete) return;

    if (window.confirm('Bạn có chắc chắn muốn xóa file này?')) {
      setLoadingStates(prev => ({ ...prev, [filePath]: true }));
      try {
        await onDelete(filePath);
      } finally {
        setLoadingStates(prev => ({ ...prev, [filePath]: false }));
      }
    }
  };

  const handlePreview = (filePath: string, fileName: string) => {
    if (onPreview) {
      onPreview(filePath, fileName);
    }
  };

  const handleImageError = (filePath: string) => {
    setImageErrors(prev => ({ ...prev, [filePath]: true }));
  };

  const getThumbnailUrl = (file: FileInfo) => {
    const token = localStorage.getItem('token');
    if (file.thumbnail_path) {
      return `/api/files/thumbnail?path=${encodeURIComponent(file.file_path)}&token=${token}`;
    }
    return null;
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

  if (files.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <File className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Chưa có file nào được upload</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid gap-4">
        {files.map((file, index) => (
          <div
            key={file.file_path || index}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-4">
              {/* Thumbnail or Icon */}
              <div className="flex-shrink-0">
                {showThumbnails && file.thumbnail_path && !imageErrors[file.file_path] ? (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={getThumbnailUrl(file) || ''}
                      alt={file.original_name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(file.file_path)}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getFileIcon(file.mime_type)}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {file.original_name}
                    </h4>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>{formatDate(file.uploaded_at)}</span>
                      <span className="capitalize">{file.mime_type}</span>
                    </div>
                    <div className="mt-2">
                      {getAccessLevelBadge(file.access_level)}
                    </div>
                  </div>

                  {/* Actions */}
                  {showActions && (
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Preview Button */}
                      {file.mime_type.startsWith('image/') && (
                        <button
                          type="button"
                          onClick={() => handlePreview(file.file_path, file.original_name)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          title="Xem trước"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      {/* Download Button */}
                      <button
                        type="button"
                        onClick={() => handleDownload(file.file_path, file.original_name)}
                        disabled={loadingStates[file.file_path]}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 disabled:opacity-50"
                        title="Tải xuống"
                      >
                        {loadingStates[file.file_path] ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>

                      {/* Delete Button */}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(file.file_path)}
                          disabled={loadingStates[file.file_path]}
                          className="p-2 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50 disabled:opacity-50"
                          title="Xóa file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilePreview;