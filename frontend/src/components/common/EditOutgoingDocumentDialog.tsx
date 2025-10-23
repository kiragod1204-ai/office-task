import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OutgoingDocumentForm } from '@/components/outgoing-documents/OutgoingDocumentForm';
import { OutgoingDocument, UpdateOutgoingDocumentRequest, outgoingDocumentApi } from '@/api/outgoing-documents';
import { useToast } from '@/hooks/use-toast';

interface EditOutgoingDocumentDialogProps {
  document: OutgoingDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditOutgoingDocumentDialog: React.FC<EditOutgoingDocumentDialogProps> = ({
  document,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (data: UpdateOutgoingDocumentRequest) => {
    if (!document) return;
    
    setLoading(true);
    try {
      await outgoingDocumentApi.updateOutgoingDocument(document.id, data);
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật văn bản đi',
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating document:', error);
      toast({
        title: 'Lỗi',
        description: error.response?.data?.error || 'Không thể cập nhật văn bản',
        variant: 'destructive',
      });
      throw error; // Re-throw so form knows it failed
    } finally {
      setLoading(false);
    }
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa văn bản đi</DialogTitle>
        </DialogHeader>
        <OutgoingDocumentForm
          document={document}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={loading}
        />
      </DialogContent>
    </Dialog>
  );
};
