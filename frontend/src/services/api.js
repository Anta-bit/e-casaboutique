import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Ajouter le token d'authentification à chaque requête
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Services des produits
export const productService = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  getByCategory: (category) => api.get(`/products/category/${category}`),
  search: (query) => api.get(`/products/search?q=${query}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

// Services du panier
export const cartService = {
  getCart: () => api.get('/cart'),
  addItem: (product_id, quantity = 1) => api.post('/cart/add', { product_id, quantity }),
  updateItem: (product_id, quantity) => api.put(`/cart/update/${product_id}`, { quantity }),
  removeItem: (product_id) => api.delete(`/cart/remove/${product_id}`),
  clearCart: () => api.delete('/cart/clear')
};

// Services d'authentification
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (oldPassword, newPassword) => api.post('/auth/change-password', { oldPassword, newPassword })
};

// Services des commandes
export const orderService = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post('/orders', orderData),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  getAllAdmin: () => api.get('/orders/admin/all'),
  getInvoice: (id) => api.get(`/orders/${id}/invoice`)
};

// Services de paiement
export const paymentService = {
  initiatePayment: (order_id, payment_method) => api.post('/payments/initiate', { order_id, payment_method }),
  verifyPaytech: (payment_reference) => api.post('/payments/verify-paytech', { payment_reference }),
  getPayments: () => api.get('/payments'),
  getPaymentsByOrder: (order_id) => api.get(`/payments/order/${order_id}`),
  getPaymentMethods: () => api.get('/payments/methods')
};

// Services des clients
export const clientService = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  // Nouveaux services admin pour la gestion des utilisateurs
  getAdminUsers: () => api.get('/clients/admin/users'),
  updateUserStatus: (id, status) => api.put(`/clients/admin/users/${id}/status`, { status }),
  deleteUser: (id) => api.delete(`/clients/admin/users/${id}`),
  getPendingSuppliers: () => api.get('/clients/admin/suppliers/pending'),
  validateSupplier: (id, status) => api.put(`/clients/admin/suppliers/${id}/validate`, { status })
};

// Services des fournisseurs
export const supplierService = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  // Nouveaux services pour l'espace fournisseur connecté
  getMyProfile: () => api.get('/suppliers/me/profile'),
  updateMyProfile: (data) => api.put('/suppliers/me/profile', data),
  getMyStats: () => api.get('/suppliers/me/stats'),
  getMyOrders: () => api.get('/suppliers/me/orders')
};

// Services des catégories
export const categoryService = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// Services des statistiques
export const statsService = {
  getDashboard: () => api.get('/stats/dashboard'),
  getSalesByDay: () => api.get('/stats/sales-by-day'),
  getTopProducts: () => api.get('/stats/top-products'),
  getRevenueByCategory: () => api.get('/stats/revenue-by-category'),
  getTopCustomers: () => api.get('/stats/top-customers')
};

// Services d'IA (Assistant Gemini)
export const aiService = {
  chat: (messages) => api.post('/ai/chat', { messages }),
  transcribeAudio: (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    return api.post('/ai/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export default api;
