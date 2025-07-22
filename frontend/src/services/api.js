import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Blocks API
export const blocksAPI = {
  getBlocks: (limit = 50) => api.get(`/blocks?limit=${limit}`),
  getBlock: (id) => api.get(`/blocks/${id}`),
  searchBlocks: (query) => api.get(`/search?q=${query}`),
};

// Transactions API
export const transactionsAPI = {
  getTransaction: (hash) => api.get(`/transactions/${hash}`),
  searchTransactions: (query) => api.get(`/search?q=${query}`),
};

// Addresses API
export const addressesAPI = {
  getAddress: (address) => api.get(`/addresses/${address}`),
};

// Metrics API
export const metricsAPI = {
  getMetrics: () => api.get('/metrics'),
};

// Search API
export const searchAPI = {
  search: (query) => api.get(`/search?q=${query}`),
};

export default api; 