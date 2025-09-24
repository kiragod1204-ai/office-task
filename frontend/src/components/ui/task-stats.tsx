import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Task } from '@/api/tasks'
import { DashboardStats } from '@/api/dashboard'
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  TrendingUp,
  Calendar
} from 'lucide-react'

interface TaskStatsProps {
  tasks: Task[]
  dashboardStats?: DashboardStats | null
  className?: string
}

export const TaskStats: React.FC<TaskStatsProps> = ({ tasks, dashboardStats, className }) => {
  // Use dashboard stats if available, otherwise calculate from tasks
  const safeTasks = tasks || []
  const totalTasks = dashboardStats?.total_tasks ?? safeTasks.length
  const completedTasks = dashboardStats?.completed_tasks ?? safeTasks.filter(t => t.status === 'Hoàn thành').length
  const overdueTasks = dashboardStats?.overdue_tasks ?? safeTasks.filter(t =>
    t.remaining_time?.is_overdue && t.status !== 'Hoàn thành'
  ).length
  const urgentTasks = dashboardStats?.urgent_tasks ?? safeTasks.filter(t =>
    t.remaining_time?.urgency === 'urgent' || t.remaining_time?.urgency === 'critical'
  ).length
  const inProgressTasks = dashboardStats?.in_progress_tasks ?? tasks.filter(t =>
    t.status === 'Đang xử lí' || t.status === 'Xem xét'
  ).length

  const completionRate = dashboardStats?.completion_rate ?? (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0)

  const stats = [
    {
      title: 'Tổng công việc',
      value: totalTasks,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Đang xử lý',
      value: inProgressTasks,
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Hoàn thành',
      value: completedTasks,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Quá hạn',
      value: overdueTasks,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Cần ưu tiên',
      value: urgentTasks,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Tỷ lệ hoàn thành
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Tiến độ tổng thể</span>
            <span className="text-sm font-medium">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{completedTasks} hoàn thành</span>
            <span>{totalTasks - completedTasks} còn lại</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}