import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/api/tasks'
import { DashboardStats } from '@/api/dashboard'
import { getRoleColor } from '@/lib/utils'
import { 
  User, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Award,
  Target
} from 'lucide-react'

interface UserPerformanceProps {
  tasks: Task[]
  dashboardStats?: DashboardStats | null
}

interface UserStats {
  id: number
  name: string
  role: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  completionRate: number
  avgCompletionTime: number
}

export const UserPerformance: React.FC<UserPerformanceProps> = ({ tasks, dashboardStats }) => {
  // Use dashboard user performance data if available
  const getUserStats = (): UserStats[] => {
    if (dashboardStats?.user_performance && Array.isArray(dashboardStats.user_performance)) {
      return dashboardStats.user_performance.map(user => ({
        id: user.user_id,
        name: user.user_name,
        role: user.user_role,
        totalTasks: user.total_tasks,
        completedTasks: user.completed_tasks,
        inProgressTasks: user.in_progress_tasks,
        overdueTasks: user.overdue_tasks,
        completionRate: user.completion_rate,
        avgCompletionTime: 0
      })).sort((a, b) => b.completionRate - a.completionRate)
    }

    // Fallback to calculating from tasks
    const userMap = new Map<number, UserStats>()

    if (!tasks || !Array.isArray(tasks)) {
      return []
    }

    tasks.forEach(task => {
      if (!task || !task.assigned_user || !task.assigned_user.ID) return

      const userId = task.assigned_user.ID
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          id: userId,
          name: task.assigned_user.name,
          role: task.assigned_user.role,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
          completionRate: 0,
          avgCompletionTime: 0
        })
      }

      const userStats = userMap.get(userId)
      if (!userStats) return
      
      userStats.totalTasks++

      if (task.status === 'Hoàn thành') {
        userStats.completedTasks++
      } else if (task.status === 'Đang xử lí' || task.status === 'Xem xét') {
        userStats.inProgressTasks++
      }

      if (task.remaining_time?.is_overdue && task.status !== 'Hoàn thành') {
        userStats.overdueTasks++
      }
    })

    // Calculate completion rates and sort by performance
    const userStats = Array.from(userMap.values()).map(user => ({
      ...user,
      completionRate: user.totalTasks > 0 ? (user.completedTasks / user.totalTasks) * 100 : 0
    }))

    return userStats.sort((a, b) => b.completionRate - a.completionRate)
  }

  const userStats = getUserStats()
  const topPerformer = userStats[0]

  if (userStats.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chưa có dữ liệu hiệu suất
        </h3>
        <p className="text-gray-600">
          Dữ liệu hiệu suất sẽ hiển thị khi có công việc được gán
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Performer Highlight */}
      {topPerformer && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Nhân viên xuất sắc</h3>
              <p className="text-sm text-yellow-700">
                <span className="font-medium">{topPerformer.name}</span> với tỷ lệ hoàn thành{' '}
                <span className="font-bold">{topPerformer.completionRate.toFixed(1)}%</span>
              </p>
            </div>
            <Badge className={getRoleColor(topPerformer.role)}>
              {topPerformer.role}
            </Badge>
          </div>
        </div>
      )}

      {/* Performance Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Bảng xếp hạng hiệu suất
        </h3>
        
        <div className="space-y-3">
          {userStats.map((user, index) => (
            <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                    <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {user.completionRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">Tỷ lệ hoàn thành</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${user.completionRate}%` }}
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">{user.totalTasks}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-center">
                    <User className="w-3 h-3 mr-1" />
                    Tổng
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm font-medium text-green-600">{user.completedTasks}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Xong
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm font-medium text-yellow-600">{user.inProgressTasks}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Đang làm
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm font-medium text-red-600">{user.overdueTasks}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Quá hạn
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Tóm tắt nhóm
        </h3>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-900">
              {userStats.length}
            </div>
            <div className="text-sm text-blue-700">Thành viên</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-blue-900">
              {(userStats.reduce((sum, user) => sum + user.completionRate, 0) / userStats.length).toFixed(1)}%
            </div>
            <div className="text-sm text-blue-700">Hiệu suất TB</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-blue-900">
              {userStats.reduce((sum, user) => sum + user.totalTasks, 0)}
            </div>
            <div className="text-sm text-blue-700">Tổng công việc</div>
          </div>
        </div>
      </div>
    </div>
  )
}