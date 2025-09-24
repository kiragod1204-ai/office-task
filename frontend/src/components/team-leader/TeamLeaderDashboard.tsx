import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { dashboardApi, DashboardStats } from '@/api/dashboard'
import { tasksApi, Task } from '@/api/tasks'
import { incomingDocumentApi, IncomingDocument } from '@/api/incoming-documents'
import { usersApi, User } from '@/api/users'
import { formatDate, getRoleColor } from '@/lib/utils'
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Target,
  UserPlus,
  Eye,

  Plus,
  Bell,
  BarChart3,
  Activity,
  ArrowRight
} from 'lucide-react'

export const TeamLeaderDashboard: React.FC = () => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [assignedDocuments, setAssignedDocuments] = useState<IncomingDocument[]>([])
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [dashStats, tasks, incomingDocs, users] = await Promise.all([
        dashboardApi.getStats(),
        tasksApi.getTasks(),
        incomingDocumentApi.getAll().then(response => response.documents || []),
        usersApi.getUsers()
      ])
      
      setDashboardStats(dashStats)
      setMyTasks(Array.isArray(tasks) ? tasks.filter(task => 
        task.assigned_to === user?.id || task.created_by === user?.id
      ) : [])
      
      // Filter documents assigned to this team leader
      setAssignedDocuments(incomingDocs.filter((doc: IncomingDocument) => 
        doc.processor_id === user?.id
      ))
      
      // Get team members (Deputies and Officers)
      setTeamMembers(users.filter((u: User) => 
        u.role === 'Phó Công An Xã' || u.role === 'Cán bộ'
      ))
    } catch (error) {
      console.error('Error fetching team leader dashboard data:', error)
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
    return myTasks.filter(task => task.status === status).length
  }

  const getOverdueTasks = () => {
    return myTasks.filter(task => {
      const deadline = new Date(task.deadline)
      const now = new Date()
      return deadline < now && task.status !== 'Hoàn thành'
    }).length
  }

  const getUpcomingDeadlines = () => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return myTasks.filter(task => {
      const deadline = new Date(task.deadline)
      return deadline >= now && deadline <= nextWeek && task.status !== 'Hoàn thành'
    })
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
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển Trưởng Công An Xã</h1>
          <p className="text-gray-600">Quản lý văn bản và giao việc cho nhóm</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => navigate('/tasks/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Giao việc mới
          </Button>
          <Button variant="outline" onClick={() => navigate('/incoming-documents')}>
            <FileText className="w-4 h-4 mr-2" />
            Xem văn bản
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
            <CardTitle className="text-sm font-medium">Công việc của tôi</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {myTasks.length}
            </div>
            <p className="text-xs text-gray-600">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Hoàn thành: {getTasksByStatus('Hoàn thành')}
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
              {getOverdueTasks()}
            </div>
            <p className="text-xs text-gray-600">
              <Bell className="w-3 h-3 inline mr-1" />
              Cần xử lý ngay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thành viên nhóm</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {teamMembers.length}
            </div>
            <p className="text-xs text-gray-600">
              <Activity className="w-3 h-3 inline mr-1" />
              Phó: {teamMembers.filter(m => m.role === 'Phó Công An Xã').length}, 
              Cán bộ: {teamMembers.filter(m => m.role === 'Cán bộ').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Documents Overview */}
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
            {assignedDocuments.slice(0, 5).map((doc) => (
              <div key={doc.ID} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${
                    doc.status === 'forwarded' ? 'bg-yellow-500' :
                    doc.status === 'assigned' ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Số {doc.arrival_number}: {doc.summary}
                  </p>
                  <p className="text-xs text-gray-600">
                    {doc.issuing_unit?.name} • {formatDate(doc.arrival_date)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Badge variant="outline" className={
                    doc.status === 'forwarded' ? 'border-yellow-500 text-yellow-700' :
                    doc.status === 'assigned' ? 'border-green-500 text-green-700' : ''
                  }>
                    {doc.status === 'forwarded' ? 'Chờ giao việc' : 
                     doc.status === 'assigned' ? 'Đã giao việc' : doc.status}
                  </Badge>
                </div>
                <div className="flex-shrink-0 flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/incoming-documents/${doc.ID}`)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/tasks/new?document=${doc.ID}`)}>
                    <UserPlus className="w-4 h-4" />
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

      {/* Task Assignment Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Giao việc nhanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => navigate('/tasks/new?type=document')}
                >
                  <FileText className="w-6 h-6 text-blue-600" />
                  <span className="text-sm">Từ văn bản</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => navigate('/tasks/new?type=independent')}
                >
                  <Target className="w-6 h-6 text-green-600" />
                  <span className="text-sm">Công việc riêng</span>
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Thành viên có thể giao việc:</h4>
                <div className="space-y-1">
                  {teamMembers.slice(0, 4).map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <Badge variant="outline" className={`text-xs ${getRoleColor(member.role)}`}>
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/tasks/new?assignee=${member.id}`)}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deadline Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Quản lý thời hạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Upcoming Deadlines */}
              <div>
                <h4 className="font-medium text-sm mb-2">Hạn sắp tới (7 ngày)</h4>
                <div className="space-y-2">
                  {getUpcomingDeadlines().slice(0, 3).map((task) => (
                    <div key={task.ID} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.description}</p>
                        <p className="text-xs text-gray-600">
                          Hạn: {formatDate(task.deadline)}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/tasks/${task.ID}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {getUpcomingDeadlines().length === 0 && (
                    <p className="text-sm text-gray-500">Không có hạn sắp tới</p>
                  )}
                </div>
              </div>

              {/* Overdue Tasks */}
              {getOverdueTasks() > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 text-red-600">Quá hạn ({getOverdueTasks()})</h4>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Cần xử lý ngay</p>
                        <p className="text-xs text-red-600">
                          {getOverdueTasks()} công việc đã quá hạn
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => navigate('/tasks?filter=overdue')}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              )}

              {/* Reminder Settings */}
              <div>
                <h4 className="font-medium text-sm mb-2">Cài đặt nhắc nhở</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-2" />
                    Nhắc trước 1 ngày
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Báo cáo hàng tuần
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Theo dõi tiến độ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Task Status Distribution */}
            <div>
              <h4 className="font-medium mb-3">Phân bố trạng thái</h4>
              <div className="space-y-3">
                {[
                  { status: 'Tiếp nhận văn bản', count: getTasksByStatus('Tiếp nhận văn bản'), color: 'bg-blue-500' },
                  { status: 'Đang xử lí', count: getTasksByStatus('Đang xử lí'), color: 'bg-yellow-500' },
                  { status: 'Xem xét', count: getTasksByStatus('Xem xét'), color: 'bg-orange-500' },
                  { status: 'Hoàn thành', count: getTasksByStatus('Hoàn thành'), color: 'bg-green-500' }
                ].map((item) => (
                  <div key={item.status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.status}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ 
                          width: `${myTasks.length > 0 ? (item.count / myTasks.length) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Performance */}
            <div>
              <h4 className="font-medium mb-3">Hiệu suất nhóm</h4>
              <div className="space-y-3">
                {dashboardStats?.user_performance.slice(0, 4).map((perf) => (
                  <div key={perf.user_id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{perf.user_name}</span>
                      <span className="font-medium">{perf.completion_rate.toFixed(0)}%</span>
                    </div>
                    <Progress value={perf.completion_rate} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="font-medium mb-3">Thao tác nhanh</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Báo cáo tiến độ
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Phân công lại
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Lịch họp nhóm
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Gửi nhắc nhở
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}