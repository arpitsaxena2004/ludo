import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const adminStorage = localStorage.getItem('admin-storage');
    if (adminStorage) {
      const { state } = JSON.parse(adminStorage);
      if (state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminAPI = {
  login: (email, password) => api.post('/admin/login', { email, password }),
  getDashboard: () => api.get('/admin/dashboard'),
  getReports: (dateRange, startDate, endDate) => 
    api.get(`/admin/reports?dateRange=${dateRange}&startDate=${startDate || ''}&endDate=${endDate || ''}`),
  getUsers: (page, limit, search) => api.get(`/admin/users?page=${page}&limit=${limit}&search=${search || ''}`),
  getUserById: (id) => api.get(`/admin/user/${id}`),
  blockUser: (id) => api.put(`/admin/user/${id}/block`),
  unblockUser: (id) => api.put(`/admin/user/${id}/unblock`),
  addFunds: (userId, amount, type, reason) =>
    api.post(`/admin/users/${userId}/add-funds`, { amount, type, reason }),
  deductFunds: (userId, amount, type, reason) =>
    api.post(`/admin/users/${userId}/deduct-funds`, { amount, type, reason }),
  getTransactions: (page, limit, type, status) => 
    api.get(`/admin/transactions?page=${page}&limit=${limit}&type=${type || ''}&status=${status || ''}`),
  updateTransaction: (id, status, adminNotes) => 
    api.put(`/admin/transaction/${id}`, { status, adminNotes }),
  getGames: (page, limit, status) => 
    api.get(`/admin/games?page=${page}&limit=${limit}&status=${status || ''}`),
  declareWinner: (roomCode, winnerId) =>
    api.post(`/admin/games/${roomCode}/declare-winner`, { winnerId }),
  getKYCRequests: (page, limit, status) => 
    api.get(`/admin/kyc?page=${page}&limit=${limit}&status=${status || 'pending'}`),
  updateKYC: (id, status, rejectionReason) => 
    api.put(`/admin/kyc/${id}`, { status, rejectionReason }),
  getSupportTickets: (page, limit, status) => 
    api.get(`/admin/support?page=${page}&limit=${limit}&status=${status || ''}`),
  updateTicketStatus: (id, status) => 
    api.put(`/admin/support/${id}/status`, { status }),
  replyToTicket: (id, message) => 
    api.post(`/admin/support/${id}/reply`, { message }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settingKey, settingValue, description, category) => 
    api.put('/admin/settings', { settingKey, settingValue, description, category }),
  
  // Policy management
  getPolicy: (policyKey) => api.get(`/admin/policies/${policyKey}`),
  updatePolicy: (policyKey, policyData) => api.put(`/admin/policies/${policyKey}`, policyData),
  getAllPolicies: () => api.get('/admin/policies'),
  
  // User management - delete
  deleteUser: (id) => api.delete(`/admin/user/${id}`),
  
  // Admin account management
  changePassword: (currentPassword, newPassword) => 
    api.put('/admin/change-password', { currentPassword, newPassword }),
};

export default api;
