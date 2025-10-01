import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react'

export const SessionTimeoutHandler: React.FC = () => {
  const { isSessionExpired, refreshSession, logout, user } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(300) // 5 minutes warning
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (isSessionExpired) {
      navigate('/login')
    }
  }, [isSessionExpired, navigate])

  useEffect(() => {
    if (!user) return

    // Check for session expiry warning (5 minutes before expiry)
    const checkWarning = () => {
      const loginTime = localStorage.getItem('loginTime')
      if (loginTime) {
        const currentTime = Date.now()
        const timeDiff = currentTime - parseInt(loginTime)
        const timeRemaining = (24 * 60 * 60 * 1000) - timeDiff // 24 hours - elapsed time
        
        if (timeRemaining <= 300000 && timeRemaining > 0) { // 5 minutes or less
          if (!showWarning) { // Only set if not already showing
            setShowWarning(true)
            setCountdown(Math.floor(timeRemaining / 1000))
          }
        } else if (timeRemaining > 300000) {
          setShowWarning(false)
        }
      }
    }

    checkWarning() // Initial check
    const interval = setInterval(checkWarning, 5000) // Check every 5 seconds instead of 1 second
    return () => clearInterval(interval)
  }, [user, showWarning]) // Add showWarning to dependencies

  useEffect(() => {
    if (showWarning && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (showWarning && countdown <= 0) {
      logout()
    }
  }, [showWarning, countdown]) // Remove logout from dependencies

  const handleRefreshSession = async () => {
    setRefreshing(true)
    try {
      await refreshSession()
      setShowWarning(false)
      setCountdown(300)
    } catch (error) {
      console.error('Failed to refresh session:', error)
      logout()
    } finally {
      setRefreshing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-orange-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center justify-center">
            <Clock className="w-5 h-5 mr-2 text-orange-600" />
            Phiên làm việc sắp hết hạn
          </CardTitle>
          <CardDescription className="text-gray-600">
            Phiên đăng nhập của bạn sẽ hết hạn sau
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">
              {formatTime(countdown)}
            </div>
            <p className="text-sm text-gray-600">
              Nhấn "Gia hạn phiên" để tiếp tục làm việc
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleRefreshSession}
              disabled={refreshing}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {refreshing ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang gia hạn...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gia hạn phiên
                </div>
              )}
            </Button>

            <Button
              onClick={logout}
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50"
            >
              Đăng xuất ngay
            </Button>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs text-orange-700 text-center">
              <strong>Lưu ý:</strong> Phiên làm việc sẽ tự động đăng xuất khi hết thời gian để bảo mật tài khoản
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}