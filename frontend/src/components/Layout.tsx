import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { NotificationCenter } from '@/components/ui/notification-center'
import { tasksApi, Task } from '@/api/tasks'
import {
  FileText,
  LayoutDashboard,
  Users,
  LogOut,
  Plus,
  FolderOpen,
  Shield,
  Crown,
  Star,
  FileCheck,
  User
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [tasks, setTasks] = useState<Task[]>([])

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Quản trị viên':
        return Shield
      case 'Trưởng Công An Xã':
        return Crown
      case 'Phó Công An Xã':
        return Star
      case 'Văn thư':
        return FileCheck
      case 'Cán bộ':
        return User
      default:
        return User
    }
  }

  // Get professional role colors
  const getProfessionalRoleColor = (role: string) => {
    switch (role) {
      case 'Quản trị viên':
        return {
          bg: 'bg-gradient-to-r from-purple-600 to-purple-700',
          text: 'text-white',
          border: 'border-purple-200',
          icon: 'text-purple-100'
        }
      case 'Trưởng Công An Xã':
        return {
          bg: 'bg-gradient-to-r from-red-600 to-red-700',
          text: 'text-white',
          border: 'border-red-200',
          icon: 'text-red-100'
        }
      case 'Phó Công An Xã':
        return {
          bg: 'bg-gradient-to-r from-orange-600 to-orange-700',
          text: 'text-white',
          border: 'border-orange-200',
          icon: 'text-orange-100'
        }
      case 'Văn thư':
        return {
          bg: 'bg-gradient-to-r from-blue-600 to-blue-700',
          text: 'text-white',
          border: 'border-blue-200',
          icon: 'text-blue-100'
        }
      case 'Cán bộ':
        return {
          bg: 'bg-gradient-to-r from-green-600 to-green-700',
          text: 'text-white',
          border: 'border-green-200',
          icon: 'text-green-100'
        }
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-600 to-gray-700',
          text: 'text-white',
          border: 'border-gray-200',
          icon: 'text-gray-100'
        }
    }
  }

  // Fetch tasks for notifications
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await tasksApi.getTasks()
        setTasks(data)
      } catch (error) {
        console.error('Error fetching tasks for notifications:', error)
      }
    }

    if (user) {
      fetchTasks()
      // Refresh tasks every 5 minutes for real-time notifications
      const interval = setInterval(fetchTasks, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [user])

  const navigation = [
    {
      name: 'Tổng quan',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Quản trị viên', 'Trưởng Công An Xã', 'Phó Công An Xã', 'Văn thư', 'Cán bộ']
    },
    {
      name: 'Công việc',
      href: '/tasks',
      icon: FileText,
      roles: ['Quản trị viên', 'Trưởng Công An Xã', 'Phó Công An Xã', 'Văn thư', 'Cán bộ']
    },
    {
      name: 'Tạo công việc',
      href: '/create-task',
      icon: Plus,
      roles: ['Văn thư', 'Trưởng Công An Xã']
    },
    {
      name: 'Văn bản đến',
      href: '/incoming-files',
      icon: FolderOpen,
      roles: ['Quản trị viên', 'Trưởng Công An Xã', 'Phó Công An Xã', 'Văn thư']
    },
    {
      name: 'Người dùng',
      href: '/users',
      icon: Users,
      roles: ['Quản trị viên']
    }
  ]

  const filteredNavigation = navigation.filter(item =>
    user && item.roles.includes(user.role)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <div className="fixed top-0 left-64 right-0 z-40 h-16 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {navigation.find(item => item.href === location.pathname)?.name || 'Trang chủ'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Xin chào,</span>
              <span className="text-sm font-medium text-gray-900">{user?.name}</span>
            </div>
            <NotificationCenter tasks={tasks} user={user} />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-gray-100">
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50/50">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src="/logo/logo.png"
                    alt="Logo"
                    className="w-10 h-10 object-contain drop-shadow-sm"
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-gray-900 leading-tight">
                  <span className="block text-gray-800">Quản lý</span>
                  <span className="block text-blue-600 text-sm font-medium">
                    Văn bản & Công việc
                  </span>
                </h1>
                <div className="flex items-center mt-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></div>
                  <span className="text-xs font-semibold text-emerald-700">Xã Khánh Cường</span>
                </div>
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-blue-50/30">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-base">
                      {user?.name.charAt(0)}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate mb-1">
                  {user?.name}
                </p>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getProfessionalRoleColor(user?.role || '').bg} ${getProfessionalRoleColor(user?.role || '').text} border ${getProfessionalRoleColor(user?.role || '').border}`}>
                  {(() => {
                    const RoleIcon = getRoleIcon(user?.role || '')
                    return <RoleIcon className={`w-3 h-3 mr-1.5 ${getProfessionalRoleColor(user?.role || '').icon}`} />
                  })()}
                  <span className="truncate">{user?.role}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-100 hover:to-blue-50 hover:text-gray-900'
                    }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
                    } ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  <span className="truncate">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-75"></div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-xl py-3 px-4 transition-all duration-200 group"
              onClick={logout}
            >
              <LogOut className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-105" />
              <span className="font-medium">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64 pt-16">
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}