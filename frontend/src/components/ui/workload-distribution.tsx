import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/api/tasks'
import { DashboardStats } from '@/api/dashboard'
import { getRoleColor } from '@/lib/utils'
import { 
  Users, 
  TrendingUp, 
  BarChart3,
  User,
  Clock,
  CheckCircle
} from 'lucide-react'

interface WorkloadDistributionProps {
  tasks: Task[]
  dashboardStats?: DashboardStats | null
}

export const WorkloadDistribution: React.FC<WorkloadDistributionProps> = ({ tasks, dashboardStats }) => {
  // Use dashboard role data if available
  const getWorkloadByRole = () => {
    if (dashboardStats?.tasks_by_role) {
      return Object.values(dashboardStats.tasks_by_role).map(role => ({
        role: role.role,
        totalTasks: role.total_tasks,
        completedTasks: role.completed_tasks,
        inProgressTasks: role.in_progress_tasks,
        userCount: role.user_count,
        completionRate: role.completion_rate,
        avgTasksPerUser: role.user_count > 0 ? role.total_tasks / role.user_count : 0,
        users: new Set() // Not needed for display
      }))
    }

    // Fallback to calculating from tasks
    const roleMap = new Map<string, {
      role: string
      totalTasks: number
      completedTasks: number
      inProgressTasks: number
      users: Set<string>
    }>()

    tasks.forEach(task => {
      if (!task.assigned_user) return

      const role = task.assigned_user.role
      if (!roleMap.has(role)) {
        roleMap.set(role, {
          role,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          users: new Set()
        })
      }

      const roleData = roleMap.get(role)!
      roleData.totalTasks++
      roleData.users.add(task.assigned_user.name)

      if (task.status === 'Hoàn thành') {
        roleData.completedTasks++
      } else if (task.status === 'Đang xử lí' || task.status === 'Xem xét') {
        roleData.inProgressTasks++
      }
    })

    return Array.from(roleMap.values()).map(role => ({
      ...role,
      userCount: role.users.size,
      completionRate: role.totalTasks > 0 ? (role.completedTasks / role.totalTasks) * 100 : 0,
      avgTasksPerUser: role.users.size > 0 ? role.totalTasks / role.users.size : 0
    }))
  }

  const roleWorkload = getWorkloadByRole()
  const maxTasks = Math.max(...roleWorkload.map(r => r.totalTasks), 1)

  if (roleWorkload.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chưa có dữ liệu phân bố
        </h3>
        <p className="text-gray-600">
          Dữ liệu phân bố công việc sẽ hiển thị khi có công việc được gán
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Role Distribution Chart */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Phân bố theo vai trò
        </h3>
        
        <div className="space-y-4">
          {roleWorkload.map((role) => (
            <div key={role.role} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge className={getRoleColor(role.role)}>
                    {role.role}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {role.userCount} người
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {role.totalTasks} công việc
                  </div>
                  <div className="text-xs text-gray-500">
                    {role.completionRate.toFixed(1)}% hoàn thành
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(role.totalTasks / maxTasks) * 100}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex">
                  <div 
                    className="bg-green-500 h-3 rounded-l-full transition-all duration-300"
                    style={{ width: `${(role.completedTasks / maxTasks) * 100}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">{role.totalTasks}</div>
                  <div className="text-gray-500 flex items-center justify-center">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Tổng
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-green-600">{role.completedTasks}</div>
                  <div className="text-gray-500 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Xong
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-blue-600">{role.avgTasksPerUser.toFixed(1)}</div>
                  <div className="text-gray-500 flex items-center justify-center">
                    <User className="w-3 h-3 mr-1" />
                    TB/người
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900">Tổng nhân sự</h4>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {roleWorkload.reduce((sum, role) => sum + role.userCount, 0)}
          </div>
          <div className="text-sm text-blue-700">
            Người tham gia
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-green-900">Hiệu suất chung</h4>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-900">
            {roleWorkload.length > 0 
              ? (roleWorkload.reduce((sum, role) => sum + role.completionRate, 0) / roleWorkload.length).toFixed(1)
              : 0
            }%
          </div>
          <div className="text-sm text-green-700">
            Tỷ lệ hoàn thành
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600">Tổng công việc</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">Đã hoàn thành</span>
        </div>
      </div>
    </div>
  )
}