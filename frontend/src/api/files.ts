import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api';

export interface FileInfo {
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

export interface FileUploadResponse {
  message: string;
  file: FileInfo;
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  byType: Record<string, number>;
}

// Upload file with enhanced validation and security
export const uploadFile = async (
  file: File,
  documentType: 'incoming' | 'outgoing' | 'task_report',
  documentId: number
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);
  formData.append('document_id', documentId.toString());

  const response = await fetch('/api/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Upload failed');
  }

  return response.json();
};

// Download file with access control
export const downloadFile = async (filePath: string, fileName?: string): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/files/download?path=${encodeURIComponent(filePath)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Download failed');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName || filePath.split('/').pop() || 'download';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Get file thumbnail
export const getFileThumbnail = (filePath: string): string => {
  const token = localStorage.getItem('token');
  return `/api/files/thumbnail?path=${encodeURIComponent(filePath)}&token=${token}`;
};

// Get file information
export const getFileInfo = async (filePath: string): Promise<FileInfo> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/files/info?path=${encodeURIComponent(filePath)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Delete file
export const deleteFile = async (filePath: string): Promise<void> => {
  const token = localStorage.getItem('token');
  await axios.delete(`${API_BASE_URL}/files/delete?path=${encodeURIComponent(filePath)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Get files by document
export const getFilesByDocument = async (
  documentType: string,
  documentId: number
): Promise<FileInfo[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/files/by-document?document_type=${documentType}&document_id=${documentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Get incoming files
export const getIncomingFiles = async (): Promise<FileInfo[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/files/incoming`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Admin functions

// Get all files with filters (admin only)
export const getAllFiles = async (filters?: {
  documentType?: string;
  mimeType?: string;
  accessLevel?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): Promise<FileInfo[]> => {
  const queryParams = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
  }

  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/admin/files?${queryParams}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Get file statistics (admin only)
export const getFileStats = async (): Promise<FileStats> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/admin/files/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Update file access level (admin only)
export const updateFileAccess = async (
  filePath: string,
  accessLevel: 'public' | 'restricted' | 'private'
): Promise<void> => {
  const token = localStorage.getItem('token');
  await axios.put(`${API_BASE_URL}/admin/files/access`, {
    file_path: filePath,
    access_level: accessLevel
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

// Bulk delete files (admin only)
export const bulkDeleteFiles = async (filePaths: string[]): Promise<void> => {
  const token = localStorage.getItem('token');
  await axios.delete(`${API_BASE_URL}/admin/files/bulk-delete`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      file_paths: filePaths
    }
  });
};

// File validation utilities
export const validateFile = (
  file: File,
  maxSize: number = 50, // MB
  allowedTypes: string[] = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif']
): string | null => {
  // Check file size
  if (file.size > maxSize * 1024 * 1024) {
    return `File "${file.name}" vượt quá kích thước tối đa ${maxSize}MB`;
  }

  // Check file type
  const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedTypes.includes(fileExt)) {
    return `File "${file.name}" có định dạng không được hỗ trợ`;
  }

  return null;
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file type icon
export const getFileTypeIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) {
    return '🖼️';
  } else if (mimeType === 'application/pdf') {
    return '📄';
  } else if (mimeType.includes('word') || mimeType.includes('document')) {
    return '📝';
  } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return '📊';
  } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return '📊';
  }
  return '📁';
};

// Check if file is an image
export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

// Check if file can be previewed
export const canPreviewFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
};

// Export all functions as filesApi for backward compatibility
export const filesApi = {
  uploadFile,
  downloadFile,
  getFileThumbnail,
  getFileInfo,
  deleteFile,
  getFilesByDocument,
  getIncomingFiles,
  getAllFiles,
  getFileStats,
  updateFileAccess,
  bulkDeleteFiles,
  validateFile,
  formatFileSize,
  getFileTypeIcon,
  isImageFile,
  canPreviewFile,
};