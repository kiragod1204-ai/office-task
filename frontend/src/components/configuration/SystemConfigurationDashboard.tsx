import React, { useState } from 'react';
import DocumentTypeManagement from './DocumentTypeManagement';
import IssuingUnitManagement from './IssuingUnitManagement';
import ReceivingUnitManagement from './ReceivingUnitManagement';
import NotificationManagement from '../notifications/NotificationManagement';

type ConfigurationTab = 'document-types' | 'issuing-units' | 'receiving-units' | 'notifications';

const SystemConfigurationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConfigurationTab>('document-types');

  const tabs = [
    {
      id: 'document-types' as ConfigurationTab,
      label: 'Loại văn bản',
      icon: '📄',
    },
    {
      id: 'issuing-units' as ConfigurationTab,
      label: 'Đơn vị ban hành',
      icon: '🏢',
    },
    {
      id: 'receiving-units' as ConfigurationTab,
      label: 'Đơn vị nhận',
      icon: '📨',
    },
    {
      id: 'notifications' as ConfigurationTab,
      label: 'Thông báo hệ thống',
      icon: '🔔',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'document-types':
        return <DocumentTypeManagement />;
      case 'issuing-units':
        return <IssuingUnitManagement />;
      case 'receiving-units':
        return <ReceivingUnitManagement />;
      case 'notifications':
        return <NotificationManagement />;
      default:
        return <DocumentTypeManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cấu hình hệ thống</h1>
          <p className="mt-2 text-gray-600">
            Quản lý các danh mục và cấu hình hệ thống
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SystemConfigurationDashboard;