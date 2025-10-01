import React, { useState, useEffect } from 'react';
import { issuingUnitApi, IssuingUnit } from '../../api/configuration';

interface IssuingUnitSelectProps {
  value?: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

const IssuingUnitSelect: React.FC<IssuingUnitSelectProps> = ({
  value,
  onChange,
  placeholder = "Chọn đơn vị ban hành",
  required = false,
  className = "",
  allowEmpty = false,
  emptyLabel = "Tất cả đơn vị",
}) => {
  const [issuingUnits, setIssuingUnits] = useState<IssuingUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIssuingUnits();
  }, []);

  // Debug: log the current state
  useEffect(() => {
    console.log('IssuingUnitSelect - issuingUnits state:', issuingUnits);
    console.log('IssuingUnitSelect - loading state:', loading);
    console.log('IssuingUnitSelect - current value:', value);
  }, [issuingUnits, loading, value]);

  const loadIssuingUnits = async () => {
    try {
      setLoading(true);
      const response = await issuingUnitApi.getAll();
      const data = response.data?.data || response.data || [];
      setIssuingUnits(Array.isArray(data) ? data : []);
    } catch (error) {
      setIssuingUnits([]);
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
      {Array.isArray(issuingUnits) && issuingUnits.map((unit, index) => (
        <option key={unit?.ID || `unit-${index}`} value={unit?.ID || ''}>
          {unit?.name || 'Unknown'}
        </option>
      ))}
    </select>
  );
};

export { IssuingUnitSelect };