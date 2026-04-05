'use client';

import { create } from 'zustand';
import apiClient from '@/lib/api-client';
import type { Task, TaskStatus, CreateTaskPayload, UpdateTaskPayload, PaginationInfo } from '@/types/task';

interface TaskState {
  tasks: Task[];
  pagination: PaginationInfo;
  filters: {
    status: TaskStatus | 'ALL';
    search: string;
  };
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  createTask: (data: CreateTaskPayload) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskPayload) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TaskState['filters']>) => void;
  setPage: (page: number) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
  filters: { status: 'ALL', search: '' },
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true });
    const { pagination, filters } = get();
    const params: Record<string, string | number> = {
      page: pagination.page,
      limit: pagination.limit,
    };
    if (filters.status !== 'ALL') params.status = filters.status;
    if (filters.search) params.search = filters.search;

    try {
      const { data } = await apiClient.get('/tasks', { params });
      set({ tasks: data.tasks, pagination: data.pagination, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('Failed to fetch tasks');
    }
  },

  createTask: async (taskData) => {
    await apiClient.post('/tasks', taskData);
    await get().fetchTasks();
  },

  updateTask: async (id, taskData) => {
    await apiClient.patch(`/tasks/${id}`, taskData);
    await get().fetchTasks();
  },

  deleteTask: async (id) => {
    await apiClient.delete(`/tasks/${id}`);
    await get().fetchTasks();
  },

  toggleStatus: async (id) => {
    const { data } = await apiClient.patch(`/tasks/${id}/toggle`);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? data : t)),
    }));
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 },
    }));
  },

  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
  },
}));
