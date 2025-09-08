import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WorkflowVisualization, WorkflowTimeline } from '@/components/ui/workflow'
import { LoadingPage } from '@/components/ui/loading'
import { getStatusColor, getRoleColor, formatDate, getTaskProgress } from '@/lib/utils'
import { RemainingTime } from '@/components/ui/remaining-time'
import { tasksApi, Task, Comment } from '@/api/tasks'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  FileText, 
  Clock, 
  MessageSquare,
  Upload,
  Download,
  UserCheck,
  CheckCircle,
  XCircle,
  Send,
  AlertTriangle,
  Search,
  X
} from 'lucide-react'
import apiClient from '@/api/client'
import { usersApi, User as UserType } from '@/api/users'
import { TaskManagementActions } from '@/components/TaskManagementActions'

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [uploadingReport, setUploadingReport] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [users, setUsers] = useState<UserType[]>([])
  const [assignUserSearchTerm, setAssignUserSearchTerm] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null)
  const [workflow, setWorkflow] = useState<any>(null)
  const [workflowLoading, setWorkflowLoading] = useState(false)

  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!id) return
      
      try {
        const [taskData, commentsData] = await Promise.all([
          tasksApi.getTask(parseInt(id)),
          tasksApi.getTaskComments(parseInt(id))
        ])
        
        setTask(taskData)
        setComments(commentsData)
        
        // Fetch workflow data
        fetchWorkflow(parseInt(id))
      } catch (error) {
        // Error handled silently
      } finally {
        setLoading(false)
      }
    }

    fetchTaskDetails()
  }, [id])

  const fetchWorkflow = async (taskId: number) => {
    setWorkflowLoading(true)
    try {
      const workflowData = await tasksApi.getTaskWorkflow(taskId)
      setWorkflow(workflowData)
    } catch (error) {
      console.error('Error fetching workflow:', error)
    } finally {
      setWorkflowLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const usersData = await usersApi.getUsers()
      
      // Normalize the data to ensure consistent field names
      const normalizedUsers = usersData.map(user => ({
        ...user,
        ID: user.ID || user.id,
        id: user.id || user.ID
      }))
      
      setUsers(normalizedUsers)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách người dùng",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const filterAssignUsers = (searchTerm: string) => {
    // Filter out admin and secretary roles as they shouldn't be assigned tasks
    const assignableUsers = users.filter(user => {
      const isAssignable = user.role !== 'Quản trị viên' && user.role !== 'Văn thư'
      return isAssignable
    })
    
    if (!searchTerm.trim()) {
      return assignableUsers
    }
    
    const searchLower = searchTerm.toLowerCase()
    const filteredUsers = assignableUsers.filter(user => {
      const nameMatch = user.name?.toLowerCase().includes(searchLower)
      const roleMatch = user.role?.toLowerCase().includes(searchLower)
      const usernameMatch = user.username?.toLowerCase().includes(searchLower)
      const matches = nameMatch || roleMatch || usernameMatch
      
      return matches
    })
    
    return filteredUsers
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!task) return
    
    try {
      const updatedTask = await tasksApi.updateTaskStatus(task.ID, { status: newStatus })
      setTask(updatedTask)
      
      // Refresh workflow data
      fetchWorkflow(task.ID)
      
      toast({
        title: "Cập nhật thành công",
        description: `Trạng thái công việc đã được cập nhật thành "${newStatus}"`,
      })
    } catch (error) {
      console.error('Error updating task status:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái công việc",
      })
    }
  }

  const handleAssignTask = async (assignedTo: number) => {
    if (!task) return
    
    // Validate assignedTo is a valid number
    if (!assignedTo || isNaN(assignedTo)) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "ID người dùng không hợp lệ",
      })
      return
    }
    
    try {
      const payload = { assigned_to: assignedTo }
      const updatedTask = await tasksApi.assignTask(task.ID, payload)
      
      setTask(updatedTask)
      setAssignDialogOpen(false)
      setAssignUserSearchTerm('')
      
      toast({
        title: "Gán công việc thành công",
        description: `Công việc đã được gán cho ${updatedTask.assigned_user?.name}`,
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.response?.data?.error || "Không thể gán công việc",
      })
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task || !newComment.trim()) return
    
    setSubmittingComment(true)
    try {
      const comment = await tasksApi.createComment(task.ID, { content: newComment })
      setComments([...comments, comment])
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !task) return

    setUploadingReport(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      await apiClient.post(`/files/report/${task.ID}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      // Refresh task data
      const updatedTask = await tasksApi.getTask(task.ID)
      setTask(updatedTask)
      toast({
        title: "Tải file thành công",
        description: "File báo cáo đã được tải lên và trạng thái được cập nhật",
      })
    } catch (error) {
      console.error('Error uploading report:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải lên file báo cáo",
      })
    } finally {
      setUploadingReport(false)
    }
  }

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    setDownloadingFile(filePath)
    try {
      const { downloadFile } = await import('@/lib/download')
      await downloadFile(filePath, fileName)
      toast({
        title: "Tải xuống thành công",
        description: `File ${fileName} đã được tải xuống`,
      })
    } catch (error) {
      console.error('Download failed:', error)
      toast({
        variant: "destructive",
        title: "Lỗi tải xuống",
        description: "Không thể tải xuống file. Vui lòng thử lại.",
      })
    } finally {
      setDownloadingFile(null)
    }
  }

  const canUpdateStatus = () => {
    if (!user || !task) return false
    
    // Trưởng Công An Xã và Phó Công An Xã có thể cập nhật trạng thái
    if (['Trưởng Công An Xã', 'Phó Công An Xã'].includes(user.role)) return true
    
    // Người được gán có thể cập nhật trạng thái
    if (task.assigned_to === user.id) return true
    
    return false
  }

  const canAssignTask = () => {
    if (!user || !task) return false
    return ['Trưởng Công An Xã', 'Phó Công An Xã'].includes(user.role)
  }

  const canUploadReport = () => {
    if (!user || !task) return false
    return task.assigned_to === user.id
  }

  const isOverdue = task && new Date(task.deadline) < new Date() && task.status !== 'Hoàn thành'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy công việc</p>
        <Button onClick={() => navigate('/tasks')} className="mt-4">
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/tasks')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chi tiết công việc</h1>
            <p className="text-gray-600 mt-1">ID: #{task.ID}</p>
          </div>
        </div>
        
        {isOverdue && (
          <Badge 
            variant="destructive" 
            className="text-sm bg-gradient-to-r from-red-500 to-red-600 text-white border-red-300 shadow-lg shadow-red-500/25 animate-pulse hover:animate-none transition-all duration-300"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Quá hạn
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl">{task.description}</CardTitle>
                <StatusBadge 
                  status={task.status} 
                  isOverdue={isOverdue}
                  variant="default"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">Người tạo:</span>
                  <span className="ml-2 font-medium">{task.creator.name}</span>
                  <Badge className={`ml-2 text-xs ${getRoleColor(task.creator.role)}`}>
                    {task.creator.role}
                  </Badge>
                </div>
                
                <div className="flex items-center text-sm">
                  <UserCheck className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">Được gán cho:</span>
                  <span className="ml-2 font-medium">{task.assigned_user?.name || 'Chưa gán'}</span>
                  {task.assigned_user && (
                    <Badge className={`ml-2 text-xs ${getRoleColor(task.assigned_user.role)}`}>
                      {task.assigned_user.role}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <span className="text-gray-600">Hạn hoàn thành:</span>
                      <span className={`ml-2 font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                        {formatDate(task.deadline)}
                      </span>
                    </div>
                    <RemainingTime 
                      deadline={task.deadline} 
                      status={task.status}
                      variant="compact"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">Ngày tạo:</span>
                  <span className="ml-2 font-medium">{formatDate(task.CreatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Visualization */}
          {workflow && (
            <WorkflowVisualization workflow={workflow} />
          )}
          {workflowLoading && (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Đang tải quy trình...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Tài liệu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Incoming File */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Văn bản đến</h4>
                    <p className="text-sm text-gray-600">
                      Số: {task.incoming_file.order_number} - {task.incoming_file.file_name}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadFile(
                      task.incoming_file.file_path,
                      task.incoming_file.file_name
                    )}
                    disabled={downloadingFile === task.incoming_file.file_path}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloadingFile === task.incoming_file.file_path ? 'Đang tải...' : 'Tải xuống'}
                  </Button>
                </div>
              </div>

              {/* Report File */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">File báo cáo</h4>
                    {task.report_file ? (
                      <p className="text-sm text-gray-600">
                        {task.report_file.split('/').pop()}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Chưa có file báo cáo</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {task.report_file && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(task.report_file, task.report_file.split('/').pop() || 'report')}
                        disabled={downloadingFile === task.report_file}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {downloadingFile === task.report_file ? 'Đang tải...' : 'Tải xuống'}
                      </Button>
                    )}
                    {canUploadReport() && (
                      <div>
                        <input
                          type="file"
                          id="report-upload"
                          className="hidden"
                          onChange={handleReportUpload}
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('report-upload')?.click()}
                          disabled={uploadingReport}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingReport ? 'Đang tải...' : 'Tải lên'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Bình luận ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="space-y-3">
                <Input
                  placeholder="Thêm bình luận..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button type="submit" disabled={submittingComment || !newComment.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  {submittingComment ? 'Đang gửi...' : 'Gửi bình luận'}
                </Button>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.ID} className="border-l-4 border-blue-200 pl-4 py-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-sm">{comment.user.name}</span>
                      <Badge className={`text-xs ${getRoleColor(comment.user.role)}`}>
                        {comment.user.role}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.CreatedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))}
                
                {comments.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Chưa có bình luận nào
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hành động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canUpdateStatus() && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Cập nhật trạng thái</h4>
                  <div className="space-y-2">
                    {task.status === 'Tiếp nhận văn bản' && (
                      <>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleStatusUpdate('Đang xử lí')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Tiếp nhận
                        </Button>
                      </>
                    )}
                    
                    {task.status === 'Đang xử lí' && task.assigned_to === user?.id && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleStatusUpdate('Xem xét')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Gửi xem xét
                      </Button>
                    )}
                    
                    {task.status === 'Xem xét' && ['Trưởng Công An Xã', 'Phó Công An Xã'].includes(user?.role || '') && (
                      <>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleStatusUpdate('Hoàn thành')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Hoàn thành
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleStatusUpdate('Đang xử lí')}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Trả lại
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {canAssignTask() && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Phân công</h4>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setAssignDialogOpen(true)
                      fetchUsers()
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Gán lại công việc
                  </Button>
                </div>
              )}

              <TaskManagementActions
                task={task}
                onTaskUpdate={setTask}
                onTaskDelete={() => {
                  // Task will be deleted and user will be redirected
                }}
              />
            </CardContent>
          </Card>

          {/* Deadline Info */}
          {task.status !== 'Hoàn thành' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Thời gian còn lại
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RemainingTime 
                  deadline={task.deadline} 
                  status={task.status}
                  variant="detailed"
                />
              </CardContent>
            </Card>
          )}

          {/* Task Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Tiến độ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Trạng thái hiện tại</span>
                  <StatusBadge 
                    status={task.status} 
                    isOverdue={isOverdue}
                    variant="compact"
                  />
                </div>
                
                {workflow ? (
                  <WorkflowTimeline workflow={workflow} compact={true} />
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const progress = getTaskProgress(task.status)
                      return (
                        <>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Tiến độ công việc</span>
                            <span className="font-bold text-gray-900 dark:text-gray-100">
                              {progress.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                            <div 
                              className={`h-3 rounded-full transition-all duration-1000 ease-out shadow-sm bg-gradient-to-r ${progress.color} ${progress.width}`}
                              style={{ boxShadow: progress.shadow }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-center">
                            <StatusBadge 
                              status={task.status} 
                              variant="compact"
                              showIcon={true}
                              isOverdue={isOverdue}
                            />
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Dialog */}
      {assignDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Gán lại công việc</h3>
            
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm người dùng..."
                  value={assignUserSearchTerm}
                  onChange={(e) => setAssignUserSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {assignUserSearchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setAssignUserSearchTerm('')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {loadingUsers ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Đang tải danh sách người dùng...</p>
                </div>
              ) : (
                <>
                  {filterAssignUsers(assignUserSearchTerm).map((u, index) => (
                    <button
                      key={u.ID || u.id || `user-${index}`}
                      onClick={() => handleAssignTask(Number(u.ID || u.id))}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-sm text-gray-500">{u.role} • @{u.username}</div>
                      </div>
                      {task.assigned_to === (u.ID || u.id) && (
                        <Badge variant="outline">Hiện tại</Badge>
                      )}
                    </button>
                  ))}
                  
                  {filterAssignUsers(assignUserSearchTerm).length === 0 && !loadingUsers && (
                    <div className="p-4 text-center text-gray-500">
                      {assignUserSearchTerm ? 'Không tìm thấy người dùng phù hợp' : 'Không có người dùng khả dụng'}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => {
                setAssignDialogOpen(false)
                setAssignUserSearchTerm('')
              }}>
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}