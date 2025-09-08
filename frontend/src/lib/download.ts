import apiClient from '@/api/client'

export const downloadFile = async (filePath: string, fileName: string) => {
  try {
    const response = await apiClient.get('/files/download', {
      params: { path: filePath },
      responseType: 'blob'
    })

    // Create blob URL
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)

    // Create download link
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download failed:', error)
    throw error
  }
}