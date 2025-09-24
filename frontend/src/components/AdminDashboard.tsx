import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usersApi, UserStats } from '@/api/users'
import { getRoleColor, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  Users,
  UserPlus,
  Shield,
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      const userStats = await usersApi.getUserStats()
      setStats(userStats)
    } catch (error) {
      console.error('Error fetching user stats:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải thống kê người dùng",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Không thể tải thống kê người dùng</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Statistics Cards */}
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
            <CardTitle className="text-sm font-medium">Quản trị viên</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.users_by_role['Quản trị viên'] || 0}
            </div>
            <p className="text-xs text-gray-600">
              Quyền cao nhất
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trưởng & Phó Công An Xã</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(stats.users_by_role['Trưởng Công An Xã'] || 0) + (stats.users_by_role['Phó Công An Xã'] || 0)}
            </div>
            <p className="text-xs text-gray-600">
              Quản lý trung gian
            </p>
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
            <p className="text-xs text-gray-600">
              Thực hiện công việc
            </p>
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

                {stats.recent_users.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Chưa có người dùng mới
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hành động nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => navigate('/users')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Quản lý người dùng</h4>
                  <p className="text-sm text-gray-600">Xem và chỉnh sửa tài khoản</p>
                </div>
              </div>
            </div>

            <div 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => navigate('/users')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Tạo người dùng mới</h4>
                  <p className="text-sm text-gray-600">Thêm tài khoản mới</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Phân quyền</h4>
                  <p className="text-sm text-gray-600">Sắp có</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}