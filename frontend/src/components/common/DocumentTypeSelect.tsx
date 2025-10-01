import React, { useState, useEffect } from 'react';
import { documentTypeApi, DocumentType } from '../../api/configuration';

interface DocumentTypeSelectProps {
  value?: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

const DocumentTypeSelect: React.FC<DocumentTypeSelectProps> = ({
  value,
  onChange,
  placeholder = "Chọn loại văn bản",
  required = false,
  className = "",
  allowEmpty = false,
  emptyLabel = "Tất cả loại văn bản",
}) => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocumentTypes();
  }, []);

  // Debug: log the current state
  useEffect(() => {
    console.log('DocumentTypeSelect - documentTypes state:', documentTypes);
    console.log('DocumentTypeSelect - loading state:', loading);
    console.log('DocumentTypeSelect - current value:', value);
  }, [documentTypes, loading, value]);

  const loadDocumentTypes = async () => {
    try {
      setLoading(true);
      const response = await documentTypeApi.getAll();
      const data = response.data?.data || response.data || [];
      setDocumentTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      setDocumentTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    
    if (value === '' || isNaN(numValue)) {
      onChange(0);
    } else {
      onChange(numValue);
    }
  };

  if (loading) {
    return (
      <select disabled className={`${className} bg-gray-100`}>
        <option>Đang tải...</option>
      </select>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      required={required}
      disabled={loading}
      className={`w-full ${className} border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${loading ? 'bg-gray-100' : 'bg-white'}`}
    >
      <option value="">{allowEmpty ? emptyLabel : placeholder}</option>
      {Array.isArray(documentTypes) && documentTypes.map((type, index) => (
        <option key={type?.ID || `type-${index}`} value={type?.ID || ''}>
          {type?.name || 'Unknown'}
        </option>
      ))}
    </select>
  );
};

export { DocumentTypeSelect };