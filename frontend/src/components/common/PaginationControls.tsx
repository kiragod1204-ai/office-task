import React from 'react';
import { PaginationInfo } from '../../api/filters';

interface PaginationControlsProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  className?: string;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
  className = ''
}) => {
  const { total, page, limit, total_pages, has_next, has_prev } = pagination;

  // Calculate page range to display
  const getPageRange = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(total_pages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < total_pages - 1) {
      rangeWithDots.push('...', total_pages);
    } else if (total_pages > 1) {
      rangeWithDots.push(total_pages);
    }

    return rangeWithDots;
  };

  const pageRange = getPageRange();

  // Calculate display range
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  if (total === 0) {
    return (
      <div className={`flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 ${className}`}>
        <div className="text-sm text-gray-700">
          Không có dữ liệu
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 ${className}`}>
      {/* Results Info */}
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-700">
          Hiển thị <span className="font-medium">{startItem}</span> đến{' '}
          <span className="font-medium">{endItem}</span> trong tổng số{' '}
          <span className="font-medium">{total}</span> kết quả
        </div>

        {/* Items per page selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-700">Hiển thị:</label>
          <select
            value={limit}
            onChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-700">mục</span>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!has_prev}
          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
            has_prev
              ? 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <span className="sr-only">Trang trước</span>
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Page Numbers */}
        <div className="flex">
          {pageRange.map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span
                  key={`dots-${index}`}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                >
                  ...
                </span>
              );
            }

            const isCurrentPage = pageNum === page;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  isCurrentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!has_next}
          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
            has_next
              ? 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <span className="sr-only">Trang sau</span>
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;