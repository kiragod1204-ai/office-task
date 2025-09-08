import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { cn } from '@/lib/utils'
import { 
  FileText, 
  Settings, 
  Eye, 
  CheckCircle, 
  Clock,
  User,
  Calendar,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react'

interface WorkflowStage {
  id: number
  name: string
  description: string
  status: string
  icon: string
  completed: boolean
  current: boolean
  timestamp?: string
  user?: string
}

interface WorkflowData {
  task_id: number
  status: string
  stages: WorkflowStage[]
  progress: number
  metadata: {
    created_at: string
    updated_at: string
    deadline: string
    assigned_to: string
    created_by: string
    has_report: boolean
    total_stages: number
    current_stage: number
  }
}

interface WorkflowVisualizationProps {
  workflow: WorkflowData
  className?: string
}

interface WorkflowTimelineProps {
  workflow: WorkflowData
  compact?: boolean
  className?: string
}

// Icon mapping for workflow stages
const ICON_MAP = {
  FileText,
  Settings,
  Eye,
  CheckCircle,
  Clock,
  User
} as const

// Helper functions
function formatWorkflowDate(dateString?: string): string | null {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getWorkflowIcon(iconName: string) {
  const Icon = ICON_MAP[iconName as keyof typeof ICON_MAP] || FileText
  return Icon
}

export const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
  workflow,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    // Animate progress bar
    const progressTimer = setTimeout(() => {
      setAnimatedProgress(workflow.progress)
    }, 500)

    return () => {
      clearTimeout(timer)
      clearTimeout(progressTimer)
    }
  }, [workflow.progress])

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-700 transform',
      'shadow-2xl hover:shadow-3xl border-0',
      'bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30',
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      className
    )}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-gradient-x" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'absolute w-1 h-1 bg-blue-400/30 rounded-full',
              'animate-float'
            )}
            style={{
              left: `${20 + i * 15}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`
            }}
          />
        ))}
      </div>

      <CardHeader className="pb-6 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            'flex items-center gap-3 text-xl font-bold',
            'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent',
            'transition-all duration-500 transform',
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
          )}>
            <div className="relative">
              <Settings className="w-6 h-6 text-blue-600 animate-spin-slow" />
              <Sparkles className="w-3 h-3 text-purple-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            Quy trình xử lý
          </CardTitle>
          
          <div className={cn(
            'flex items-center gap-3 transition-all duration-700 transform',
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
          )}>
            <Badge variant="outline" className={cn(
              'text-xs font-semibold px-3 py-1',
              'bg-gradient-to-r from-blue-50 to-purple-50',
              'border-blue-200 text-blue-700',
              'animate-pulse-soft'
            )}>
              {workflow.metadata.current_stage}/{workflow.metadata.total_stages}
            </Badge>
            <div className={cn(
              'text-lg font-bold px-3 py-1 rounded-full',
              'bg-gradient-to-r from-blue-500 to-purple-600 text-white',
              'shadow-lg animate-bounce-soft'
            )}>
              {workflow.progress}%
            </div>
          </div>
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className={cn(
          'relative w-full bg-gray-200 rounded-full h-3 mt-4 overflow-hidden',
          'shadow-inner transition-all duration-500 transform',
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}>
          {/* Background shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          
          {/* Progress fill with gradient and glow */}
          <div 
            className={cn(
              'h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden',
              'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
              'shadow-lg shadow-blue-500/30'
            )}
            style={{ width: `${animatedProgress}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
            
            {/* Pulsing glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse opacity-50" />
          </div>
          
          {/* Progress indicator dot */}
          <div 
            className={cn(
              'absolute top-1/2 w-4 h-4 -mt-2 -ml-2',
              'bg-white rounded-full shadow-lg',
              'border-2 border-blue-500',
              'animate-pulse transition-all duration-1000 ease-out'
            )}
            style={{ left: `${animatedProgress}%` }}
          >
            <div className="absolute inset-1 bg-blue-500 rounded-full animate-ping" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 relative z-10">
        {/* Workflow Stages */}
        <div className="relative">
          {workflow.stages.map((stage, index) => {
            const Icon = getWorkflowIcon(stage.icon)
            const isLast = index === workflow.stages.length - 1
            
            return (
              <div 
                key={stage.id} 
                className={cn(
                  'relative transition-all duration-700 transform',
                  isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
                )}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Animated Connector Line */}
                {!isLast && (
                  <div className="absolute left-8 top-16 w-0.5 h-20 overflow-hidden">
                    <div className={cn(
                      'w-full h-full transition-all duration-1000 ease-out',
                      stage.completed 
                        ? 'bg-gradient-to-b from-green-400 to-green-600' 
                        : 'bg-gradient-to-b from-gray-300 to-gray-400'
                    )}>
                      {stage.completed && (
                        <div className="w-full h-full bg-gradient-to-b from-green-300 to-transparent animate-flow-down" />
                      )}
                    </div>
                  </div>
                )}
                
                {/* Stage Item with Enhanced Styling */}
                <div className={cn(
                  'group flex items-start gap-6 p-6 rounded-2xl transition-all duration-500 transform hover:scale-[1.02]',
                  'backdrop-blur-sm border border-white/20',
                  stage.current && [
                    'bg-gradient-to-r from-blue-50/80 via-blue-100/60 to-purple-50/80',
                    'border-blue-200/50 shadow-xl shadow-blue-500/20',
                    'animate-glow-pulse'
                  ],
                  stage.completed && !stage.current && [
                    'bg-gradient-to-r from-green-50/80 via-emerald-50/60 to-green-100/80',
                    'border-green-200/50 shadow-lg shadow-green-500/10'
                  ],
                  !stage.completed && !stage.current && [
                    'bg-gradient-to-r from-gray-50/80 to-slate-50/80',
                    'border-gray-200/50 hover:shadow-lg'
                  ]
                )}>
                  {/* Enhanced Icon with Animations */}
                  <div className="relative">
                    <div className={cn(
                      'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 transform',
                      'group-hover:scale-110 group-hover:rotate-3',
                      stage.completed && [
                        'bg-gradient-to-br from-green-400 to-green-600 text-white',
                        'shadow-2xl shadow-green-500/40 animate-success-bounce'
                      ],
                      stage.current && [
                        'bg-gradient-to-br from-blue-500 to-purple-600 text-white',
                        'shadow-2xl shadow-blue-500/40 animate-current-pulse'
                      ],
                      !stage.completed && !stage.current && [
                        'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-600',
                        'shadow-lg group-hover:shadow-xl'
                      ]
                    )}>
                      <Icon className={cn(
                        'w-8 h-8 transition-all duration-300',
                        stage.current && 'animate-bounce-gentle'
                      )} />
                      
                      {/* Animated ring for current stage */}
                      {stage.current && (
                        <div className="absolute inset-0 rounded-2xl border-2 border-blue-400 animate-ping opacity-75" />
                      )}
                      
                      {/* Success checkmark overlay */}
                      {stage.completed && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      )}
                      
                      {/* Sparkle effects for completed stages */}
                      {stage.completed && (
                        <>
                          <Sparkles className="absolute -top-1 -left-1 w-4 h-4 text-yellow-400 animate-twinkle" />
                          <Zap className="absolute -bottom-1 -right-1 w-3 h-3 text-blue-400 animate-flash" />
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Enhanced Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={cn(
                        'text-lg font-bold transition-all duration-300',
                        stage.current && 'text-blue-700 animate-text-glow',
                        stage.completed && 'text-green-700',
                        !stage.completed && !stage.current && 'text-gray-700 group-hover:text-gray-900'
                      )}>
                        {stage.name}
                      </h4>
                      
                      {stage.current && (
                        <Badge className={cn(
                          'bg-gradient-to-r from-blue-500 to-purple-600 text-white',
                          'animate-pulse-soft shadow-lg'
                        )}>
                          <Clock className="w-3 h-3 mr-1" />
                          Đang thực hiện
                        </Badge>
                      )}
                    </div>
                    
                    <p className={cn(
                      'text-sm mb-4 transition-colors duration-300',
                      stage.current ? 'text-blue-600' : 'text-gray-600'
                    )}>
                      {stage.description}
                    </p>
                    
                    {/* Enhanced Stage Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {stage.timestamp && (
                        <div className={cn(
                          'flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-300',
                          'bg-white/60 backdrop-blur-sm border border-white/40',
                          'hover:bg-white/80 hover:scale-105'
                        )}>
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-700">
                            {formatWorkflowDate(stage.timestamp)}
                          </span>
                        </div>
                      )}
                      {stage.user && (
                        <div className={cn(
                          'flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-300',
                          'bg-white/60 backdrop-blur-sm border border-white/40',
                          'hover:bg-white/80 hover:scale-105'
                        )}>
                          <User className="w-4 h-4 text-purple-500" />
                          <span className="font-medium text-gray-700">{stage.user}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Workflow Metadata */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Người tạo:</span>
              <span className="ml-2 font-medium">{workflow.metadata.created_by}</span>
            </div>
            <div>
              <span className="text-gray-500">Người thực hiện:</span>
              <span className="ml-2 font-medium">{workflow.metadata.assigned_to}</span>
            </div>
            <div>
              <span className="text-gray-500">Ngày tạo:</span>
              <span className="ml-2 font-medium">{formatWorkflowDate(workflow.metadata.created_at)}</span>
            </div>
            <div>
              <span className="text-gray-500">Hạn hoàn thành:</span>
              <span className="ml-2 font-medium">{formatWorkflowDate(workflow.metadata.deadline)}</span>
            </div>
          </div>
          
          {workflow.metadata.has_report && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              Đã có báo cáo
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  workflow,
  compact = false,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200)
    return () => clearTimeout(timer)
  }, [])

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-3 p-4 rounded-xl transition-all duration-500 transform',
        'bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-pink-50/50',
        'backdrop-blur-sm border border-white/40',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        className
      )}>
        {workflow.stages.map((stage, index) => {
          const Icon = getWorkflowIcon(stage.icon)
          return (
            <React.Fragment key={stage.id}>
              <div className="relative group">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 transform',
                  'group-hover:scale-110 group-hover:rotate-6',
                  stage.completed && [
                    'bg-gradient-to-br from-green-400 to-green-600 text-white',
                    'shadow-lg shadow-green-500/30 animate-success-bounce'
                  ],
                  stage.current && [
                    'bg-gradient-to-br from-blue-500 to-purple-600 text-white',
                    'shadow-lg shadow-blue-500/30 animate-current-pulse'
                  ],
                  !stage.completed && !stage.current && [
                    'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-600',
                    'group-hover:shadow-md'
                  ]
                )}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  transform: isVisible ? 'scale(1)' : 'scale(0)',
                  transition: `all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${index * 100}ms`
                }}>
                  <Icon className={cn(
                    'w-5 h-5 transition-all duration-300',
                    stage.current && 'animate-bounce-gentle'
                  )} />
                  
                  {/* Animated ring for current stage */}
                  {stage.current && (
                    <div className="absolute inset-0 rounded-xl border-2 border-blue-400 animate-ping opacity-75" />
                  )}
                  
                  {/* Success indicator */}
                  {stage.completed && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md animate-scale-in">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                  )}
                </div>
                
                {/* Tooltip on hover */}
                <div className={cn(
                  'absolute -top-12 left-1/2 transform -translate-x-1/2',
                  'px-2 py-1 bg-gray-900 text-white text-xs rounded-md',
                  'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                  'pointer-events-none whitespace-nowrap z-50'
                )}>
                  {stage.name}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900" />
                </div>
              </div>
              
              {index < workflow.stages.length - 1 && (
                <div className="relative">
                  <ArrowRight className={cn(
                    'w-5 h-5 transition-all duration-500',
                    stage.completed ? 'text-green-500 animate-flow-right' : 'text-gray-400'
                  )} />
                  {stage.completed && (
                    <div className="absolute inset-0 animate-ping">
                      <ArrowRight className="w-5 h-5 text-green-400 opacity-50" />
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          )
        })}
        
        {/* Animated Progress Badge */}
        <div className={cn(
          'ml-3 px-4 py-2 rounded-full transition-all duration-700 transform',
          'bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold',
          'shadow-lg shadow-blue-500/30 animate-bounce-soft',
          isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        )}
        style={{ transitionDelay: '400ms' }}>
          <Sparkles className="w-4 h-4 inline mr-1 animate-twinkle" />
          {workflow.progress}%
        </div>
      </div>
    )
  }

  return <WorkflowVisualization workflow={workflow} className={className} />
}