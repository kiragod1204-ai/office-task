import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'Tiếp nhận văn bản':
      return 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-300 shadow-sm ring-1 ring-blue-200/50 dark:from-blue-900/20 dark:to-blue-900/30 dark:text-blue-200 dark:border-blue-700 dark:ring-blue-700/30'
    case 'Đang xử lí':
      return 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border-amber-300 shadow-sm ring-1 ring-amber-200/50 dark:from-amber-900/20 dark:to-amber-900/30 dark:text-amber-200 dark:border-amber-700 dark:ring-amber-700/30'
    case 'Xem xét':
      return 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-800 border-orange-300 shadow-sm ring-1 ring-orange-200/50 dark:from-orange-900/20 dark:to-orange-900/30 dark:text-orange-200 dark:border-orange-700 dark:ring-orange-700/30'
    case 'Hoàn thành':
      return 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-300 shadow-sm ring-1 ring-green-200/50 dark:from-green-900/20 dark:to-green-900/30 dark:text-green-200 dark:border-green-700 dark:ring-green-700/30'
    default:
      return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-300 shadow-sm ring-1 ring-gray-200/50 dark:from-gray-800 dark:to-gray-900 dark:text-gray-200 dark:border-gray-700 dark:ring-gray-700/30'
  }
}

export function getStatusIcon(status: string) {
  switch (status) {
    case 'Tiếp nhận văn bản':
      return 'FileText'
    case 'Đang xử lí':
      return 'Clock'
    case 'Xem xét':
      return 'Eye'
    case 'Hoàn thành':
      return 'CheckCircle'
    default:
      return 'Circle'
  }
}

export function getRoleColor(role: string) {
  switch (role) {
    case 'Quản trị viên':
      return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-300 shadow-lg shadow-purple-500/25'
    case 'Trưởng Công An Xã':
      return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-300 shadow-lg shadow-red-500/25'
    case 'Phó Công An Xã':
      return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-300 shadow-lg shadow-orange-500/25'
    case 'Văn thư':
      return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-300 shadow-lg shadow-blue-500/25'
    case 'Cán bộ':
      return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-300 shadow-lg shadow-green-500/25'
    default:
      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-300 shadow-lg shadow-gray-500/25'
  }
}

export function getRoleColorLight(role: string) {
  switch (role) {
    case 'Quản trị viên':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700'
    case 'Trưởng Công An Xã':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700'
    case 'Phó Công An Xã':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700'
    case 'Văn thư':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700'
    case 'Cán bộ':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
  }
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'Cao':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700'
    case 'Trung bình':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700'
    case 'Thấp':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
  }
}

export function getRemainingTime(deadline: string | Date) {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffMs = deadlineDate.getTime() - now.getTime()
  
  if (diffMs < 0) {
    const overdueDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24))
    const overdueHours = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (overdueDays > 0) {
      return {
        text: `Quá hạn ${overdueDays} ngày`,
        isOverdue: true,
        urgency: 'critical'
      }
    } else if (overdueHours > 0) {
      return {
        text: `Quá hạn ${overdueHours} giờ`,
        isOverdue: true,
        urgency: 'critical'
      }
    } else {
      return {
        text: 'Quá hạn',
        isOverdue: true,
        urgency: 'critical'
      }
    }
  }
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 7) {
    return {
      text: `Còn ${days} ngày`,
      isOverdue: false,
      urgency: 'normal'
    }
  } else if (days > 3) {
    return {
      text: `Còn ${days} ngày`,
      isOverdue: false,
      urgency: 'medium'
    }
  } else if (days > 1) {
    return {
      text: `Còn ${days} ngày ${hours} giờ`,
      isOverdue: false,
      urgency: 'high'
    }
  } else if (days === 1) {
    return {
      text: `Còn 1 ngày ${hours} giờ`,
      isOverdue: false,
      urgency: 'urgent'
    }
  } else if (hours > 0) {
    return {
      text: `Còn ${hours} giờ ${minutes} phút`,
      isOverdue: false,
      urgency: 'urgent'
    }
  } else {
    return {
      text: `Còn ${minutes} phút`,
      isOverdue: false,
      urgency: 'critical'
    }
  }
}

export function getUrgencyColor(urgency: string) {
  switch (urgency) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700'
    case 'urgent':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700'
    case 'high':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700'
    case 'medium':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700'
    case 'normal':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
  }
}

export function getTaskProgress(status: string) {
  switch (status) {
    case 'Hoàn thành':
      return { percentage: 100, width: 'w-full', color: 'from-green-400 to-green-600', shadow: '0 0 10px rgba(34, 197, 94, 0.4)' }
    case 'Xem xét':
      return { percentage: 75, width: 'w-3/4', color: 'from-orange-400 to-orange-600', shadow: '0 0 10px rgba(249, 115, 22, 0.4)' }
    case 'Đang xử lí':
      return { percentage: 50, width: 'w-1/2', color: 'from-yellow-400 to-yellow-600', shadow: '0 0 10px rgba(234, 179, 8, 0.4)' }
    case 'Tiếp nhận văn bản':
      return { percentage: 25, width: 'w-1/4', color: 'from-blue-400 to-blue-600', shadow: '0 0 10px rgba(59, 130, 246, 0.4)' }
    default:
      return { percentage: 0, width: 'w-0', color: 'from-gray-400 to-gray-600', shadow: '0 0 10px rgba(107, 114, 128, 0.4)' }
  }
}