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

// Response interceptor to handle HTML responses (API 404/500 fallback)
api.interceptors.response.use(
    (response) => {
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('text/html')) {
            return Promise.reject(new Error('API unavailable (received HTML)'));
        }
        return response;
    },
    (error) => {
        if (error.response && error.response.headers['content-type']?.includes('text/html')) {
            error.message = 'API unavailable (received HTML)';
        }
        return Promise.reject(error);
    }
);

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
    forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
    resetPassword: (email, otp, newPassword) => api.post('/api/auth/reset-password', { email, otp, newPassword }),
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
    try {
        const user = localStorage.getItem('user');
        if (user === 'undefined' || user === 'null') return null;
        return user ? JSON.parse(user) : null;
    } catch (e) {
        // If local storage is corrupted, clear it
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return null;
    }
};

export const isLoggedIn = () => {
    return !!localStorage.getItem('token');
};

export default api;
