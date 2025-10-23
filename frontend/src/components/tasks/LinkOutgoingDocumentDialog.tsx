import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { tasksApi, TaskOutgoingDocument } from '@/api/tasks';
import { outgoingDocumentApi, OutgoingDocument } from '@/api/outgoing-documents';
import { Search, Link, Unlink, FileText, Calendar, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface LinkOutgoingDocumentDialogProps {
  taskId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LinkOutgoingDocumentDialog: React.FC<LinkOutgoingDocumentDialogProps> = ({
  taskId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<OutgoingDocument[]>([]);
  const [linkedDocuments, setLinkedDocuments] = useState<TaskOutgoingDocument[]>([]);
  const [linking, setLinking] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
      loadLinkedDocuments();
    }
  }, [isOpen, taskId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await outgoingDocumentApi.getOutgoingDocuments({
        limit: 50,
        sort_by: 'created_at',
        sort_order: 'desc'
      });
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách văn bản đi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedDocuments = async () => {
    try {
      const linked = await tasksApi.getTaskOutgoingDocuments(taskId);
      setLinkedDocuments(linked || []);
    } catch (error: any) {
      console.error('Error loading linked documents:', error);
      // Don't show error toast for 400/404 - just means no linked documents yet
      if (error.response?.status !== 400 && error.response?.status !== 404) {
        toast({
          title: 'Lỗi',
          description: 'Không thể tải danh sách văn bản liên kết',
          variant: 'destructive',
        });
      }
    }
  };

  const handleLink = async (documentId: number) => {
    setLinking(documentId);
    try {
      await tasksApi.linkOutgoingDocument(taskId, {
        outgoing_document_id: documentId
      });
      
      toast({
        title: 'Thành công',
        description: 'Đã liên kết văn bản đi với công việc',
      });
      
      await loadLinkedDocuments();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.error || 'Không thể liên kết văn bản',
        variant: 'destructive',
      });
    } finally {
      setLinking(null);
    }
  };

  const handleUnlink = async (documentId: number) => {
    setLinking(documentId);
    try {
      await tasksApi.unlinkOutgoingDocument(taskId, documentId);
      
      toast({
        title: 'Thành công',
        description: 'Đã hủy liên kết văn bản đi',
      });
      
      await loadLinkedDocuments();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.error || 'Không thể hủy liên kết văn bản',
        variant: 'destructive',
      });
    } finally {
      setLinking(null);
    }
  };

  const isLinked = (documentId: number) => {
    return linkedDocuments.some(ld => ld.outgoing_document_id === documentId);
  };

  const filteredDocuments = documents.filter(doc => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      doc.document_number.toLowerCase().includes(search) ||
      doc.summary.toLowerCase().includes(search)
    );
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Bản thảo',
      review: 'Đang xem xét',
      approved: 'Đã phê duyệt',
      sent: 'Đã gửi',
      rejected: 'Từ chối'
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Link className="w-5 h-5 mr-2" />
            Liên kết văn bản đi
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Linked Documents Section */}
          {linkedDocuments.length > 0 && (
            <div className="border-b pb-4">
              <h3 className="text-sm font-semibold mb-2 text-gray-700">
                Văn bản đã liên kết ({linkedDocuments.length})
              </h3>
              <div className="space-y-2">
                {linkedDocuments.map((linked) => (
                  <div
                    key={linked.ID}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-sm">
                          {linked.outgoing_document?.document_number}
                        </span>
                        <Badge className={`text-xs ${getStatusBadgeClass(linked.outgoing_document?.status || '')}`}>
                          {getStatusLabel(linked.outgoing_document?.status || '')}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 ml-6">
                        {linked.outgoing_document?.summary}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlink(linked.outgoing_document_id)}
                      disabled={linking === linked.outgoing_document_id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {linking === linked.outgoing_document_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Unlink className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm văn bản đi..."
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
                <p>Không tìm thấy văn bản đi</p>
              </div>
            ) : (
              filteredDocuments.map((doc) => {
                const linked = isLinked(doc.id);
                return (
                  <div
                    key={doc.id}
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
                            {doc.document_number}
                          </span>
                          <Badge className={`text-xs ${getStatusBadgeClass(doc.status)}`}>
                            {getStatusLabel(doc.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{doc.summary}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(doc.issue_date), 'dd/MM/yyyy')}
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
                        onClick={() => linked ? handleUnlink(doc.id) : handleLink(doc.id)}
                        disabled={linking === doc.id}
                        className={linked ? 'text-red-600 hover:text-red-700' : ''}
                      >
                        {linking === doc.id ? (
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
