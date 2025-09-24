import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  IncomingDocument, 
  IncomingDocumentFilters, 

  INCOMING_DOCUMENT_STATUS_LABELS,
  incomingDocumentApi 
} from '../../api/incoming-documents';
import { DocumentTypeSelect } from '../common/DocumentTypeSelect';
import { IssuingUnitSelect } from '../common/IssuingUnitSelect';
import { useToast } from '../../hooks/use-toast';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  UserCheck,
  Calendar,
  FileText,
  Building,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface IncomingDocumentListProps {
  onEdit?: (document: IncomingDocument) => void;
  onView?: (document: IncomingDocument) => void;
  onDelete?: (document: IncomingDocument) => void;
  onAssignProcessor?: (document: IncomingDocument) => void;
}

export const IncomingDocumentList: React.FC<IncomingDocumentListProps> = ({
  onEdit,
  onView,
  onDelete,
  onAssignProcessor,
}) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<IncomingDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });

  const [filters, setFilters] = useState<IncomingDocumentFilters>({
    page: 1,
    limit: 20,
  });

  const [showFilters, setShowFilters] = useState(false);

  // Load documents on component mount and when filters change
  useEffect(() => {
    loadDocuments();
  }, [filters]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await incomingDocumentApi.getAll(filters);
      setDocuments(response.documents);
      setPagination({
        total: response.pagination.total,
        page: response.pagination.page,
        limit: response.pagination.limit,
        pages: response.pagination.total_pages,
      });
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

  const handleFilterChange = (key: keyof IncomingDocumentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleDownloadFile = async (document: IncomingDocument) => {
    if (!document.file_path) {
      toast({
        title: 'Thông báo',
        description: 'Văn bản này chưa có file đính kèm',
        variant: 'default',
      });
      return;
    }

    try {
      const blob = await incomingDocumentApi.downloadFile(document.file_path);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.original_number}_${document.arrival_number}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải file xuống',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'received':
        return 'secondary';
      case 'forwarded':
        return 'default';
      case 'assigned':
        return 'outline';
      case 'processing':
        return 'default';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Danh sách văn bản đến</h2>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Bộ lọc
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bộ lọc tìm kiếm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Số văn bản, trích yếu..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Trạng thái</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Tất cả trạng thái</option>
                  {Object.entries(INCOMING_DOCUMENT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Loại văn bản</label>
                <DocumentTypeSelect
                  value={filters.document_type_id || 0}
                  onChange={(value) => handleFilterChange('document_type_id', value || undefined)}
                  allowEmpty
                  emptyLabel="Tất cả loại văn bản"
                />
              </div>

              {/* Issuing Unit */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Đơn vị ban hành</label>
                <IssuingUnitSelect
                  value={filters.issuing_unit_id || 0}
                  onChange={(value) => handleFilterChange('issuing_unit_id', value || undefined)}
                  allowEmpty
                  emptyLabel="Tất cả đơn vị"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Từ ngày</label>
                <Input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Đến ngày</label>
                <Input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
              <Button onClick={() => setShowFilters(false)}>
                Áp dụng
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy văn bản đến nào
            </div>
          ) : (
            <div className="divide-y">
              {documents.map((document) => (
                <div key={document.ID} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant={getStatusBadgeVariant(document.status)}>
                          {INCOMING_DOCUMENT_STATUS_LABELS[document.status as keyof typeof INCOMING_DOCUMENT_STATUS_LABELS]}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Số đến: {document.arrival_number}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Số gốc: {document.original_number}
                        </span>
                      </div>

                      {/* Summary */}
                      <h3 className="font-semibold text-lg leading-tight">
                        {document.summary}
                      </h3>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Ngày đến: {format(new Date(document.arrival_date), 'dd/MM/yyyy', { locale: vi })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>
                            Ngày VB: {format(new Date(document.document_date), 'dd/MM/yyyy', { locale: vi })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{document.issuing_unit.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>{document.document_type.name}</span>
                        </div>
                        {document.processor && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Người xử lý: {document.processor.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Tạo bởi: {document.created_by.name}</span>
                        </div>
                      </div>

                      {/* Internal Notes */}
                      {document.internal_notes && (
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          <strong>Ghi chú:</strong> {document.internal_notes}
                        </div>
                      )}

                      {/* Tasks */}
                      {document.tasks && document.tasks.length > 0 && (
                        <div className="text-sm">
                          <strong>Công việc liên quan:</strong>
                          <div className="mt-1 space-y-1">
                            {document.tasks.map((task) => (
                              <div key={task.ID} className="flex items-center gap-2 text-muted-foreground">
                                <span>• {task.description}</span>
                                {task.assigned_to && (
                                  <span className="text-xs">({task.assigned_to.name})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {onView && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onView(document)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(document)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}

                      {onAssignProcessor && !document.processor_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAssignProcessor(document)}
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      )}

                      {document.file_path && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadFile(document)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}

                      {onDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(document)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Trang {pagination.page} / {pagination.pages} 
            ({pagination.total} văn bản)
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};