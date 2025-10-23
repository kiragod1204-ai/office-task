import React, { useState, useEffect } from 'react';
import { 
  OutgoingDocument,
  outgoingDocumentApi,
  User
} from '../../api/outgoing-documents';
import { DocumentTypeSelect } from '../common/DocumentTypeSelect';
import { IssuingUnitSelect } from '../common/IssuingUnitSelect';
import EnhancedFileUpload from '../common/EnhancedFileUpload';
import FilePreview from '../common/FilePreview';
import { getFilesByDocument, downloadFile, deleteFile } from '../../api/files';
import { useToast } from '../../hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface OutgoingDocumentFormProps {
  document?: OutgoingDocument;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const OutgoingDocumentForm: React.FC<OutgoingDocumentFormProps> = ({
  document,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    document_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    document_type_id: 0,
    issuing_unit_id: 0,
    summary: '',
    drafter_id: 0,
    approver_id: 0,
    internal_notes: ''
  });

  const [drafters, setDrafters] = useState<User[]>([]);
  const [approvers, setApprovers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documentFiles, setDocumentFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Load drafters and approvers
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const [draftersData, approversData] = await Promise.all([
          outgoingDocumentApi.getDrafters(),
          outgoingDocumentApi.getApprovers()
        ]);
        // IDs are now automatically normalized by the API client
        setDrafters(draftersData);
        setApprovers(approversData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
    if (document?.id) {
      loadDocumentFiles();
    }
  }, [document?.id]);

  // Initialize form data when editing
  useEffect(() => {
    if (document) {
      setFormData({
        document_number: document.document_number,
        issue_date: document.issue_date ? document.issue_date.split('T')[0] : new Date().toISOString().split('T')[0],
        document_type_id: document.document_type_id,
        issuing_unit_id: document.issuing_unit_id,
        summary: document.summary,
        drafter_id: document.drafter_id,
        approver_id: document.approver_id,
        internal_notes: document.internal_notes || ''
      });
    }
  }, [document]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('_id') ? parseInt(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.document_number.trim()) {
      newErrors.document_number = 'Số văn bản là bắt buộc';
    }
    if (!formData.issue_date) {
      newErrors.issue_date = 'Ngày ban hành là bắt buộc';
    }
    if (!formData.document_type_id) {
      newErrors.document_type_id = 'Loại văn bản là bắt buộc';
    }
    if (!formData.issuing_unit_id) {
      newErrors.issuing_unit_id = 'Đơn vị ban hành là bắt buộc';
    }
    if (!formData.summary.trim()) {
      newErrors.summary = 'Trích yếu là bắt buộc';
    }
    if (!formData.drafter_id) {
      newErrors.drafter_id = 'Người soạn thảo là bắt buộc';
    }
    if (!formData.approver_id) {
      newErrors.approver_id = 'Người phê duyệt là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loadDocumentFiles = async () => {
    if (!document?.id) return;
    
    try {
      setLoadingFiles(true);
      const files = await getFilesByDocument('outgoing', document.id);
      setDocumentFiles(files);
    } catch (error) {
      console.error('Error loading document files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileUploadSuccess = () => {
    toast({
      title: 'Thành công',
      description: 'Tải file lên thành công',
    });
    // Reload files to show the new upload
    loadDocumentFiles();
  };

  const handleFileUploadError = (error: string) => {
    toast({
      title: 'Lỗi',
      description: error,
      variant: 'destructive',
    });
  };

  const handleFileDownload = async (filePath: string, fileName: string) => {
    try {
      await downloadFile(filePath, fileName);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải file xuống',
        variant: 'destructive',
      });
    }
  };

  const handleFileDelete = async (filePath: string) => {
    try {
      await deleteFile(filePath);
      toast({
        title: 'Thành công',
        description: 'Xóa file thành công',
      });
      // Reload files to reflect the deletion
      loadDocumentFiles();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa file',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  if (loadingUsers) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Number */}
        <div>
          <label htmlFor="document_number" className="block text-sm font-medium text-gray-700 mb-1">
            Số văn bản <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="document_number"
            name="document_number"
            value={formData.document_number}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              errors.document_number ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập số văn bản"
          />
          {errors.document_number && (
            <p className="mt-1 text-sm text-red-600">{errors.document_number}</p>
          )}
        </div>

        {/* Issue Date */}
        <div>
          <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700 mb-1">
            Ngày ban hành <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="issue_date"
            name="issue_date"
            value={formData.issue_date}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              errors.issue_date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.issue_date && (
            <p className="mt-1 text-sm text-red-600">{errors.issue_date}</p>
          )}
        </div>

        {/* Document Type */}
        <div>
          <label htmlFor="document_type_id" className="block text-sm font-medium text-gray-700 mb-1">
            Loại văn bản <span className="text-red-500">*</span>
          </label>
          <DocumentTypeSelect
            value={formData.document_type_id}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, document_type_id: value }));
              if (errors.document_type_id) {
                setErrors(prev => ({ ...prev, document_type_id: '' }));
              }
            }}
            className={errors.document_type_id ? 'border-red-500' : ''}
          />
          {errors.document_type_id && (
            <p className="mt-1 text-sm text-red-600">{errors.document_type_id}</p>
          )}
        </div>

        {/* Issuing Unit */}
        <div>
          <label htmlFor="issuing_unit_id" className="block text-sm font-medium text-gray-700 mb-1">
            Đơn vị ban hành <span className="text-red-500">*</span>
          </label>
          <IssuingUnitSelect
            value={formData.issuing_unit_id}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, issuing_unit_id: value }));
              if (errors.issuing_unit_id) {
                setErrors(prev => ({ ...prev, issuing_unit_id: '' }));
              }
            }}
            className={errors.issuing_unit_id ? 'border-red-500' : ''}
          />
          {errors.issuing_unit_id && (
            <p className="mt-1 text-sm text-red-600">{errors.issuing_unit_id}</p>
          )}
        </div>

        {/* Drafter */}
        <div>
          <label htmlFor="drafter_id" className="block text-sm font-medium text-gray-700 mb-1">
            Người soạn thảo <span className="text-red-500">*</span>
          </label>
          <select
            id="drafter_id"
            name="drafter_id"
            value={formData.drafter_id}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              errors.drafter_id ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value={0}>Chọn người soạn thảo</option>
            {drafters.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
          {errors.drafter_id && (
            <p className="mt-1 text-sm text-red-600">{errors.drafter_id}</p>
          )}
        </div>

        {/* Approver */}
        <div>
          <label htmlFor="approver_id" className="block text-sm font-medium text-gray-700 mb-1">
            Người phê duyệt <span className="text-red-500">*</span>
          </label>
          <select
            id="approver_id"
            name="approver_id"
            value={formData.approver_id}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              errors.approver_id ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value={0}>Chọn người phê duyệt</option>
            {approvers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
          {errors.approver_id && (
            <p className="mt-1 text-sm text-red-600">{errors.approver_id}</p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
          Trích yếu <span className="text-red-500">*</span>
        </label>
        <textarea
          id="summary"
          name="summary"
          value={formData.summary}
          onChange={handleInputChange}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
            errors.summary ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Nhập trích yếu nội dung văn bản"
        />
        {errors.summary && (
          <p className="mt-1 text-sm text-red-600">{errors.summary}</p>
        )}
      </div>

      {/* Internal Notes */}
      <div>
        <label htmlFor="internal_notes" className="block text-sm font-medium text-gray-700 mb-1">
          Ghi chú nội bộ
        </label>
        <textarea
          id="internal_notes"
          name="internal_notes"
          value={formData.internal_notes}
          onChange={handleInputChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Nhập ghi chú nội bộ (tùy chọn)"
        />
      </div>

      {/* File Management */}
      {document?.id && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Quản lý tệp đính kèm</label>
          
          {/* Enhanced File Upload */}
          <EnhancedFileUpload
            documentType="outgoing"
            documentId={document.id}
            onUploadSuccess={handleFileUploadSuccess}
            onUploadError={handleFileUploadError}
            maxFiles={5}
            maxSize={50}
            allowedTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif']}
            showPreview={true}
            className="border rounded-lg p-4"
          />

          {/* File Preview */}
          {loadingFiles ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Đang tải files...</span>
            </div>
          ) : (
            <FilePreview
              files={documentFiles}
              onDownload={handleFileDownload}
              onDelete={handleFileDelete}
              showActions={true}
              showThumbnails={true}
              className="border rounded-lg p-4"
            />
          )}
        </div>
      )}

      {!document?.id && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            💡 Bạn có thể upload files sau khi tạo văn bản thành công.
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
              Đang xử lý...
            </>
          ) : (
            document ? 'Cập nhật' : 'Tạo mới'
          )}
        </button>
      </div>
    </form>
  );
};