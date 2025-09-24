import React, { useState, useEffect } from 'react';
import { receivingUnitApi, ReceivingUnit, CreateReceivingUnitRequest } from '../../api/configuration';

interface ReceivingUnitFormData extends CreateReceivingUnitRequest {
  is_active: boolean;
}

const ReceivingUnitManagement: React.FC = () => {
  const [receivingUnits, setReceivingUnits] = useState<ReceivingUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ReceivingUnit | null>(null);
  const [formData, setFormData] = useState<ReceivingUnitFormData>({
    name: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadReceivingUnits();
  }, []);

  const loadReceivingUnits = async () => {
    try {
      setLoading(true);
      const response = await receivingUnitApi.getAllIncludingInactive();
      setReceivingUnits(response.data.data);
    } catch (error) {
      console.error('Error loading receiving units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUnit) {
        await receivingUnitApi.update(editingUnit.id, formData);
      } else {
        await receivingUnitApi.create(formData);
      }
      await loadReceivingUnits();
      resetForm();
    } catch (error) {
      console.error('Error saving receiving unit:', error);
    }
  };

  const handleEdit = (unit: ReceivingUnit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      description: unit.description,
      is_active: unit.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn vị nhận này?')) {
      try {
        await receivingUnitApi.delete(id);
        await loadReceivingUnits();
      } catch (error) {
        console.error('Error deleting receiving unit:', error);
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await receivingUnitApi.toggleStatus(id);
      await loadReceivingUnits();
    } catch (error) {
      console.error('Error toggling receiving unit status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
    });
    setEditingUnit(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý đơn vị nhận</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Thêm đơn vị nhận
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {editingUnit ? 'Chỉnh sửa đơn vị nhận' : 'Thêm đơn vị nhận mới'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên đơn vị</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Kích hoạt
              </label>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {editingUnit ? 'Cập nhật' : 'Thêm mới'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên đơn vị
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mô tả
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {receivingUnits.map((unit) => (
              <tr key={unit.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {unit.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {unit.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      unit.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {unit.is_active ? 'Kích hoạt' : 'Vô hiệu hóa'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(unit)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleToggleStatus(unit.id)}
                    className="text-yellow-600 hover:text-yellow-900"
                  >
                    {unit.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  </button>
                  <button
                    onClick={() => handleDelete(unit.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReceivingUnitManagement;