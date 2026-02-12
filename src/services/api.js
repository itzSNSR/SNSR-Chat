import axios from 'axios';

// Use relative path for local proxy (mobile friendly), or environment variable for production
const API_URL = import.meta.env.VITE_API_URL || '';

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
    claim: (chatId) => api.put(`/api/chats/${chatId}/claim`),
    archive: (chatId) => api.put(`/api/chats/${chatId}/archive`),
    unarchive: (chatId) => api.put(`/api/chats/${chatId}/unarchive`),
    delete: (chatId) => api.delete(`/api/chats/${chatId}`)
};

// Gemini API (through backend proxy)
export const geminiAPI = {
    generate: (prompt, model, history = []) => api.post('/api/gemini/generate', { prompt, model, history })
};

// OCR API (through backend proxy)
export const ocrAPI = {
    extract: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/api/ocr/extract', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000 // 30s timeout for OCR processing
        });
    }
};

// Math Captcha API
export const captchaAPI = {
    getChallenge: () => api.get('/api/captcha/challenge')
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
