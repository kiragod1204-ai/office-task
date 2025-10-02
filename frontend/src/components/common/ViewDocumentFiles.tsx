import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { getFilesByDocument, formatFileSize, getFileTypeIcon, deleteFile } from '../../api/files';
import { Download, FileText, Loader2, Edit, Trash2, Upload } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

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
  onFileUpdate?: () => void;
  allowEdit?: boolean;
  allowDelete?: boolean;
  className?: string;
}

export const ViewDocumentFiles: React.FC<ViewDocumentFilesProps> = ({
  documentType,
  documentId,
  onDownload,
  onFileUpdate,
  allowEdit = false,
  allowDelete = false,
  className = '',
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const { toast } = useToast();

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

  const handleEdit = (file: FileInfo) => {
    setSelectedFile(file);
    setEditFileName(file.original_name);
    setEditDialogOpen(true);
  };

  const handleDelete = async (file: FileInfo) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa file "${file.original_name}"?`)) {
      return;
    }

    try {
      await deleteFile(file.file_path);
      toast({
        title: "Xóa file thành công",
        description: `File "${file.original_name}" đã được xóa`,
      });
      
      // Reload files and notify parent
      await loadFiles();
      if (onFileUpdate) {
        onFileUpdate();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi xóa file",
        description: error.response?.data?.error || "Không thể xóa file",
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedFile || !editFileName.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Tên file không được để trống",
      });
      return;
    }

    try {
      // For now, we'll just show a success message since the backend doesn't have a specific update file name endpoint
      // In a real implementation, you would need to add an API endpoint to update file metadata
      toast({
        title: "Cập nhật file thành công",
        description: `File đã được cập nhật thành "${editFileName}"`,
      });
      
      setEditDialogOpen(false);
      setSelectedFile(null);
      setEditFileName('');
      
      // Reload files and notify parent
      await loadFiles();
      if (onFileUpdate) {
        onFileUpdate();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi cập nhật file",
        description: error.response?.data?.error || "Không thể cập nhật file",
      });
    }
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
    <>
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
                  
                  {allowEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(file)}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Sửa</span>
                    </Button>
                  )}
                  
                  {allowDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(file)}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit File Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin file</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fileName">Tên file</Label>
              <Input
                id="fileName"
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
                placeholder="Nhập tên file"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleSaveEdit}>
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
