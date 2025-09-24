import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSearchSuggestions } from '../../api/filters';

interface SearchWithAutocompleteProps {
  entityType: 'incoming_documents' | 'outgoing_documents' | 'tasks';
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  className?: string;
}

const SearchWithAutocomplete: React.FC<SearchWithAutocompleteProps> = ({
  entityType,
  value,
  onChange,
  onSearch,
  placeholder = 'Nhập từ khóa tìm kiếm...',
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search suggestions
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (value.trim().length >= 2) {
        setLoading(true);
        try {
          const response = await getSearchSuggestions(entityType, value.trim(), 10);
          setSuggestions(response.suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, entityType]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setActiveSuggestion(-1);
  }, [onChange]);

  // Handle key navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0) {
          onChange(suggestions[activeSuggestion]);
          setShowSuggestions(false);
          setActiveSuggestion(-1);
        }
        onSearch();
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showSuggestions, suggestions, activeSuggestion, onChange, onSearch]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    onSearch();
  }, [onChange, onSearch]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    // Delay hiding suggestions to allow for suggestion clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }
    }, 150);
  }, []);

  // Handle search button click
  const handleSearchClick = useCallback(() => {
    onSearch();
    setShowSuggestions(false);
  }, [onSearch]);

  // Handle clear button click
  const handleClearClick = useCallback(() => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Action Buttons */}
        <div className="absolute inset-y-0 right-0 flex items-center">
          {value && (
            <button
              onClick={handleClearClick}
              className="p-1 mr-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              title="Xóa"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <button
            onClick={handleSearchClick}
            className="px-3 py-1 mr-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Tìm
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute inset-y-0 right-16 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                index === activeSuggestion ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="truncate">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showSuggestions && suggestions.length === 0 && !loading && value.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-4 py-2 text-gray-500 text-sm">
            Không tìm thấy gợi ý nào
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchWithAutocomplete;