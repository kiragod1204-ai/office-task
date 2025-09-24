import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { IncomingDocumentForm } from './IncomingDocumentForm';
import { IncomingDocumentList } from './IncomingDocumentList';
import { ProcessorAssignmentDialog } from './ProcessorAssignmentDialog';
import { 
  IncomingDocument, 
  CreateIncomingDocumentRequest, 
  UpdateIncomingDocumentRequest,
  incomingDocumentApi 
} from '../../api/incoming-documents';
import { useToast } from '../../hooks/use-toast';
import { Plus, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const IncomingDocumentManagement: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<IncomingDocument | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user can create documents (Secretary or Admin)
  const canCreateDocument = user?.role === 'Văn thư' || user?.role === 'Quản trị viên';
  
  // Check if user can edit documents
  const canEditDocument = (document: IncomingDocument) => {
    if (user?.role === 'Văn thư' || user?.role === 'Quản trị viên') {
      return true;
    }
    if (user?.role === 'Trưởng Công An Xã' || user?.role === 'Phó Công An Xã') {
      return document.processor_id === user.id || document.created_by_id === user.id;
    }
    return false;
  };

  // Check if user can delete documents
  const canDeleteDocument = (document: IncomingDocument) => {
    if (user?.role === 'Văn thư' || user?.role === 'Quản trị viên') {
      return true;
    }
    if (user?.role === 'Trưởng Công An Xã') {
      return document.created_by_id === user.id;
    }
    return false;
  };

  // Check if user can assign processors
  const canAssignProcessor = user?.role === 'Văn thư' || 
                            user?.role === 'Trưởng Công An Xã' || 
                            user?.role === 'Phó Công An Xã' || 
                            user?.role === 'Quản trị viên';

  const handleCreateDocument = async (data: CreateIncomingDocumentRequest) => {
    try {
      setLoading(true);
      await incomingDocumentApi.create(data);
      
      toast({
        title: 'Thành công',
        description: 'Tạo văn bản đến thành công',
      });
      
      setShowCreateDialog(false);
      // Refresh the list by triggering a re-render
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating document:', error);
      toast({
        title: 'Lỗi',
        description: error.response?.data?.error || 'Không thể tạo văn bản đến',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDocument = async (data: UpdateIncomingDocumentRequest) => {
    if (!selectedDocument) return;

    try {
      setLoading(true);
      await incomingDocumentApi.update(selectedDocument.ID, data);
      
      toast({
        title: 'Thành công',
        description: 'Cập nhật văn bản đến thành công',
      });
      
      setShowEditDialog(false);
      setSelectedDocument(null);
      // Refresh the list by triggering a re-render
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating document:', error);
      toast({
        title: 'Lỗi',
        description: error.response?.data?.error || 'Không thể cập nhật văn bản đến',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (document: IncomingDocument) => {
    if (!confirm('Bạn có chắc chắn muốn xóa văn bản này?')) {
      return;
    }

    try {
      await incomingDocumentApi.delete(document.ID);
      
      toast({
        title: 'Thành công',
        description: 'Xóa văn bản đến thành công',
      });
      
      // Refresh the list by triggering a re-render
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Lỗi',
        description: error.response?.data?.error || 'Không thể xóa văn bản đến',
        variant: 'destructive',
      });
    }
  };

  const handleViewDocument = (document: IncomingDocument) => {
    setSelectedDocument(document);
    setShowViewDialog(true);
  };

  const handleEditDocument = (document: IncomingDocument) => {
    setSelectedDocument(document);
    setShowEditDialog(true);
  };

  const handleAssignProcessor = (document: IncomingDocument) => {
    setSelectedDocument(document);
    setShowAssignDialog(true);
  };

  const handleAssignmentSuccess = () => {
    toast({
      title: 'Thành công',
      description: 'Gán người xử lý thành công',
    });
    // Refresh the list by triggering a re-render
    window.location.reload();
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Quản lý văn bản đến</h1>
            <p className="text-muted-foreground">
              Tiếp nhận, xử lý và theo dõi văn bản đến
            </p>
          </div>
        </div>
        
        {canCreateDocument && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm văn bản đến
          </Button>
        )}
      </div>

      {/* Document List */}
      <IncomingDocumentList
        onView={handleViewDocument}
        onEdit={canEditDocument(selectedDocument || {} as IncomingDocument) ? handleEditDocument : undefined}
        onDelete={canDeleteDocument(selectedDocument || {} as IncomingDocument) ? handleDeleteDocument : undefined}
        onAssignProcessor={canAssignProcessor ? handleAssignProcessor : undefined}
      />

      {/* Create Document Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm văn bản đến mới</DialogTitle>
          </DialogHeader>
          <IncomingDocumentForm
            onSubmit={handleCreateDocument}
            onCancel={() => setShowCreateDialog(false)}
            isLoading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa văn bản đến</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <IncomingDocumentForm
              document={selectedDocument}
              onSubmit={handleUpdateDocument}
              onCancel={() => setShowEditDialog(false)}
              isLoading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết văn bản đến</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-6">
              {/* Document Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Số đến</label>
                  <p className="text-lg font-semibold">{selectedDocument.arrival_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Số văn bản gốc</label>
                  <p className="text-lg">{selectedDocument.original_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ngày đến</label>
                  <p>{new Date(selectedDocument.arrival_date).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ngày văn bản</label>
                  <p>{new Date(selectedDocument.document_date).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Loại văn bản</label>
                  <p>{selectedDocument.document_type.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Đơn vị ban hành</label>
                  <p>{selectedDocument.issuing_unit.name}</p>
                </div>
                {selectedDocument.processor && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Người xử lý</label>
                    <p>{selectedDocument.processor.name} ({selectedDocument.processor.role})</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Người tạo</label>
                  <p>{selectedDocument.created_by.name}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Trích yếu</label>
                <p className="mt-1 p-3 bg-muted rounded">{selectedDocument.summary}</p>
              </div>

              {selectedDocument.internal_notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ghi chú nội bộ</label>
                  <p className="mt-1 p-3 bg-muted rounded">{selectedDocument.internal_notes}</p>
                </div>
              )}

              {selectedDocument.file_path && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">File đính kèm</label>
                  <div className="mt-1">
                    <Button
                      variant="outline"
                      onClick={() => {
                        incomingDocumentApi.downloadFile(selectedDocument.file_path)
                          .then(blob => {
                            const url = window.URL.createObjectURL(blob);
                            const a = window.document.createElement('a');
                            a.href = url;
                            a.download = `${selectedDocument.original_number}_${selectedDocument.arrival_number}.pdf`;
                            window.document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            window.document.body.removeChild(a);
                          })
                          .catch(() => {
                            toast({
                              title: 'Lỗi',
                              description: 'Không thể tải file xuống',
                              variant: 'destructive',
                            });
                          });
                      }}
                    >
                      Tải xuống file
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setShowViewDialog(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Processor Assignment Dialog */}
      <ProcessorAssignmentDialog
        document={selectedDocument}
        isOpen={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        onSuccess={handleAssignmentSuccess}
      />
    </div>
  );
};