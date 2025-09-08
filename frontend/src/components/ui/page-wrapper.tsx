import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
  animation?: 'fade' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale' | 'bounce'
  delay?: number
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  className,
  animation = 'fade',
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const animationClasses = {
    fade: isVisible ? 'opacity-100' : 'opacity-0',
    'slide-up': isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
    'slide-left': isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0',
    'slide-right': isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0',
    scale: isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
    bounce: isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
  }

  const transitionClasses = {
    fade: 'transition-opacity duration-700 ease-out',
    'slide-up': 'transition-all duration-700 ease-out transform',
    'slide-left': 'transition-all duration-700 ease-out transform',
    'slide-right': 'transition-all duration-700 ease-out transform',
    scale: 'transition-all duration-700 ease-out transform',
    bounce: 'transition-all duration-700 cubic-bezier(0.68, -0.55, 0.265, 1.55) transform'
  }

  return (
    <div className={cn(
      transitionClasses[animation],
      animationClasses[animation],
      className
    )}>
      {children}
    </div>
  )
}

interface StaggeredListProps {
  children: React.ReactNode[]
  className?: string
  staggerDelay?: number
  animation?: 'fade' | 'slide-up' | 'slide-left' | 'scale'
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  className,
  staggerDelay = 100,
  animation = 'slide-up'
}) => {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(new Array(children.length).fill(false))

  useEffect(() => {
    children.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => {
          const newVisible = [...prev]
          newVisible[index] = true
          return newVisible
        })
      }, index * staggerDelay)
    })
  }, [children.length, staggerDelay])

  const animationClasses = {
    fade: (visible: boolean) => visible ? 'opacity-100' : 'opacity-0',
    'slide-up': (visible: boolean) => visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
    'slide-left': (visible: boolean) => visible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0',
    scale: (visible: boolean) => visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
  }

  const transitionClasses = {
    fade: 'transition-opacity duration-500 ease-out',
    'slide-up': 'transition-all duration-500 ease-out transform',
    'slide-left': 'transition-all duration-500 ease-out transform',
    scale: 'transition-all duration-500 ease-out transform'
  }

  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(
            transitionClasses[animation],
            animationClasses[animation](visibleItems[index])
          )}
        >
          {child}
        </div>
      ))}
    </div>
  )
}