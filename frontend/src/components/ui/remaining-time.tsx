import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle } from 'lucide-react'
import { getUrgencyColor, cn } from '@/lib/utils'
import { useRemainingTime } from '@/hooks/use-remaining-time'

interface RemainingTimeProps {
  deadline: string | Date
  status?: string
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

export const RemainingTime: React.FC<RemainingTimeProps> = ({
  deadline,
  status,
  variant = 'default',
  className
}) => {
  // Don't show remaining time for completed tasks
  if (status === 'Hoàn thành') {
    return null
  }

  const remainingTime = useRemainingTime(deadline, status)

  if (variant === 'compact') {
    return (
      <Badge 
        className={cn(
          'text-xs',
          getUrgencyColor(remainingTime.urgency),
          remainingTime.isOverdue && 'animate-pulse',
          className
        )}
        variant="outline"
      >
        <Clock className="w-3 h-3 mr-1" />
        {remainingTime.text}
      </Badge>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="text-center">
          <div className={cn(
            'text-2xl font-bold',
            remainingTime.isOverdue ? 'text-red-600' : 'text-blue-600'
          )}>
            {remainingTime.text}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {remainingTime.isOverdue ? 'Đã quá hạn' : 'Còn lại'}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={cn(
              'h-3 rounded-full transition-all duration-300',
              remainingTime.urgency === 'critical' && 'bg-red-500',
              remainingTime.urgency === 'urgent' && 'bg-orange-500',
              remainingTime.urgency === 'high' && 'bg-yellow-500',
              remainingTime.urgency === 'medium' && 'bg-blue-500',
              remainingTime.urgency === 'normal' && 'bg-green-500',
              remainingTime.isOverdue && 'animate-pulse'
            )}
            style={{
              width: remainingTime.isOverdue ? '100%' : 
                     remainingTime.urgency === 'critical' ? '95%' :
                     remainingTime.urgency === 'urgent' ? '75%' :
                     remainingTime.urgency === 'high' ? '50%' :
                     remainingTime.urgency === 'medium' ? '25%' : '10%'
            }}
          />
        </div>
        
        <div className="text-xs text-center text-gray-500">
          {remainingTime.isOverdue ? 
            'Công việc đã quá hạn' : 
            'Thời gian còn lại để hoàn thành'
          }
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {remainingTime.isOverdue && (
        <AlertTriangle className="w-4 h-4 text-red-500" />
      )}
      <Badge 
        className={cn(
          getUrgencyColor(remainingTime.urgency),
          remainingTime.isOverdue && 'animate-pulse'
        )}
        variant="outline"
      >
        <Clock className="w-4 h-4 mr-2" />
        {remainingTime.text}
      </Badge>
    </div>
  )
}