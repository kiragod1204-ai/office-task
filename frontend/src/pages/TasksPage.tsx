import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getStatusColor, formatDate, cn } from '@/lib/utils'
import { RemainingTime } from '@/components/ui/remaining-time'
import { TaskStats } from '@/components/ui/task-stats'
import { OverdueNotification } from '@/components/ui/overdue-notification'
import { tasksApi, Task } from '@/api/tasks'
import { useAuth } from '@/context/AuthContext'
import { 
  Search, 
  Eye, 
  Calendar,
  User,
  FileText,
  Clock
} from 'lucide-react'

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await tasksApi.getTasks()
        setTasks(data)
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || task.status === statusFilter
    const matchesUrgency = !urgencyFilter || 
      (urgencyFilter === 'overdue' && task.remaining_time?.is_overdue) ||
      (urgencyFilter === 'urgent' && (task.remaining_time?.urgency === 'urgent' || task.remaining_time?.urgency === 'critical')) ||
      (urgencyFilter === 'normal' && (task.remaining_time?.urgency === 'normal' || task.remaining_time?.urgency === 'medium'))
    return matchesSearch && matchesStatus && matchesUrgency
  })

  const statusOptions = [
    'Tiếp nhận văn bản',
    'Đang xử lí',
    'Xem xét',
    'Hoàn thành'
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-blue-400 opacity-20"></div>
        </div>
        <p className="text-gray-600 animate-pulse">Đang tải công việc...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Overdue Notification */}
      <OverdueNotification 
        tasks={tasks}
        className={cn(
          "transition-all duration-700 transform",
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        )}
      />

      {/* Enhanced Header */}
      <div className={cn(
        "flex justify-between items-center transition-all duration-700 transform",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      )}>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            Công việc
          </h1>
          <p className="text-gray-600 text-lg">
            Quản lý và theo dõi các công việc được giao
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{filteredTasks.length} công việc</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{filteredTasks.filter(t => t.status !== 'Hoàn thành').length} đang xử lý</span>
            </div>
          </div>
        </div>
        {user?.role === 'Văn thư' && (
          <div className={cn(
            "transition-all duration-700 transform",
            isVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
          )}>
            <Link to="/create-task">
              <Button className="shadow-xl hover:shadow-2xl">
                <FileText className="w-5 h-5 mr-2" />
                Tạo công việc mới
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Task Statistics */}
      <div 
        className={cn(
          "transition-all duration-700 transform",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}
        style={{ transitionDelay: "200ms" }}
      >
        <TaskStats tasks={tasks} />
      </div>

      {/* Enhanced Filters */}
      <Card className={cn(
        "transition-all duration-700 transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
      style={{ transitionDelay: "400ms" }}>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Tìm kiếm công việc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 border-2 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Tất cả trạng thái</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="sm:w-48">
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Tất cả mức độ</option>
                <option value="overdue">Quá hạn</option>
                <option value="urgent">Cần ưu tiên</option>
                <option value="normal">Bình thường</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTasks.map((task, index) => {
          const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Hoàn thành'
          
          return (
            <Card 
              key={task.ID} 
              className={cn(
                "group relative overflow-hidden transition-all duration-500 transform hover:scale-105",
                "bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30",
                isOverdue && "border-red-300 bg-gradient-to-br from-red-50/50 to-pink-50/30",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              )}
              style={{ 
                transitionDelay: `${300 + index * 100}ms`,
                animationDelay: `${300 + index * 100}ms`
              }}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Status indicator line */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-1 transition-all duration-300",
                task.status === 'Hoàn thành' && "bg-gradient-to-r from-green-400 to-emerald-500",
                task.status === 'Đang xử lí' && "bg-gradient-to-r from-blue-400 to-blue-500",
                task.status === 'Xem xét' && "bg-gradient-to-r from-yellow-400 to-orange-500",
                task.status === 'Tiếp nhận văn bản' && "bg-gradient-to-r from-gray-400 to-gray-500"
              )} />

              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                    {task.description}
                  </CardTitle>
                  {isOverdue && (
                    <Badge variant="destructive" className="ml-2 animate-pulse">
                      Quá hạn
                    </Badge>
                  )}
                </div>
                <Badge className={cn(
                  getStatusColor(task.status),
                  "transform group-hover:scale-105 transition-transform duration-300"
                )}>
                  {task.status}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-4 relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Giao cho: {task.assigned_user?.name || 'Chưa gán'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">Hạn: {formatDate(task.deadline)}</span>
                      <RemainingTime 
                        deadline={task.deadline} 
                        status={task.status}
                        variant="compact"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium">Tạo: {formatDate(task.CreatedAt)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3 group-hover:bg-orange-200 transition-colors">
                      <FileText className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="font-medium">Văn bản số: {task.incoming_file?.order_number}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Link to={`/tasks/${task.ID}`}>
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-600 group-hover:text-white group-hover:border-transparent transition-all duration-300"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Xem chi tiết
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có công việc nào
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter 
                ? 'Không tìm thấy công việc phù hợp với bộ lọc'
                : 'Chưa có công việc nào được tạo'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}