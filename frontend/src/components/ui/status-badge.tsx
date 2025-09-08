import React from 'react'
import { Badge } from '@/components/ui/badge'
import { getStatusColor } from '@/lib/utils'
import { 
  FileText, 
  Clock, 
  Eye, 
  CheckCircle, 
  Circle,
  AlertTriangle 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'compact' | 'detailed'
  showIcon?: boolean
  isOverdue?: boolean
  className?: string
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Tiếp nhận văn bản':
      return FileText
    case 'Đang xử lí':
      return Clock
    case 'Xem xét':
      return Eye
    case 'Hoàn thành':
      return CheckCircle
    default:
      return Circle
  }
}

const getStatusDescription = (status: string) => {
  switch (status) {
    case 'Tiếp nhận văn bản':
      return 'Văn bản đã được tiếp nhận và chờ xử lý'
    case 'Đang xử lí':
      return 'Công việc đang được thực hiện'
    case 'Xem xét':
      return 'Công việc đã hoàn thành và chờ xem xét'
    case 'Hoàn thành':
      return 'Công việc đã được hoàn thành'
    default:
      return 'Trạng thái không xác định'
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'default',
  showIcon = true,
  isOverdue = false,
  className
}) => {
  const StatusIcon = getStatusIcon(status)
  const statusColor = getStatusColor(status)
  
  if (variant === 'compact') {
    return (
      <Badge 
        className={cn(
          statusColor,
          'px-2 py-1 text-xs font-medium cursor-default',
          isOverdue && 'ring-2 ring-red-500/50',
          className
        )}
        title={getStatusDescription(status)}
      >
        {showIcon && <StatusIcon className="w-3 h-3 mr-1" />}
        {status}
        {isOverdue && <AlertTriangle className="w-3 h-3 ml-1 text-red-600" />}
      </Badge>
    )
  }
  
  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-1', className)}>
        <Badge 
          className={cn(
            statusColor,
            'px-3 py-1.5 text-sm font-medium cursor-default',
            isOverdue && 'ring-2 ring-red-500/50'
          )}
        >
          {showIcon && <StatusIcon className="w-4 h-4 mr-2" />}
          {status}
          {isOverdue && <AlertTriangle className="w-4 h-4 ml-2 text-red-600" />}
        </Badge>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {getStatusDescription(status)}
        </p>
      </div>
    )
  }
  
  // Default variant
  return (
    <Badge 
      className={cn(
        statusColor,
        'px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-105 cursor-default',
        isOverdue && 'ring-2 ring-red-500/50 animate-pulse',
        className
      )}
      title={getStatusDescription(status)}
    >
      {showIcon && <StatusIcon className="w-4 h-4 mr-2" />}
      {status}
      {isOverdue && <AlertTriangle className="w-4 h-4 ml-2 text-red-600" />}
    </Badge>
  )
}