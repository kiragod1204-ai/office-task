import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

import { Link } from 'react-router-dom'
import { 
  Plus, 
  FileText, 
  Users, 
  BarChart3,
  Search,
  Settings,
  Upload,

} from 'lucide-react'

interface QuickActionsProps {
  user: any
}

export const QuickActions: React.FC<QuickActionsProps> = ({ user }) => {
  const getActionsForRole = () => {
    const commonActions = [
      {
        icon: Search,
        label: 'Tìm kiếm công việc',
        href: '/tasks',
        color: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
        description: 'Tìm và xem chi tiết công việc'
      },
      {
        icon: BarChart3,
        label: 'Báo cáo',
        href: '/reports',
        color: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
        description: 'Xem báo cáo và thống kê'
      }
    ]

    switch (user?.role) {
      case 'Văn thư':
        return [
          {
            icon: Plus,
            label: 'Tạo công việc',
            href: '/create-task',
            color: 'bg-green-100 text-green-600 hover:bg-green-200',
            description: 'Tạo công việc mới từ văn bản'
          },
          {
            icon: Upload,
            label: 'Tải văn bản',
            href: '/incoming-files',
            color: 'bg-orange-100 text-orange-600 hover:bg-orange-200',
            description: 'Tải lên văn bản đến'
          },
          ...commonActions
        ]

      case 'Trưởng Công An Xã':
      case 'Phó Công An Xã':
        return [
          {
            icon: Users,
            label: 'Quản lý nhóm',
            href: '/team',
            color: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
            description: 'Xem hiệu suất và phân công'
          },
          {
            icon: FileText,
            label: 'Phê duyệt',
            href: '/tasks?status=Xem xét',
            color: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
            description: 'Xem xét và phê duyệt công việc'
          },
          ...commonActions
        ]

      case 'Quản trị viên':
        return [
          {
            icon: Users,
            label: 'Quản lý người dùng',
            href: '/users',
            color: 'bg-red-100 text-red-600 hover:bg-red-200',
            description: 'Quản lý tài khoản người dùng'
          },
          {
            icon: Settings,
            label: 'Cài đặt hệ thống',
            href: '/settings',
            color: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            description: 'Cấu hình hệ thống'
          },
          ...commonActions
        ]

      default:
        return [
          {
            icon: FileText,
            label: 'Công việc của tôi',
            href: '/my-tasks',
            color: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
            description: 'Xem công việc được giao'
          },
          ...commonActions
        ]
    }
  }

  const actions = getActionsForRole()

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Thao tác nhanh
          </h2>
          <div className="text-sm text-gray-500">
            Dành cho {user?.role}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon
            
            return (
              <Link key={index} to={action.href}>
                <div className="group p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`p-3 rounded-full ${action.color} transition-colors duration-200`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-gray-700">
                        {action.label}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Additional Quick Stats */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-lg font-bold text-gray-900">
                {new Date().toLocaleDateString('vi-VN', { day: 'numeric' })}
              </div>
              <div className="text-xs text-gray-500">Ngày hôm nay</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-lg font-bold text-gray-900">
                {new Date().toLocaleDateString('vi-VN', { weekday: 'short' })}
              </div>
              <div className="text-xs text-gray-500">Thứ trong tuần</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-lg font-bold text-gray-900">
                {new Date().getHours()}:{new Date().getMinutes().toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500">Giờ hiện tại</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}