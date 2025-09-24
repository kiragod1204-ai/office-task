import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usersApi, UserStats } from '@/api/users'
import { dashboardApi, DashboardStats, SystemHealth } from '@/api/dashboard'
import { getRoleColor, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import FileManagement from './FileManagement'
import {
  Users,
  UserPlus,
  Shield,
  TrendingUp,
  Activity,
  Calendar,
  Settings,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Server,
  Network,
  BarChart3,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react'

export const AdminDashboardEnhanced: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      const [userStats, dashStats, healthData] = await Promise.all([
        usersApi.getUserStats(),
        dashboardApi.getStats(),
        dashboardApi.getSystemHealth()
      ])
      setStats(userStats)
      setDashboardStats(dashStats)
      setSystemHealth(healthData)
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải dữ liệu dashboard",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllData()
    setRefreshing(false)
    toast({
      title: "Đã cập nhật",
      description: "Dữ liệu dashboard đã được làm mới",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển Quản trị</h1>
          <p className="text-gray-600">Tổng quan hệ thống và quản lý người dùng</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="users">Người dùng</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="activity">Hoạt động</TabsTrigger>
          <TabsTrigger value="audit">Kiểm toán</TabsTrigger>
          <TabsTrigger value="system">Hệ thống</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SystemOverview 
            stats={stats} 
            dashboardStats={dashboardStats} 
            systemHealth={systemHealth} 
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagementInterface stats={stats} navigate={navigate} />
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <FileManagement />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <SystemActivityMonitoring dashboardStats={dashboardStats} />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditTrailViewer dashboardStats={dashboardStats} />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemMaintenanceTools systemHealth={systemHealth} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// System Overview Component
const SystemOverview: React.FC<{
  stats: UserStats | null
  dashboardStats: DashboardStats | null
  systemHealth: SystemHealth | null
}> = ({ stats, dashboardStats, systemHealth }) => {
  if (!stats || !dashboardStats || !systemHealth) return null

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total_users}</div>
            <p className="text-xs text-gray-600">
              <Activity className="w-3 h-3 inline mr-1" />
              {stats.active_users} đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng công việc</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardStats.total_tasks}</div>
            <p className="text-xs text-gray-600">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              {dashboardStats.completed_tasks} đã hoàn thành
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboardStats.overdue_tasks}</div>
            <p className="text-xs text-gray-600">
              <Clock className="w-3 h-3 inline mr-1" />
              {dashboardStats.urgent_tasks} khẩn cấp
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {dashboardStats.completion_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600">
              Hiệu suất tổng thể
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Tình trạng hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                systemHealth.status === 'healthy' ? 'bg-green-500' : 
                systemHealth.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <div>
                <p className="font-medium">Trạng thái chung</p>
                <p className="text-sm text-gray-600 capitalize">{systemHealth.status}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Cơ sở dữ liệu</p>
                <p className="text-sm text-gray-600">{systemHealth.response_time}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Server className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium">Uptime</p>
                <p className="text-sm text-gray-600">{systemHealth.uptime}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Thống kê văn bản</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dashboardStats.incoming_files.total_count}
              </div>
              <p className="text-sm text-gray-600">Tổng văn bản đến</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dashboardStats.incoming_files.this_month_count}
              </div>
              <p className="text-sm text-gray-600">Tháng này</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {dashboardStats.incoming_files.today_count}
              </div>
              <p className="text-sm text-gray-600">Hôm nay</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// User Management Interface Component
const UserManagementInterface: React.FC<{
  stats: UserStats | null
  navigate: (path: string) => void
}> = ({ stats, navigate }) => {
  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quản trị viên</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.users_by_role['Quản trị viên'] || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Văn thư</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.users_by_role['Văn thư'] || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trưởng & Phó</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(stats.users_by_role['Trưởng Công An Xã'] || 0) + (stats.users_by_role['Phó Công An Xã'] || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cán bộ</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.users_by_role['Cán bộ'] || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý người dùng</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Tạo, chỉnh sửa và quản lý tài khoản người dùng
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/users')}
              >
                <Users className="w-4 h-4 mr-2" />
                Xem tất cả
              </Button>
              <Button 
                size="sm"
                onClick={() => navigate('/users')}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Tạo người dùng
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role Distribution */}
            <div>
              <h4 className="font-medium mb-3">Phân bố theo vai trò</h4>
              <div className="space-y-2">
                {Object.entries(stats.users_by_role).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleColor(role)} variant="outline">
                        {role}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-gray-500">
                        ({Math.round((count / stats.total_users) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Users */}
            <div>
              <h4 className="font-medium mb-3">Người dùng mới nhất</h4>
              <div className="space-y-2">
                {stats.recent_users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-xs ${getRoleColor(user.role)}`} variant="outline">
                        {user.role}
                      </Badge>
                      {user.created_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(user.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// System Activity Monitoring Component
const SystemActivityMonitoring: React.FC<{
  dashboardStats: DashboardStats | null
}> = ({ dashboardStats }) => {
  if (!dashboardStats) return null

  return (
    <div className="space-y-6">
      {/* Activity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Hoạt động hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardStats.recent_activity.filter(activity => {
                const today = new Date().toDateString()
                return new Date(activity.timestamp).toDateString() === today
              }).length}
            </div>
            <p className="text-xs text-gray-600">Hành động được thực hiện</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Người dùng hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Set(dashboardStats.recent_activity.map(a => a.user_name)).size}
            </div>
            <p className="text-xs text-gray-600">Trong 24h qua</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tác vụ hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {dashboardStats.recent_activity.filter(a => a.type === 'completion').length}
            </div>
            <p className="text-xs text-gray-600">Trong tuần này</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardStats.recent_activity.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'completion' ? 'bg-green-500' :
                  activity.type === 'creation' ? 'bg-blue-500' :
                  activity.type === 'update' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {activity.user_name} {activity.description}
                  </p>
                  <p className="text-xs text-gray-600">
                    {activity.task_title}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    {activity.user_role}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance by Role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Hiệu suất theo vai trò
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(dashboardStats.tasks_by_role).map(([role, stats]) => (
              <div key={role} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={getRoleColor(role)}>
                    {role}
                  </Badge>
                  <div className="text-sm text-gray-600">
                    {stats.completed_tasks}/{stats.total_tasks} ({stats.completion_rate.toFixed(1)}%)
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                    style={{ width: `${stats.completion_rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Audit Trail Viewer Component
const AuditTrailViewer: React.FC<{
  dashboardStats: DashboardStats | null
}> = ({ dashboardStats }) => {
  if (!dashboardStats) return null

  return (
    <div className="space-y-6">
      {/* Audit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tổng sự kiện</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardStats.recent_activity.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tạo mới</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardStats.recent_activity.filter(a => a.type === 'creation').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cập nhật</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardStats.recent_activity.filter(a => a.type === 'update').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {dashboardStats.recent_activity.filter(a => a.type === 'completion').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Nhật ký kiểm toán
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Xuất báo cáo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardStats.recent_activity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'completion' ? 'bg-green-100 text-green-600' :
                    activity.type === 'creation' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'update' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {activity.type === 'completion' ? <CheckCircle className="w-4 h-4" /> :
                     activity.type === 'creation' ? <FileText className="w-4 h-4" /> :
                     activity.type === 'update' ? <Settings className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user_name}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {activity.user_role}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {activity.description}: {activity.task_title}
                  </p>
                  <p className="text-xs text-gray-500">
                    ID: {activity.task_id} • {formatDate(activity.timestamp)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// System Maintenance Tools Component
const SystemMaintenanceTools: React.FC<{
  systemHealth: SystemHealth | null
}> = ({ systemHealth }) => {
  if (!systemHealth) return null

  return (
    <div className="space-y-6">
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="w-5 h-5 mr-2" />
            Trạng thái hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Cơ sở dữ liệu</span>
              </div>
              <div className="pl-7">
                <p className="text-sm text-gray-600">
                  Trạng thái: <span className="font-medium">{systemHealth.metrics.database.status}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Thời gian phản hồi: <span className="font-medium">{systemHealth.metrics.database.response_time}</span>
                </p>
                {systemHealth.metrics.database.connections && (
                  <p className="text-sm text-gray-600">
                    Kết nối: <span className="font-medium">{systemHealth.metrics.database.connections}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-green-600" />
                <span className="font-medium">Máy chủ</span>
              </div>
              <div className="pl-7">
                <p className="text-sm text-gray-600">
                  CPU: <span className="font-medium">{systemHealth.metrics.server.cpu_usage}</span>
                </p>
                <p className="text-sm text-gray-600">
                  RAM: <span className="font-medium">{systemHealth.metrics.server.memory_usage}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Goroutines: <span className="font-medium">{systemHealth.metrics.server.goroutines}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Network className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Mạng</span>
              </div>
              <div className="pl-7">
                <p className="text-sm text-gray-600">
                  Trạng thái: <span className="font-medium">{systemHealth.metrics.network.status}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Độ trễ: <span className="font-medium">{systemHealth.metrics.network.latency}</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Công cụ bảo trì
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
              <Database className="w-6 h-6 text-blue-600" />
              <div className="text-left">
                <p className="font-medium">Sao lưu dữ liệu</p>
                <p className="text-sm text-gray-600">Tạo bản sao lưu hệ thống</p>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
              <RefreshCw className="w-6 h-6 text-green-600" />
              <div className="text-left">
                <p className="font-medium">Làm mới cache</p>
                <p className="text-sm text-gray-600">Xóa bộ nhớ đệm hệ thống</p>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
              <FileText className="w-6 h-6 text-purple-600" />
              <div className="text-left">
                <p className="font-medium">Xuất logs</p>
                <p className="text-sm text-gray-600">Tải xuống nhật ký hệ thống</p>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
              <Shield className="w-6 h-6 text-orange-600" />
              <div className="text-left">
                <p className="font-medium">Kiểm tra bảo mật</p>
                <p className="text-sm text-gray-600">Quét lỗ hổng bảo mật</p>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
              <BarChart3 className="w-6 h-6 text-red-600" />
              <div className="text-left">
                <p className="font-medium">Phân tích hiệu suất</p>
                <p className="text-sm text-gray-600">Đánh giá tốc độ hệ thống</p>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
              <Settings className="w-6 h-6 text-gray-600" />
              <div className="text-left">
                <p className="font-medium">Cấu hình hệ thống</p>
                <p className="text-sm text-gray-600">Điều chỉnh tham số</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}