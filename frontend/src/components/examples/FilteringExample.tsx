import React from 'react';
import EnhancedIncomingDocumentsList from '../incoming-documents/EnhancedIncomingDocumentsList';

/**
 * Example component showing how to use the new advanced filtering system
 * 
 * This component demonstrates:
 * - Advanced filtering with date ranges, status, document types, etc.
 * - Search with autocomplete suggestions
 * - Filter presets for common searches
 * - Saved filters functionality
 * - Pagination with customizable page sizes
 * - URL synchronization for bookmarkable filtered views
 */
const FilteringExample: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Advanced Filtering System Example
        </h1>
        <p className="text-gray-600">
          This page demonstrates the new advanced filtering capabilities for documents and tasks.
          The filtering system includes:
        </p>
        <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
          <li>Advanced filters with date ranges, status, document types, and more</li>
          <li>Search with autocomplete suggestions based on existing data</li>
          <li>Filter presets for common searches (overdue tasks, pending documents, etc.)</li>
          <li>Saved filters functionality for frequently used filter combinations</li>
          <li>Pagination with customizable page sizes</li>
          <li>URL synchronization so filtered views can be bookmarked and shared</li>
          <li>Efficient database queries with proper indexing for performance</li>
        </ul>
      </div>

      {/* Enhanced Incoming Documents List with Advanced Filtering */}
      <EnhancedIncomingDocumentsList />
    </div>
  );
};

export default FilteringExample;