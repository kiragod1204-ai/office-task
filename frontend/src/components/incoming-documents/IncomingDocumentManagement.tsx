import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { IncomingDocumentForm } from './IncomingDocumentForm';
import { IncomingDocumentList } from './IncomingDocumentList';
import { ProcessorAssignmentDialog } from './ProcessorAssignmentDialog';
import { ViewDocumentFiles } from '../common/ViewDocumentFiles';
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
  const navigate = useNavigate();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<IncomingDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check if user can create documents (Secretary or Admin)
  const canCreateDocument = user?.role === 'Văn thư' || user?.role === 'Quản trị viên';
  


  // Check if user can assign processors
  const canAssignProcessor = user?.role === 'Văn thư' || 
                            user?.role === 'Trưởng Công An Xã' || 
                            user?.role === 'Phó Công An Xã' || 
                            user?.role === 'Quản trị viên';

  const handleCreateDocument = async (data: CreateIncomingDocumentRequest) => {
    try {
      setLoading(true);
      const createdDocument = await incomingDocumentApi.create(data);
      
      toast({
        title: 'Thành công',
        description: 'Tạo văn bản đến thành công',
      });
      
      setShowCreateDialog(false);
      // Refresh the list
      setRefreshKey(prev => prev + 1);
      
      return createdDocument;
    } catch (error: any) {
      console.error('Error creating document:', error);
      toast({
        title: 'Lỗi',
        description: error.response?.data?.error || 'Không thể tạo văn bản đến',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDocument = async (data: UpdateIncomingDocumentRequest) => {
    if (!selectedDocument) return;

    try {
      setLoading(true);
      const updatedDocument = await incomingDocumentApi.update(selectedDocument.ID, data);
      
      toast({
        title: 'Thành công',
        description: 'Cập nhật văn bản đến thành công',
      });
      
      setShowEditDialog(false);
      setSelectedDocument(null);
      // Refresh the list
      setRefreshKey(prev => prev + 1);
      
      return updatedDocument;
    } catch (error: any) {
      console.error('Error updating document:', error);
      toast({
        title: 'Lỗi',
        description: error.response?.data?.error || 'Không thể cập nhật văn bản đến',
        variant: 'destructive',
      });
      throw error;
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
      
      // Refresh the list
      setRefreshKey(prev => prev + 1);
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
    navigate(`/incoming-documents/${document.ID}`);
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
    // Refresh the list
    setRefreshKey(prev => prev + 1);
  };

  const handleFileDownload = async (filePath: string, fileName: string) => {
    try {
      const { downloadFile } = await import('../../api/files');
      await downloadFile(filePath, fileName);
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
        onEdit={handleEditDocument}
        onDelete={handleDeleteDocument}
        onAssignProcessor={canAssignProcessor ? handleAssignProcessor : undefined}
        refreshKey={refreshKey}
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