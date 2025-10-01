import React, { useState } from 'react';
import { 
  OutgoingDocument, 
  CreateOutgoingDocumentRequest,
  UpdateOutgoingDocumentRequest,
  outgoingDocumentApi
} from '../../api/outgoing-documents';
import { OutgoingDocumentForm } from './OutgoingDocumentForm';
import { OutgoingDocumentList } from './OutgoingDocumentList';
import { ApprovalWorkflow } from './ApprovalWorkflow';
import { OutgoingDocumentFileUpload } from './OutgoingDocumentFileUpload';
import { ViewDocumentFiles } from '../common/ViewDocumentFiles';

type ViewMode = 'list' | 'create' | 'edit' | 'view' | 'approval' | 'upload';

export const OutgoingDocumentManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDocument, setSelectedDocument] = useState<OutgoingDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreate = async (data: CreateOutgoingDocumentRequest) => {
    setIsLoading(true);
    try {
      await outgoingDocumentApi.createOutgoingDocument(data);
      showNotification('success', 'Tạo văn bản đi thành công');
      setViewMode('list');
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Không thể tạo văn bản đi';
      showNotification('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: UpdateOutgoingDocumentRequest) => {
    if (!selectedDocument) return;
    
    setIsLoading(true);
    try {
      const updatedDocument = await outgoingDocumentApi.updateOutgoingDocument(selectedDocument.id, data);
      setSelectedDocument(updatedDocument);
      showNotification('success', 'Cập nhật văn bản đi thành công');
      setViewMode('view');
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Không thể cập nhật văn bản đi';
      showNotification('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (document: OutgoingDocument) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa văn bản "${document.document_number}"?`)) {
      return;
    }

    try {
      await outgoingDocumentApi.deleteOutgoingDocument(document.id);
      showNotification('success', 'Xóa văn bản đi thành công');
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Không thể xóa văn bản đi';
      showNotification('error', errorMessage);
    }
  };

  const handleView = async (document: OutgoingDocument) => {
    try {
      const fullDocument = await outgoingDocumentApi.getOutgoingDocument(document.id);
      setSelectedDocument(fullDocument);
      setViewMode('view');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Không thể tải thông tin văn bản';
      showNotification('error', errorMessage);
    }
  };

  const handleEdit = async (document: OutgoingDocument) => {
    try {
      const fullDocument = await outgoingDocumentApi.getOutgoingDocument(document.id);
      setSelectedDocument(fullDocument);
      setViewMode('edit');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Không thể tải thông tin văn bản';
      showNotification('error', errorMessage);
    }
  };

  const handleApprovalAction = async (document: OutgoingDocument) => {
    try {
      const fullDocument = await outgoingDocumentApi.getOutgoingDocument(document.id);
      setSelectedDocument(fullDocument);
      setViewMode('approval');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Không thể tải thông tin văn bản';
      showNotification('error', errorMessage);
    }
  };

  const handleStatusUpdate = (updatedDocument: OutgoingDocument) => {
    setSelectedDocument(updatedDocument);
    showNotification('success', 'Cập nhật trạng thái thành công');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUploadSuccess = (filePath: string, fileName: string, status: string) => {
    if (selectedDocument) {
      setSelectedDocument({
        ...selectedDocument,
        file_path: filePath,
        status: status
      });
    }
    showNotification('success', `Upload file "${fileName}" thành công`);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUploadError = (error: string) => {
    showNotification('error', error);
  };



  const handleFileDownloadInView = async (filePath: string, fileName: string) => {
    try {
      const { downloadFile } = await import('../../api/files');
      await downloadFile(filePath, fileName);
      showNotification('success', 'Tải file thành công');
    } catch (error) {
      console.error('Error downloading file:', error);
      showNotification('error', 'Không thể tải file xuống');
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Tạo văn bản đi mới</h2>
            <OutgoingDocumentForm
              onSubmit={handleCreate}
              onCancel={() => setViewMode('list')}
              isLoading={isLoading}
            />
          </div>
        );

      case 'edit':
        return selectedDocument ? (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Chỉnh sửa văn bản đi</h2>
            <OutgoingDocumentForm
              document={selectedDocument}
              onSubmit={handleUpdate}
              onCancel={() => setViewMode('view')}
              isLoading={isLoading}
            />
          </div>
        ) : null;

      case 'view':
        return selectedDocument ? (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Chi tiết văn bản đi</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('upload')}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Upload file
                </button>
                <button
                  onClick={() => setViewMode('edit')}
                  className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-indigo-300 rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Quay lại
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số văn bản</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDocument.document_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày ban hành</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedDocument.issue_date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Loại văn bản</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDocument.document_type.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Đơn vị ban hành</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDocument.issuing_unit.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Người soạn thảo</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedDocument.drafter.name} ({selectedDocument.drafter.role})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Người phê duyệt</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedDocument.approver.name} ({selectedDocument.approver.role})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <p className="mt-1">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {selectedDocument.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Files đính kèm</label>
                  <div className="mt-2">
                    <ViewDocumentFiles 
                      documentType="outgoing"
                      documentId={selectedDocument.id}
                      onDownload={handleFileDownloadInView}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Trích yếu</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDocument.summary}</p>
              </div>
              {selectedDocument.internal_notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ghi chú nội bộ</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDocument.internal_notes}</p>
                </div>
              )}
            </div>
          </div>
        ) : null;

      case 'upload':
        return selectedDocument ? (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Upload file văn bản</h2>
              <button
                onClick={() => setViewMode('view')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Quay lại
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedDocument.document_number}
              </h3>
              <p className="text-sm text-gray-600">{selectedDocument.summary}</p>
            </div>

            <OutgoingDocumentFileUpload
              documentId={selectedDocument.id}
              currentFilePath={selectedDocument.file_path}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        ) : null;

      case 'approval':
        return selectedDocument ? (
          <ApprovalWorkflow
            document={selectedDocument}
            onStatusUpdate={handleStatusUpdate}
            onClose={() => setViewMode('view')}
          />
        ) : null;

      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">Quản lý văn bản đi</h1>
              <button
                onClick={() => setViewMode('create')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Tạo văn bản mới
              </button>
            </div>

            <OutgoingDocumentList
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onApprovalAction={handleApprovalAction}
              refreshTrigger={refreshTrigger}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setNotification(null)}
                  className="inline-flex text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
};