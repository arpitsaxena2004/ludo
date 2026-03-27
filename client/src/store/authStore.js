import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      
      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),
      
      fetchUser: async () => {
        try {
          const { token } = get();
          if (!token) return;
          
          const response = await axios.get('/user/profile', {
            baseURL: import.meta.env.VITE_API_URL,
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success) {
            set({ user: response.data.data });
          }
        } catch (error) {
          console.error('Failed to fetch user:', error);
        }
      },
      
      // Fetch wallet balance in real-time
      fetchBalance: async () => {
        try {
          const { token } = get();
          if (!token) return;
          
          const response = await axios.get('/wallet/balance', {
            baseURL: import.meta.env.VITE_API_URL,
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success) {
            const { depositCash, winningCash, bonusCash } = response.data.data;
            set((state) => ({
              user: {
                ...state.user,
                depositCash,
                winningCash,
                bonusCash
              }
            }));
          }
        } catch (error) {
          console.error('Failed to fetch balance:', error);
        }
      },
      
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;
