import React, { useState, useEffect } from 'react';
import { receivingUnitApi, ReceivingUnit } from '../../api/configuration';

interface ReceivingUnitSelectProps {
  value?: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const ReceivingUnitSelect: React.FC<ReceivingUnitSelectProps> = ({
  value,
  onChange,
  placeholder = "Chọn đơn vị nhận",
  required = false,
  className = "",
}) => {
  const [receivingUnits, setReceivingUnits] = useState<ReceivingUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceivingUnits();
  }, []);

  const loadReceivingUnits = async () => {
    try {
      setLoading(true);
      const response = await receivingUnitApi.getAll();
      
      // Handle different response structures
      const data = response.data?.data || response.data || [];
      // Ensure data is an array and has valid structure
      const validData = Array.isArray(data) ? data.filter(item => item && typeof item === 'object' && item.id) : [];
      setReceivingUnits(validData);
    } catch (error) {
      console.error('Error loading receiving units:', error);
      setReceivingUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = parseInt(e.target.value);
    if (!isNaN(selectedValue) && selectedValue > 0) {
      onChange(selectedValue);
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
      value={value && value > 0 ? value : ''}
      onChange={handleChange}
      required={required}
      className={`${className} border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
    >
      <option value="">{placeholder}</option>
      {Array.isArray(receivingUnits) && receivingUnits.map((unit, index) => (
        <option key={unit?.id || `unit-${index}`} value={unit?.id || ''}>
          {unit?.name || 'Unknown'}
        </option>
      ))}
    </select>
  );
};

export default ReceivingUnitSelect;