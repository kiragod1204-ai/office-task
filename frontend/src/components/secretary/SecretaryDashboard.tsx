import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { dashboardApi, DashboardStats } from '@/api/dashboard'
import { incomingDocumentApi, IncomingDocument } from '@/api/incoming-documents'
import { outgoingDocumentsApi, OutgoingDocument } from '@/api/outgoing-documents'
import { formatDate } from '@/lib/utils'
import {
  FileText,
  FilePlus,
  FileDown,
  FileUp,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Download,
  Eye,
  Edit,
  Plus
} from 'lucide-react'

export const SecretaryDashboard: React.FC = () => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [incomingDocuments, setIncomingDocuments] = useState<IncomingDocument[]>([])
  const [outgoingDocuments, setOutgoingDocuments] = useState<OutgoingDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [dashStats, incomingDocs, outgoingDocs] = await Promise.all([
        dashboardApi.getStats(),
        incomingDocumentApi.getAll().then(response => response.documents || []),
        outgoingDocumentsApi.getOutgoingDocuments()
      ])
      setDashboardStats(dashStats)
      setIncomingDocuments(incomingDocs)
      setOutgoingDocuments(outgoingDocs)
    } catch (error) {
      console.error('Error fetching secretary dashboard data:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải dữ liệu dashboard",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredIncomingDocs = incomingDocuments.filter(doc =>
    doc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.original_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.issuing_unit?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredOutgoingDocs = outgoingDocuments.filter(doc =>
    doc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển Văn thư</h1>
          <p className="text-gray-600">Quản lý văn bản đến và văn bản đi</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => navigate('/incoming-documents/new')}>
            <FilePlus className="w-4 h-4 mr-2" />
            Văn bản đến
          </Button>
          <Button variant="outline" onClick={() => navigate('/outgoing-documents/new')}>
            <FileUp className="w-4 h-4 mr-2" />
            Văn bản đi
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Văn bản đến hôm nay</CardTitle>
            <FileDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardStats?.incoming_files.today_count || 0}
            </div>
            <p className="text-xs text-gray-600">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Tháng này: {dashboardStats?.incoming_files.this_month_count || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng văn bản đến</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardStats?.incoming_files.total_count || 0}
            </div>
            <p className="text-xs text-gray-600">
              <Calendar className="w-3 h-3 inline mr-1" />
              Số thứ tự mới nhất: {dashboardStats?.incoming_files.latest_order || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Văn bản đi</CardTitle>
            <FileUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {outgoingDocuments.length}
            </div>
            <p className="text-xs text-gray-600">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Đã phê duyệt: {outgoingDocuments.filter(d => d.status === 'approved').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ xử lý</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {incomingDocuments.filter(d => d.status === 'received').length}
            </div>
            <p className="text-xs text-gray-600">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              Cần chuyển tiếp
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Document Entry Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FilePlus className="w-5 h-5 mr-2" />
            Thao tác nhanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/incoming-documents/new')}
            >
              <FileDown className="w-8 h-8" />
              <div className="text-center">
                <p className="font-medium">Nhập văn bản đến</p>
                <p className="text-sm opacity-80">Đăng ký văn bản mới nhận</p>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/outgoing-documents/new')}
            >
              <FileUp className="w-8 h-8" />
              <div className="text-center">
                <p className="font-medium">Tạo văn bản đi</p>
                <p className="text-sm opacity-80">Soạn thảo văn bản mới</p>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => navigate('/documents/search')}
            >
              <Search className="w-8 h-8" />
              <div className="text-center">
                <p className="font-medium">Tìm kiếm văn bản</p>
                <p className="text-sm opacity-80">Tra cứu nhanh</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Tìm kiếm và lọc
            </CardTitle>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Bộ lọc nâng cao
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Tìm kiếm theo số văn bản, tóm tắt, đơn vị..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FileDown className="w-5 h-5 mr-2" />
                Văn bản đến gần đây
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/incoming-documents')}>
                Xem tất cả
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredIncomingDocs.slice(0, 5).map((doc) => (
                <div key={doc.ID} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      doc.status === 'received' ? 'bg-yellow-500' :
                      doc.status === 'forwarded' ? 'bg-blue-500' :
                      doc.status === 'assigned' ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Số {doc.arrival_number}: {doc.summary}
                    </p>
                    <p className="text-xs text-gray-600">
                      {doc.issuing_unit?.name} • {formatDate(doc.arrival_date)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/incoming-documents/${doc.ID}`)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/incoming-documents/${doc.ID}/edit`)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredIncomingDocs.length === 0 && (
                <p className="text-center text-gray-500 py-4">Không có văn bản đến nào</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Outgoing Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FileUp className="w-5 h-5 mr-2" />
                Văn bản đi gần đây
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/outgoing-documents')}>
                Xem tất cả
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredOutgoingDocs.slice(0, 5).map((doc) => (
                <div key={doc.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      doc.status === 'draft' ? 'bg-gray-500' :
                      doc.status === 'pending' ? 'bg-yellow-500' :
                      doc.status === 'approved' ? 'bg-green-500' :
                      doc.status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Số {doc.document_number}: {doc.summary}
                    </p>
                    <p className="text-xs text-gray-600">
                      {doc.drafter?.name} • {formatDate(doc.issue_date)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/outgoing-documents/${doc.id}`)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/outgoing-documents/${doc.id}/edit`)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredOutgoingDocs.length === 0 && (
                <p className="text-center text-gray-500 py-4">Không có văn bản đi nào</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Tình trạng xử lý
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Incoming Document Status */}
            <div>
              <h4 className="font-medium mb-3">Văn bản đến</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Chờ xử lý</span>
                  </div>
                  <span className="text-sm font-medium">
                    {incomingDocuments.filter(d => d.status === 'received').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Đã chuyển tiếp</span>
                  </div>
                  <span className="text-sm font-medium">
                    {incomingDocuments.filter(d => d.status === 'forwarded').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Đã giao việc</span>
                  </div>
                  <span className="text-sm font-medium">
                    {incomingDocuments.filter(d => d.status === 'assigned').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Outgoing Document Status */}
            <div>
              <h4 className="font-medium mb-3">Văn bản đi</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-sm">Bản thảo</span>
                  </div>
                  <span className="text-sm font-medium">
                    {outgoingDocuments.filter(d => d.status === 'draft').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Chờ duyệt</span>
                  </div>
                  <span className="text-sm font-medium">
                    {outgoingDocuments.filter(d => d.status === 'pending').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Đã duyệt</span>
                  </div>
                  <span className="text-sm font-medium">
                    {outgoingDocuments.filter(d => d.status === 'approved').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="font-medium mb-3">Thao tác nhanh</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Xuất báo cáo
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  In danh sách
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo mẫu
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}