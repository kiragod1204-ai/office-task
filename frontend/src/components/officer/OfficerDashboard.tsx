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
import { formatDate } from '@/lib/utils'
import {
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Eye,
  Edit,
  Bell,
  BarChart3,
  Activity,
  PlayCircle,
  Save,
  Send,
  User,
  Award,
  Timer
} from 'lucide-react'

export const OfficerDashboard: React.FC = () => {

  const [assignedTasks, setAssignedTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [processingTask, setProcessingTask] = useState<number | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const tasks = await tasksApi.getTasks()
      
      // Filter tasks assigned to this officer
      const allTasks = Array.isArray(tasks) ? tasks : []
      setAssignedTasks(allTasks.filter(task => task.assigned_to === user?.id))
    } catch (error) {
      console.error('Error fetching officer dashboard data:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải dữ liệu dashboard",
      })
    } finally {
      setLoading(false)
    }
  }

  const getTasksByStatus = (status: string) => {
    return assignedTasks.filter(task => task.status === status).length
  }

  const getOverdueTasks = () => {
    return assignedTasks.filter(task => {
      const deadline = new Date(task.deadline)
      const now = new Date()
      return deadline < now && task.status !== 'Hoàn thành'
    })
  }

  const getUpcomingDeadlines = () => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return assignedTasks.filter(task => {
      const deadline = new Date(task.deadline)
      return deadline >= now && deadline <= nextWeek && task.status !== 'Hoàn thành'
    })
  }

  const getTodayTasks = () => {
    const today = new Date().toDateString()
    return assignedTasks.filter(task => {
      const deadline = new Date(task.deadline)
      return deadline.toDateString() === today && task.status !== 'Hoàn thành'
    })
  }

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      setProcessingTask(taskId)
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
    } finally {
      setProcessingTask(null)
    }
  }

  const getTaskPriority = (task: Task) => {
    const deadline = new Date(task.deadline)
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { level: 'overdue', color: 'text-red-600', bg: 'bg-red-50' }
    if (diffDays <= 1) return { level: 'urgent', color: 'text-orange-600', bg: 'bg-orange-50' }
    if (diffDays <= 3) return { level: 'high', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { level: 'normal', color: 'text-green-600', bg: 'bg-green-50' }
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
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển Cán bộ</h1>
          <p className="text-gray-600">Quản lý và thực hiện công việc được giao</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => navigate('/tasks')}>
            <Target className="w-4 h-4 mr-2" />
            Tất cả công việc
          </Button>
          <Button variant="outline" onClick={() => navigate('/tasks?filter=overdue')}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Quá hạn
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng công việc</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {assignedTasks.length}
            </div>
            <p className="text-xs text-gray-600">
              <Activity className="w-3 h-3 inline mr-1" />
              Đang xử lý: {getTasksByStatus('Đang xử lí')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getTasksByStatus('Hoàn thành')}
            </div>
            <p className="text-xs text-gray-600">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Tỷ lệ: {assignedTasks.length > 0 
                ? Math.round((getTasksByStatus('Hoàn thành') / assignedTasks.length) * 100)
                : 0}%
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
              {getOverdueTasks().length}
            </div>
            <p className="text-xs text-gray-600">
              <Bell className="w-3 h-3 inline mr-1" />
              Cần xử lý ngay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hạn hôm nay</CardTitle>
            <Timer className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {getTodayTasks().length}
            </div>
            <p className="text-xs text-gray-600">
              <Clock className="w-3 h-3 inline mr-1" />
              Ưu tiên cao
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deadline Warnings */}
      {(getOverdueTasks().length > 0 || getUpcomingDeadlines().length > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Bell className="w-5 h-5 mr-2" />
              Cảnh báo thời hạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getOverdueTasks().length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-800">
                      Quá hạn ({getOverdueTasks().length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {getOverdueTasks().slice(0, 3).map((task) => (
                      <div key={task.ID} className="text-sm text-red-700">
                        • {task.description}
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
                    onClick={() => navigate('/tasks?filter=overdue')}
                  >
                    Xem tất cả
                  </Button>
                </div>
              )}

              {getUpcomingDeadlines().length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">
                      Hạn sắp tới ({getUpcomingDeadlines().length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {getUpcomingDeadlines().slice(0, 3).map((task) => (
                      <div key={task.ID} className="text-sm text-yellow-700">
                        • {task.description} - {formatDate(task.deadline)}
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    onClick={() => navigate('/tasks?filter=upcoming')}
                  >
                    Xem tất cả
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
            {assignedTasks
              .filter(task => task.status !== 'Hoàn thành')
              .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
              .slice(0, 3)
              .map((task) => {
                const priority = getTaskPriority(task)
                return (
                  <div key={task.ID} className={`p-4 border rounded-lg ${priority.bg} border-gray-200`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.description}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-600">
                            <User className="w-3 h-3 inline mr-1" />
                            Từ: {task.created_by?.name}
                          </p>
                          <p className={`text-sm ${priority.color}`}>
                            <Clock className="w-3 h-3 inline mr-1" />
                            Hạn: {formatDate(task.deadline)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={
                          task.status === 'Đang xử lí' ? 'border-yellow-500 text-yellow-700' :
                          'border-blue-500 text-blue-700'
                        }>
                          {task.status}
                        </Badge>
                        <Badge variant="outline" className={priority.color}>
                          {priority.level === 'overdue' ? 'Quá hạn' :
                           priority.level === 'urgent' ? 'Khẩn cấp' :
                           priority.level === 'high' ? 'Cao' : 'Bình thường'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Kết quả thực hiện:</label>
                        <Textarea 
                          placeholder="Nhập kết quả thực hiện công việc..."
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Chi tiết thực hiện:</label>
                        <Textarea 
                          placeholder="Mô tả chi tiết quá trình thực hiện..."
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        {task.status === 'Tiếp nhận văn bản' && (
                          <Button 
                            size="sm"
                            onClick={() => handleUpdateTaskStatus(task.ID, 'Đang xử lí')}
                            disabled={processingTask === task.ID}
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Bắt đầu xử lý
                          </Button>
                        )}
                        
                        {task.status === 'Đang xử lí' && (
                          <>
                            <Button 
                              size="sm"
                              onClick={() => handleUpdateTaskStatus(task.ID, 'Hoàn thành')}
                              disabled={processingTask === task.ID}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Hoàn thành
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateTaskStatus(task.ID, 'Xem xét')}
                              disabled={processingTask === task.ID}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Gửi xem xét
                            </Button>
                          </>
                        )}
                        
                        <Button variant="outline" size="sm">
                          <Save className="w-4 h-4 mr-2" />
                          Lưu tiến độ
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/tasks/${task.ID}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            
            {assignedTasks.filter(task => task.status !== 'Hoàn thành').length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500">Tuyệt vời! Bạn đã hoàn thành tất cả công việc</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Danh sách công việc
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/tasks')}>
                Xem tất cả
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignedTasks
                .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                .slice(0, 6)
                .map((task) => {
                  const priority = getTaskPriority(task)
                  return (
                    <div key={task.ID} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
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
                          {task.created_by?.name} • {formatDate(task.deadline)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-center space-x-2">
                        <Badge variant="outline" className={`text-xs ${priority.color}`}>
                          {priority.level === 'overdue' ? 'Quá hạn' :
                           priority.level === 'urgent' ? 'Khẩn cấp' :
                           priority.level === 'high' ? 'Cao' : 'Bình thường'}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/tasks/${task.ID}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              {assignedTasks.length === 0 && (
                <p className="text-center text-gray-500 py-4">Chưa có công việc nào được giao</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Thống kê hiệu suất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Completion Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Tỷ lệ hoàn thành</span>
                  <span className="text-sm font-bold">
                    {assignedTasks.length > 0 
                      ? Math.round((getTasksByStatus('Hoàn thành') / assignedTasks.length) * 100)
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={assignedTasks.length > 0 
                    ? (getTasksByStatus('Hoàn thành') / assignedTasks.length) * 100
                    : 0} 
                  className="h-3" 
                />
              </div>

              {/* Task Status Distribution */}
              <div>
                <h4 className="font-medium mb-3">Phân bố trạng thái</h4>
                <div className="space-y-2">
                  {[
                    { status: 'Tiếp nhận văn bản', count: getTasksByStatus('Tiếp nhận văn bản'), color: 'bg-blue-500' },
                    { status: 'Đang xử lí', count: getTasksByStatus('Đang xử lí'), color: 'bg-yellow-500' },
                    { status: 'Xem xét', count: getTasksByStatus('Xem xét'), color: 'bg-orange-500' },
                    { status: 'Hoàn thành', count: getTasksByStatus('Hoàn thành'), color: 'bg-green-500' }
                  ].map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm">{item.status}</span>
                      </div>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {assignedTasks.length}
                  </div>
                  <div className="text-xs text-gray-600">Tổng công việc</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {getTasksByStatus('Hoàn thành')}
                  </div>
                  <div className="text-xs text-gray-600">Đã hoàn thành</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">
                    {getTasksByStatus('Đang xử lí')}
                  </div>
                  <div className="text-xs text-gray-600">Đang xử lý</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {getOverdueTasks().length}
                  </div>
                  <div className="text-xs text-gray-600">Quá hạn</div>
                </div>
              </div>

              {/* Achievement Badge */}
              {assignedTasks.length > 0 && getTasksByStatus('Hoàn thành') / assignedTasks.length >= 0.8 && (
                <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Hiệu suất xuất sắc!</p>
                      <p className="text-xs text-green-600">
                        Bạn đã hoàn thành {Math.round((getTasksByStatus('Hoàn thành') / assignedTasks.length) * 100)}% công việc
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}