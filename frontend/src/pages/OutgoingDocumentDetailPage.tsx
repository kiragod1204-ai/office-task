import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { outgoingDocumentApi, OutgoingDocument } from '@/api/outgoing-documents';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FilePreview } from '@/components/common/FilePreviewModal';
import { EditOutgoingDocumentDialog } from '@/components/common/EditOutgoingDocumentDialog';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Building2,
  User,
  Clock,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Eye,
  Printer,
} from 'lucide-react';
import { format } from 'date-fns';

export const OutgoingDocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [document, setDocument] = useState<OutgoingDocument | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ path: string; name: string; mimeType: string } | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadDocument();
      loadTasks();
      loadFiles();
    }
  }, [id]);

  const loadDocument = async () => {
    try {
      const data = await outgoingDocumentApi.getOutgoingDocument(Number(id));
      setDocument(data);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.error || 'Không thể tải thông tin văn bản',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch(`/api/outgoing-documents/${id}/tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadFiles = async () => {
    try {
      const response = await fetch(`/api/outgoing-documents/${id}/files`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    setUploading(true);
    try {
      await outgoingDocumentApi.uploadFile(Number(id), file);
      toast({
        title: 'Thành công',
        description: 'Upload file thành công',
      });
      loadFiles();
      loadDocument();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.error || 'Không thể upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: 'Bản thảo', variant: 'secondary' },
      review: { label: 'Đang xem xét', variant: 'default' },
      approved: { label: 'Đã phê duyệt', variant: 'outline' },
      sent: { label: 'Đã gửi', variant: 'outline' },
      rejected: { label: 'Từ chối', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canUploadFile = () => {
    if (!user) return false;
    const role = user.role;
    return role === 'Văn thư' || role === 'Quản trị viên' || 
           role === 'Trưởng Công An Xã' || role === 'Phó Công An Xã' ||
           role === 'Cán bộ';
  };

  const canApprove = () => {
    if (!user || !document) return false;
    const role = user.role;
    return (role === 'Trưởng Công An Xã' || role === 'Phó Công An Xã' || role === 'Quản trị viên') &&
           (document.status === 'draft' || document.status === 'review');
  };

  const canSend = () => {
    if (!user || !document) return false;
    const role = user.role;
    return (role === 'Văn thư' || role === 'Quản trị viên') && document.status === 'approved';
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      await fetch(`/api/outgoing-documents/${id}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action: 'approve' }),
      });
      toast({
        title: 'Thành công',
        description: 'Đã phê duyệt văn bản',
      });
      loadDocument();
      setShowApprovalDialog(false);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể phê duyệt văn bản',
        variant: 'destructive',
      });
    }
  };

  const handleSend = async () => {
    if (!id) return;
    try {
      await fetch(`/api/outgoing-documents/${id}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action: 'send' }),
      });
      toast({
        title: 'Thành công',
        description: 'Đã gửi văn bản',
      });
      loadDocument();
      setShowSendDialog(false);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi văn bản',
        variant: 'destructive',
      });
    }
  };

  const handleEditSuccess = () => {
    loadDocument();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Không tìm thấy văn bản</p>
        <Button onClick={() => navigate('/outgoing-documents')} className="mt-4">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/outgoing-documents')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Văn bản đi {document.document_number}
            </h1>
            <p className="text-sm text-gray-600 mt-1">{document.summary}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(document.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin văn bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Số văn bản</label>
                  <p className="text-base font-semibold">{document.document_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Ngày ban hành</label>
                  <p className="text-base flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {document.issue_date ? format(new Date(document.issue_date), 'dd/MM/yyyy') : 'Chưa có'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Loại văn bản</label>
                  <p className="text-base flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-gray-400" />
                    {document.document_type.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Đơn vị ban hành</label>
                  <p className="text-base flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                    {document.issuing_unit.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Người soạn thảo</label>
                  <p className="text-base flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    {document.drafter.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Người phê duyệt</label>
                  <p className="text-base flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    {document.approver.name}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Trích yếu</label>
                <p className="text-base mt-1">{document.summary}</p>
              </div>

              {document.internal_notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Ghi chú nội bộ</label>
                  <p className="text-base mt-1 text-gray-700">{document.internal_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Files */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>File đính kèm</CardTitle>
                  <CardDescription>Tổng số: {files.length} file</CardDescription>
                </div>
                {canUploadFile() && (
                  <div>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    <Button
                      size="sm"
                      onClick={() => window.document.getElementById('file-upload')?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload file
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Chưa có file đính kèm</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {files.filter(file => file && file.original_name).map((file, index) => (
                    <div
                      key={file.id || index}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <FileText className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 break-words">{file.original_name}</p>
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">Kích thước:</span>
                                <span className="font-medium">
                                  {file.file_size ? (file.file_size / 1024 / 1024 >= 1 
                                    ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB`
                                    : `${(file.file_size / 1024).toFixed(2)} KB`) : '0 KB'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">Loại file:</span>
                                <span className="font-medium">{file.mime_type || 'N/A'}</span>
                              </div>
                              {file.uploaded_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-500">Tải lên:</span>
                                  <span className="font-medium">
                                    {format(new Date(file.uploaded_at), 'dd/MM/yyyy HH:mm')}
                                  </span>
                                </div>
                              )}
                              {file.access_level && (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">Quyền truy cập:</span>
                                  <span className="font-medium">{file.access_level}</span>
                                </div>
                              )}
                            </div>
                            {file.summary && (
                              <p className="mt-2 text-sm text-gray-600 italic">{file.summary}</p>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={async () => {
                            try {
                              const { downloadFile } = await import('@/api/files');
                              await downloadFile(file.file_path, file.original_name);
                              toast({
                                title: 'Thành công',
                                description: 'Tải file thành công',
                              });
                            } catch (error) {
                              toast({
                                title: 'Lỗi',
                                description: 'Không thể tải file xuống',
                                variant: 'destructive',
                              });
                            }
                          }}
                          className="flex-shrink-0"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {(file.mime_type === 'application/pdf' || file.mime_type?.startsWith('image/')) && (
                          <>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setPreviewFile({
                                path: file.file_path,
                                name: file.original_name,
                                mimeType: file.mime_type
                              })}
                              className="flex-shrink-0"
                              title="Xem trước"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {file.mime_type === 'application/pdf' && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem('token');
                                    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api';
                                    const response = await fetch(
                                      `${baseUrl}/files/preview?path=${encodeURIComponent(file.file_path)}`,
                                      { headers: { 'Authorization': `Bearer ${token}` } }
                                    );
                                    
                                    if (!response.ok) {
                                      throw new Error('Không thể tải file');
                                    }
                                    
                                    const blob = await response.blob();
                                    const url = URL.createObjectURL(blob);
                                    
                                    // Open in new window for printing
                                    const printWindow = window.open(url, '_blank');
                                    
                                    if (printWindow) {
                                      printWindow.onload = () => {
                                        printWindow.focus();
                                        setTimeout(() => {
                                          printWindow.print();
                                        }, 250);
                                      };
                                      
                                      // Cleanup after print dialog closes
                                      setTimeout(() => {
                                        URL.revokeObjectURL(url);
                                      }, 60000);
                                    } else {
                                      toast({
                                        title: 'Lỗi',
                                        description: 'Vui lòng cho phép popup để in file',
                                        variant: 'destructive',
                                      });
                                      URL.revokeObjectURL(url);
                                    }
                                  } catch (error) {
                                    console.error('Print error:', error);
                                    toast({
                                      title: 'Lỗi',
                                      description: 'Không thể in file',
                                      variant: 'destructive',
                                    });
                                  }
                                }}
                                className="flex-shrink-0"
                                title="In"
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Tasks */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Công việc liên quan</CardTitle>
                <CardDescription>Tổng số: {tasks.length} công việc</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Chưa có công việc liên quan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task: any) => (
                    <Link
                      key={task.ID}
                      to={`/tasks/${task.ID}`}
                      className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{task.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {task.assigned_to?.name || 'Chưa gán'}
                            </span>
                            {task.deadline && task.deadline !== '0001-01-01T00:00:00Z' && (
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {format(new Date(task.deadline), 'dd/MM/yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant={task.status === 'Hoàn thành' ? 'outline' : 'default'}>
                          {task.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setShowEditDialog(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Chỉnh sửa văn bản
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                disabled={!canApprove()}
                onClick={() => setShowApprovalDialog(true)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Phê duyệt
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                disabled={!canSend()}
                onClick={() => setShowSendDialog(true)}
              >
                <Send className="w-4 h-4 mr-2" />
                Gửi văn bản
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Tạo văn bản</p>
                    <p className="text-xs text-gray-500">
                      {document.created_at ? format(new Date(document.created_at), 'dd/MM/yyyy HH:mm') : 'Chưa có'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Bởi {document.created_by?.name || 'Không rõ'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File Preview Dialog */}
      {previewFile && (
        <FilePreview
          filePath={previewFile.path}
          fileName={previewFile.name}
          mimeType={previewFile.mimeType}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={async () => {
            try {
              const { downloadFile } = await import('@/api/files');
              await downloadFile(previewFile.path, previewFile.name);
              toast({
                title: 'Thành công',
                description: 'Tải file thành công',
              });
            } catch (error) {
              toast({
                title: 'Lỗi',
                description: 'Không thể tải file xuống',
                variant: 'destructive',
              });
            }
          }}
        />
      )}

      {/* Edit Dialog */}
      <EditOutgoingDocumentDialog
        document={document}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phê duyệt văn bản</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn phê duyệt văn bản "{document?.document_number}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleApprove}>
              Phê duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gửi văn bản</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn gửi văn bản "{document?.document_number}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleSend}>
              Gửi văn bản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
