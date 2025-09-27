import React, { useState, useEffect } from 'react';

interface MessageFiltersState {
  author: string;
  source: string;
  dateFrom: string;
  dateTo: string;
}

interface FilterMetadata {
  authors: string[];
  sources: string[];
  total_messages: number;
  date_range: {
    earliest: string | null;
    latest: string | null;
  };
}

interface MessageFiltersProps {
  onFiltersChange: (filters: MessageFiltersState) => void;
  apiBaseUrl: string;
  className?: string;
}

export function MessageFilters({ onFiltersChange, apiBaseUrl, className = '' }: MessageFiltersProps) {
  const [filters, setFilters] = useState<MessageFiltersState>({
    author: '',
    source: '',
    dateFrom: '',
    dateTo: ''
  });

  const [metadata, setMetadata] = useState<FilterMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load filter metadata on component mount
  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${apiBaseUrl}/api/messages/filters`);
        if (response.ok) {
          const data = await response.json();
          setMetadata(data);
        }
      } catch (error) {
        console.error('Failed to load filter metadata:', error);
      }
      setIsLoading(false);
    };

    if (apiBaseUrl) {
      loadMetadata();
    }
  }, [apiBaseUrl]);

  const handleFilterChange = (key: keyof MessageFiltersState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      author: '',
      source: '',
      dateFrom: '',
      dateTo: ''
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className={`message-filters ${className}`}>
      <div className="filters-header">
        <h3 className="filters-title">🔍 Message Filters</h3>
        {metadata && (
          <span className="filters-info text-secondary">
            {metadata.total_messages} total messages
          </span>
        )}
      </div>

      <div className="filters-form">
        <div className="filter-row">
          {/* Author Filter */}
          <div className="filter-group">
            <label className="filter-label text-secondary">Author:</label>
            <select
              className="filter-select"
              value={filters.author}
              onChange={(e) => handleFilterChange('author', e.target.value)}
              disabled={isLoading}
            >
              <option value="">All Authors</option>
              {metadata?.authors.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="filter-group">
            <label className="filter-label text-secondary">Source:</label>
            <select
              className="filter-select"
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              disabled={isLoading}
            >
              <option value="">All Sources</option>
              {metadata?.sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-row">
          {/* Date From Filter */}
          <div className="filter-group">
            <label className="filter-label text-secondary">From Date:</label>
            <input
              type="date"
              className="filter-input"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              min={metadata?.date_range.earliest || undefined}
              max={metadata?.date_range.latest || undefined}
              disabled={isLoading}
            />
          </div>

          {/* Date To Filter */}
          <div className="filter-group">
            <label className="filter-label text-secondary">To Date:</label>
            <input
              type="date"
              className="filter-input"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              min={filters.dateFrom || metadata?.date_range.earliest || undefined}
              max={metadata?.date_range.latest || undefined}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button
            className="btn-secondary"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters || isLoading}
          >
            🗑️ Clear All
          </button>

          {hasActiveFilters && (
            <div className="active-filters-indicator">
              <span className="indicator-dot"></span>
              <span className="indicator-text text-secondary">
                Filters active
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { MessageFiltersState, FilterMetadata };