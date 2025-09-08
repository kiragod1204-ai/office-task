import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/api/tasks'
import { Link } from 'react-router-dom'
import { 
  Bell, 
  X, 
  AlertTriangle,
  Clock,
  CheckCircle,
  MessageSquare,
  Eye
} from 'lucide-react'

interface NotificationCenterProps {
  tasks: Task[]
  user: any
}

interface Notification {
  id: string
  type: 'overdue' | 'deadline' | 'assignment' | 'completion' | 'reminder'
  title: string
  message: string
  taskId?: number
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ tasks, user }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Generate notifications based on tasks
  useEffect(() => {
    const generateNotifications = (): Notification[] => {
      const notifs: Notification[] = []
      const now = new Date()

      // Add null check for tasks
      if (!tasks || !Array.isArray(tasks)) {
        return notifs
      }

      tasks.forEach(task => {
        // Skip if task is null or missing required properties
        if (!task || !task.ID || !task.description || !task.deadline) {
          return
        }

        // Overdue notifications
        if (task.remaining_time?.is_overdue && task.status !== 'Hoàn thành') {
          notifs.push({
            id: `overdue-${task.ID}`,
            type: 'overdue',
            title: 'Công việc quá hạn',
            message: `"${task.description}" đã quá hạn ${task.remaining_time.text.toLowerCase()}`,
            taskId: task.ID,
            timestamp: new Date(task.deadline),
            read: false,
            priority: 'critical'
          })
        }

        // Deadline approaching (within 24 hours)
        const deadlineDate = new Date(task.deadline)
        const timeDiff = deadlineDate.getTime() - now.getTime()
        const hoursUntilDeadline = timeDiff / (1000 * 60 * 60)

        if (hoursUntilDeadline > 0 && hoursUntilDeadline <= 24 && task.status !== 'Hoàn thành') {
          notifs.push({
            id: `deadline-${task.ID}`,
            type: 'deadline',
            title: 'Hạn sắp tới',
            message: `"${task.description}" sẽ hết hạn trong ${Math.round(hoursUntilDeadline)} giờ`,
            taskId: task.ID,
            timestamp: new Date(now.getTime() - Math.random() * 3600000), // Random time within last hour
            read: false,
            priority: hoursUntilDeadline <= 6 ? 'high' : 'medium'
          })
        }

        // New assignment notifications (for assigned user)
        if (user && task.assigned_to === user.id && task.status === 'Đang xử lí') {
          const taskCreated = new Date(task.CreatedAt)
          const hoursSinceCreated = (now.getTime() - taskCreated.getTime()) / (1000 * 60 * 60)
          
          if (hoursSinceCreated <= 24) { // Show for 24 hours after creation
            notifs.push({
              id: `assignment-${task.ID}`,
              type: 'assignment',
              title: 'Công việc mới được giao',
              message: `Bạn được giao công việc: "${task.description}"`,
              taskId: task.ID,
              timestamp: taskCreated,
              read: false,
              priority: 'medium'
            })
          }
        }

        // Completion notifications (for task creator)
        if (user && task.created_by === user.id && task.status === 'Hoàn thành') {
          const taskUpdated = new Date(task.UpdatedAt)
          const hoursSinceUpdate = (now.getTime() - taskUpdated.getTime()) / (1000 * 60 * 60)
          
          if (hoursSinceUpdate <= 48) { // Show for 48 hours after completion
            notifs.push({
              id: `completion-${task.ID}`,
              type: 'completion',
              title: 'Công việc đã hoàn thành',
              message: `"${task.description}" đã được hoàn thành bởi ${task.assigned_user?.name || 'người được giao'}`,
              taskId: task.ID,
              timestamp: taskUpdated,
              read: false,
              priority: 'low'
            })
          }
        }
      })

      // Sort by priority and timestamp
      return notifs.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        return b.timestamp.getTime() - a.timestamp.getTime()
      }).slice(0, 20) // Limit to 20 notifications
    }

    const newNotifications = generateNotifications()
    setNotifications(newNotifications)
    setUnreadCount(newNotifications.filter(n => !n.read).length)
  }, [tasks, user])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'deadline':
        return <Clock className="w-4 h-4 text-orange-500" />
      case 'assignment':
        return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'completion':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-500 bg-red-50'
      case 'high':
        return 'border-l-orange-500 bg-orange-50'
      case 'medium':
        return 'border-l-blue-500 bg-blue-50'
      case 'low':
        return 'border-l-green-500 bg-green-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days} ngày trước`
    if (hours > 0) return `${hours} giờ trước`
    if (minutes > 0) return `${minutes} phút trước`
    return 'Vừa xong'
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 p-0 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold min-w-0 animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 z-50 animate-in slide-in-from-top-2 duration-200">
          <Card className="shadow-xl border-2 bg-white rounded-lg overflow-hidden">
            <CardHeader className="pb-3 px-4 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center">
                  <Bell className="w-4 h-4 mr-2" />
                  Thông báo
                </CardTitle>
                <div className="flex items-center space-x-1">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs px-2 py-1 h-7">
                      Đánh dấu đã đọc
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-7 w-7 p-0">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 px-4">
                    <Bell className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      Không có thông báo
                    </h3>
                    <p className="text-xs text-gray-600">
                      Thông báo mới sẽ hiển thị ở đây
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`
                          p-3 border-l-4 hover:bg-gray-50 transition-colors cursor-pointer
                          ${getPriorityColor(notification.priority)}
                          ${notification.read ? 'opacity-60' : ''}
                        `}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 pr-2">
                                <h4 className="text-xs font-medium text-gray-900 leading-tight">
                                  {notification.title}
                                </h4>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-tight">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-500">
                                    {getTimeAgo(notification.timestamp)}
                                  </span>
                                  {notification.taskId && (
                                    <Link 
                                      to={`/tasks/${notification.taskId}`}
                                      onClick={() => setIsOpen(false)}
                                      className="flex-shrink-0"
                                    >
                                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                        <Eye className="w-3 h-3 mr-1" />
                                        Xem
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overlay to close panel */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-10" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}