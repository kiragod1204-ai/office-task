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
      setReceivingUnits(response.data.data);
    } catch (error) {
      console.error('Error loading receiving units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = parseInt(e.target.value);
    if (!isNaN(selectedValue)) {
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
      value={value || ''}
      onChange={handleChange}
      required={required}
      className={`${className} border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
    >
      <option value="">{placeholder}</option>
      {receivingUnits.map((unit) => (
        <option key={unit.id} value={unit.id}>
          {unit.name}
        </option>
      ))}
    </select>
  );
};

export default ReceivingUnitSelect;