import apiClient from './client'

export interface User {
  ID: number
  id?: number  // For backward compatibility
  name: string
  username: string
  role: string
  CreatedAt?: string
  UpdatedAt?: string
  created_at?: string
  updated_at?: string
}

export interface CreateUserRequest {
  name: string
  username: string
  password: string
  role: string
}

export interface UpdateUserRequest {
  name?: string
  username?: string
  role?: string
  password?: string
}

export interface UserStats {
  total_users: number
  users_by_role: Record<string, number>
  active_users: number
  recent_users: User[]
}

export const usersApi = {
  // Get all users
  getUsers: async (role?: string): Promise<User[]> => {
    const params = role ? { role } : {}
    const response = await apiClient.get('/users', { params })
    return response.data
  },

  // Get user by ID
  getUserById: async (id: number): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`)
    return response.data
  },

  // Create new user
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post('/users', userData)
    return response.data
  },

  // Update user
  updateUser: async (id: number, userData: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, userData)
    return response.data
  },

  // Delete user
  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`)
  },

  // Toggle user status
  toggleUserStatus: async (id: number, active: boolean): Promise<void> => {
    await apiClient.post(`/users/${id}/toggle-status`, { active })
  },

  // Get user statistics
  getUserStats: async (): Promise<UserStats> => {
    const response = await apiClient.get('/users/stats')
    return response.data
  },

  // Get team leaders and deputies
  getTeamLeaders: async (): Promise<User[]> => {
    const response = await apiClient.get('/users/team-leaders')
    return response.data
  },

  // Get officers
  getOfficers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users/officers')
    return response.data
  }
}