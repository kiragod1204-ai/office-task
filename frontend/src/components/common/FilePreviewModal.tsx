import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, Maximize2, FileText, ChevronLeft, ChevronRight, RotateCw, Printer } from 'lucide-react';

// Set up PDF.js worker from local file (works offline)
// The worker file should be copied to public/pdf-worker/ during build
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf-worker/pdf.worker.min.js`;

interface FilePreviewProps {
  filePath: string;
  fileName: string;
  mimeType: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  filePath,
  fileName,
  mimeType,
  isOpen,
  onClose,
  onDownload,
}) => {
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [rotation, setRotation] = useState(0);
  const [pdfFile, setPdfFile] = useState<{ data: ArrayBuffer } | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchFileWithAuth();
    }
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [isOpen, filePath]);

  const fetchFileWithAuth = async () => {
    try {
      setLoading(true);
      setError('');
      setPageNumber(1);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api';
      
      const response = await fetch(
        `${baseUrl}/files/preview?path=${encodeURIComponent(filePath)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Preview error:', response.status, errorData);
        throw new Error(errorData.error || 'Không thể tải file');
      }

      const blob = await response.blob();
      
      if (mimeType === 'application/pdf') {
        const arrayBuffer = await blob.arrayBuffer();
        setPdfFile({ data: arrayBuffer });
      } else if (mimeType?.startsWith('image/')) {
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      }
      
      setLoading(false);
    } catch (err) {
      setError(mimeType === 'application/pdf' ? 'Không thể tải file PDF' : 'Không thể tải file');
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Không thể tải file PDF');
    setLoading(false);
  };

  const isPDF = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');
  const isPreviewable = isPDF || isImage;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const handlePrint = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api';
      
      // Fetch file again with authentication
      const response = await fetch(
        `${baseUrl}/files/preview?path=${encodeURIComponent(filePath)}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (!response.ok) {
        throw new Error('Không thể tải file');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        };
        
        // Cleanup after print dialog closes
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 60000);
      } else {
        console.error('Popup blocked - please allow popups for this site');
      }
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  const renderPreview = () => {
    if (!isPreviewable) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <FileText className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg mb-2">Không thể xem trước file này</p>
          <p className="text-sm mb-4">Loại file: {mimeType}</p>
          {onDownload && (
            <Button onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Tải xuống để xem
            </Button>
          )}
        </div>
      );
    }

    if (isPDF) {
      if (loading) {
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải PDF...</p>
            </div>
          </div>
        );
      }

      if (error) {
        return (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <FileText className="w-16 h-16 mb-4 text-red-300" />
            <p className="text-lg mb-2 text-red-600">{error}</p>
            {onDownload && (
              <Button onClick={onDownload} className="mt-4">
                <Download className="w-4 h-4 mr-2" />
                Tải xuống thay thế
              </Button>
            )}
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center">
          {/* PDF Navigation */}
          {numPages > 1 && (
            <div className="flex items-center justify-center gap-4 mb-4 p-2 bg-gray-100 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">
                Trang {pageNumber} / {numPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* PDF Document */}
          <div className="overflow-auto max-h-[70vh] border rounded-lg bg-gray-50">
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </div>
        </div>
      );
    }

    if (isImage) {
      if (loading) {
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải hình ảnh...</p>
            </div>
          </div>
        );
      }

      if (error) {
        return (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <FileText className="w-16 h-16 mb-4 text-red-300" />
            <p className="text-lg mb-2 text-red-600">{error}</p>
            {onDownload && (
              <Button onClick={onDownload} className="mt-4">
                <Download className="w-4 h-4 mr-2" />
                Tải xuống thay thế
              </Button>
            )}
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center p-4 bg-gray-50 overflow-auto">
          <img
            src={imageUrl}
            alt={fileName}
            style={{ 
              maxWidth: '100%', 
              maxHeight: isFullscreen ? '90vh' : '70vh',
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s'
            }}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={isFullscreen ? 'max-w-[95vw] h-[95vh]' : 'max-w-5xl max-h-[90vh]'}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex-1 truncate pr-4">{fileName}</DialogTitle>
            <div className="flex items-center gap-2">
              {(isPDF || isImage) && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={scale <= 0.5}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={scale >= 3.0}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleRotate} title="Xoay">
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={toggleFullscreen} title="Toàn màn hình">
                <Maximize2 className="w-4 h-4" />
              </Button>
              {(isPDF || isImage) && (
                <Button variant="ghost" size="sm" onClick={handlePrint} title="In">
                  <Printer className="w-4 h-4" />
                </Button>
              )}
              {onDownload && (
                <Button variant="ghost" size="sm" onClick={onDownload} title="Tải xuống">
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="overflow-auto">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
