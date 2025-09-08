import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  className, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={cn(
      'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
      sizeClasses[size],
      className
    )} />
  )
}

interface LoadingPageProps {
  message?: string
  className?: string
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  message = 'Đang tải...', 
  className 
}) => {
  return (
    <div className={cn(
      'min-h-screen flex flex-col items-center justify-center bg-gray-50',
      className
    )}>
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600 text-lg font-medium">{message}</p>
      </div>
    </div>
  )
}

interface LoadingCardProps {
  message?: string
  className?: string
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  message = 'Đang tải...', 
  className 
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border',
      className
    )}>
      <LoadingSpinner className="mb-4" />
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  )
}

interface LoadingButtonProps {
  loading?: boolean
  children: React.ReactNode
  className?: string
  [key: string]: any
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({ 
  loading = false, 
  children, 
  className,
  ...props 
}) => {
  return (
    <button 
      className={cn(
        'inline-flex items-center justify-center',
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  )
}