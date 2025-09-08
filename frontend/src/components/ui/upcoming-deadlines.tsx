import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Task } from '@/api/tasks'
import { DashboardStats } from '@/api/dashboard'
import { Link } from 'react-router-dom'
import { formatDate, getUrgencyColor } from '@/lib/utils'
import { RemainingTime } from './remaining-time'
import { 
  Calendar, 
  Clock, 
  AlertTriangle,
  Eye,
  User,
  ArrowRight
} from 'lucide-react'

interface UpcomingDeadlinesProps {
  tasks: Task[]
  dashboardStats?: DashboardStats | null
  limit?: number
}

export const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({ 
  tasks, 
  dashboardStats,
  limit = 5 
}) => {
  // Use dashboard upcoming tasks if available
  const getUpcomingTasks = () => {
    if (dashboardStats?.upcoming_tasks) {
      return dashboardStats.upcoming_tasks.slice(0, limit)
    }

    // Fallback to calculating from tasks
    return (tasks || [])
      .filter(task => task.status !== 'Hoàn thành')
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, limit)
  }

  const upcomingTasks = getUpcomingTasks()

  const overdueTasks = upcomingTasks.filter(task => task.remaining_time?.is_overdue)
  const urgentTasks = upcomingTasks.filter(task => 
    task.remaining_time?.urgency === 'urgent' || task.remaining_time?.urgency === 'critical'
  )

  if (upcomingTasks.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Không có hạn sắp tới
        </h3>
        <p className="text-gray-600">
          Tất cả công việc đã hoàn thành hoặc chưa có hạn
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-900">{overdueTasks.length}</div>
          <div className="text-xs text-red-700 flex items-center justify-center">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Quá hạn
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-orange-900">{urgentTasks.length}</div>
          <div className="text-xs text-orange-700 flex items-center justify-center">
            <Clock className="w-3 h-3 mr-1" />
            Cần ưu tiên
          </div>
        </div>
      </div>

      {/* Upcoming Tasks List */}
      <div className="space-y-3">
        {upcomingTasks.map((task) => (
          <div 
            key={task.ID} 
            className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
              task.remaining_time?.is_overdue 
                ? 'border-red-200 bg-red-50' 
                : task.remaining_time?.urgency === 'urgent' || task.remaining_time?.urgency === 'critical'
                ? 'border-orange-200 bg-orange-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="space-y-3">
              {/* Task Title and Status */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                    {task.description}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getUrgencyColor(task.status)}`}>
                      {task.status}
                    </Badge>
                    {task.remaining_time?.is_overdue && (
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Quá hạn
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Link to={`/tasks/${task.ID}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Deadline Info */}
              <div className="space-y-2">
                <div className="flex items-center text-xs text-gray-600">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>Hạn: {formatDate(task.deadline)}</span>
                </div>
                
                <RemainingTime 
                  deadline={task.deadline}
                  status={task.status}
                  variant="compact"
                />
              </div>

              {/* Assigned User */}
              {task.assigned_user && (
                <div className="flex items-center text-xs text-gray-600">
                  <User className="w-3 h-3 mr-1" />
                  <span>Giao cho: {task.assigned_user.name}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* View All Link */}
      {tasks.filter(t => t.status !== 'Hoàn thành').length > limit && (
        <div className="pt-3 border-t border-gray-100">
          <Link to="/tasks">
            <Button variant="outline" className="w-full text-sm">
              Xem tất cả hạn sắp tới
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-blue-50 rounded-lg p-3">
        <h4 className="font-medium text-blue-900 text-sm mb-2">
          💡 Mẹo quản lý thời gian
        </h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Ưu tiên công việc quá hạn và cần ưu tiên</li>
          <li>• Kiểm tra hạn định kỳ mỗi ngày</li>
          <li>• Báo cáo sớm nếu không thể hoàn thành đúng hạn</li>
        </ul>
      </div>
    </div>
  )
}