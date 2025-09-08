import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { tasksApi } from '@/api/tasks'
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  User, 
  Calendar,
  Save,
  X
} from 'lucide-react'
import apiClient from '@/api/client'

interface IncomingFile {
  ID: number
  order_number: number
  file_name: string
  file_path: string
}

interface User {
  ID: number
  id?: number  // For backward compatibility
  name: string
  role: string
}

export const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [assignedTo, setAssignedTo] = useState<number | null>(null)
  const [incomingFileId, setIncomingFileId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  
  const [incomingFiles, setIncomingFiles] = useState<IncomingFile[]>([])
  const [teamLeaders, setTeamLeaders] = useState<User[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    // Check if user is authorized
    if (!user || !['Văn thư', 'Trưởng Công An Xã'].includes(user.role)) {
      navigate('/dashboard')
      return
    }

    fetchData()
  }, [user, navigate])

  const fetchData = async () => {
    try {
      const [filesResponse, leadersResponse] = await Promise.all([
        apiClient.get('/files/incoming'),
        apiClient.get('/users/team-leaders')
      ])
      
      setIncomingFiles(filesResponse.data)
      setTeamLeaders(leadersResponse.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await apiClient.post('/files/incoming', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      const newFile = response.data
      setIncomingFiles([...incomingFiles, newFile])
      setIncomingFileId(newFile.ID)
      setSelectedFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      toast({
        title: "Tải file thành công",
        description: "Văn bản đến đã được tải lên thành công",
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải lên file",
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!description || !deadline || !assignedTo || !incomingFileId) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin",
      })
      return
    }

    setLoading(true)
    try {
      const task = await tasksApi.createTask({
        description,
        deadline: new Date(deadline).toISOString(),
        assigned_to: assignedTo,
        incoming_file_id: incomingFileId
      })
      
      toast({
        title: "Tạo công việc thành công",
        description: "Công việc đã được tạo và gán thành công",
      })
      navigate(`/tasks/${task.ID}`)
    } catch (error) {
      console.error('Error creating task:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tạo công việc",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
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
          <p className="text-gray-600 mt-1">Tạo và phân công công việc từ văn bản đến</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin công việc</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Mô tả công việc *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Nhập mô tả chi tiết về công việc..."
                    className="w-full h-24 px-3 py-2 text-sm border border-gray-300 bg-white rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    required
                  />
                </div>

                {/* Deadline */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Thời hạn hoàn thành *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Assigned To */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Giao cho *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <select
                      value={assignedTo || ''}
                      onChange={(e) => setAssignedTo(parseInt(e.target.value))}
                      className="w-full h-10 pl-10 pr-3 py-2 text-sm border border-gray-300 bg-white rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Chọn người nhận nhiệm vụ</option>
                      {teamLeaders.map((leader) => (
                        <option key={leader.ID || leader.id} value={leader.ID || leader.id}>
                          {leader.name} ({leader.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Incoming File */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Văn bản đến *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <select
                      value={incomingFileId || ''}
                      onChange={(e) => setIncomingFileId(parseInt(e.target.value))}
                      className="w-full h-10 pl-10 pr-3 py-2 text-sm border border-gray-300 bg-white rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Chọn văn bản đến</option>
                      {incomingFiles.map((file) => (
                        <option key={file.ID} value={file.ID}>
                          Số {file.order_number} - {file.file_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/tasks')}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Đang tạo...' : 'Tạo công việc'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upload New File */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload văn bản đến
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                />
                
                {!selectedFile ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Chọn file
                  </Button>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeSelectedFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {selectedFile && (
                  <Button
                    onClick={handleFileUpload}
                    disabled={uploadingFile}
                    className="w-full"
                  >
                    {uploadingFile ? 'Đang tải lên...' : 'Tải lên'}
                  </Button>
                )}
              </div>

              <div className="text-xs text-gray-500">
                <p>Định dạng hỗ trợ: PDF, DOC, DOCX, XLS, XLSX</p>
                <p>Kích thước tối đa: 10MB</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Files */}
          <Card>
            <CardHeader>
              <CardTitle>Văn bản đến gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {incomingFiles.slice(-5).reverse().map((file) => (
                  <div
                    key={file.ID}
                    className={`p-3 border border-gray-200 rounded-lg cursor-pointer transition-colors ${
                      incomingFileId === file.ID 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setIncomingFileId(file.ID)}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Số {file.order_number}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {file.file_name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {incomingFiles.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Chưa có văn bản đến nào
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Hướng dẫn</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>1. Upload văn bản đến hoặc chọn từ danh sách có sẵn</p>
              <p>2. Nhập mô tả chi tiết về công việc cần thực hiện</p>
              <p>3. Chọn thời hạn hoàn thành phù hợp</p>
              <p>4. Giao công việc cho Trưởng Công An Xã hoặc Phó Công An Xã</p>
              <p>5. Nhấn "Tạo công việc" để hoàn tất</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}