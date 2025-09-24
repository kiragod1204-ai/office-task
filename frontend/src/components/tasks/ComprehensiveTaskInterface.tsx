import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { Task } from '@/api/tasks'
import { TaskAssignmentInterface } from './TaskAssignmentInterface'
import { TaskDelegation } from './TaskDelegation'
import { TaskForwarding } from './TaskForwarding'
import { ProcessingContentManager } from './ProcessingContentManager'
import { TaskStatusHistory } from './TaskStatusHistory'
import { 
  UserCheck, 
  Forward, 
  Edit3, 
  History,
  Settings,
  FileText,
  Clock,
  User,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface ComprehensiveTaskInterfaceProps {
  task: Task
  onTaskUpdate: (updatedTask: Task) => void
}

export const ComprehensiveTaskInterface: React.FC<ComprehensiveTaskInterfaceProps> = ({
  task,
  onTaskUpdate
}) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('actions')

  const canManageTask = () => {
    if (!user) return false
    
    // Check if user can manage this task
    return (
      task.created_by_id === user.id || 
      task.assigned_to_id === user.id ||
      ['Trưởng Công An Xã', 'Phó Công An Xã', 'Văn thư'].includes(user.role)
    )
  }

  const getTaskPriority = () => {
    if (!task.deadline) return 'normal'
    
    const deadline = new Date(task.deadline)
    const now = new Date()
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 0) return 'overdue'
    if (diffHours < 24) return 'urgent'
    if (diffHours < 72) return 'high'
    return 'normal'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200'
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'high': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'Quá hạn'
      case 'urgent': return 'Khẩn cấp'
      case 'high': return 'Ưu tiên cao'
      default: return 'Bình thường'
    }
  }

  if (!canManageTask()) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Bạn không có quyền quản lý công việc này</p>
        </CardContent>
      </Card>
    )
  }

  const priority = getTaskPriority()

  return (
    <div className="space-y-6">
      {/* Task Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Quản lý công việc
            </CardTitle>
            <Badge className={`${getPriorityColor(priority)} border`}>
              {priority === 'overdue' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {getPriorityLabel(priority)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Người tạo:</span>
              <span className="font-medium">{task.created_by?.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Được gán:</span>
              <span className="font-medium">{task.assigned_to?.name || 'Chưa gán'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Trạng thái:</span>
              <Badge variant="outline">{task.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Management Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="actions" className="flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Hành động
              </TabsTrigger>
              <TabsTrigger value="processing" className="flex items-center">
                <Edit3 className="w-4 h-4 mr-2" />
                Xử lý
              </TabsTrigger>
              <TabsTrigger value="assignment" className="flex items-center">
                <UserCheck className="w-4 h-4 mr-2" />
                Phân công
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center">
                <History className="w-4 h-4 mr-2" />
                Lịch sử
              </TabsTrigger>
            </TabsList>

            {/* Actions Tab */}
            <TabsContent value="actions" className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assignment Actions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Phân công & Chuyển tiếp</h4>
                  <div className="space-y-2">
                    <TaskAssignmentInterface 
                      task={task} 
                      onTaskUpdate={onTaskUpdate}
                    />
                    <TaskDelegation 
                      task={task} 
                      onTaskUpdate={onTaskUpdate}
                    />
                    <TaskForwarding 
                      task={task} 
                      onTaskUpdate={onTaskUpdate}
                    />
                  </div>
                </div>

                {/* Processing Actions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Xử lý công việc</h4>
                  <div className="space-y-2">
                    <ProcessingContentManager 
                      task={task} 
                      onTaskUpdate={onTaskUpdate}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Processing Tab */}
            <TabsContent value="processing" className="p-6">
              <ProcessingContentManager 
                task={task} 
                onTaskUpdate={onTaskUpdate}
              />
            </TabsContent>

            {/* Assignment Tab */}
            <TabsContent value="assignment" className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-4">Phân công công việc</h4>
                  <TaskAssignmentInterface 
                    task={task} 
                    onTaskUpdate={onTaskUpdate}
                    trigger={
                      <Button className="w-full">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Phân công lại
                      </Button>
                    }
                  />
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-4">Ủy quyền</h4>
                  <TaskDelegation 
                    task={task} 
                    onTaskUpdate={onTaskUpdate}
                  />
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-4">Chuyển tiếp</h4>
                  <TaskForwarding 
                    task={task} 
                    onTaskUpdate={onTaskUpdate}
                  />
                </div>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="p-6">
              <TaskStatusHistory taskId={task.ID} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Hành động nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {task.status === 'Tiếp nhận văn bản' && (
              <Button size="sm" variant="outline">
                <UserCheck className="w-3 h-3 mr-1" />
                Tiếp nhận
              </Button>
            )}
            {task.status === 'Đang xử lí' && task.assigned_to_id === user?.id && (
              <Button size="sm" variant="outline">
                <Forward className="w-3 h-3 mr-1" />
                Gửi xem xét
              </Button>
            )}
            {task.status === 'Xem xét' && ['Trưởng Công An Xã', 'Phó Công An Xã'].includes(user?.role || '') && (
              <>
                <Button size="sm" variant="outline">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Hoàn thành
                </Button>
                <Button size="sm" variant="outline">
                  <Forward className="w-3 h-3 mr-1" />
                  Trả lại
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}