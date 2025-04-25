'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  type: string;
  name: string;
  region: string;
  details: Record<string, any>;
}

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsDropdownOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/resources/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      const data = await response.json();
      setResults(data);
      setIsDropdownOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    handleSearch(newQuery);
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(`/services/${result.type}/${result.id}`);
    setIsDropdownOpen(false);
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 's3':
        return '📦';
      case 'ec2':
        return '🖥️';
      case 'rds':
        return '🗄️';
      case 'lambda':
        return '⚡';
      case 'dynamodb':
        return '📊';
      default:
        return '🔍';
    }
  };

  const getResourceDetails = (resource: SearchResult) => {
    switch (resource.type.toLowerCase()) {
      case 'ec2':
        return `State: ${resource.details.state} | Type: ${resource.type}`;
      case 'rds':
        return `Engine: ${resource.details.engine} | Status: ${resource.details.status}`;
      case 'lambda':
        return `Runtime: ${resource.details.runtime}`;
      default:
        return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search AWS resources..."
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      {isDropdownOpen && (results.length > 0 || isLoading || error) && (
        <div className="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-red-500">{error}</div>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {results.map((result) => (
                <li
                  key={result.id}
                  className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{result.name}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {result.type.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{result.region}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Search; 