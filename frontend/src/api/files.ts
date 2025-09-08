import apiClient from './client'

export interface IncomingFile {
  ID: number
  order_number: number
  file_name: string
  file_path: string
  uploaded_by: number
  CreatedAt: string
  UpdatedAt: string
  user: {
    ID: number
    name: string
    role: string
  }
}

export const filesApi = {
  // Upload incoming file
  uploadIncomingFile: async (file: File): Promise<IncomingFile> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post('/files/incoming', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Upload report file
  uploadReportFile: async (taskId: number, file: File): Promise<any> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post(`/files/report/${taskId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Get incoming files
  getIncomingFiles: async (): Promise<IncomingFile[]> => {
    const response = await apiClient.get('/files/incoming')
    return response.data
  },

  // Download file
  downloadFile: async (filePath: string): Promise<Blob> => {
    const response = await apiClient.get('/files/download', {
      params: { path: filePath },
      responseType: 'blob',
    })
    return response.data
  }
}