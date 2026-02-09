import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth APIs
export const authAPI = {
    signup: (data) => api.post('/api/auth/signup', data),
    login: (data) => api.post('/api/auth/login', data),
    verifyOtp: (userId, otp) => api.post('/api/auth/verify-otp', { userId, otp }),
    resendOtp: (userId) => api.post('/api/auth/resend-otp', { userId }),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return api.post('/api/auth/logout');
    },
    getMe: () => api.get('/api/auth/me')
};

// Chat APIs
export const chatAPI = {
    create: (modelUsed) => api.post('/api/chats', { modelUsed }),
    getAll: () => api.get('/api/chats'),
    getOne: (chatId) => api.get(`/api/chats/${chatId}`),
    addMessage: (chatId, message) => api.put(`/api/chats/${chatId}/message`, { message }),
    fork: (chatId) => api.post(`/api/chats/${chatId}/fork`),
    claim: (chatId) => api.put(`/api/chats/${chatId}/claim`)
};

// Gemini API (through backend proxy)
export const geminiAPI = {
    generate: (prompt, model, history = []) => api.post('/api/gemini/generate', { prompt, model, history })
};

// Helper functions
export const saveAuth = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};

export const getStoredUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const isLoggedIn = () => {
    return !!localStorage.getItem('token');
};

export default api;
