import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { User, AuthTokens } from '@tymblok/shared';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  updateTokens: (tokens: AuthTokens) => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

// SecureStore has a 2048-byte limit per key.
// Split large values across multiple keys to avoid the warning/failure.
const CHUNK_SIZE = 1800; // leave margin under 2048

const secureStorage = {
  getItem: async (name: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name);
    }
    // Read chunk count from header key
    const header = await SecureStore.getItemAsync(name);
    if (header === null) return null;

    const chunkCount = parseInt(header, 10);
    if (isNaN(chunkCount)) {
      // Legacy single-key value — return as-is
      return header;
    }

    // Reassemble from chunks
    const chunks: string[] = [];
    for (let i = 0; i < chunkCount; i++) {
      const chunk = await SecureStore.getItemAsync(`${name}_${i}`);
      if (chunk === null) return null;
      chunks.push(chunk);
    }
    return chunks.join('');
  },
  setItem: async (name: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
      return;
    }

    // Split into chunks
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }

    // Store header (chunk count) in the main key
    await SecureStore.setItemAsync(name, String(chunks.length));

    // Store each chunk
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${name}_${i}`, chunks[i]);
    }
  },
  removeItem: async (name: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
      return;
    }
    // Read header to know how many chunks to clean up
    const header = await SecureStore.getItemAsync(name);
    if (header !== null) {
      const chunkCount = parseInt(header, 10);
      if (!isNaN(chunkCount)) {
        for (let i = 0; i < chunkCount; i++) {
          await SecureStore.deleteItemAsync(`${name}_${i}`);
        }
      }
    }
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, tokens) => set({ user, tokens, isAuthenticated: true, isLoading: false }),

      clearAuth: () => set({ user: null, tokens: null, isAuthenticated: false, isLoading: false }),

      updateTokens: tokens => set({ tokens }),

      updateUser: updates =>
        set(state => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setLoading: isLoading => set({ isLoading }),
    }),
    {
      name: 'tymblok-auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: state => ({ user: state.user, tokens: state.tokens }),
    }
  )
);
