import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { tasksApi, Task, UpdateTaskRequest, ForwardTaskRequest } from '@/api/tasks'
import { usersApi, User as UserType } from '@/api/users'
import { filesApi } from '@/api/files'
import { Edit, Trash2, Forward, AlertTriangle, Search, X, User, Settings, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ComprehensiveTaskInterface } from './tasks/ComprehensiveTaskInterface'

interface TaskManagementActionsProps {
  task: Task
  onTaskUpdate: (updatedTask: Task) => void
  onTaskDelete: () => void
}

export const TaskManagementActions: React.FC<TaskManagementActionsProps> = ({
  task,
  onTaskUpdate,
  onTaskDelete
}) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false)
  
  const [editForm, setEditForm] = useState({
    description: task?.description || '',
    deadline: task?.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
    assigned_to: task?.assigned_to_id || 0,
    incoming_document_id: task?.incoming_document_id || 0
  })
  
  const [forwardForm, setForwardForm] = useState({
    assigned_to: 0,
    comment: ''
  })
  
  const [users, setUsers] = useState<UserType[]>([])
  const [incomingFiles, setIncomingFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [forwardUserSearchTerm, setForwardUserSearchTerm] = useState('')

  useEffect(() => {
    if (editDialogOpen || forwardDialogOpen) {
      fetchUsers()
    }
    if (editDialogOpen) {
      fetchIncomingFiles()
    }
  }, [editDialogOpen, forwardDialogOpen])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const [teamLeaders, officers] = await Promise.all([
        usersApi.getTeamLeaders(),
        usersApi.getOfficers()
      ])
      
      // Normalize user data to ensure consistent field names
      const normalizeUsers = (users: UserType[]) => users.map(user => ({
        ...user,
        ID: user.ID || user.id || 0,
        id: user.id || user.ID || 0
      })).filter(user => user.id > 0)
      
      const allUsers = [
        ...normalizeUsers(teamLeaders),
        ...normalizeUsers(officers)
      ]
      
      setUsers(allUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        variant: "destructive",
        title: "Lỗi tải dữ liệu",
        description: "Không thể tải danh sách người dùng. Vui lòng thử lại.",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchIncomingFiles = async () => {
    try {
      const data = await filesApi.getIncomingFiles()
      setIncomingFiles(data)
    } catch (error) {
      console.error('Error fetching incoming files:', error)
    }
  }

  const canEdit = () => {
    if (!user) return false
    if (user.role === 'Văn thư') return true
    if (user.role === 'Trưởng Công An Xã') {
      return task.created_by_id === user.id || task.assigned_to_id === user.id
    }
    return false
  }

  const canDelete = () => {
    if (!user) return false
    if (user.role === 'Văn thư') return true
    if (user.role === 'Trưởng Công An Xã') {
      return task.created_by_id === user.id && task.status !== 'Hoàn thành'
    }
    return false
  }

  const canForward = () => {
    if (!user) return false
    return ['Trưởng Công An Xã', 'Phó Công An Xã'].includes(user.role)
  }

  const canSubmitForReview = () => {
    if (!user) return false
    if (user.role !== 'Cán bộ') return false
    if (task.assigned_to_id !== user.id) return false
    if (task.status !== 'Đang xử lí') return false
    return true
  }

  const handleSubmitForReview = async () => {
    setLoading(true)
    try {
      const result = await tasksApi.submitForReview(task.ID)
      onTaskUpdate(result.task)
      
      toast({
        title: "Nộp công việc thành công",
        description: result.message,
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi nộp công việc",
        description: error.response?.data?.error || "Không thể nộp công việc để xem xét",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = (searchTerm: string) => {
    // Filter out admin and secretary roles as they shouldn't be assigned tasks
    const assignableUsers = users.filter(user => 
      user?.role !== 'Quản trị viên' && user?.role !== 'Văn thư'
    )
    
    if (!searchTerm.trim()) return assignableUsers
    return assignableUsers.filter(user => 
      user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleEdit = async () => {
    setLoading(true)
    try {
      const updateData: UpdateTaskRequest = {}
      
      if (editForm.description !== task.description) {
        updateData.description = editForm.description
      }
      
      const newDeadline = new Date(editForm.deadline).toISOString()
      if (newDeadline !== task.deadline) {
        updateData.deadline = newDeadline
      }
      
      if (editForm.assigned_to !== task.assigned_to_id) {
        updateData.assigned_to = editForm.assigned_to
      }
      
      if (editForm.incoming_document_id !== task.incoming_document_id) {
        updateData.incoming_document_id = editForm.incoming_document_id
      }

      const updatedTask = await tasksApi.updateTask(task.ID, updateData)
      onTaskUpdate(updatedTask)
      setEditDialogOpen(false)
      setUserSearchTerm('')
      
      toast({
        title: "Cập nhật thành công",
        description: "Công việc đã được cập nhật",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi cập nhật",
        description: error.response?.data?.error || "Không thể cập nhật công việc",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await tasksApi.deleteTask(task.ID)
      onTaskDelete()
      setDeleteDialogOpen(false)
      
      toast({
        title: "Xóa thành công",
        description: "Công việc đã được xóa",
      })
      
      navigate('/tasks')
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi xóa",
        description: error.response?.data?.error || "Không thể xóa công việc",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForward = async () => {
    if (!forwardForm.assigned_to) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn người nhận",
      })
      return
    }

    const selectedUser = users.find(u => (u.id || u.ID) === forwardForm.assigned_to)
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không tìm thấy thông tin người nhận",
      })
      return
    }

    setLoading(true)
    try {
      const forwardData: ForwardTaskRequest = {
        assigned_to: forwardForm.assigned_to,
        comment: forwardForm.comment.trim()
      }

      const updatedTask = await tasksApi.forwardTask(task.ID, forwardData)
      
      onTaskUpdate(updatedTask)
      setForwardDialogOpen(false)
      setForwardForm({ assigned_to: 0, comment: '' })
      setForwardUserSearchTerm('')
      
      toast({
        title: "Chuyển tiếp thành công",
        description: `Công việc đã được chuyển tiếp cho ${selectedUser.name}`,
      })
    } catch (error: any) {
      console.error('Error forwarding task:', error)
      toast({
        variant: "destructive",
        title: "Lỗi chuyển tiếp",
        description: error.response?.data?.error || "Không thể chuyển tiếp công việc",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!canEdit() && !canDelete() && !canForward() && !canSubmitForReview()) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Comprehensive Task Interface */}
      <ComprehensiveTaskInterface task={task} onTaskUpdate={onTaskUpdate} />
      
      <div className="space-y-2">
        <h4 className="font-medium text-sm flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Hành động quản lý
        </h4>
        
        {canEdit() && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Edit className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa công việc</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Creator Information - Read Only */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <Label className="text-sm font-medium text-gray-700">Người tạo:</Label>
                <div className="mt-1 flex items-center">
                  <span className="font-medium">{task.creator?.name || task.created_by?.name}</span>
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {task.creator?.role || task.created_by?.role}
                  </span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Mô tả công việc</Label>
                <Textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="deadline">Thời hạn</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="assigned_to">Người thực hiện</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Tìm kiếm người dùng..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {userSearchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setUserSearchTerm('')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <Select
                    value={editForm.assigned_to ? editForm.assigned_to.toString() : ""}
                    onValueChange={(value) => setEditForm({ ...editForm, assigned_to: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn người thực hiện" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterUsers(userSearchTerm)
                        .filter(user => user?.id && user.id > 0)
                        .map((user) => (
                          <SelectItem key={user.id || user.ID} value={(user.id || user.ID).toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-xs text-gray-500">{user.role} • @{user.username}</span>
                            </div>
                          </SelectItem>
                        ))}
                      {filterUsers(userSearchTerm).length === 0 && (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          {userSearchTerm ? 'Không tìm thấy người dùng' : 'Không có người dùng khả dụng'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="incoming_document">Văn bản đến</Label>
                <Select
                  value={editForm.incoming_document_id ? editForm.incoming_document_id.toString() : ""}
                  onValueChange={(value) => setEditForm({ ...editForm, incoming_document_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn văn bản đến" />
                  </SelectTrigger>
                  <SelectContent>
                    {(incomingFiles || [])
                      .filter(file => (file?.ID || file?.id) && (file.ID > 0 || file.id > 0))
                      .map((file) => (
                      <SelectItem key={file.ID || file.id} value={(file.ID || file.id).toString()}>
                        #{file.order_number} - {file.summary || file.file_name}
                      </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setEditDialogOpen(false)
                  setUserSearchTerm('')
                }}>
                  Hủy
                </Button>
                <Button onClick={handleEdit} disabled={loading}>
                  {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {canForward() && (
        <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Forward className="w-4 h-4 mr-2" />
              Chuyển tiếp
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Forward className="w-5 h-5 mr-2 text-blue-600" />
                Chuyển tiếp công việc
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Chuyển tiếp công việc này cho người khác xử lý
              </p>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Current Assignment Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Thông tin hiện tại</h4>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{task.assigned_to?.name || 'Chưa gán'}</p>
                    <p className="text-xs text-gray-500">
                      {task.assigned_to?.role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Search and User Selection */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Chuyển đến</Label>
                <div className="mt-2 space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Tìm kiếm theo tên, vai trò hoặc tên đăng nhập..."
                      value={forwardUserSearchTerm}
                      onChange={(e) => setForwardUserSearchTerm(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {forwardUserSearchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setForwardUserSearchTerm('')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  {/* User Cards */}
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg">
                    {loadingUsers ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Đang tải danh sách người dùng...</p>
                      </div>
                    ) : users.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <User className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">Không có dữ liệu người dùng</p>
                      </div>
                    ) : (
                      <>
                        {filterUsers(forwardUserSearchTerm)
                          .filter(user => user?.id && user.id > 0)
                          .map((user) => {
                            const userId = user.id
                            const isSelected = forwardForm.assigned_to === userId
                            const isCurrent = task.assigned_to_id === userId
                            
                            return (
                              <button
                                key={userId}
                                onClick={() => setForwardForm({ ...forwardForm, assigned_to: userId || 0 })}
                                disabled={isCurrent}
                                className={`w-full text-left p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                                  isSelected ? 'bg-blue-50 border-blue-200' : ''
                                } ${isCurrent ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                                    }`}>
                                      <User className={`w-4 h-4 ${
                                        isSelected ? 'text-blue-600' : 'text-gray-500'
                                      }`} />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{user.name}</p>
                                      <p className="text-xs text-gray-500">{user.role} • @{user.username}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {isCurrent && (
                                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        Hiện tại
                                      </span>
                                    )}
                                    {isSelected && !isCurrent && (
                                      <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        
                        {filterUsers(forwardUserSearchTerm).length === 0 && (
                          <div className="p-4 text-center text-gray-500">
                            <User className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm">
                              {forwardUserSearchTerm ? 'Không tìm thấy người dùng phù hợp' : 'Không có người dùng khả dụng'}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Comment Section */}
              <div>
                <Label htmlFor="forward_comment" className="text-sm font-medium text-gray-700">
                  Ghi chú chuyển tiếp
                </Label>
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  Thêm ghi chú để người nhận hiểu rõ lý do chuyển tiếp (tùy chọn)
                </p>
                <Textarea
                  id="forward_comment"
                  value={forwardForm.comment}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 500) {
                      setForwardForm({ ...forwardForm, comment: value })
                    }
                  }}
                  placeholder="Ví dụ: Chuyển tiếp để xử lý theo chuyên môn, cần hỗ trợ thêm thông tin..."
                  rows={4}
                  className="resize-none"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-xs ${
                    forwardForm.comment.length > 450 ? 'text-orange-500' : 
                    forwardForm.comment.length > 400 ? 'text-yellow-500' : 'text-gray-400'
                  }`}>
                    {forwardForm.comment.length}/500 ký tự
                  </span>
                </div>
              </div>

              {/* Selected User Summary */}
              {forwardForm.assigned_to > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-blue-800 mb-2">Xác nhận chuyển tiếp</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Forward className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-800">
                        Chuyển tiếp đến: <span className="font-medium">
                          {users.find(u => (u.id || u.ID) === forwardForm.assigned_to)?.name}
                        </span>
                      </p>
                      <p className="text-xs text-blue-600">
                        {users.find(u => (u.id || u.ID) === forwardForm.assigned_to)?.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setForwardDialogOpen(false)
                    setForwardUserSearchTerm('')
                    setForwardForm({ assigned_to: 0, comment: '' })
                  }}
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button 
                  onClick={handleForward} 
                  disabled={loading || !forwardForm.assigned_to}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang chuyển tiếp...
                    </>
                  ) : (
                    <>
                      <Forward className="w-4 h-4 mr-2" />
                      Chuyển tiếp
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}

      {canSubmitForReview() && (
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={handleSubmitForReview}
          disabled={loading}
        >
          <Send className="w-4 h-4 mr-2" />
          Nộp để xem xét
        </Button>
      )}

      {canDelete() && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa công việc
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Xác nhận xóa
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                Bạn có chắc chắn muốn xóa công việc này? Hành động này không thể hoàn tác.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Tất cả bình luận và dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Hủy
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                  {loading ? 'Đang xóa...' : 'Xóa công việc'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </div>
  )
}
