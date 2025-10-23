import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { tasksApi } from '@/api/tasks';
import { incomingDocumentApi, IncomingDocument } from '@/api/incoming-documents';
import { Search, Link, Unlink, FileText, Calendar, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface LinkIncomingDocumentDialogProps {
  taskId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LinkIncomingDocumentDialog: React.FC<LinkIncomingDocumentDialogProps> = ({
  taskId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<IncomingDocument[]>([]);
  const [linkedDocumentId, setLinkedDocumentId] = useState<number | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
      loadLinkedDocument();
    }
  }, [isOpen, taskId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await incomingDocumentApi.getAll({
        limit: 50
      });
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách văn bản đến',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedDocument = async () => {
    try {
      const task = await tasksApi.getTask(taskId);
      setLinkedDocumentId(task.incoming_document_id || null);
    } catch (error) {
      console.error('Error loading linked document:', error);
    }
  };

  const handleLink = async (documentId: number) => {
    setLinking(true);
    try {
      await tasksApi.linkIncomingDocument(taskId, {
        incoming_document_id: documentId
      });
      
      toast({
        title: 'Thành công',
        description: 'Đã liên kết văn bản đến với công việc',
      });
      
      setLinkedDocumentId(documentId);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.error || 'Không thể liên kết văn bản',
        variant: 'destructive',
      });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    setLinking(true);
    try {
      await tasksApi.unlinkIncomingDocument(taskId);
      
      toast({
        title: 'Thành công',
        description: 'Đã hủy liên kết văn bản đến',
      });
      
      setLinkedDocumentId(null);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.error || 'Không thể hủy liên kết văn bản',
        variant: 'destructive',
      });
    } finally {
      setLinking(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      String(doc.arrival_number).toLowerCase().includes(search) ||
      doc.original_number.toLowerCase().includes(search) ||
      doc.summary.toLowerCase().includes(search)
    );
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-gray-100 text-gray-800';
      case 'forwarded':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      received: 'Đã tiếp nhận',
      forwarded: 'Đã chuyển tiếp',
      assigned: 'Đã giao việc',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành'
    };
    return labels[status] || status;
  };

  const linkedDocument = linkedDocumentId ? documents.find(d => d.ID === linkedDocumentId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Link className="w-5 h-5 mr-2" />
            Liên kết văn bản đến
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Linked Document Section */}
          {linkedDocument && (
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-2 text-gray-700">
                Văn bản đã liên kết
              </h3>
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">
                      Số đến: {linkedDocument.arrival_number}
                    </span>
                    <Badge className={`text-xs ${getStatusBadgeClass(linkedDocument.status)}`}>
                      {getStatusLabel(linkedDocument.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 ml-6">
                    {linkedDocument.summary}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Số ký hiệu: {linkedDocument.original_number}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUnlink}
                  disabled={linking}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {linking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm văn bản đến..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Documents List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">Đang tải...</span>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Không tìm thấy văn bản đến</p>
              </div>
            ) : (
              filteredDocuments.map((doc) => {
                const linked = doc.ID === linkedDocumentId;
                return (
                  <div
                    key={doc.ID}
                    className={`p-3 border rounded-lg transition-colors ${
                      linked
                        ? 'bg-gray-50 border-gray-300'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-blue-600">
                            Số đến: {doc.arrival_number}
                          </span>
                          <Badge className={`text-xs ${getStatusBadgeClass(doc.status)}`}>
                            {getStatusLabel(doc.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{doc.summary}</p>
                        <p className="text-xs text-gray-500 mb-2">
                          Số ký hiệu: {doc.original_number}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(doc.arrival_date), 'dd/MM/yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {doc.document_type.name}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant={linked ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => linked ? handleUnlink() : handleLink(doc.ID)}
                        disabled={linking || (linkedDocumentId !== null && !linked)}
                        className={linked ? 'text-red-600 hover:text-red-700' : ''}
                      >
                        {linking ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : linked ? (
                          <>
                            <Unlink className="w-4 h-4 mr-1" />
                            Hủy
                          </>
                        ) : (
                          <>
                            <Link className="w-4 h-4 mr-1" />
                            Liên kết
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
