import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IncomingDocumentForm } from '@/components/incoming-documents/IncomingDocumentForm';
import { IncomingDocument, UpdateIncomingDocumentRequest, incomingDocumentApi } from '@/api/incoming-documents';
import { useToast } from '@/hooks/use-toast';

interface EditIncomingDocumentDialogProps {
  document: IncomingDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditIncomingDocumentDialog: React.FC<EditIncomingDocumentDialogProps> = ({
  document,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (data: UpdateIncomingDocumentRequest) => {
    if (!document) return;
    
    setLoading(true);
    try {
      await incomingDocumentApi.update(document.ID, data);
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật văn bản đến',
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
          <DialogTitle>Chỉnh sửa văn bản đến</DialogTitle>
        </DialogHeader>
        <IncomingDocumentForm
          document={document}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={loading}
        />
      </DialogContent>
    </Dialog>
  );
};
