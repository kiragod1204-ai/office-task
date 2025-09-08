import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/api/tasks'
import { AlertTriangle, X, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface OverdueNotificationProps {
  tasks: Task[]
  className?: string
}

export const OverdueNotification: React.FC<OverdueNotificationProps> = ({ 
  tasks, 
  className 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const overdueTasks = tasks?.filter(task => 
    task.remaining_time?.is_overdue && task.status !== 'Hoàn thành'
  ) || []

  useEffect(() => {
    if (overdueTasks.length > 0 && !isDismissed) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [overdueTasks.length, isDismissed])

  if (!isVisible || overdueTasks.length === 0) {
    return null
  }

  return (
    <Card className={cn(
      "border-red-200 bg-red-50 shadow-lg animate-in slide-in-from-top-2 duration-300",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">
                Cảnh báo: Có {overdueTasks.length} công việc quá hạn
              </h3>
              <p className="text-sm text-red-700 mb-3">
                Các công việc sau đây đã quá hạn hoàn thành và cần được xử lý ngay:
              </p>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {overdueTasks.slice(0, 3).map((task) => (
                  <div key={task.ID} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm line-clamp-1">
                        {task.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="destructive" className="text-xs">
                          {task.remaining_time?.text}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Giao cho: {task.assigned_user?.name || 'Chưa gán'}
                        </span>
                      </div>
                    </div>
                    <Link to={`/tasks/${task.ID}`}>
                      <Button variant="outline" size="sm" className="ml-2">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
                
                {overdueTasks.length > 3 && (
                  <div className="text-center py-2">
                    <p className="text-sm text-red-600">
                      Và {overdueTasks.length - 3} công việc khác...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}