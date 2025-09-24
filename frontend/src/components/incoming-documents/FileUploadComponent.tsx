import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useToast } from '../../hooks/use-toast';
import { 
  Upload, 
  X, 
  File, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { incomingDocumentApi } from '../../api/incoming-documents';

interface FileUploadComponentProps {
  documentId: number;
  onUploadSuccess?: (filePath: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

interface UploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  documentId,
  onUploadSuccess,
  onUploadError,
  disabled = false,
  className = '',
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0,
    error: null,
    success: false,
  });

  const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return 'Chỉ hỗ trợ file PDF, DOC, DOCX, JPG, PNG';
    }

    if (file.size > maxFileSize) {
      return 'Kích thước file không được vượt quá 10MB';
    }

    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setUploadState(prev => ({
        ...prev,
        error: validationError,
        file: null,
        success: false,
      }));
      toast({
        title: 'Lỗi',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setUploadState(prev => ({
      ...prev,
      file,
      error: null,
      success: false,
      progress: 0,
    }));
  };

  const handleUpload = async () => {
    if (!uploadState.file) return;

    try {
      setUploadState(prev => ({
        ...prev,
        uploading: true,
        progress: 0,
        error: null,
        success: false,
      }));

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 200);

      const result = await incomingDocumentApi.uploadFile(documentId, uploadState.file);

      clearInterval(progressInterval);
      
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        success: true,
      }));

      toast({
        title: 'Thành công',
        description: 'Tải file lên thành công',
      });

      onUploadSuccess?.(result.file_path, result.file_name);

      // Reset after success
      setTimeout(() => {
        setUploadState({
          file: null,
          uploading: false,
          progress: 0,
          error: null,
          success: false,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);

    } catch (error: any) {
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: 0,
        error: error.response?.data?.error || 'Không thể tải file lên',
        success: false,
      }));

      const errorMessage = error.response?.data?.error || 'Không thể tải file lên';
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });

      onUploadError?.(errorMessage);
    }
  };

  const handleRemoveFile = () => {
    setUploadState({
      file: null,
      uploading: false,
      progress: 0,
      error: null,
      success: false,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={allowedTypes.join(',')}
          className="hidden"
          disabled={disabled || uploadState.uploading}
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploadState.uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          Chọn file
        </Button>

        {uploadState.file && (
          <Button
            type="button"
            onClick={handleUpload}
            disabled={disabled || uploadState.uploading || uploadState.success}
          >
            {uploadState.uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {uploadState.success ? 'Đã tải lên' : 'Tải lên'}
          </Button>
        )}
      </div>

      {/* File Info */}
      {uploadState.file && (
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{uploadState.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uploadState.file.size)}
                </p>
              </div>
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {uploadState.success && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {uploadState.error && (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              {!uploadState.uploading && !uploadState.success && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {uploadState.uploading && (
            <div className="mt-3 space-y-2">
              <Progress value={uploadState.progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Đang tải lên... {uploadState.progress}%
              </p>
            </div>
          )}

          {/* Error Message */}
          {uploadState.error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {uploadState.error}
            </div>
          )}

          {/* Success Message */}
          {uploadState.success && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              File đã được tải lên thành công
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        Hỗ trợ file PDF, DOC, DOCX, JPG, PNG. Tối đa 10MB.
      </p>
    </div>
  );
};