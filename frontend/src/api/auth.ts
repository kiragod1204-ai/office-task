import apiClient from './client'

export interface LoginRequest {
  username: string
  password: string
  show_password?: boolean // For password visibility toggle data
}

export interface LoginResponse {
  token: string
  user: {
    id: number
    name: string
    role: string
    is_active: boolean
    last_login: string | null
  }
}

export interface User {
  id: number
  name: string
  role: string
  is_active: boolean
  last_login: string | null
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/profile')
    return response.data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}