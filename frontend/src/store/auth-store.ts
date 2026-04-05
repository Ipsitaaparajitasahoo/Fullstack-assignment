'use client';

import { create } from 'zustand';
import apiClient, { setAccessToken } from '@/lib/api-client';
import type { User, LoginPayload, RegisterPayload } from '@/types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (payload) => {
    const { data } = await apiClient.post('/auth/login', payload);
    setAccessToken(data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, isAuthenticated: true });
  },

  register: async (payload) => {
    const { data } = await apiClient.post('/auth/register', payload);
    setAccessToken(data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    }
    setAccessToken(null);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');

    if (!refreshToken || !userStr) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const { data } = await apiClient.post('/auth/refresh', { refreshToken });
      setAccessToken(data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      let user: User | null = null;
      try {
        user = JSON.parse(userStr);
      } catch {
        localStorage.removeItem('user');
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setAccessToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
