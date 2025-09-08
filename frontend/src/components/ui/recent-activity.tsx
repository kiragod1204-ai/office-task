import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Task } from '@/api/tasks'
import { DashboardStats } from '@/api/dashboard'
import { Link } from 'react-router-dom'
import { formatDate, getStatusColor, getRoleColor } from '@/lib/utils'
import { 
  FileText, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Eye,
  ArrowRight
} from 'lucide-react'

interface RecentActivityProps {
  tasks: Task[]
  dashboardStats?: DashboardStats | null
  limit?: number
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ 
  tasks, 
  dashboardStats,
  limit = 10 
}) => {
  // Use dashboard recent activity if available
  const getRecentActivity = () => {
    if (dashboardStats?.recent_activity) {
      return dashboardStats.recent_activity.slice(0, limit)
    }

    // Fallback to calculating from tasks
    return (tasks || [])
      .sort((a, b) => new Date(b.UpdatedAt).getTime() - new Date(a.UpdatedAt).getTime())
      .slice(0, limit)
      .map(task => ({
        id: task.ID,
        type: getActivityType(task.status),
        description: getActionText(task.status),
        task_id: task.ID,
        user_name: task.assigned_user?.name || task.creator.name,
        user_role: task.assigned_user?.role || task.creator.role,
        timestamp: task.UpdatedAt,
        task_title: task.description
      }))
  }

  const recentActivity = getRecentActivity()

  const getActivityType = (status: string) => {
    switch (status) {
      case 'Hoàn thành': return 'completion'
      case 'Xem xét': return 'review'
      case 'Đang xử lí': return 'processing'
      case 'Tiếp nhận văn bản': return 'creation'
      default: return 'update'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completion':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'review':
        return <Eye className="w-4 h-4 text-orange-600" />
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'creation':
        return <FileText className="w-4 h-4 text-blue-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const timeDiff = new Date().getTime() - new Date(timestamp).getTime()
    const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))
    const daysAgo = Math.floor(hoursAgo / 24)
    
    if (daysAgo > 0) {
      return `${daysAgo} ngày trước`
    } else if (hoursAgo > 0) {
      return `${hoursAgo} giờ trước`
    } else {
      return 'Vừa xong'
    }
  }

  const getActionText = (status: string) => {
    switch (status) {
      case 'Hoàn thành':
        return 'đã hoàn thành công việc'
      case 'Xem xét':
        return 'đã gửi xem xét'
      case 'Đang xử lí':
        return 'đang xử lý công việc'
      case 'Tiếp nhận văn bản':
        return 'đã tạo công việc mới'
      default:
        return 'đã cập nhật công việc'
    }
  }

  if (recentActivity.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chưa có hoạt động nào
        </h3>
        <p className="text-gray-600">
          Các hoạt động gần đây sẽ hiển thị ở đây
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {recentActivity.map((activity) => {
          return (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user_name}</span>
                      {' '}
                      <span className="text-gray-600">{activity.description}</span>
                    </p>
                    
                    <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">
                      {activity.task_title}
                    </p>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={`text-xs ${getRoleColor(activity.user_role)}`}>
                        {activity.user_role}
                      </Badge>
                      
                      <span className="text-xs text-gray-500">
                        {getTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  <Link to={`/tasks/${activity.task_id}`}>
                    <Button variant="ghost" size="sm" className="ml-2">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {tasks.length > limit && (
        <div className="text-center pt-4 border-t border-gray-100">
          <Link to="/tasks">
            <Button variant="outline" className="w-full">
              Xem tất cả công việc
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}