import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { tasksApi, Task, DelegateTaskRequest } from '@/api/tasks'
import { usersApi, User } from '@/api/users'
import { 
  UserCheck, 
  Search, 
  X, 
  User as UserIcon,
  ArrowRight,
  AlertCircle
} from 'lucide-react'

interface TaskDelegationProps {
  task: Task
  onTaskUpdate: (updatedTask: Task) => void
}

export const TaskDelegation: React.FC<TaskDelegationProps> = ({
  task,
  onTaskUpdate
}) => {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number>(0)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const allUsers = await usersApi.getUsers()
      
      // Filter users based on current user's role and delegation rules
      let availableUsers: User[] = []
      
      if (user?.role === 'Trưởng Công An Xã') {
        // Team leaders can delegate to Deputies and Officers
        availableUsers = allUsers.filter(u => 
          u.role === 'Phó Công An Xã' || u.role === 'Cán bộ'
        )
      } else if (user?.role === 'Phó Công An Xã') {
        // Deputies can only delegate to Officers
        availableUsers = allUsers.filter(u => u.role === 'Cán bộ')
      }
      
      // Exclude current assignee
      availableUsers = availableUsers.filter(u => u.ID !== task.assigned_to_id)
      
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

  const canDelegate = () => {
    if (!user) return false
    
    // Check if user has delegation rights
    if (!['Trưởng Công An Xã', 'Phó Công An Xã'].includes(user.role)) {
      return false
    }
    
    // Check if user is assigned to this task or created it
    return task.assigned_to_id === user.id || task.created_by_id === user.id
  }

  const filterUsers = (searchTerm: string) => {
    if (!searchTerm.trim()) return users
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleDelegate = async () => {
    if (!selectedUserId) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn người nhận ủy quyền",
      })
      return
    }

    const selectedUser = users.find(u => u.ID === selectedUserId)
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không tìm thấy thông tin người nhận",
      })
      return
    }

    setLoading(true)
    try {
      const delegateData: DelegateTaskRequest = {
        assigned_to: selectedUserId,
        notes: notes.trim()
      }

      const updatedTask = await tasksApi.delegateTask(task.ID, delegateData)
      
      onTaskUpdate(updatedTask)
      setOpen(false)
      setSelectedUserId(0)
      setNotes('')
      setSearchTerm('')
      
      toast({
        title: "Ủy quyền thành công",
        description: `Công việc đã được ủy quyền cho ${selectedUser.name}`,
      })
    } catch (error: any) {
      console.error('Error delegating task:', error)
      toast({
        variant: "destructive",
        title: "Lỗi ủy quyền",
        description: error.response?.data?.error || "Không thể ủy quyền công việc",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!canDelegate()) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <UserCheck className="w-4 h-4 mr-2" />
          Ủy quyền
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
            Ủy quyền công việc
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Ủy quyền công việc này cho người khác thực hiện
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Assignment Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Thông tin hiện tại</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{task.assigned_to?.name || 'Chưa gán'}</p>
                  <p className="text-xs text-gray-500">{task.assigned_to?.role}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="text-right">
                <p className="text-sm text-gray-600">Ủy quyền cho</p>
                <p className="text-xs text-gray-500">Chọn người nhận</p>
              </div>
            </div>
          </div>

          {/* Delegation Rules Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-blue-800">Quy tắc ủy quyền</h4>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  {user?.role === 'Trưởng Công An Xã' && (
                    <li>• Trưởng phòng có thể ủy quyền cho Phó phòng hoặc Cán bộ</li>
                  )}
                  {user?.role === 'Phó Công An Xã' && (
                    <li>• Phó phòng chỉ có thể ủy quyền cho Cán bộ</li>
                  )}
                  <li>• Chỉ có thể ủy quyền công việc được gán cho mình</li>
                </ul>
              </div>
            </div>
          </div>

          {/* User Search and Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Chọn người nhận ủy quyền</Label>
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
                    <UserIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">Không có người dùng khả dụng để ủy quyền</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {user?.role === 'Phó Công An Xã' 
                        ? 'Phó phòng chỉ có thể ủy quyền cho Cán bộ'
                        : 'Trưởng phòng có thể ủy quyền cho Phó phòng hoặc Cán bộ'
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    {filterUsers(searchTerm).map((user) => {
                      const isSelected = selectedUserId === user.ID
                      
                      return (
                        <button
                          key={user.ID}
                          onClick={() => setSelectedUserId(user.ID)}
                          className={`w-full text-left p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isSelected ? 'bg-blue-100' : 'bg-gray-100'
                              }`}>
                                <UserIcon className={`w-4 h-4 ${
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
                            {isSelected && (
                              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                    
                    {filterUsers(searchTerm).length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        <UserIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">Không tìm thấy người dùng phù hợp</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Notes Section */}
          <div>
            <Label htmlFor="delegate_notes" className="text-sm font-medium text-gray-700">
              Ghi chú ủy quyền
            </Label>
            <p className="text-xs text-gray-500 mt-1 mb-2">
              Thêm ghi chú để người nhận hiểu rõ lý do ủy quyền (tùy chọn)
            </p>
            <Textarea
              id="delegate_notes"
              value={notes}
              onChange={(e) => {
                const value = e.target.value
                if (value.length <= 500) {
                  setNotes(value)
                }
              }}
              placeholder="Ví dụ: Ủy quyền do bận công tác, cần hỗ trợ chuyên môn..."
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs ${
                notes.length > 450 ? 'text-orange-500' : 
                notes.length > 400 ? 'text-yellow-500' : 'text-gray-400'
              }`}>
                {notes.length}/500 ký tự
              </span>
            </div>
          </div>

          {/* Selected User Summary */}
          {selectedUserId > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-sm text-green-800 mb-2">Xác nhận ủy quyền</h4>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-800">
                    Ủy quyền cho: <span className="font-medium">
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
                setSelectedUserId(0)
                setNotes('')
              }}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleDelegate} 
              disabled={loading || !selectedUserId}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang ủy quyền...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Ủy quyền
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}