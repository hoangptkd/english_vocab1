// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// Sửa API_URL để phù hợp với Android Emulator
const API_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api', // Android Emulator
  ios: 'http://localhost:3000/api',     // iOS Simulator
  default: 'http://localhost:3000/api'  // Web/default
});
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để tự động thêm token vào mọi request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
// Trong file api.js, thêm log để debug
  register: async (email, password, name) => {
      console.log('Calling register API with:', { email, password, name });
      try {
        // Kiểm tra backend có chạy không
        const ping = await api.get('/');
        console.log('Backend is running:', ping.data);
        const response = await api.post('/auth/register', { email, password, name });
        console.log('Register API response:', response.data);
        if (response.data.token) {
          await AsyncStorage.setItem('authToken', response.data.token);
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
      } catch (error) {
        console.error('Register API error:', error);
        throw error;
      }
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (email, resetToken, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      email,
      resetToken,
      newPassword,
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

// Vocabulary APIs
// Vocabulary APIs
export const vocabularyAPI = {
  // Get list of topics
  getTopics: async () => {
    const response = await api.get('/topics');
    return response.data;
  },

  // Get new vocabularies with optional topicId
  getNewVocabs: async (limit = 10, level = null, topicId = null) => {
    const params = { limit };
    if (level) params.level = level;
    if (topicId) params.topicId = topicId;
    const response = await api.get('/vocabulary/new', { params });
    return response.data;
  },

  getReviewVocabs: async () => {
    const response = await api.get('/vocabulary/review');
    return response.data;
  },
};

// Learning APIs
export const learningAPI = {
  startLearning: async (vocabId, quality) => {
    const response = await api.post('/learning/start', { vocabId, quality });
    return response.data;
  },

  updateProgress: async (vocabId, isCorrect) => {
    const response = await api.post('/learning/update', { vocabId, isCorrect });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/learning/stats');
    return response.data;
  },
};

export default api;