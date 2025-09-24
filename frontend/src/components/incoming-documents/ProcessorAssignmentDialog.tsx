import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { 
  IncomingDocument, 
  Processor, 

  incomingDocumentApi 
} from '../../api/incoming-documents';
import { useToast } from '../../hooks/use-toast';
import { Loader2, UserCheck } from 'lucide-react';

interface ProcessorAssignmentDialogProps {
  document: IncomingDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedDocument: IncomingDocument) => void;
}

export const ProcessorAssignmentDialog: React.FC<ProcessorAssignmentDialogProps> = ({
  document,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [selectedProcessorId, setSelectedProcessorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProcessors, setLoadingProcessors] = useState(false);

  // Load processors when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadProcessors();
      setSelectedProcessorId(document?.processor_id || null);
    }
  }, [isOpen, document]);

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

  const handleAssign = async () => {
    if (!document || !selectedProcessorId) {
      return;
    }

    try {
      setLoading(true);
      const updatedDocument = await incomingDocumentApi.assignProcessor(
        document.ID, 
        { processor_id: selectedProcessorId }
      );
      
      toast({
        title: 'Thành công',
        description: 'Đã gán người xử lý thành công',
      });
      
      onSuccess(updatedDocument);
      onClose();
    } catch (error) {
      console.error('Error assigning processor:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể gán người xử lý',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const selectedProcessor = processors.find(p => p.ID === selectedProcessorId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Gán người xử lý
          </DialogTitle>
        </DialogHeader>

        {document && (
          <div className="space-y-4">
            {/* Document Info */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium">Thông tin văn bản</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Số đến: {document.arrival_number}</div>
                <div>Số gốc: {document.original_number}</div>
                <div>Trích yếu: {document.summary}</div>
              </div>
            </div>

            {/* Current Processor */}
            {document.processor && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Người xử lý hiện tại</h4>
                <div className="text-sm text-blue-700">
                  {document.processor.name} ({document.processor.role})
                </div>
              </div>
            )}

            {/* Processor Selection */}
            <div className="space-y-2">
              <Label htmlFor="processor">
                {document.processor ? 'Chuyển cho người xử lý khác' : 'Chọn người xử lý'}
              </Label>
              
              {loadingProcessors ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang tải danh sách người xử lý...
                </div>
              ) : (
                <select
                  id="processor"
                  value={selectedProcessorId || ''}
                  onChange={(e) => setSelectedProcessorId(e.target.value ? parseInt(e.target.value) : null)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="">Chọn người xử lý</option>
                  {processors.map((processor) => (
                    <option key={processor.ID} value={processor.ID}>
                      {processor.name} ({processor.role})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selected Processor Info */}
            {selectedProcessor && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900">Người xử lý được chọn</h4>
                <div className="text-sm text-green-700">
                  {selectedProcessor.name} ({selectedProcessor.role})
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleAssign}
            disabled={loading || !selectedProcessorId || loadingProcessors}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {document?.processor ? 'Chuyển giao' : 'Gán người xử lý'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};