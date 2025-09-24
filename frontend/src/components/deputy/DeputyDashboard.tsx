import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'

import { tasksApi, Task } from '@/api/tasks'
import { incomingDocumentApi, IncomingDocument } from '@/api/incoming-documents'
import { usersApi, User } from '@/api/users'
import { formatDate } from '@/lib/utils'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  UserPlus,
  Eye,
  Edit,
  Plus,
  Bell,
  BarChart3,
  Activity,
  ArrowRight,
  Send,
  Save,
  PlayCircle,

} from 'lucide-react'

export const DeputyDashboard: React.FC = () => {

  const [assignedDocuments, setAssignedDocuments] = useState<IncomingDocument[]>([])
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([])
  const [delegatedTasks, setDelegatedTasks] = useState<Task[]>([])
  const [officers, setOfficers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [tasks, incomingDocs, users] = await Promise.all([
        tasksApi.getTasks(),
        incomingDocumentApi.getAll().then(response => response.documents || []),
        usersApi.getUsers()
      ])
      
      // Filter tasks assigned to this deputy
      const allTasks = Array.isArray(tasks) ? tasks : []
      setAssignedTasks(allTasks.filter(task => task.assigned_to === user?.id))
      
      // Filter tasks created by this deputy (delegated tasks)
      setDelegatedTasks(allTasks.filter(task => task.created_by === user?.id))
      
      // Filter documents assigned to this deputy
      setAssignedDocuments(incomingDocs.filter((doc: IncomingDocument) => 
        doc.processor_id === user?.id
      ))
      
      // Get officers for delegation
      setOfficers(users.filter((u: User) => u.role === 'Cán bộ'))
    } catch (error) {
      console.error('Error fetching deputy dashboard data:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải dữ liệu dashboard",
      })
    } finally {
      setLoading(false)
    }
  }

  const getTasksByStatus = (tasks: Task[], status: string) => {
    return tasks.filter(task => task.status === status).length
  }

  const getOverdueTasks = (tasks: Task[]) => {
    return tasks.filter(task => {
      const deadline = new Date(task.deadline)
      const now = new Date()
      return deadline < now && task.status !== 'Hoàn thành'
    }).length
  }

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await tasksApi.updateTaskStatus(taskId, { status: newStatus })
      await fetchDashboardData()
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái công việc",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
      })
    }
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển Phó Công An Xã</h1>
          <p className="text-gray-600">Xử lý văn bản và quản lý công việc được giao</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => navigate('/tasks/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Giao việc
          </Button>
          <Button variant="outline" onClick={() => navigate('/tasks')}>
            <Target className="w-4 h-4 mr-2" />
            Công việc của tôi
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Văn bản được giao</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {assignedDocuments.length}
            </div>
            <p className="text-xs text-gray-600">
              <Clock className="w-3 h-3 inline mr-1" />
              Chờ xử lý: {assignedDocuments.filter(d => d.status === 'forwarded').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Công việc nhận</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {assignedTasks.length}
            </div>
            <p className="text-xs text-gray-600">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Hoàn thành: {getTasksByStatus(assignedTasks, 'Hoàn thành')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Công việc giao</CardTitle>
            <UserPlus className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {delegatedTasks.length}
            </div>
            <p className="text-xs text-gray-600">
              <Activity className="w-3 h-3 inline mr-1" />
              Đang xử lý: {getTasksByStatus(delegatedTasks, 'Đang xử lí')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {getOverdueTasks([...assignedTasks, ...delegatedTasks])}
            </div>
            <p className="text-xs text-gray-600">
              <Bell className="w-3 h-3 inline mr-1" />
              Cần xử lý ngay
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Documents and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Văn bản được giao
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/incoming-documents')}>
                Xem tất cả
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignedDocuments.slice(0, 4).map((doc) => (
                <div key={doc.ID} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      doc.status === 'forwarded' ? 'bg-yellow-500' :
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
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/tasks/new?document=${doc.ID}`)}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {assignedDocuments.length === 0 && (
                <p className="text-center text-gray-500 py-4">Chưa có văn bản nào được giao</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assigned Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Công việc được giao
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/tasks')}>
                Xem tất cả
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignedTasks.slice(0, 4).map((task) => (
                <div key={task.ID} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      task.status === 'Tiếp nhận văn bản' ? 'bg-blue-500' :
                      task.status === 'Đang xử lí' ? 'bg-yellow-500' :
                      task.status === 'Xem xét' ? 'bg-orange-500' :
                      task.status === 'Hoàn thành' ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.description}
                    </p>
                    <p className="text-xs text-gray-600">
                      Hạn: {formatDate(task.deadline)} • {task.created_by?.name}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className={
                      task.status === 'Hoàn thành' ? 'border-green-500 text-green-700' :
                      task.status === 'Đang xử lí' ? 'border-yellow-500 text-yellow-700' :
                      'border-blue-500 text-blue-700'
                    }>
                      {task.status}
                    </Badge>
                  </div>
                  <div className="flex-shrink-0 flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/tasks/${task.ID}`)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {task.status !== 'Hoàn thành' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleUpdateTaskStatus(task.ID, 'Đang xử lí')}
                      >
                        <PlayCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {assignedTasks.length === 0 && (
                <p className="text-center text-gray-500 py-4">Chưa có công việc nào được giao</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Processing Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Edit className="w-5 h-5 mr-2" />
            Xử lý công việc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignedTasks.filter(task => task.status !== 'Hoàn thành').slice(0, 2).map((task) => (
              <div key={task.ID} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{task.description}</h4>
                    <p className="text-sm text-gray-600">
                      Hạn: {formatDate(task.deadline)} • Từ: {task.created_by?.name}
                    </p>
                  </div>
                  <Badge variant="outline" className={
                    task.status === 'Đang xử lí' ? 'border-yellow-500 text-yellow-700' :
                    'border-blue-500 text-blue-700'
                  }>
                    {task.status}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Nội dung xử lý:</label>
                    <Textarea 
                      placeholder="Nhập nội dung xử lý..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Ghi chú:</label>
                    <Textarea 
                      placeholder="Ghi chú thêm..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm"
                      onClick={() => handleUpdateTaskStatus(task.ID, 'Đang xử lí')}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Bắt đầu xử lý
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUpdateTaskStatus(task.ID, 'Hoàn thành')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Hoàn thành
                    </Button>
                    <Button variant="outline" size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Lưu nháp
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {assignedTasks.filter(task => task.status !== 'Hoàn thành').length === 0 && (
              <p className="text-center text-gray-500 py-8">Không có công việc nào cần xử lý</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Delegation Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Giao việc cho Cán bộ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Delegation */}
            <div>
              <h4 className="font-medium mb-3">Giao việc nhanh</h4>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/tasks/new?type=independent')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo công việc mới
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/tasks/new?type=document')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Từ văn bản
                </Button>
              </div>
              
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">Cán bộ có thể giao việc:</h5>
                <div className="space-y-2">
                  {officers.slice(0, 3).map((officer) => (
                    <div key={officer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-green-600">
                            {officer.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{officer.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/tasks/new?assignee=${officer.id}`)}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Delegated Tasks Status */}
            <div>
              <h4 className="font-medium mb-3">Công việc đã giao</h4>
              <div className="space-y-3">
                {delegatedTasks.slice(0, 4).map((task) => (
                  <div key={task.ID} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === 'Hoàn thành' ? 'bg-green-500' :
                        task.status === 'Đang xử lí' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.description}</p>
                      <p className="text-xs text-gray-600">
                        {task.assigned_to?.name} • {formatDate(task.deadline)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                  </div>
                ))}
                {delegatedTasks.length === 0 && (
                  <p className="text-sm text-gray-500">Chưa giao việc nào</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Tổng quan hiệu suất
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Personal Performance */}
            <div>
              <h4 className="font-medium mb-3">Hiệu suất cá nhân</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Tỷ lệ hoàn thành</span>
                    <span className="font-medium">
                      {assignedTasks.length > 0 
                        ? Math.round((getTasksByStatus(assignedTasks, 'Hoàn thành') / assignedTasks.length) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={assignedTasks.length > 0 
                      ? (getTasksByStatus(assignedTasks, 'Hoàn thành') / assignedTasks.length) * 100
                      : 0} 
                    className="h-2" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">
                      {assignedTasks.length}
                    </div>
                    <div className="text-xs text-gray-600">Tổng công việc</div>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">
                      {getTasksByStatus(assignedTasks, 'Hoàn thành')}
                    </div>
                    <div className="text-xs text-gray-600">Đã hoàn thành</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Performance */}
            <div>
              <h4 className="font-medium mb-3">Hiệu suất nhóm</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Công việc đã giao</span>
                    <span className="font-medium">{delegatedTasks.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Đã hoàn thành</span>
                    <span className="font-medium text-green-600">
                      {getTasksByStatus(delegatedTasks, 'Hoàn thành')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Đang xử lý</span>
                    <span className="font-medium text-yellow-600">
                      {getTasksByStatus(delegatedTasks, 'Đang xử lí')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div>
              <h4 className="font-medium mb-3">Thống kê nhanh</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Văn bản xử lý</span>
                  <span className="font-medium">{assignedDocuments.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Quá hạn</span>
                  <span className="font-medium text-red-600">
                    {getOverdueTasks([...assignedTasks, ...delegatedTasks])}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cán bộ quản lý</span>
                  <span className="font-medium">{officers.length}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}