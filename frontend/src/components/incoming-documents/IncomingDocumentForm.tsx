import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DocumentTypeSelect } from '../common/DocumentTypeSelect';
import { IssuingUnitSelect } from '../common/IssuingUnitSelect';
import EnhancedFileUpload from '../common/EnhancedFileUpload';
import FilePreview from '../common/FilePreview';
import { 
  IncomingDocument,
  Processor,
  incomingDocumentApi 
} from '../../api/incoming-documents';
import { getFilesByDocument, downloadFile, deleteFile } from '../../api/files';
import { useToast } from '../../hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface IncomingDocumentFormProps {
  document?: IncomingDocument;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const IncomingDocumentForm: React.FC<IncomingDocumentFormProps> = ({
  document,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [loadingProcessors, setLoadingProcessors] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const [formData, setFormData] = useState({
    arrival_date: document ? document.arrival_date.split('T')[0] : new Date().toISOString().split('T')[0],
    original_number: document?.original_number || '',
    document_date: document ? document.document_date.split('T')[0] : '',
    document_type_id: document?.document_type_id || 0,
    issuing_unit_id: document?.issuing_unit_id || 0,
    summary: document?.summary || '',
    internal_notes: document?.internal_notes || '',
    processor_id: document?.processor_id || undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load processors and files on component mount
  useEffect(() => {
    loadProcessors();
    if (document?.ID) {
      loadDocumentFiles();
    }
  }, [document?.ID]);

  const loadProcessors = async () => {
    try {
      setLoadingProcessors(true);
      const data = await incomingDocumentApi.getProcessors();
      setProcessors(data);
    } catch (error) {
      console.error('Error loading processors:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách người xử lý',
        variant: 'destructive',
      });
    } finally {
      setLoadingProcessors(false);
    }
  };

  const loadDocumentFiles = async () => {
    if (!document?.ID) return;
    
    try {
      setLoadingFiles(true);
      const files = await getFilesByDocument('incoming', document.ID);
      setDocumentFiles(files);
    } catch (error) {
      console.error('Error loading document files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.original_number.trim()) {
      newErrors.original_number = 'Số văn bản gốc là bắt buộc';
    }

    if (!formData.document_date) {
      newErrors.document_date = 'Ngày văn bản là bắt buộc';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        ...formData,
        processor_id: formData.processor_id || undefined,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {document ? 'Chỉnh sửa văn bản đến' : 'Thêm văn bản đến mới'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Arrival Date */}
            <div className="space-y-2">
              <Label htmlFor="arrival_date">Ngày đến *</Label>
              <Input
                id="arrival_date"
                type="date"
                value={formData.arrival_date}
                onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                className={errors.arrival_date ? 'border-red-500' : ''}
              />
              {errors.arrival_date && (
                <p className="text-sm text-red-500">{errors.arrival_date}</p>
              )}
            </div>

            {/* Document Date */}
            <div className="space-y-2">
              <Label htmlFor="document_date">Ngày văn bản *</Label>
              <Input
                id="document_date"
                type="date"
                value={formData.document_date}
                onChange={(e) => setFormData({ ...formData, document_date: e.target.value })}
                className={errors.document_date ? 'border-red-500' : ''}
              />
              {errors.document_date && (
                <p className="text-sm text-red-500">{errors.document_date}</p>
              )}
            </div>

            {/* Original Number */}
            <div className="space-y-2">
              <Label htmlFor="original_number">Số văn bản gốc *</Label>
              <Input
                id="original_number"
                value={formData.original_number}
                onChange={(e) => setFormData({ ...formData, original_number: e.target.value })}
                placeholder="Nhập số văn bản gốc"
                className={errors.original_number ? 'border-red-500' : ''}
              />
              {errors.original_number && (
                <p className="text-sm text-red-500">{errors.original_number}</p>
              )}
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="document_type">Loại văn bản *</Label>
              <DocumentTypeSelect
                value={formData.document_type_id}
                onChange={(value) => setFormData({ ...formData, document_type_id: value })}
                className={errors.document_type_id ? 'border-red-500' : ''}
              />
              {errors.document_type_id && (
                <p className="text-sm text-red-500">{errors.document_type_id}</p>
              )}
            </div>

            {/* Issuing Unit */}
            <div className="space-y-2">
              <Label htmlFor="issuing_unit">Đơn vị ban hành *</Label>
              <IssuingUnitSelect
                value={formData.issuing_unit_id}
                onChange={(value) => setFormData({ ...formData, issuing_unit_id: value })}
                className={errors.issuing_unit_id ? 'border-red-500' : ''}
              />
              {errors.issuing_unit_id && (
                <p className="text-sm text-red-500">{errors.issuing_unit_id}</p>
              )}
            </div>

            {/* Processor */}
            <div className="space-y-2">
              <Label htmlFor="processor">Người xử lý</Label>
              <select
                id="processor"
                value={formData.processor_id || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  processor_id: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loadingProcessors}
              >
                <option value="">Chọn người xử lý</option>
                {processors.map((processor) => (
                  <option key={processor.ID} value={processor.ID}>
                    {processor.name} ({processor.role})
                  </option>
                ))}
              </select>
              {loadingProcessors && (
                <p className="text-sm text-muted-foreground">Đang tải danh sách người xử lý...</p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Trích yếu *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Nhập trích yếu nội dung văn bản"
              rows={3}
              className={errors.summary ? 'border-red-500' : ''}
            />
            {errors.summary && (
              <p className="text-sm text-red-500">{errors.summary}</p>
            )}
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="internal_notes">Ghi chú nội bộ</Label>
            <Textarea
              id="internal_notes"
              value={formData.internal_notes}
              onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
              placeholder="Nhập ghi chú nội bộ (không bắt buộc)"
              rows={2}
            />
          </div>

          {/* File Management */}
          {document?.ID && (
            <div className="space-y-4">
              <Label>Quản lý tệp đính kèm</Label>
              
              {/* Enhanced File Upload */}
              <EnhancedFileUpload
                documentType="incoming"
                documentId={document.ID}
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

          {!document?.ID && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                💡 Bạn có thể upload files sau khi tạo văn bản thành công.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {document ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};