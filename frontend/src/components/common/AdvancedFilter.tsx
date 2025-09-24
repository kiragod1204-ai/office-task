import React, { useState, useEffect, useCallback } from 'react';
import { 
  FilterParams, 
  DocumentFilterParams, 
  TaskFilterParams, 
  FilterOptions, 
  FilterPreset,
  SavedFilter,
  getFilterOptions, 
  getFilterPresets,
  getSavedFilters,
  saveFilter,
  deleteSavedFilter
} from '../../api/filters';
import { documentTypeApi, issuingUnitApi, DocumentType, IssuingUnit } from '../../api/configuration';
import { usersApi, User } from '../../api/users';

interface AdvancedFilterProps {
  entityType: 'incoming_documents' | 'outgoing_documents' | 'tasks';
  filters: FilterParams | DocumentFilterParams | TaskFilterParams;
  onFiltersChange: (filters: FilterParams | DocumentFilterParams | TaskFilterParams) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  className?: string;
}

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  entityType,
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [presets, setPresets] = useState<Record<string, FilterPreset>>({});
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [issuingUnits, setIssuingUnits] = useState<IssuingUnit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [loading, setLoading] = useState(false);

  // Load filter options and data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load filter options
        const optionsResponse = await getFilterOptions(entityType);
        setFilterOptions(optionsResponse.options);

        // Load presets
        const presetsResponse = await getFilterPresets();
        setPresets(presetsResponse.presets);

        // Load saved filters
        const savedResponse = await getSavedFilters(entityType);
        setSavedFilters(savedResponse.saved_filters);

        // Load reference data for document filters
        if (entityType === 'incoming_documents' || entityType === 'outgoing_documents') {
          const [docTypesResponse, unitsResponse, usersResponse] = await Promise.all([
            documentTypeApi.getAll(),
            issuingUnitApi.getAll(),
            usersApi.getUsers()
          ]);
          setDocumentTypes(docTypesResponse.data.data);
          setIssuingUnits(unitsResponse.data.data);
          setUsers(usersResponse);
        } else if (entityType === 'tasks') {
          const usersResponse = await usersApi.getUsers();
          setUsers(usersResponse);
        }
      } catch (error) {
        console.error('Error loading filter data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [entityType]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handlePresetApply = useCallback((presetKey: string) => {
    const preset = presets[presetKey];
    if (preset) {
      const newFilters = { ...filters, ...preset.filters };
      onFiltersChange(newFilters);
      onApplyFilters();
    }
  }, [filters, presets, onFiltersChange, onApplyFilters]);

  const handleSavedFilterApply = useCallback((savedFilter: SavedFilter) => {
    const newFilters = { ...filters, ...savedFilter.filters };
    onFiltersChange(newFilters);
    onApplyFilters();
  }, [filters, onFiltersChange, onApplyFilters]);

  const handleSaveFilter = useCallback(async () => {
    if (!saveFilterName.trim()) return;

    try {
      await saveFilter(saveFilterName, entityType, filters);
      setSaveFilterName('');
      setShowSaveDialog(false);
      
      // Reload saved filters
      const savedResponse = await getSavedFilters(entityType);
      setSavedFilters(savedResponse.saved_filters);
    } catch (error) {
      console.error('Error saving filter:', error);
    }
  }, [saveFilterName, entityType, filters]);

  const handleDeleteSavedFilter = useCallback(async (filterId: number) => {
    try {
      await deleteSavedFilter(filterId);
      
      // Reload saved filters
      const savedResponse = await getSavedFilters(entityType);
      setSavedFilters(savedResponse.saved_filters);
    } catch (error) {
      console.error('Error deleting filter:', error);
    }
  }, [entityType]);

  const renderDateRangeFilter = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Từ ngày
        </label>
        <input
          type="date"
          value={filters.start_date || ''}
          onChange={(e) => handleFilterChange('start_date', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Đến ngày
        </label>
        <input
          type="date"
          value={filters.end_date || ''}
          onChange={(e) => handleFilterChange('end_date', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  const renderStatusFilter = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Trạng thái
      </label>
      <select
        value={filters.status || ''}
        onChange={(e) => handleFilterChange('status', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tất cả trạng thái</option>
        {filterOptions.statuses?.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </div>
  );

  const renderDocumentFilters = () => {
    const docFilters = filters as DocumentFilterParams;
    
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại văn bản
          </label>
          <select
            value={docFilters.document_type_id || ''}
            onChange={(e) => handleFilterChange('document_type_id', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả loại văn bản</option>
            {documentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Đơn vị ban hành
          </label>
          <select
            value={docFilters.issuing_unit_id || ''}
            onChange={(e) => handleFilterChange('issuing_unit_id', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả đơn vị</option>
            {issuingUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>

        {entityType === 'incoming_documents' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Người xử lý
            </label>
            <select
              value={docFilters.processor_id || ''}
              onChange={(e) => handleFilterChange('processor_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả người xử lý</option>
              {users.filter(user => user.role === 'truong' || user.role === 'pho').map((user) => (
                <option key={user.ID} value={user.ID}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {entityType === 'outgoing_documents' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người soạn thảo
              </label>
              <select
                value={docFilters.drafter_id || ''}
                onChange={(e) => handleFilterChange('drafter_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả người soạn thảo</option>
                {users.map((user) => (
                  <option key={user.ID} value={user.ID}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người phê duyệt
              </label>
              <select
                value={docFilters.approver_id || ''}
                onChange={(e) => handleFilterChange('approver_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả người phê duyệt</option>
                {users.filter(user => user.role === 'truong' || user.role === 'pho').map((user) => (
                  <option key={user.ID} value={user.ID}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </>
    );
  };

  const renderTaskFilters = () => {
    const taskFilters = filters as TaskFilterParams;
    
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Người được giao
          </label>
          <select
            value={taskFilters.assignee_id || ''}
            onChange={(e) => handleFilterChange('assignee_id', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả người được giao</option>
            {users.map((user) => (
              <option key={user.ID} value={user.ID}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại công việc
          </label>
          <select
            value={taskFilters.task_type || ''}
            onChange={(e) => handleFilterChange('task_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả loại công việc</option>
            {filterOptions.task_types?.map((type) => (
              <option key={type} value={type}>
                {type === 'document_linked' ? 'Liên quan văn bản' : 'Độc lập'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mức độ khẩn cấp
          </label>
          <select
            value={taskFilters.urgency_level || ''}
            onChange={(e) => handleFilterChange('urgency_level', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả mức độ</option>
            {filterOptions.urgency_levels?.map((level) => (
              <option key={level} value={level}>
                {level === 'critical' ? 'Rất khẩn cấp' :
                 level === 'urgent' ? 'Khẩn cấp' :
                 level === 'high' ? 'Cao' :
                 level === 'medium' ? 'Trung bình' : 'Bình thường'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trạng thái hạn
          </label>
          <select
            value={taskFilters.is_overdue || ''}
            onChange={(e) => handleFilterChange('is_overdue', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="true">Quá hạn</option>
            <option value="false">Chưa quá hạn</option>
          </select>
        </div>
      </>
    );
  };

  const renderSortingOptions = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sắp xếp theo
        </label>
        <select
          value={filters.sort_by || 'created_at'}
          onChange={(e) => handleFilterChange('sort_by', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {filterOptions.sort_fields?.map((field) => (
            <option key={field} value={field}>
              {field === 'created_at' ? 'Ngày tạo' :
               field === 'updated_at' ? 'Ngày cập nhật' :
               field === 'arrival_date' ? 'Ngày đến' :
               field === 'issue_date' ? 'Ngày ban hành' :
               field === 'deadline' ? 'Hạn hoàn thành' :
               field === 'status' ? 'Trạng thái' :
               field === 'description' ? 'Mô tả' : field}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Thứ tự
        </label>
        <select
          value={filters.sort_order || 'desc'}
          onChange={(e) => handleFilterChange('sort_order', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="desc">Giảm dần</option>
          <option value="asc">Tăng dần</option>
        </select>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-medium">Bộ lọc nâng cao</span>
            </button>

            {/* Quick Presets */}
            <div className="flex items-center space-x-2">
              {Object.entries(presets).slice(0, 3).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetApply(key)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Áp dụng
            </button>
            <button
              onClick={onClearFilters}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Range */}
          {renderDateRangeFilter()}

          {/* Status */}
          {renderStatusFilter()}

          {/* Entity-specific filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(entityType === 'incoming_documents' || entityType === 'outgoing_documents') && renderDocumentFilters()}
            {entityType === 'tasks' && renderTaskFilters()}
          </div>

          {/* Sorting */}
          {renderSortingOptions()}

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bộ lọc đã lưu
              </label>
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((savedFilter) => (
                  <div key={savedFilter.id} className="flex items-center space-x-1">
                    <button
                      onClick={() => handleSavedFilterApply(savedFilter)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                    >
                      {savedFilter.name}
                    </button>
                    <button
                      onClick={() => handleDeleteSavedFilter(savedFilter.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Filter */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
            >
              Lưu bộ lọc hiện tại
            </button>
          </div>
        </div>
      )}

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Lưu bộ lọc</h3>
            <input
              type="text"
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              placeholder="Nhập tên bộ lọc..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveFilter}
                disabled={!saveFilterName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilter;