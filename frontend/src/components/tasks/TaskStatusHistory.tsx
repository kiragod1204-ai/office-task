import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { tasksApi, TaskStatusHistory as TaskStatusHistoryType } from '@/api/tasks'
import { 
  History, 
  User, 
  Clock, 
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface TaskStatusHistoryProps {
  taskId: number
}

export const TaskStatusHistory: React.FC<TaskStatusHistoryProps> = ({ taskId }) => {
  const [history, setHistory] = useState<TaskStatusHistoryType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [taskId])

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await tasksApi.getTaskStatusHistory(taskId)
      setHistory(data)
    } catch (error: any) {
      console.error('Error fetching task history:', error)
      setError('Không thể tải lịch sử trạng thái')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Chưa bắt đầu':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Tiếp nhận văn bản':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Đang xử lí':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Xem xét':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Hoàn thành':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Chưa bắt đầu':
        return <Clock className="w-3 h-3" />
      case 'Tiếp nhận văn bản':
        return <RefreshCw className="w-3 h-3" />
      case 'Đang xử lí':
        return <RefreshCw className="w-3 h-3 animate-spin" />
      case 'Xem xét':
        return <AlertCircle className="w-3 h-3" />
      case 'Hoàn thành':
        return <div className="w-3 h-3 bg-green-600 rounded-full" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <History className="w-4 h-4 mr-2" />
            Lịch sử trạng thái
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500">Đang tải lịch sử...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <History className="w-4 h-4 mr-2" />
              Lịch sử trạng thái
            </div>
            <Button variant="outline" size="sm" onClick={fetchHistory}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <History className="w-4 h-4 mr-2" />
            Lịch sử trạng thái
          </div>
          <Button variant="outline" size="sm" onClick={fetchHistory}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Chưa có lịch sử trạng thái</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => (
              <div key={item.ID} className="relative">
                {/* Timeline line */}
                {index < history.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-200"></div>
                )}
                
                <div className="flex items-start space-x-3">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                    {getStatusIcon(item.new_status)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {item.old_status && (
                        <>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(item.old_status)}`}
                          >
                            {item.old_status}
                          </Badge>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                        </>
                      )}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(item.new_status)}`}
                      >
                        {item.new_status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                      <User className="w-3 h-3" />
                      <span>{item.changed_by?.name}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(item.CreatedAt)}</span>
                    </div>
                    
                    {item.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                        {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}