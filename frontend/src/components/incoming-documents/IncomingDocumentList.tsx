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
  Building,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

interface IncomingDocumentListProps {
  onEdit?: (document: IncomingDocument) => void;
  onView?: (document: IncomingDocument) => void;
  onDelete?: (document: IncomingDocument) => void;
  onAssignProcessor?: (document: IncomingDocument) => void;
  refreshKey?: number;
}

export const IncomingDocumentList: React.FC<IncomingDocumentListProps> = ({
  onEdit,
  onView,
  onDelete,
  onAssignProcessor,
  refreshKey,
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

  // Reload when refreshKey changes
  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      loadDocuments();
    }
  }, [refreshKey]);

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



  const handleDownloadFiles = async (document: IncomingDocument) => {
    try {
      // Import the files API
      const { getFilesByDocument, downloadFile } = await import('../../api/files');
      
      // Get all files for this document
      const files = await getFilesByDocument('incoming', document.ID);
      
      if (files.length === 0) {
        toast({
          title: 'Thông báo',
          description: 'Văn bản này chưa có file đính kèm',
          variant: 'default',
        });
        return;
      }

      // If only one file, download it directly
      if (files.length === 1) {
        await downloadFile(files[0].file_path, files[0].original_name);
        toast({
          title: 'Thành công',
          description: 'Tải file thành công',
        });
        return;
      }

      // If multiple files, download them one by one
      for (const file of files) {
        try {
          await downloadFile(file.file_path, file.original_name);
        } catch (error) {
          console.error(`Error downloading file ${file.original_name}:`, error);
        }
      }
      
      toast({
        title: 'Thành công',
        description: `Tải xuống ${files.length} files thành công`,
      });
    } catch (error) {
      console.error('Error downloading files:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải files xuống',
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

      {/* Document List - Table Layout */}
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Số đến
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Số gốc
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ngày đến
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Loại VB
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Trích yếu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Đơn vị BH
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Người xử lý
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Công việc
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map((document) => (
                    <tr 
                      key={document.ID} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => onView && onView(document)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-primary">
                        {document.arrival_number}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {document.original_number}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {format(new Date(document.arrival_date), 'dd/MM/yyyy')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {document.document_type.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="truncate max-w-md" title={document.summary}>
                          {document.summary}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate max-w-[200px]" title={document.issuing_unit.name}>
                            {document.issuing_unit.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {document.processor ? (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            {document.processor.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Chưa gán</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {document.tasks && document.tasks.length > 0 ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs font-semibold">
                              {document.tasks.length} CV
                            </Badge>
                            {document.tasks.slice(0, 2).map((task) => (
                              <div key={task.ID} className="text-xs text-muted-foreground truncate max-w-[150px]" title={task.description}>
                                • {task.description}
                              </div>
                            ))}
                            {document.tasks.length > 2 && (
                              <div className="text-xs text-muted-foreground italic">
                                +{document.tasks.length - 2} khác
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Chưa có CV</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(document.status)} className="text-xs">
                          {INCOMING_DOCUMENT_STATUS_LABELS[document.status as keyof typeof INCOMING_DOCUMENT_STATUS_LABELS]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {onView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(document)}
                              title="Xem chi tiết"
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(document)}
                              title="Chỉnh sửa"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}

                          {onAssignProcessor && !document.processor_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAssignProcessor(document)}
                              title="Gán người xử lý"
                              className="h-8 w-8 p-0"
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFiles(document);
                            }}
                            title="Tải xuống files"
                            className="h-8 w-8 p-0"
                          >
                            <Download className="w-4 h-4" />
                          </Button>

                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(document)}
                              title="Xóa"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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