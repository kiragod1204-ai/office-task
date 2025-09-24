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

  const loadDocumentTypes = async () => {
    try {
      setLoading(true);
      const response = await documentTypeApi.getAll();
      setDocumentTypes(response.data.data);
    } catch (error) {
      console.error('Error loading document types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = parseInt(e.target.value);
    if (!isNaN(selectedValue)) {
      onChange(selectedValue);
    } else if (allowEmpty) {
      onChange(0);
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
      className={`${className} border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
    >
      <option value="">{allowEmpty ? emptyLabel : placeholder}</option>
      {documentTypes.map((type) => (
        <option key={type.id} value={type.id}>
          {type.name}
        </option>
      ))}
    </select>
  );
};

export { DocumentTypeSelect };