import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAdminStore = create(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (admin, token) => set({ admin, token, isAuthenticated: true }),
      
      logout: () => set({ admin: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'admin-storage',
    }
  )
);

export default useAdminStore;
