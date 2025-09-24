import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { EnhancedTaskForm } from '@/components/tasks/EnhancedTaskForm'
import { ArrowLeft } from 'lucide-react'

export const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Check if user is authorized
  if (!user || !['Văn thư', 'Trưởng Công An Xã', 'Phó Công An Xã'].includes(user.role)) {
    navigate('/dashboard')
    return null
  }

  const handleSuccess = (task: any) => {
    navigate(`/tasks/${task.ID}`)
  }

  const handleCancel = () => {
    navigate('/tasks')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/tasks')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tạo công việc mới</h1>
          <p className="text-gray-600 mt-1">Tạo và phân công công việc với các tùy chọn nâng cao</p>
        </div>
      </div>

      {/* Enhanced Task Form */}
      <EnhancedTaskForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        mode="create"
      />
    </div>
  )
}