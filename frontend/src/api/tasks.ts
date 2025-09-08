import apiClient from './client'

export interface RemainingTimeInfo {
  text: string
  is_overdue: boolean
  urgency: string
  days: number
  hours: number
  minutes: number
}

export interface Task {
  ID: number
  CreatedAt: string
  UpdatedAt: string
  DeletedAt: string | null
  description: string
  deadline: string
  status: string
  assigned_to: number
  created_by: number
  incoming_file_id: number
  report_file: string
  remaining_time?: RemainingTimeInfo
  assigned_user: {
    ID: number
    name: string
    role: string
  }
  creator: {
    ID: number
    name: string
    role: string
  }
  incoming_file: {
    ID: number
    order_number: number
    file_name: string
  }
  comments: Comment[]
}

export interface Comment {
  ID: number
  CreatedAt: string
  UpdatedAt: string
  DeletedAt: string | null
  task_id: number
  user_id: number
  content: string
  user: {
    ID: number
    name: string
    role: string
  }
}

export interface CreateTaskRequest {
  description: string
  deadline: string
  assigned_to: number
  incoming_file_id: number
}

export interface AssignTaskRequest {
  assigned_to: number
}

export interface UpdateStatusRequest {
  status: string
}

export interface CreateCommentRequest {
  content: string
}

export interface UpdateTaskRequest {
  description?: string
  deadline?: string
  assigned_to?: number
  incoming_file_id?: number
}

export interface ForwardTaskRequest {
  assigned_to: number
  comment?: string
}

export const tasksApi = {
  getTasks: async (): Promise<Task[]> => {
    const response = await apiClient.get('/tasks')
    return response.data
  },

  getTask: async (id: number): Promise<Task> => {
    const response = await apiClient.get(`/tasks/${id}`)
    return response.data
  },

  createTask: async (task: CreateTaskRequest): Promise<Task> => {
    const response = await apiClient.post('/tasks', task)
    return response.data
  },

  assignTask: async (id: number, data: AssignTaskRequest): Promise<Task> => {
    const response = await apiClient.put(`/tasks/${id}/assign`, data)
    return response.data
  },

  updateTaskStatus: async (id: number, data: UpdateStatusRequest): Promise<Task> => {
    const response = await apiClient.put(`/tasks/${id}/status`, data)
    return response.data
  },

  getTaskComments: async (id: number): Promise<Comment[]> => {
    const response = await apiClient.get(`/tasks/${id}/comments`)
    return response.data
  },

  createComment: async (id: number, data: CreateCommentRequest): Promise<Comment> => {
    const response = await apiClient.post(`/tasks/${id}/comments`, data)
    return response.data
  },

  getTaskWorkflow: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/tasks/${id}/workflow`)
    return response.data
  },

  updateTask: async (id: number, data: UpdateTaskRequest): Promise<Task> => {
    const response = await apiClient.put(`/tasks/${id}`, data)
    return response.data
  },

  deleteTask: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`)
  },

  forwardTask: async (id: number, data: ForwardTaskRequest): Promise<Task> => {
    const response = await apiClient.post(`/tasks/${id}/forward`, data)
    return response.data
  }
}