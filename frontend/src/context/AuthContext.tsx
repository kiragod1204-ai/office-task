import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, authApi } from '@/api/auth'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string, showPassword?: boolean) => Promise<void>
  logout: () => void
  loading: boolean
  isSessionExpired: boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSessionExpired, setIsSessionExpired] = useState(false)

  // Session timeout handling (24 hours)
  const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setIsSessionExpired(false)
    authApi.logout()
  }, [])



  const refreshSession = useCallback(async () => {
    try {
      if (token) {
        const profile = await authApi.getProfile()
        setUser(profile)
        
        // Check if user is still active
        if (!profile.is_active) {
          logout()
          throw new Error('Tài khoản đã bị vô hiệu hóa')
        }
        
        // Update login time
        localStorage.setItem('loginTime', Date.now().toString())
        localStorage.setItem('user', JSON.stringify(profile))
        setIsSessionExpired(false)
      }
    } catch (error) {
      logout()
      throw error
    }
  }, [token, logout])

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (savedToken && savedUser) {
        // Check session expiry
        const loginTime = localStorage.getItem('loginTime')
        if (loginTime) {
          const currentTime = Date.now()
          const timeDiff = currentTime - parseInt(loginTime)
          
          if (timeDiff > SESSION_TIMEOUT) {
            // Session expired
            setUser(null)
            setToken(null)
            setIsSessionExpired(true)
            authApi.logout()
            setLoading(false)
            return
          }
        }

        setToken(savedToken)
        const userData = JSON.parse(savedUser)
        
        // Check if user is still active
        if (userData.is_active) {
          setUser(userData)
        } else {
          setUser(null)
          setToken(null)
          authApi.logout()
        }
      }

      setLoading(false)
    }

    initAuth()
  }, []) // Remove dependencies to prevent infinite loop

  // Set up session check interval
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        const loginTime = localStorage.getItem('loginTime')
        if (loginTime) {
          const currentTime = Date.now()
          const timeDiff = currentTime - parseInt(loginTime)
          
          if (timeDiff > SESSION_TIMEOUT) {
            setIsSessionExpired(true)
            setUser(null)
            setToken(null)
            authApi.logout()
          }
        }
      }, 60000) // Check every minute

      return () => clearInterval(interval)
    }
  }, [token]) // Remove checkSessionExpiry dependency

  const login = async (username: string, password: string, showPassword?: boolean) => {
    try {
      const response = await authApi.login({ 
        username, 
        password, 
        show_password: showPassword 
      })
      
      // Check if user account is active
      if (!response.user.is_active) {
        throw new Error('Tài khoản đã bị vô hiệu hóa')
      }
      
      setToken(response.token)
      setUser(response.user)
      setIsSessionExpired(false)
      
      // Store login time for session management
      const loginTime = Date.now().toString()
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('loginTime', loginTime)
    } catch (error) {
      throw error
    }
  }

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isSessionExpired,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}