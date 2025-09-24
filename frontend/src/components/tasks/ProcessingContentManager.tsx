import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { tasksApi, Task, UpdateProcessingContentRequest } from '@/api/tasks'
import { 
  Edit3, 
  Save, 
  FileText, 
  Clock,
  User,
  AlertCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ProcessingContentManagerProps {
  task: Task
  onTaskUpdate: (updatedTask: Task) => void
}

export const ProcessingContentManager: React.FC<ProcessingContentManagerProps> = ({
  task,
  onTaskUpdate
}) => {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [processingContent, setProcessingContent] = useState(task.processing_content || '')
  const [processingNotes, setProcessingNotes] = useState(task.processing_notes || '')

  const canUpdateProcessingContent = () => {
    if (!user) return false
    
    // Only the assigned user can update processing content
    return task.assigned_to_id === user.id
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const updateData: UpdateProcessingContentRequest = {
        processing_content: processingContent,
        processing_notes: processingNotes
      }

      const updatedTask = await tasksApi.updateProcessingContent(task.ID, updateData)
      
      onTaskUpdate(updatedTask)
      setOpen(false)
      
      toast({
        title: "Cập nhật thành công",
        description: "Nội dung xử lý đã được cập nhật",
      })
    } catch (error: any) {
      console.error('Error updating processing content:', error)
      toast({
        variant: "destructive",
        title: "Lỗi cập nhật",
        description: error.response?.data?.error || "Không thể cập nhật nội dung xử lý",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setProcessingContent(task.processing_content || '')
    setProcessingNotes(task.processing_notes || '')
    setOpen(false)
  }

  if (!canUpdateProcessingContent()) {
    // Show read-only view for users who can't edit
    if (!task.processing_content && !task.processing_notes) {
      return null
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <FileText className="w-4 h-4 mr-2" />
            Nội dung xử lý
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.processing_content && (
            <div>
              <Label className="text-xs text-gray-500">Nội dung xử lý</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                {task.processing_content}
              </div>
            </div>
          )}
          
          {task.processing_notes && (
            <div>
              <Label className="text-xs text-gray-500">Ghi chú xử lý</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                {task.processing_notes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current Processing Content Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Nội dung xử lý
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Edit3 className="w-5 h-5 mr-2 text-blue-600" />
                    Cập nhật nội dung xử lý
                  </DialogTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    Cập nhật nội dung và ghi chú xử lý công việc
                  </p>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Task Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Thông tin công việc</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Mô tả:</span>
                        <span className="font-medium">{task.description}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Người tạo:</span>
                        <span className="font-medium">{task.created_by?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Tạo lúc:</span>
                        <span className="font-medium">{formatDate(task.CreatedAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{task.status}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Permission Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm text-blue-800">Lưu ý</h4>
                        <p className="text-xs text-blue-700 mt-1">
                          Chỉ người được gán công việc mới có thể cập nhật nội dung xử lý
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Processing Content */}
                  <div>
                    <Label htmlFor="processing_content" className="text-sm font-medium text-gray-700">
                      Nội dung xử lý
                    </Label>
                    <p className="text-xs text-gray-500 mt-1 mb-2">
                      Mô tả chi tiết về cách thức xử lý công việc này
                    </p>
                    <Textarea
                      id="processing_content"
                      value={processingContent}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value.length <= 2000) {
                          setProcessingContent(value)
                        }
                      }}
                      placeholder="Nhập nội dung xử lý chi tiết..."
                      rows={6}
                      className="resize-none"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-xs ${
                        processingContent.length > 1800 ? 'text-orange-500' : 
                        processingContent.length > 1600 ? 'text-yellow-500' : 'text-gray-400'
                      }`}>
                        {processingContent.length}/2000 ký tự
                      </span>
                    </div>
                  </div>
                  
                  {/* Processing Notes */}
                  <div>
                    <Label htmlFor="processing_notes" className="text-sm font-medium text-gray-700">
                      Ghi chú xử lý
                    </Label>
                    <p className="text-xs text-gray-500 mt-1 mb-2">
                      Các ghi chú bổ sung, lưu ý đặc biệt trong quá trình xử lý
                    </p>
                    <Textarea
                      id="processing_notes"
                      value={processingNotes}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value.length <= 1000) {
                          setProcessingNotes(value)
                        }
                      }}
                      placeholder="Nhập ghi chú xử lý..."
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-xs ${
                        processingNotes.length > 900 ? 'text-orange-500' : 
                        processingNotes.length > 800 ? 'text-yellow-500' : 'text-gray-400'
                      }`}>
                        {processingNotes.length}/1000 ký tự
                      </span>
                    </div>
                  </div>

                  {/* Preview */}
                  {(processingContent || processingNotes) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-3">Xem trước</h4>
                      <div className="space-y-3">
                        {processingContent && (
                          <div>
                            <Label className="text-xs text-gray-500">Nội dung xử lý</Label>
                            <div className="mt-1 p-2 bg-white rounded border text-sm">
                              {processingContent}
                            </div>
                          </div>
                        )}
                        {processingNotes && (
                          <div>
                            <Label className="text-xs text-gray-500">Ghi chú xử lý</Label>
                            <div className="mt-1 p-2 bg-white rounded border text-sm">
                              {processingNotes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Hủy
                    </Button>
                    <Button 
                      onClick={handleUpdate} 
                      disabled={loading}
                      className="min-w-[120px]"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Đang cập nhật...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Cập nhật
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.processing_content || task.processing_notes ? (
            <>
              {task.processing_content && (
                <div>
                  <Label className="text-xs text-gray-500">Nội dung xử lý</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                    {task.processing_content}
                  </div>
                </div>
              )}
              
              {task.processing_notes && (
                <div>
                  <Label className="text-xs text-gray-500">Ghi chú xử lý</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                    {task.processing_notes}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm">Chưa có nội dung xử lý</p>
              <p className="text-xs text-gray-400 mt-1">
                Nhấn "Chỉnh sửa" để thêm nội dung xử lý
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}