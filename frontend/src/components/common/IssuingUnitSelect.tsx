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

  const loadIssuingUnits = async () => {
    try {
      setLoading(true);
      const response = await issuingUnitApi.getAll();
      setIssuingUnits(response.data.data);
    } catch (error) {
      console.error('Error loading issuing units:', error);
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
      {issuingUnits.map((unit) => (
        <option key={unit.id} value={unit.id}>
          {unit.name}
        </option>
      ))}
    </select>
  );
};

export { IssuingUnitSelect };