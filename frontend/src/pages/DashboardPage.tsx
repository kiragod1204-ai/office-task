import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskStats } from '@/components/ui/task-stats'
import { OverdueNotification } from '@/components/ui/overdue-notification'
import { RecentActivity } from '@/components/ui/recent-activity'
import { TaskTrends } from '@/components/ui/task-trends'
import { UserPerformance } from '@/components/ui/user-performance'
import { QuickActions } from '@/components/ui/quick-actions'
import { UpcomingDeadlines } from '@/components/ui/upcoming-deadlines'
import { WorkloadDistribution } from '@/components/ui/workload-distribution'
import { TaskCalendar } from '@/components/ui/task-calendar'
import { SystemHealth } from '@/components/ui/system-health'

import { tasksApi, Task } from '@/api/tasks'
import { dashboardApi, DashboardStats } from '@/api/dashboard'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  Users,
  Calendar,
  Activity,
  BarChart3,
  Clock
} from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  const { user } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tasksData, statsData] = await Promise.all([
          tasksApi.getTasks(),
          dashboardApi.getStats()
        ])
        setTasks(Array.isArray(tasksData) ? tasksData : [])
        setDashboardStats(statsData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()

    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-blue-400 opacity-20"></div>
        </div>
        <p className="text-gray-600 animate-pulse">Đang tải bảng điều khiển...</p>
      </div>
    )
  }

  // Ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className={cn(
        "transition-all duration-700 transform",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      )}>
        <div className="space-y-2">
          <div className="flex items-center space-x-4">
            <img 
              src="/logo/logo.png" 
              alt="Logo" 
              className="w-12 h-12 object-contain"
            />
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Bảng điều khiển
                </h1>
                <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-lg font-semibold text-emerald-700">Xã Khánh Cường</span>
                  <span className="text-xs text-gray-500 -mt-1">Hệ thống quản lý công việc</span>
                </div>
              </div>
              <div className="sm:hidden mt-1">
                <span className="text-sm font-medium text-emerald-700">Xã Khánh Cường</span>
                <span className="text-xs text-gray-500 ml-2">Hệ thống quản lý công việc</span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-lg">
            Tổng quan về công việc và hoạt động của bạn
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Hôm nay: {new Date().toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>Chào mừng, {user?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Notification */}
      <OverdueNotification
        tasks={safeTasks}
        className={cn(
          "transition-all duration-700 transform",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}
      />

      {/* Quick Actions */}
      <div className={cn(
        "transition-all duration-700 transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
        style={{ transitionDelay: "100ms" }}>
        <QuickActions user={user} />
      </div>

      {/* Task Statistics */}
      <div className={cn(
        "transition-all duration-700 transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
        style={{ transitionDelay: "200ms" }}>
        <TaskStats tasks={safeTasks} dashboardStats={dashboardStats} />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Column - Main Content */}
        <div className="xl:col-span-3 space-y-8">
          {/* Top Row - Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Task Trends */}
            <div className={cn(
              "transition-all duration-700 transform",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}
              style={{ transitionDelay: "300ms" }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Xu hướng công việc
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskTrends tasks={safeTasks} dashboardStats={dashboardStats} />
                </CardContent>
              </Card>
            </div>

            {/* Workload Distribution */}
            <div className={cn(
              "transition-all duration-700 transform",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}
              style={{ transitionDelay: "350ms" }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Phân bố công việc
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WorkloadDistribution tasks={safeTasks} dashboardStats={dashboardStats} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Calendar View */}
          <div className={cn(
            "transition-all duration-700 transform",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          )}
            style={{ transitionDelay: "400ms" }}>
            <TaskCalendar tasks={safeTasks} />
          </div>

          {/* Recent Activity */}
          <div className={cn(
            "transition-all duration-700 transform",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          )}
            style={{ transitionDelay: "450ms" }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Hoạt động gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentActivity tasks={safeTasks} dashboardStats={dashboardStats} />
              </CardContent>
            </Card>
          </div>

          {/* User Performance - Only for managers */}
          {(user?.role === 'Trưởng Công An Xã' || user?.role === 'Quản trị viên' || user?.role === 'Phó Công An Xã') && (
            <div className={cn(
              "transition-all duration-700 transform",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}
              style={{ transitionDelay: "500ms" }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Hiệu suất nhóm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserPerformance tasks={safeTasks} dashboardStats={dashboardStats} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className={cn(
            "transition-all duration-700 transform",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          )}
            style={{ transitionDelay: "600ms" }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Hạn sắp tới
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UpcomingDeadlines tasks={safeTasks} dashboardStats={dashboardStats} />
              </CardContent>
            </Card>
          </div>

          {/* Task Distribution */}
          <div className={cn(
            "transition-all duration-700 transform",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          )}
            style={{ transitionDelay: "650ms" }}>
            <Card>
              <CardHeader>
                <CardTitle>Phân bố trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <TaskDistribution tasks={safeTasks} />
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className={cn(
            "transition-all duration-700 transform",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          )}
            style={{ transitionDelay: "700ms" }}>
            <Card>
              <CardHeader>
                <CardTitle>Thống kê nhanh</CardTitle>
              </CardHeader>
              <CardContent>
                <QuickStats tasks={safeTasks} user={user} dashboardStats={dashboardStats} />
              </CardContent>
            </Card>
          </div>

          {/* System Health - Only for admins */}
          {(user?.role === 'Quản trị viên' || user?.role === 'Trưởng Công An Xã') && (
            <div className={cn(
              "transition-all duration-700 transform",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}
              style={{ transitionDelay: "750ms" }}>
              <SystemHealth tasks={safeTasks} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Task Distribution Component
const TaskDistribution: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const statusCounts = (tasks || []).reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const total = tasks.length
  const statuses = [
    { name: 'Tiếp nhận văn bản', color: 'bg-blue-500' },
    { name: 'Đang xử lí', color: 'bg-yellow-500' },
    { name: 'Xem xét', color: 'bg-orange-500' },
    { name: 'Hoàn thành', color: 'bg-green-500' }
  ]

  return (
    <div className="space-y-4">
      {statuses.map((status) => {
        const count = statusCounts[status.name] || 0
        const percentage = total > 0 ? (count / total) * 100 : 0

        return (
          <div key={status.name} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{status.name}</span>
              <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${status.color} transition-all duration-300`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Quick Stats Component
const QuickStats: React.FC<{ tasks: Task[], user: any, dashboardStats?: DashboardStats | null }> = ({ tasks, user, dashboardStats }) => {
  const myTasks = (tasks || []).filter(task => task.assigned_to === user?.id)
  const myCompletedTasks = myTasks.filter(task => task.status === 'Hoàn thành')
  const myOverdueTasks = myTasks.filter(task =>
    task.remaining_time?.is_overdue && task.status !== 'Hoàn thành'
  )

  const todayTasks = tasks.filter(task => {
    const today = new Date().toISOString().split('T')[0]
    const taskDate = new Date(task.deadline).toISOString().split('T')[0]
    return taskDate === today && task.status !== 'Hoàn thành'
  })

  const thisWeekTasks = tasks.filter(task => {
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6))
    const taskDate = new Date(task.deadline)
    return taskDate >= weekStart && taskDate <= weekEnd && task.status !== 'Hoàn thành'
  })

  const stats = [
    {
      label: 'Công việc của tôi',
      value: myTasks.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Đã hoàn thành',
      value: myCompletedTasks.length,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Quá hạn',
      value: myOverdueTasks.length,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      label: 'Hạn hôm nay',
      value: todayTasks.length,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Hạn tuần này',
      value: thisWeekTasks.length,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <div className="space-y-3">
      {stats.map((stat, index) => (
        <div key={index} className={`p-3 rounded-lg ${stat.bgColor}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{stat.label}</span>
            <span className={`text-lg font-bold ${stat.color}`}>
              {stat.value}
            </span>
          </div>
        </div>
      ))}

      {/* Personal completion rate */}
      <div className="pt-3 border-t border-gray-100">
        <div className="text-sm text-gray-600 mb-2">Tỷ lệ hoàn thành cá nhân</div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">
            {myCompletedTasks.length}/{myTasks.length}
          </span>
          <span className="text-xs font-medium">
            {myTasks.length > 0 ? Math.round((myCompletedTasks.length / myTasks.length) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${myTasks.length > 0 ? (myCompletedTasks.length / myTasks.length) * 100 : 0}%`
            }}
          />
        </div>
      </div>
    </div>
  )
}