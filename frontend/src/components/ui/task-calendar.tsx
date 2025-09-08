import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/api/tasks'
import { Link } from 'react-router-dom'
import { getUrgencyColor } from '@/lib/utils'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Eye
} from 'lucide-react'

interface TaskCalendarProps {
  tasks: Task[]
}

export const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getTasksForDate = (date: Date | null) => {
    if (!date) return []
    
    const dateStr = date.toISOString().split('T')[0]
    return tasks?.filter(task => {
      const taskDate = new Date(task.deadline).toISOString().split('T')[0]
      return taskDate === dateStr && task.status !== 'Hoàn thành'
    }) || []
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const days = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPastDate = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Lịch công việc
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {monthName}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((date, index) => {
              const dayTasks = getTasksForDate(date)
              const hasOverdue = dayTasks.some(task => task.remaining_time?.is_overdue)
              const hasUrgent = dayTasks.some(task => 
                task.remaining_time?.urgency === 'urgent' || task.remaining_time?.urgency === 'critical'
              )
              
              return (
                <div
                  key={index}
                  className={`
                    min-h-[80px] p-1 border border-gray-100 rounded-lg transition-all duration-200
                    ${date ? 'hover:bg-gray-50 cursor-pointer' : ''}
                    ${isToday(date) ? 'bg-blue-50 border-blue-200' : ''}
                    ${isPastDate(date) ? 'bg-gray-50' : ''}
                    ${hasOverdue ? 'bg-red-50 border-red-200' : ''}
                    ${hasUrgent && !hasOverdue ? 'bg-orange-50 border-orange-200' : ''}
                  `}
                >
                  {date && (
                    <>
                      {/* Date number */}
                      <div className={`
                        text-xs font-medium mb-1
                        ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}
                        ${isPastDate(date) ? 'text-gray-400' : ''}
                      `}>
                        {date.getDate()}
                      </div>
                      
                      {/* Task indicators */}
                      <div className="space-y-1">
                        {dayTasks.slice(0, 2).map((task) => (
                          <div
                            key={task.ID}
                            className="group relative"
                          >
                            <div className={`
                              text-xs p-1 rounded truncate transition-all duration-200
                              ${task.remaining_time?.is_overdue 
                                ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                                : task.remaining_time?.urgency === 'urgent' || task.remaining_time?.urgency === 'critical'
                                ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              }
                            `}>
                              {task.description.substring(0, 15)}...
                            </div>
                            
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10">
                              <div className="bg-gray-900 text-white text-xs rounded p-2 whitespace-nowrap max-w-xs">
                                <div className="font-medium">{task.description}</div>
                                <div className="text-gray-300">
                                  {task.assigned_user?.name || 'Chưa gán'}
                                </div>
                                <div className="flex items-center mt-1">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {task.remaining_time?.text}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* More tasks indicator */}
                        {dayTasks.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayTasks.length - 2} khác
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-gray-600">Hôm nay</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
              <span className="text-gray-600">Cần ưu tiên</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-gray-600">Quá hạn</span>
            </div>
          </div>

          {/* Today's Tasks */}
          {(() => {
            const todayTasks = getTasksForDate(new Date())
            if (todayTasks.length === 0) return null
            
            return (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Công việc hôm nay</h4>
                <div className="space-y-2">
                  {todayTasks.map((task) => (
                    <div key={task.ID} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {task.description}
                        </div>
                        <div className="text-xs text-gray-500">
                          {task.assigned_user?.name || 'Chưa gán'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${getUrgencyColor(task.remaining_time?.urgency || 'normal')}`}>
                          {task.remaining_time?.text}
                        </Badge>
                        <Link to={`/tasks/${task.ID}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      </CardContent>
    </Card>
  )
}