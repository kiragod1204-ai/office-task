import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { tasksApi, Task, AssignTaskRequest } from '@/api/tasks'
import { usersApi, User } from '@/api/users'
import { 
  UserCheck, 
  Search, 
  X, 
  User as UserIcon,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface TaskAssignmentInterfaceProps {
  task: Task
  onTaskUpdate: (updatedTask: Task) => void
  trigger?: React.ReactNode
}

export const TaskAssignmentInterface: React.FC<TaskAssignmentInterfaceProps> = ({
  task,
  onTaskUpdate,
  trigger
}) => {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number>(task.assigned_to_id || 0)

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const allUsers = await usersApi.getUsers()
      
      // Filter users based on current user's role and assignment rules
      let availableUsers: User[] = []
      
      if (user?.role === 'Văn thư') {
        // Secretary can assign to Team Leaders and Deputies only
        availableUsers = allUsers.filter(u => 
          u.role === 'Trưởng Công An Xã' || u.role === 'Phó Công An Xã'
        )
      } else if (user?.role === 'Trưởng Công An Xã') {
        // Team leaders can assign to Deputies and Officers
        availableUsers = allUsers.filter(u => 
          u.role === 'Phó Công An Xã' || u.role === 'Cán bộ'
        )
      } else if (user?.role === 'Phó Công An Xã') {
        // Deputies can assign to Officers
        availableUsers = allUsers.filter(u => u.role === 'Cán bộ')
      }
      
      setUsers(availableUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        variant: "destructive",
        title: "Lỗi tải dữ liệu",
        description: "Không thể tải danh sách người dùng",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const canAssignTask = () => {
    if (!user) return false
    
    // Check if user has assignment rights
    if (!['Văn thư', 'Trưởng Công An Xã', 'Phó Công An Xã'].includes(user.role)) {
      return false
    }
    
    // Check if user created the task or is assigned to it
    return task.created_by_id === user.id || task.assigned_to_id === user.id
  }

  const filterUsers = (searchTerm: string) => {
    if (!searchTerm.trim()) return users
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn người thực hiện",
      })
      return
    }

    const selectedUser = users.find(u => u.ID === selectedUserId)
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không tìm thấy thông tin người được chọn",
      })
      return
    }

    setLoading(true)
    try {
      const assignData: AssignTaskRequest = {
        assigned_to: selectedUserId
      }

      const updatedTask = await tasksApi.assignTask(task.ID, assignData)
      
      onTaskUpdate(updatedTask)
      setOpen(false)
      setSearchTerm('')
      
      toast({
        title: "Phân công thành công",
        description: `Công việc đã được phân công cho ${selectedUser.name}`,
      })
    } catch (error: any) {
      console.error('Error assigning task:', error)
      toast({
        variant: "destructive",
        title: "Lỗi phân công",
        description: error.response?.data?.error || "Không thể phân công công việc",
      })
    } finally {
      setLoading(false)
    }
  }

  const getAssignmentRules = () => {
    switch (user?.role) {
      case 'Văn thư':
        return 'Văn thư có thể phân công cho Trưởng phòng và Phó phòng'
      case 'Trưởng Công An Xã':
        return 'Trưởng phòng có thể phân công cho Phó phòng và Cán bộ'
      case 'Phó Công An Xã':
        return 'Phó phòng có thể phân công cho Cán bộ'
      default:
        return 'Không có quyền phân công'
    }
  }

  if (!canAssignTask()) {
    return null
  }

  const defaultTrigger = (
    <Button variant="outline" className="w-full justify-start">
      <UserCheck className="w-4 h-4 mr-2" />
      Phân công
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
            Phân công công việc
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Phân công công việc này cho người khác thực hiện
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Thông tin hiện tại</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {task.assigned_to?.name || 'Chưa phân công'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {task.assigned_to?.role || 'Không có vai trò'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {task.assigned_to ? 'Đã phân công' : 'Chưa phân công'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Rules Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-blue-800">Quy tắc phân công</h4>
                <p className="text-xs text-blue-700 mt-1">
                  {getAssignmentRules()}
                </p>
              </div>
            </div>
          </div>

          {/* User Search and Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Chọn người thực hiện</Label>
            <div className="mt-2 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm theo tên, vai trò hoặc tên đăng nhập..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {/* User Cards */}
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg">
                {loadingUsers ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Đang tải danh sách người dùng...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">Không có người dùng khả dụng để phân công</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {getAssignmentRules()}
                    </p>
                  </div>
                ) : (
                  <>
                    {filterUsers(searchTerm).map((user) => {
                      const isSelected = selectedUserId === user.ID
                      const isCurrent = task.assigned_to_id === user.ID
                      
                      return (
                        <button
                          key={user.ID}
                          onClick={() => setSelectedUserId(user.ID)}
                          className={`w-full text-left p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50 border-blue-200' : ''
                          } ${isCurrent ? 'bg-green-50 border-green-200' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCurrent ? 'bg-green-100' :
                                isSelected ? 'bg-blue-100' : 'bg-gray-100'
                              }`}>
                                <UserIcon className={`w-4 h-4 ${
                                  isCurrent ? 'text-green-600' :
                                  isSelected ? 'text-blue-600' : 'text-gray-500'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{user.name}</p>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {user.role}
                                  </Badge>
                                  <span className="text-xs text-gray-500">@{user.username}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isCurrent && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  Hiện tại
                                </Badge>
                              )}
                              {isSelected && (
                                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                    
                    {filterUsers(searchTerm).length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">Không tìm thấy người dùng phù hợp</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Selected User Summary */}
          {selectedUserId > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-sm text-green-800 mb-2">Xác nhận phân công</h4>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-800">
                    Phân công cho: <span className="font-medium">
                      {users.find(u => u.ID === selectedUserId)?.name}
                    </span>
                  </p>
                  <p className="text-xs text-green-600">
                    {users.find(u => u.ID === selectedUserId)?.role}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setOpen(false)
                setSearchTerm('')
                setSelectedUserId(task.assigned_to_id || 0)
              }}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={loading || !selectedUserId || selectedUserId === task.assigned_to_id}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang phân công...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Phân công
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}