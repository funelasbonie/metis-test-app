// src/services/api.ts - SIMPLER VERSION
import axios from 'axios';
import { authService } from './authService';

const API_BASE_URL = 'http://localhost:7161'; // Your .NET app URL

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    async (config) => {
        const token = await authService.getAccessToken();

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            try {
                await authService.silentRenew();
                return api(error.config);
            } catch (refreshError) {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// API methods
export const apiService = {
    async getProtectedData() {
        const response = await api.get('/api/metis/protected');
        return response.data;
    },

    async getSharedData() {
        const response = await api.get('/api/metis/shared');
        return response.data;
    },

    async getPublicData() {
        const response = await api.get('/api/metis/public');
        return response.data;
    },

    async getUserInfo() {
        const response = await api.get('/api/sso/userinfo');
        return response.data;
    },

    // Generic methods
    get(url: string, config?: any) {
        return api.get(url, config);
    },

    post(url: string, data?: any, config?: any) {
        return api.post(url, data, config);
    },

    put(url: string, data?: any, config?: any) {
        return api.put(url, data, config);
    },

    delete(url: string, config?: any) {
        return api.delete(url, config);
    }
};