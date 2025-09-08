import apiClient from './client'

export interface DashboardStats {
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  overdue_tasks: number
  urgent_tasks: number
  completion_rate: number
  tasks_by_status: Record<string, number>
  tasks_by_role: Record<string, RoleStats>
  recent_activity: ActivityItem[]
  upcoming_tasks: TaskWithRemainingTime[]
  trend_data: TrendDataPoint[]
  user_performance: UserPerformanceStats[]
  incoming_files: IncomingFileStats
}

export interface IncomingFileStats {
  total_count: number
  this_month_count: number
  today_count: number
  latest_order: number
}

export interface RoleStats {
  role: string
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  user_count: number
  completion_rate: number
}

export interface ActivityItem {
  id: number
  type: string
  description: string
  task_id: number
  user_name: string
  user_role: string
  timestamp: string
  task_title: string
}

export interface TrendDataPoint {
  date: string
  created: number
  completed: number
  day_name: string
}

export interface UserPerformanceStats {
  user_id: number
  user_name: string
  user_role: string
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  overdue_tasks: number
  completion_rate: number
}

export interface TaskWithRemainingTime {
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
  remaining_time: {
    text: string
    is_overdue: boolean
    urgency: string
    days: number
    hours: number
    minutes: number
  }
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
}

export interface SystemHealth {
  status: string
  uptime: string
  response_time: string
  total_tasks: number
  total_users: number
  active_users: number
  tasks_today: number
  completion_rate: number
  overdue_tasks: number
  last_update: string
  metrics: {
    database: {
      status: string
      response_time: string
      connections?: number
    }
    server: {
      status: string
      cpu_usage: string
      memory_usage: string
      goroutines: number
    }
    network: {
      status: string
      latency: string
    }
  }
}

export interface DetailedMetrics {
  timestamp: string
  system: {
    goroutines: number
    memory_alloc: number
    memory_total: number
    memory_sys: number
    gc_runs: number
    cpu_usage: number
    memory_usage: number
  }
  database: {
    open_connections: number
    in_use: number
    idle: number
    max_open: number
    max_idle: number
  }
  tasks: {
    total: number
    completed: number
    overdue: number
    today: number
  }
  performance: {
    response_time: number
    uptime: string
  }
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/dashboard/stats')
    return response.data
  },

  getUserTasks: async (): Promise<TaskWithRemainingTime[]> => {
    const response = await apiClient.get('/dashboard/user-tasks')
    return response.data
  },

  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await apiClient.get('/dashboard/system-health')
    return response.data
  },

  getDetailedMetrics: async (): Promise<DetailedMetrics> => {
    const response = await apiClient.get('/dashboard/metrics')
    return response.data
  }
}