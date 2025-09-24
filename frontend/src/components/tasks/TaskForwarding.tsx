import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { tasksApi, Task, ForwardTaskRequest } from '@/api/tasks'
import { usersApi, User } from '@/api/users'
import { 
  Forward, 
  Search, 
  X, 
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  Send
} from 'lucide-react'

interface TaskForwardingProps {
  task: Task
  onTaskUpdate: (updatedTask: Task) => void
}

export const TaskForwarding: React.FC<TaskForwardingProps> = ({
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
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const allUsers = await usersApi.getUsers()
      
      // Filter users based on current user's role and forwarding rules
      let availableUsers: User[] = []
      
      if (user?.role === 'Trưởng Công An Xã') {
        // Team leaders can forward to other Team Leaders, Deputies, and Officers
        availableUsers = allUsers.filter(u => 
          u.role === 'Trưởng Công An Xã' || 
          u.role === 'Phó Công An Xã' || 
          u.role === 'Cán bộ'
        )
      } else if (user?.role === 'Phó Công An Xã') {
        // Deputies can forward to Team Leaders, other Deputies, and Officers
        availableUsers = allUsers.filter(u => 
          u.role === 'Trưởng Công An Xã' || 
          u.role === 'Phó Công An Xã' || 
          u.role === 'Cán bộ'
        )
      } else if (user?.role === 'Cán bộ') {
        // Officers can forward to Team Leaders and Deputies
        availableUsers = allUsers.filter(u => 
          u.role === 'Trưởng Công An Xã' || 
          u.role === 'Phó Công An Xã'
        )
      }
      
      // Exclude current assignee and current user
      availableUsers = availableUsers.filter(u => 
        u.ID !== task.assigned_to_id && u.ID !== user?.id
      )
      
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

  const canForwardTask = () => {
    if (!user) return false
    
    // Check if user has forwarding rights
    if (!['Trưởng Công An Xã', 'Phó Công An Xã', 'Cán bộ'].includes(user.role)) {
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

  const handleForward = async () => {
    if (!selectedUserId) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn người nhận chuyển tiếp",
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
      const forwardData: ForwardTaskRequest = {
        assigned_to: selectedUserId,
        comment: comment.trim()
      }

      const updatedTask = await tasksApi.forwardTask(task.ID, forwardData)
      
      onTaskUpdate(updatedTask)
      setOpen(false)
      setSelectedUserId(0)
      setComment('')
      setSearchTerm('')
      
      toast({
        title: "Chuyển tiếp thành công",
        description: `Công việc đã được chuyển tiếp cho ${selectedUser.name}`,
      })
    } catch (error: any) {
      console.error('Error forwarding task:', error)
      toast({
        variant: "destructive",
        title: "Lỗi chuyển tiếp",
        description: error.response?.data?.error || "Không thể chuyển tiếp công việc",
      })
    } finally {
      setLoading(false)
    }
  }

  const getForwardingRules = () => {
    switch (user?.role) {
      case 'Trưởng Công An Xã':
        return 'Trưởng phòng có thể chuyển tiếp cho Trưởng phòng khác, Phó phòng hoặc Cán bộ'
      case 'Phó Công An Xã':
        return 'Phó phòng có thể chuyển tiếp cho Trưởng phòng, Phó phòng khác hoặc Cán bộ'
      case 'Cán bộ':
        return 'Cán bộ có thể chuyển tiếp cho Trưởng phòng hoặc Phó phòng'
      default:
        return 'Không có quyền chuyển tiếp'
    }
  }

  if (!canForwardTask()) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Forward className="w-4 h-4 mr-2" />
          Chuyển tiếp
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Forward className="w-5 h-5 mr-2 text-blue-600" />
            Chuyển tiếp công việc
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Chuyển tiếp công việc này cho người khác xử lý
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
                <p className="text-sm text-gray-600">Chuyển tiếp cho</p>
                <p className="text-xs text-gray-500">Chọn người nhận</p>
              </div>
            </div>
          </div>

          {/* Forwarding Rules Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-blue-800">Quy tắc chuyển tiếp</h4>
                <p className="text-xs text-blue-700 mt-1">
                  {getForwardingRules()}
                </p>
              </div>
            </div>
          </div>

          {/* User Search and Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Chọn người nhận chuyển tiếp</Label>
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
                    <p className="text-sm">Không có người dùng khả dụng để chuyển tiếp</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {getForwardingRules()}
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
          
          {/* Comment Section */}
          <div>
            <Label htmlFor="forward_comment" className="text-sm font-medium text-gray-700">
              Lời nhắn chuyển tiếp
            </Label>
            <p className="text-xs text-gray-500 mt-1 mb-2">
              Thêm lời nhắn để người nhận hiểu rõ lý do chuyển tiếp (tùy chọn)
            </p>
            <Textarea
              id="forward_comment"
              value={comment}
              onChange={(e) => {
                const value = e.target.value
                if (value.length <= 500) {
                  setComment(value)
                }
              }}
              placeholder="Ví dụ: Chuyển tiếp để xử lý chuyên môn, cần hỗ trợ kỹ thuật..."
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs ${
                comment.length > 450 ? 'text-orange-500' : 
                comment.length > 400 ? 'text-yellow-500' : 'text-gray-400'
              }`}>
                {comment.length}/500 ký tự
              </span>
            </div>
          </div>

          {/* Selected User Summary */}
          {selectedUserId > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-sm text-green-800 mb-2">Xác nhận chuyển tiếp</h4>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Send className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-800">
                    Chuyển tiếp cho: <span className="font-medium">
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
                setComment('')
              }}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleForward} 
              disabled={loading || !selectedUserId}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang chuyển tiếp...
                </>
              ) : (
                <>
                  <Forward className="w-4 h-4 mr-2" />
                  Chuyển tiếp
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}