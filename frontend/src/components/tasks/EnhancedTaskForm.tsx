import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { tasksApi, CreateTaskRequest } from '@/api/tasks'
import { usersApi, User } from '@/api/users'
import { incomingDocumentApi, IncomingDocument } from '@/api/incoming-documents'
import { 
  Calendar, 
  User as UserIcon, 
  FileText, 
  Clock, 
  Save,
  X,
  Search,

  CheckCircle
} from 'lucide-react'

interface EnhancedTaskFormProps {
  onSuccess?: (task: any) => void
  onCancel?: () => void
  initialData?: Partial<CreateTaskRequest>
  mode?: 'create' | 'edit'
}

export const EnhancedTaskForm: React.FC<EnhancedTaskFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  mode = 'create'
}) => {
  const { toast } = useToast()
  
  const [formData, setFormData] = useState<CreateTaskRequest>({
    description: initialData?.description || '',
    deadline: initialData?.deadline || '',
    deadline_type: initialData?.deadline_type || 'specific',
    assigned_to: initialData?.assigned_to || 0,
    incoming_document_id: initialData?.incoming_document_id,
    task_type: initialData?.task_type || 'independent',
    processing_content: initialData?.processing_content || '',
    processing_notes: initialData?.processing_notes || ''
  })
  
  const [users, setUsers] = useState<User[]>([])
  const [incomingDocuments, setIncomingDocuments] = useState<IncomingDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [documentSearchTerm, setDocumentSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      const [usersData, documentsResponse] = await Promise.all([
        usersApi.getUsers(),
        incomingDocumentApi.getAll()
      ])
      
      const documentsData = documentsResponse.documents
      
      // Filter users who can be assigned tasks (exclude admin and secretary)
      const assignableUsers = usersData.filter((user: any) => 
        user.role !== 'Quản trị viên' && user.role !== 'Văn thư'
      )
      
      setUsers(assignableUsers)
      setIncomingDocuments(documentsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        variant: "destructive",
        title: "Lỗi tải dữ liệu",
        description: "Không thể tải dữ liệu cần thiết",
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.description.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập mô tả công việc",
      })
      return
    }

    if (!formData.assigned_to) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng chọn người thực hiện",
      })
      return
    }

    setLoading(true)
    try {
      // Format the deadline properly for the backend
      const submitData = { ...formData }
      if (submitData.deadline && submitData.deadline_type === 'specific') {
        // Convert datetime-local to ISO string with timezone
        const deadlineDate = new Date(submitData.deadline)
        submitData.deadline = deadlineDate.toISOString()
      }
      
      const task = await tasksApi.createTask(submitData)
      
      toast({
        title: "Tạo công việc thành công",
        description: "Công việc đã được tạo và gán thành công",
      })
      
      if (onSuccess) {
        onSuccess(task)
      }
    } catch (error: any) {
      console.error('Error creating task:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.response?.data?.error || "Có lỗi xảy ra khi tạo công việc",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = (searchTerm: string) => {
    if (!searchTerm.trim()) return users
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filterDocuments = (searchTerm: string) => {
    if (!searchTerm.trim()) return incomingDocuments
    return incomingDocuments.filter(doc => 
      doc.arrival_number.toString().includes(searchTerm) ||
      doc.original_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const getDeadlineTypeLabel = (type: string | undefined) => {
    switch (type) {
      case 'specific': return 'Ngày cụ thể'
      case 'monthly': return 'Hàng tháng'
      case 'quarterly': return 'Hàng quý'
      case 'yearly': return 'Hàng năm'
      default: return 'Ngày cụ thể'
    }
  }

  const getTaskTypeLabel = (type: string | undefined) => {
    switch (type) {
      case 'document_linked': return 'Liên quan đến văn bản'
      case 'independent': return 'Công việc độc lập'
      default: return 'Công việc độc lập'
    }
  }

  if (loadingData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          {mode === 'create' ? 'Tạo công việc mới' : 'Chỉnh sửa công việc'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Type Selection */}
          <div className="space-y-2">
            <Label>Loại công việc</Label>
            <Select
              value={formData.task_type}
              onValueChange={(value) => setFormData({ ...formData, task_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại công việc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="independent">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Công việc độc lập
                  </div>
                </SelectItem>
                <SelectItem value="document_linked">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-blue-500" />
                    Liên quan đến văn bản
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {getTaskTypeLabel(formData.task_type)}
            </p>
          </div>

          {/* Document Selection (only if document_linked) */}
          {formData.task_type === 'document_linked' && (
            <div className="space-y-4">
              <Label>Văn bản liên quan *</Label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm text-blue-800">Liên kết với văn bản</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Công việc này sẽ được liên kết với văn bản đến đã chọn
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm văn bản theo số đến, số gốc hoặc tóm tắt..."
                    value={documentSearchTerm}
                    onChange={(e) => setDocumentSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {documentSearchTerm && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setDocumentSearchTerm('')}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <Select
                  value={formData.incoming_document_id?.toString() || ""}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    incoming_document_id: value ? parseInt(value) : undefined 
                  })}
                >
                  <SelectTrigger className="h-auto min-h-[2.5rem]">
                    <SelectValue placeholder="Chọn văn bản đến" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {filterDocuments(documentSearchTerm).map((doc) => (
                      <SelectItem key={doc.ID} value={doc.ID.toString()}>
                        <div className="flex flex-col py-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              Số đến: {doc.arrival_number}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {doc.original_number}
                            </Badge>
                          </div>
                          <span className="text-sm font-medium mt-1">
                            {doc.summary}
                          </span>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                            <span>Ngày: {new Date(doc.document_date).toLocaleDateString('vi-VN')}</span>
                            <span>•</span>
                            <span>{doc.issuing_unit?.name || 'Không rõ đơn vị'}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {filterDocuments(documentSearchTerm).length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">
                          {documentSearchTerm ? 'Không tìm thấy văn bản phù hợp' : 'Không có văn bản nào'}
                        </p>
                        {documentSearchTerm && (
                          <p className="text-xs text-gray-400 mt-1">
                            Thử tìm kiếm với từ khóa khác
                          </p>
                        )}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                
                {/* Selected Document Preview */}
                {formData.incoming_document_id && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    {(() => {
                      const selectedDoc = incomingDocuments.find(doc => doc.ID === formData.incoming_document_id)
                      return selectedDoc ? (
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-green-800">Văn bản đã chọn</h4>
                            <div className="mt-1 space-y-1">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs bg-white">
                                  Số đến: {selectedDoc.arrival_number}
                                </Badge>
                                <Badge variant="outline" className="text-xs bg-white">
                                  {selectedDoc.original_number}
                                </Badge>
                              </div>
                              <p className="text-sm text-green-700">{selectedDoc.summary}</p>
                              <p className="text-xs text-green-600">
                                Ngày: {new Date(selectedDoc.document_date).toLocaleDateString('vi-VN')} • 
                                Đơn vị: {selectedDoc.issuing_unit?.name || 'Không rõ'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả công việc *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nhập mô tả chi tiết về công việc cần thực hiện..."
              rows={4}
              className="resize-none"
              required
            />
          </div>

          {/* Flexible Deadline Management */}
          <div className="space-y-4">
            <Label>Quản lý thời hạn</Label>
            
            {/* Deadline Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, deadline_type: 'specific' })}
                className={`p-3 border rounded-lg text-left transition-all ${
                  formData.deadline_type === 'specific' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Calendar className={`w-4 h-4 ${
                    formData.deadline_type === 'specific' ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <span className="font-medium text-sm">Ngày cụ thể</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Đặt thời hạn hoàn thành cụ thể
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({ ...formData, deadline_type: 'monthly' })}
                className={`p-3 border rounded-lg text-left transition-all ${
                  ['monthly', 'quarterly', 'yearly'].includes(formData.deadline_type || '') 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className={`w-4 h-4 ${
                    ['monthly', 'quarterly', 'yearly'].includes(formData.deadline_type || '') ? 'text-green-500' : 'text-gray-400'
                  }`} />
                  <span className="font-medium text-sm">Định kỳ</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Công việc lặp lại theo chu kỳ
                </p>
              </button>
            </div>

            {/* Specific Deadline Configuration */}
            {formData.deadline_type === 'specific' && (
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Label htmlFor="deadline" className="text-sm font-medium text-blue-800">
                  Thời hạn hoàn thành cụ thể
                </Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="pl-10 border-blue-300 focus:border-blue-500"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  {formData.deadline && (
                    <div className="text-xs text-blue-600">
                      Thời hạn: {new Date(formData.deadline).toLocaleString('vi-VN')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Periodic Deadline Configuration */}
            {['monthly', 'quarterly', 'yearly'].includes(formData.deadline_type || '') && (
              <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Label className="text-sm font-medium text-green-800">
                  Cấu hình chu kỳ lặp lại
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deadline_type: 'monthly' })}
                    className={`p-2 border rounded text-center text-xs transition-all ${
                      formData.deadline_type === 'monthly'
                        ? 'border-green-500 bg-green-100 text-green-700'
                        : 'border-green-300 hover:border-green-400'
                    }`}
                  >
                    <Clock className="w-3 h-3 mx-auto mb-1" />
                    Hàng tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deadline_type: 'quarterly' })}
                    className={`p-2 border rounded text-center text-xs transition-all ${
                      formData.deadline_type === 'quarterly'
                        ? 'border-green-500 bg-green-100 text-green-700'
                        : 'border-green-300 hover:border-green-400'
                    }`}
                  >
                    <Clock className="w-3 h-3 mx-auto mb-1" />
                    Hàng quý
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deadline_type: 'yearly' })}
                    className={`p-2 border rounded text-center text-xs transition-all ${
                      formData.deadline_type === 'yearly'
                        ? 'border-green-500 bg-green-100 text-green-700'
                        : 'border-green-300 hover:border-green-400'
                    }`}
                  >
                    <Clock className="w-3 h-3 mx-auto mb-1" />
                    Hàng năm
                  </button>
                </div>
                <div className="text-xs text-green-600">
                  {formData.deadline_type === 'monthly' && 'Công việc sẽ lặp lại hàng tháng'}
                  {formData.deadline_type === 'quarterly' && 'Công việc sẽ lặp lại hàng quý (3 tháng)'}
                  {formData.deadline_type === 'yearly' && 'Công việc sẽ lặp lại hàng năm'}
                </div>
              </div>
            )}
          </div>

          {/* Role-based User Assignment */}
          <div className="space-y-4">
            <Label>Phân công người thực hiện *</Label>
            
            {/* Assignment Rules Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <UserIcon className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm text-yellow-800">Quy tắc phân công</h4>
                  <p className="text-xs text-yellow-700 mt-1">
                    Chọn người thực hiện phù hợp với vai trò của bạn. Không thể phân công cho Quản trị viên và Văn thư.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* User Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm theo tên, vai trò hoặc tên đăng nhập..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {userSearchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setUserSearchTerm('')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {/* User Selection */}
              <Select
                value={formData.assigned_to.toString()}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: parseInt(value) })}
              >
                <SelectTrigger className="h-auto min-h-[2.5rem]">
                  <SelectValue placeholder="Chọn người thực hiện" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filterUsers(userSearchTerm).map((user) => (
                    <SelectItem key={user.ID} value={user.ID.toString()}>
                      <div className="flex items-center space-x-3 py-1">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{user.name}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                            <span className="text-xs text-gray-500">@{user.username}</span>
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  {filterUsers(userSearchTerm).length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      <UserIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm">
                        {userSearchTerm ? 'Không tìm thấy người dùng phù hợp' : 'Không có người dùng khả dụng'}
                      </p>
                      {userSearchTerm && (
                        <p className="text-xs text-gray-400 mt-1">
                          Thử tìm kiếm với từ khóa khác
                        </p>
                      )}
                    </div>
                  )}
                </SelectContent>
              </Select>

              {/* Selected User Preview */}
              {formData.assigned_to > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  {(() => {
                    const selectedUser = users.find(u => u.ID === formData.assigned_to)
                    return selectedUser ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-green-800">
                            Đã chọn: {selectedUser.name}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs bg-white">
                              {selectedUser.role}
                            </Badge>
                            <span className="text-xs text-green-600">@{selectedUser.username}</span>
                          </div>
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Processing Content */}
          <div className="space-y-2">
            <Label htmlFor="processing_content">Nội dung xử lý</Label>
            <Textarea
              id="processing_content"
              value={formData.processing_content}
              onChange={(e) => setFormData({ ...formData, processing_content: e.target.value })}
              placeholder="Nhập nội dung xử lý ban đầu (tùy chọn)..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Processing Notes */}
          <div className="space-y-2">
            <Label htmlFor="processing_notes">Ghi chú xử lý</Label>
            <Textarea
              id="processing_notes"
              value={formData.processing_notes}
              onChange={(e) => setFormData({ ...formData, processing_notes: e.target.value })}
              placeholder="Nhập ghi chú về cách xử lý (tùy chọn)..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Form Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Tóm tắt công việc</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Loại:</span>
                <Badge variant="outline" className="ml-2">
                  {getTaskTypeLabel(formData.task_type)}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Thời hạn:</span>
                <Badge variant="outline" className="ml-2">
                  {getDeadlineTypeLabel(formData.deadline_type)}
                </Badge>
              </div>
              {formData.assigned_to > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-500">Người thực hiện:</span>
                  <span className="ml-2 font-medium">
                    {users.find(u => u.ID === formData.assigned_to)?.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Hủy
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Đang tạo...' : (mode === 'create' ? 'Tạo công việc' : 'Cập nhật')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}