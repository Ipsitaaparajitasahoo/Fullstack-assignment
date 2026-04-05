'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useTaskStore } from '@/store/task-store';
import { useDebounce } from '@/hooks/useDebounce';
import type { TaskStatus } from '@/types/task';

const statusOptions = [
  { value: 'ALL', label: 'All Status' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
];

export function TaskFilters() {
  const filters = useTaskStore((s) => s.filters);
  const setFilters = useTaskStore((s) => s.setFilters);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update store when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch });
    }
  }, [debouncedSearch, setFilters, filters.search]);

  // Fetch tasks when filters change
  useEffect(() => {
    fetchTasks();
  }, [filters.status, filters.search, fetchTasks]);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ status: e.target.value as TaskStatus | 'ALL' });
  }, [setFilters]);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search tasks"
        />
      </div>
      <select
        value={filters.status}
        onChange={handleStatusChange}
        className="px-4 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="Filter by status"
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
