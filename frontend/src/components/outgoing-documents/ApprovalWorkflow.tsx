import React, { useState } from 'react';
import { 
  OutgoingDocument, 
  UpdateApprovalStatusRequest,
  outgoingDocumentApi,
  OUTGOING_STATUS,
  OUTGOING_STATUS_LABELS
} from '../../api/outgoing-documents';

interface ApprovalWorkflowProps {
  document: OutgoingDocument;
  onStatusUpdate: (updatedDocument: OutgoingDocument) => void;
  onClose: () => void;
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  document,
  onStatusUpdate,
  onClose
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>(document.status);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAvailableStatuses = () => {
    const currentStatus = document.status;
    const statuses = [];

    switch (currentStatus) {
      case OUTGOING_STATUS.DRAFT:
        statuses.push(
          { value: OUTGOING_STATUS.REVIEW, label: OUTGOING_STATUS_LABELS[OUTGOING_STATUS.REVIEW] },
          { value: OUTGOING_STATUS.REJECTED, label: OUTGOING_STATUS_LABELS[OUTGOING_STATUS.REJECTED] }
        );
        break;
      case OUTGOING_STATUS.REVIEW:
        statuses.push(
          { value: OUTGOING_STATUS.APPROVED, label: OUTGOING_STATUS_LABELS[OUTGOING_STATUS.APPROVED] },
          { value: OUTGOING_STATUS.REJECTED, label: OUTGOING_STATUS_LABELS[OUTGOING_STATUS.REJECTED] },
          { value: OUTGOING_STATUS.DRAFT, label: 'Trả về bản thảo' }
        );
        break;
      case OUTGOING_STATUS.APPROVED:
        statuses.push(
          { value: OUTGOING_STATUS.SENT, label: OUTGOING_STATUS_LABELS[OUTGOING_STATUS.SENT] }
        );
        break;
      case OUTGOING_STATUS.REJECTED:
        statuses.push(
          { value: OUTGOING_STATUS.DRAFT, label: 'Trả về bản thảo' }
        );
        break;
      default:
        break;
    }

    return statuses;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case OUTGOING_STATUS.DRAFT:
        return 'text-gray-600 bg-gray-100';
      case OUTGOING_STATUS.REVIEW:
        return 'text-yellow-600 bg-yellow-100';
      case OUTGOING_STATUS.APPROVED:
        return 'text-green-600 bg-green-100';
      case OUTGOING_STATUS.SENT:
        return 'text-blue-600 bg-blue-100';
      case OUTGOING_STATUS.REJECTED:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getWorkflowSteps = () => {
    const steps = [
      { status: OUTGOING_STATUS.DRAFT, label: 'Bản thảo', description: 'Văn bản đang được soạn thảo' },
      { status: OUTGOING_STATUS.REVIEW, label: 'Đang xem xét', description: 'Văn bản đang được xem xét phê duyệt' },
      { status: OUTGOING_STATUS.APPROVED, label: 'Đã phê duyệt', description: 'Văn bản đã được phê duyệt' },
      { status: OUTGOING_STATUS.SENT, label: 'Đã gửi', description: 'Văn bản đã được gửi đi' }
    ];

    return steps;
  };

  const getCurrentStepIndex = () => {
    const steps = getWorkflowSteps();
    return steps.findIndex(step => step.status === document.status);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedStatus === document.status) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updateData: UpdateApprovalStatusRequest = {
        status: selectedStatus,
        notes: notes.trim() || undefined
      };

      const updatedDocument = await outgoingDocumentApi.updateApprovalStatus(document.id, updateData);
      onStatusUpdate(updatedDocument);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể cập nhật trạng thái phê duyệt');
    } finally {
      setIsLoading(false);
    }
  };

  const availableStatuses = getAvailableStatuses();
  const workflowSteps = getWorkflowSteps();
  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Quy trình phê duyệt văn bản
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Document Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Thông tin văn bản</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Số văn bản:</span>
                <span className="ml-2 font-medium">{document.document_number}</span>
              </div>
              <div>
                <span className="text-gray-500">Ngày ban hành:</span>
                <span className="ml-2">{new Date(document.issue_date).toLocaleDateString('vi-VN')}</span>
              </div>
              <div>
                <span className="text-gray-500">Người soạn thảo:</span>
                <span className="ml-2">{document.drafter.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Người phê duyệt:</span>
                <span className="ml-2">{document.approver.name}</span>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-gray-500">Trích yếu:</span>
              <p className="mt-1 text-sm">{document.summary}</p>
            </div>
          </div>

          {/* Workflow Visualization */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-4">Tiến trình xử lý</h4>
            <div className="flex items-center justify-between">
              {workflowSteps.map((step, index) => (
                <div key={step.status} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStepIndex 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${
                      index <= currentStepIndex ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 max-w-24">
                      {step.description}
                    </div>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <div className={`absolute h-0.5 w-16 mt-4 ${
                      index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                    }`} style={{ left: `${(index + 1) * 25}%`, transform: 'translateX(-50%)' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Status */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Trạng thái hiện tại</h4>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(document.status)}`}>
              {OUTGOING_STATUS_LABELS[document.status as keyof typeof OUTGOING_STATUS_LABELS]}
            </span>
          </div>

          {/* Status Update Form */}
          {availableStatuses.length > 0 && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Cập nhật trạng thái
                </label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={document.status}>
                    Giữ nguyên - {OUTGOING_STATUS_LABELS[document.status as keyof typeof OUTGOING_STATUS_LABELS]}
                  </option>
                  {availableStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập ghi chú về quyết định phê duyệt..."
                />
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    'Cập nhật trạng thái'
                  )}
                </button>
              </div>
            </form>
          )}

          {availableStatuses.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-500">Không có thao tác nào khả dụng cho trạng thái hiện tại</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};