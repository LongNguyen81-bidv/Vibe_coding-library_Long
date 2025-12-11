import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear storage and redirect to login
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  checkEmail: (email) => api.get(`/auth/check-email/${encodeURIComponent(email)}`),
  login: (data) => api.post('/auth/login', data),
}

// Books API (for future use)
export const booksAPI = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
}

// Categories API (for future use)
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

// Profile API
export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  changePassword: (data) => api.put('/profile/change-password', data),
}

// Borrowings API
export const borrowingsAPI = {
  create: (data) => api.post('/borrowings', data),
  getPending: () => api.get('/borrowings/pending'),
  confirm: (id) => api.patch(`/borrowings/${id}/confirm`),
  reject: (id, data) => api.patch(`/borrowings/${id}/reject`, data),
  getHistory: (status) => api.get('/borrowings/history', { params: { status } }),
  createReturnRequest: (id) => api.post(`/borrowings/${id}/return-request`),
  extend: (id) => api.patch(`/borrowings/${id}/extend`),
  cancel: (id) => api.patch(`/borrowings/${id}/cancel`),
  getPendingReturnRequests: () => api.get('/borrowings/return-requests/pending'),
  confirmReturn: (id, data) => api.patch(`/borrowings/return-requests/${id}/confirm`, data),
  getFineLevels: () => api.get('/borrowings/fine-levels'),
}

// Fine Levels API
export const fineLevelsAPI = {
  getAll: () => api.get('/fine-levels'),
  create: (data) => api.post('/fine-levels', data),
  update: (id, data) => api.put(`/fine-levels/${id}`, data),
  delete: (id) => api.delete(`/fine-levels/${id}`),
}

// Fines API
export const finesAPI = {
  getMyFines: (status) => api.get('/fines/my', { params: { status } }),
  getFineDetail: (id) => api.get(`/fines/${id}`),
  payFine: (id, data) => api.patch(`/fines/${id}/pay`, data),
  getAllFines: (status) => api.get('/fines', { params: { status } }),
  confirmPayment: (id) => api.patch(`/fines/${id}/confirm`),
  rejectPayment: (id, data) => api.patch(`/fines/${id}/reject`, data),
}

// Users API
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  activate: (id) => api.patch(`/users/${id}/activate`),
  disable: (id) => api.patch(`/users/${id}/disable`),
  approve: (id) => api.patch(`/users/${id}/approve`),
  reject: (id, data) => api.patch(`/users/${id}/reject`, data),
  assignRole: (id, data) => api.patch(`/users/${id}/assign-role`, data),
}

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
}

// Reports API
export const reportAPI = {
  getBooksReport: (params) => api.get('/reports/books', { params }),
  getBorrowingsReport: (params) => api.get('/reports/borrowings', { params }),
  getFinesReport: (params) => api.get('/reports/fines', { params }),
  getLostDamagedReport: (params) => api.get('/reports/lost-damaged', { params }),
  exportCSV: (data) => api.post('/reports/export', data, { responseType: 'blob' }),
}

export default api



