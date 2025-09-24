import React, { useState, useRef } from 'react';
import { outgoingDocumentApi } from '../../api/outgoing-documents';

interface OutgoingDocumentFileUploadProps {
  documentId: number;
  currentFilePath?: string;
  onUploadSuccess: (filePath: string, fileName: string, status: string) => void;
  onUploadError: (error: string) => void;
  className?: string;
}

export const OutgoingDocumentFileUpload: React.FC<OutgoingDocumentFileUploadProps> = ({
  documentId,
  currentFilePath,
  onUploadSuccess,
  onUploadError,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return `Định dạng file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(', ')}`;
    }
    
    if (file.size > maxFileSize) {
      return 'Kích thước file không được vượt quá 10MB';
    }
    
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await outgoingDocumentApi.uploadFile(documentId, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        onUploadSuccess(response.file_path, response.file_name, response.status);
        setUploadProgress(0);
        setIsUploading(false);
      }, 500);
      
    } catch (error: any) {
      setIsUploading(false);
      setUploadProgress(0);
      const errorMessage = error.response?.data?.error || 'Không thể upload file';
      onUploadError(errorMessage);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getFileName = (filePath: string) => {
    return filePath.split('/').pop() || filePath;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : isUploading
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!isUploading ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Đang upload file...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <p className="font-medium">Kéo thả file vào đây hoặc click để chọn</p>
              <p className="text-xs text-gray-500 mt-1">
                Hỗ trợ: {allowedTypes.join(', ')} (tối đa 10MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Current File Info */}
      {currentFilePath && !isUploading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                File đã upload: {getFileName(currentFilePath)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Upload file mới để thay thế file hiện tại
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• File PDF được ưu tiên cho văn bản đã ký và đóng dấu</p>
        <p>• File DOC/DOCX cho văn bản đang soạn thảo</p>
        <p>• Kích thước file tối đa: 10MB</p>
      </div>
    </div>
  );
};