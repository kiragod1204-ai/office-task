import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Download, 
  FileText, 
  Calendar,
  Building,
  Hash,
  AlertCircle
} from 'lucide-react'
import apiClient from '@/api/client'

interface TaskDocument {
  ID: number
  document_number?: string
  arrival_number?: number
  original_number?: string
  summary: string
  file_path?: string
  document_type?: {
    ID: number
    name: string
  }
  issuing_unit?: {
    ID: number
    name: string
  }
  status?: string
  issue_date?: string
  arrival_date?: string
}

interface TaskDocuments {
  task_id: number
  incoming_document?: TaskDocument
  outgoing_documents: TaskDocument[]
}

interface ViewTaskDocumentsProps {
  taskId: number
  className?: string
}

export const ViewTaskDocuments: React.FC<ViewTaskDocumentsProps> = ({ 
  taskId, 
  className = "" 
}) => {
  const [documents, setDocuments] = useState<TaskDocuments | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await apiClient.get(`/tasks/${taskId}/documents`)
        setDocuments(response.data)
      } catch (error) {
        console.error('Error fetching task documents:', error)
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải danh sách tài liệu",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [taskId, toast])

  const handleDownloadIncoming = async () => {
    setDownloadingFile('incoming')
    try {
      const response = await apiClient.get(`/tasks/${taskId}/download/incoming`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `van-ban-den-${documents?.incoming_document?.arrival_number}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Tải xuống thành công",
        description: "Văn bản đến đã được tải xuống",
      })
    } catch (error) {
      console.error('Download failed:', error)
      toast({
        variant: "destructive",
        title: "Lỗi tải xuống",
        description: "Không thể tải xuống văn bản đến",
      })
    } finally {
      setDownloadingFile(null)
    }
  }

  const handleDownloadOutgoing = async (docId?: number) => {
    const downloadKey = docId ? `outgoing-${docId}` : 'outgoing'
    setDownloadingFile(downloadKey)
    try {
      // For outgoing documents, we need to use the files API with the specific file path
      // First, get the document details to find the file path
      if (docId) {
        const docResponse = await apiClient.get(`/outgoing-documents/${docId}`)
        const outgoingDoc = docResponse.data
        
        if (outgoingDoc.file_path) {
          // Use the files download API - let the backend handle the filename
          const { downloadFile } = await import('../../api/files')
          await downloadFile(outgoingDoc.file_path, '') // Empty filename lets backend use original name
          
          toast({
            title: "Tải xuống thành công",
            description: "Văn bản đi đã được tải xuống",
          })
        } else {
          throw new Error("Văn bản không có file đính kèm")
        }
      } else {
        // Fallback to the task endpoint if no specific document ID
        const response = await apiClient.get(`/tasks/${taskId}/download/outgoing`, {
          responseType: 'blob'
        })
        
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `van-ban-di-${taskId}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Tải xuống thành công",
          description: "Văn bản đi đã được tải xuống",
        })
      }
    } catch (error) {
      console.error('Download failed:', error)
      toast({
        variant: "destructive",
        title: "Lỗi tải xuống",
        description: "Không thể tải xuống văn bản đi",
      })
    } finally {
      setDownloadingFile(null)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Đang tải tài liệu...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Tài liệu liên quan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Incoming Document */}
        {documents?.incoming_document ? (
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50/30">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <FileText className="w-4 h-4 mr-2 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Văn bản đến</h4>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Hash className="w-3 h-3 mr-1 text-gray-400" />
                    <span className="text-gray-600">Số đến:</span>
                    <span className="ml-1 font-medium">{documents.incoming_document.arrival_number}</span>
                    {documents.incoming_document.original_number && (
                      <>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-600">Số gốc:</span>
                        <span className="ml-1 font-medium">{documents.incoming_document.original_number}</span>
                      </>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 font-medium">
                    {documents.incoming_document.summary}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {documents.incoming_document.document_type && (
                      <Badge variant="secondary" className="text-xs">
                        <Building className="w-3 h-3 mr-1" />
                        {documents.incoming_document.document_type.name}
                      </Badge>
                    )}
                    {documents.incoming_document.issuing_unit && (
                      <Badge variant="outline" className="text-xs">
                        {documents.incoming_document.issuing_unit.name}
                      </Badge>
                    )}
                    {documents.incoming_document.arrival_date && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(documents.incoming_document.arrival_date)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadIncoming}
                disabled={downloadingFile === 'incoming'}
                className="ml-4"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloadingFile === 'incoming' ? 'Đang tải...' : 'Tải xuống'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="text-center text-gray-500">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Không có văn bản đến</p>
            </div>
          </div>
        )}

        {/* Outgoing Documents */}
        {documents?.outgoing_documents && documents.outgoing_documents.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-green-600" />
              Văn bản đi ({documents.outgoing_documents.length})
            </h4>
            {documents.outgoing_documents.map((doc, index) => (
              <div key={doc.ID || index} className="border border-gray-200 rounded-lg p-4 bg-green-50/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Hash className="w-3 h-3 mr-1 text-gray-400" />
                        <span className="text-gray-600">Số:</span>
                        <span className="ml-1 font-medium">{doc.document_number}</span>
                        {doc.status && (
                          <>
                            <span className="mx-2 text-gray-400">•</span>
                            <Badge 
                              variant={doc.status === 'approved' ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {doc.status}
                            </Badge>
                          </>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 font-medium">
                        {doc.summary}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {doc.document_type && (
                          <Badge variant="secondary" className="text-xs">
                            <Building className="w-3 h-3 mr-1" />
                            {doc.document_type.name}
                          </Badge>
                        )}
                        {doc.issuing_unit && (
                          <Badge variant="outline" className="text-xs">
                            {doc.issuing_unit.name}
                          </Badge>
                        )}
                        {doc.issue_date && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(doc.issue_date)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadOutgoing(doc.ID)}
                    disabled={downloadingFile === `outgoing-${doc.ID}`}
                    className="ml-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloadingFile === `outgoing-${doc.ID}` ? 'Đang tải...' : 'Tải xuống'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="text-center text-gray-500">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Chưa có văn bản đi liên quan</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
