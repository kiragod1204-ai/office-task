import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate, getRoleColor } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { 
  Search, 
  Upload, 
  Download, 
  FileText, 
  Calendar,
  User,
  Hash,
  X
} from 'lucide-react'
import apiClient from '@/api/client'

interface IncomingFile {
  ID: number
  CreatedAt: string
  UpdatedAt: string
  order_number: number
  file_name: string
  file_path: string
  uploaded_by: number
  user: {
    ID: number
    name: string
    role: string
  }
}

export const IncomingFilesPage: React.FC = () => {
  const [files, setFiles] = useState<IncomingFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null)

  const { user } = useAuth()
  const { toast } = useToast()



  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await apiClient.get('/files/incoming')
      setFiles(response.data)
    } catch (error) {
      console.error('Error fetching files:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách văn bản đến",
      })
    } finally {
      setLoading(false)
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
      setFiles([newFile, ...files])
      setSelectedFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      toast({
        title: "Tải file thành công",
        description: `Văn bản đến số ${newFile.order_number} đã được tải lên`,
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải file",
      })
    } finally {
      setUploadingFile(false)
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

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    setDownloadingFile(filePath)
    try {
      const { downloadFile } = await import('@/lib/download')
      await downloadFile(filePath, fileName)
      toast({
        title: "Tải xuống thành công",
        description: `File ${fileName} đã được tải xuống`,
      })
    } catch (error) {
      console.error('Download failed:', error)
      toast({
        variant: "destructive",
        title: "Lỗi tải xuống",
        description: "Không thể tải xuống file. Vui lòng thử lại.",
      })
    } finally {
      setDownloadingFile(null)
    }
  }

  const filteredFiles = files.filter(file => 
    file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.order_number.toString().includes(searchTerm)
  )

  const canUpload = user?.role === 'Văn thư'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Văn bản đến</h1>
          <p className="text-gray-600 mt-2">
            Quản lý và theo dõi các văn bản đến
          </p>
        </div>
      </div>

      {/* Upload Section */}
      {canUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Tải lên văn bản đến
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
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
              </div>
              
              {selectedFile && (
                <Button
                  onClick={handleFileUpload}
                  disabled={uploadingFile}
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
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tên file hoặc số thứ tự..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFiles.map((file) => (
          <Card key={file.ID} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2">
                      {file.file_name}
                    </CardTitle>
                  </div>
                </div>
                <Badge variant="outline" className="ml-2">
                  #{file.order_number}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Hash className="w-4 h-4 mr-2" />
                <span>Số thứ tự: {file.order_number}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2" />
                <span>Tải lên bởi: {file.user.name}</span>
                <Badge className={`ml-2 text-xs ${getRoleColor(file.user.role)}`}>
                  {file.user.role}
                </Badge>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Ngày tải: {formatDate(file.CreatedAt)}</span>
              </div>

              <div className="pt-3 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleDownloadFile(file.file_path, file.file_name)}
                  disabled={downloadingFile === file.file_path}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloadingFile === file.file_path ? 'Đang tải...' : 'Tải xuống'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có văn bản đến nào
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Không tìm thấy văn bản phù hợp với từ khóa tìm kiếm'
                : 'Chưa có văn bản đến nào được tải lên'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Thống kê</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{files.length}</div>
              <div className="text-sm text-gray-600">Tổng văn bản</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {files.filter(f => new Date(f.CreatedAt).getMonth() === new Date().getMonth()).length}
              </div>
              <div className="text-sm text-gray-600">Tháng này</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {files.filter(f => new Date(f.CreatedAt).toDateString() === new Date().toDateString()).length}
              </div>
              <div className="text-sm text-gray-600">Hôm nay</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.max(...files.map(f => f.order_number), 0)}
              </div>
              <div className="text-sm text-gray-600">Số thứ tự cao nhất</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}