import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
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

// Block API
export const blockAPI = {
  getBlocks: (limit = 50) => 
    api.get(`/blocks?limit=${limit}`),
  
  getBlock: (id) => 
    api.get(`/blocks/${id}`),
  
  searchBlocks: (query) => 
    api.get(`/search?q=${encodeURIComponent(query)}`),
};

// Transaction API
export const transactionAPI = {
  getTransaction: (hash) => 
    api.get(`/transactions/${hash}`),
  
  getAddressTransactions: (address) => 
    api.get(`/addresses/${address}`),
};

// Metrics API
export const metricsAPI = {
  getMetrics: () => 
    api.get('/metrics'),
};

// Search API
export const searchAPI = {
  search: (query) => 
    api.get(`/search?q=${encodeURIComponent(query)}`),
};

export default api; 