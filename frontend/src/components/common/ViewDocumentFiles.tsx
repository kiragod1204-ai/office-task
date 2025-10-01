import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { getFilesByDocument, formatFileSize, getFileTypeIcon } from '../../api/files';
import { Download, FileText, Loader2 } from 'lucide-react';

interface FileInfo {
  id?: number;
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
  uploaded_by?: number;
}

interface ViewDocumentFilesProps {
  documentType: 'incoming' | 'outgoing' | 'task_report';
  documentId: number;
  onDownload: (filePath: string, fileName: string) => void;
  className?: string;
}

export const ViewDocumentFiles: React.FC<ViewDocumentFilesProps> = ({
  documentType,
  documentId,
  onDownload,
  className = '',
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [documentType, documentId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const fileList = await getFilesByDocument(documentType, documentId);
      setFiles(fileList);
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Không thể tải danh sách files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (file: FileInfo) => {
    onDownload(file.file_path, file.original_name);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Đang tải files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-4 text-red-600 ${className}`}>
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className={`text-center p-4 text-muted-foreground ${className}`}>
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Chưa có file đính kèm</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {files.map((file, index) => (
        <Card key={file.id || index} className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="text-2xl">
                  {getFileTypeIcon(file.mime_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.original_name}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>Tải lên: {formatDate(file.uploaded_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  className="flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải xuống</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};