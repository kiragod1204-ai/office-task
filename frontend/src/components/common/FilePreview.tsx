import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, FileText, Image } from 'lucide-react';
import { format } from 'date-fns';

interface FilePreviewProps {
  files: any[];
  onDownload?: (file: any) => void;
  onDelete?: (file: any) => void;
  showActions?: boolean;
  showThumbnails?: boolean;
  className?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  files,
  onDownload,
  onDelete,
  showActions = true,
  className = '',
}) => {
  if (!files || files.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>Chưa có file đính kèm</p>
      </div>
    );
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-600" />;
    }
    return <FileText className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {files.map((file, index) => (
        <div
          key={file.id || index}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(file.mime_type || file.mimeType)}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {file.original_name || file.originalName || file.name}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                {file.file_size && (
                  <span>
                    {file.file_size / 1024 / 1024 >= 1
                      ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB`
                      : `${(file.file_size / 1024).toFixed(2)} KB`}
                  </span>
                )}
                {file.uploaded_at && (
                  <span>
                    {format(new Date(file.uploaded_at), 'dd/MM/yyyy HH:mm')}
                  </span>
                )}
              </div>
            </div>
          </div>
          {showActions && (
            <div className="flex items-center gap-2">
              {onDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownload(file)}
                  title="Tải xuống"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(file)}
                  title="Xóa"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FilePreview;
