import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { getRoleColor, formatDate } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { usersApi, User, UserStats } from '@/api/users'
import { 
  Search, 
  UserPlus, 
  User as UserIcon,
  Shield,
  Users as UsersIcon,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Hash
} from 'lucide-react'

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')



  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    role: ''
  })
  const [editUser, setEditUser] = useState({
    name: '',
    username: '',
    role: '',
    password: ''
  })
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const roles = [
    'Quản trị viên',
    'Trưởng Công An Xã', 
    'Phó Công An Xã',
    'Văn thư',
    'Cán bộ'
  ]

  useEffect(() => {
    if (user?.role !== 'Quản trị viên') {
      return
    }
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      const [usersData, statsData] = await Promise.all([
        usersApi.getUsers(),
        usersApi.getUserStats()
      ])
      setUsers(usersData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải dữ liệu người dùng",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newUser.name || !newUser.username || !newUser.password || !newUser.role) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin",
      })
      return
    }

    setCreating(true)
    try {
      const createdUser = await usersApi.createUser(newUser)
      setUsers([...users, createdUser])
      setNewUser({ name: '', username: '', password: '', role: '' })
      setCreateDialogOpen(false)
      toast({
        title: "Tạo người dùng thành công",
        description: `Đã tạo tài khoản cho ${createdUser.name}`,
      })
      fetchData()
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.response?.data?.error || 'Có lỗi xảy ra khi tạo người dùng',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditUser({
      name: user.name,
      username: user.username,
      role: user.role,
      password: ''
    })
    setEditDialogOpen(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setUpdating(true)
    try {
      const updateData: any = {
        name: editUser.name,
        username: editUser.username,
        role: editUser.role
      }
      
      if (editUser.password) {
        updateData.password = editUser.password
      }

      const updatedUser = await usersApi.updateUser(selectedUser.ID || selectedUser.id!, updateData)
      
      setUsers(users.map(u => (u.ID || u.id) === (selectedUser.ID || selectedUser.id) ? updatedUser : u))
      
      setEditDialogOpen(false)
      setSelectedUser(null)
      toast({
        title: "Cập nhật thành công",
        description: `Đã cập nhật thông tin ${updatedUser.name}`,
      })
      fetchData()
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.response?.data?.error || 'Có lỗi xảy ra khi cập nhật người dùng',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleViewUser = async (user: User) => {
    try {
      const userDetails = await usersApi.getUserById(user.ID || user.id!)
      setSelectedUser(userDetails)
      setViewDialogOpen(true)
    } catch (error) {
      console.error('Error fetching user details:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải thông tin chi tiết người dùng",
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setDeleting(true)
    try {
      await usersApi.deleteUser(selectedUser.ID || selectedUser.id!)
      setUsers(users.filter(u => (u.ID || u.id) !== (selectedUser.ID || selectedUser.id)))
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      toast({
        title: "Xóa thành công",
        description: `Đã xóa người dùng ${selectedUser.name}`,
      })
      fetchData()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.response?.data?.error || 'Có lỗi xảy ra khi xóa người dùng',
      })
    } finally {
      setDeleting(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !roleFilter || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (user?.role !== 'Quản trị viên') {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Không có quyền truy cập
        </h3>
        <p className="text-gray-600">
          Chỉ Quản trị viên mới có thể quản lý người dùng
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-600 mt-2">
            Quản lý tài khoản và phân quyền người dùng
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Tạo người dùng mới
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo người dùng mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Họ tên</label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Nhập họ tên"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên đăng nhập</label>
                <Input
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Mật khẩu</label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Vai trò</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full h-10 px-3 py-2 text-sm border border-gray-300 bg-white rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Chọn vai trò</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Đang tạo...' : 'Tạo'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
              <UsersIcon className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
              <p className="text-xs text-gray-600">
                {stats.active_users} đang hoạt động
              </p>
            </CardContent>
          </Card>

          {Object.entries(stats.users_by_role).slice(0, 3).map(([role, count]) => (
            <Card key={role}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{role}</CardTitle>
                <UserIcon className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-gray-600">
                  {Math.round((count / stats.total_users) * 100)}% tổng số
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm người dùng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 bg-white rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Tất cả vai trò</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((u) => (
          <Card key={u.ID || u.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{u.name}</CardTitle>
                    <p className="text-sm text-gray-600">@{u.username}</p>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewUser(u)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditUser(u)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedUser(u)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge className={getRoleColor(u.role)}>
                  {u.role}
                </Badge>
                <span className="text-sm text-gray-500">ID: {u.ID || u.id}</span>
              </div>
              {(u.CreatedAt || u.created_at) && (
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <Calendar className="w-3 h-3 mr-1" />
                  Tạo: {formatDate(u.CreatedAt || u.created_at!)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có người dùng nào
            </h3>
            <p className="text-gray-600">
              {searchTerm || roleFilter 
                ? 'Không tìm thấy người dùng phù hợp với bộ lọc'
                : 'Chưa có người dùng nào được tạo'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Họ tên</label>
              <Input
                value={editUser.name}
                onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                placeholder="Nhập họ tên"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên đăng nhập</label>
              <Input
                value={editUser.username}
                onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Mật khẩu mới (để trống nếu không đổi)</label>
              <Input
                type="password"
                value={editUser.password}
                onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                placeholder="Nhập mật khẩu mới"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Vai trò</label>
              <select
                value={editUser.role}
                onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 bg-white rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin người dùng</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-gray-600">@{selectedUser.username}</p>
                  <Badge className={getRoleColor(selectedUser.role)}>
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Hash className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">ID:</span>
                  <span className="ml-2 font-medium">{selectedUser.ID || selectedUser.id}</span>
                </div>
                
                {(selectedUser.CreatedAt || selectedUser.created_at) && (
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">Ngày tạo:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedUser.CreatedAt || selectedUser.created_at!)}</span>
                  </div>
                )}
                
                {(selectedUser.UpdatedAt || selectedUser.updated_at) && (
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">Cập nhật lần cuối:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedUser.UpdatedAt || selectedUser.updated_at!)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser.name}</strong>?
              </p>
              <p className="text-sm text-red-600">
                Hành động này không thể hoàn tác.
              </p>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  disabled={deleting}
                >
                  {deleting ? 'Đang xóa...' : 'Xóa'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}