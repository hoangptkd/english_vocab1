// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// Sửa API_URL để phù hợp với Android Emulator
// const LAN = '192.168.1.12:3000';
//
// const API_URL = Platform.select({
//   android: 'http://10.0.2.2:3000/api', // Android Emulator
//   ios:     `http://${LAN}/api`,     // iOS Simulator
//   default: 'http://localhost:3000/api'  // Web/default
// });
// --------- ENV / BASE URL ----------
/**
 * Khi chạy debug (dev), bạn vẫn có thể dùng 10.0.2.2 / LAN.
 * Khi build phát hành (APKPure), luôn dùng domain HTTPS của Render.
 */
const PROD_API_ROOT = 'https://english-vocab-it2k.onrender.com'; // ✅ Render
const DEV_API_ROOT_ANDROID = 'http://10.0.2.2:3000';
const DEV_API_ROOT_IOS = 'http://192.168.1.7:3000'; // đổi IP LAN của bạn khi cần
const DEV_API_ROOT_WEB = 'http://localhost:3000';
const API_ROOT =
    __DEV__
        ? (Platform.OS === 'android' ? DEV_API_ROOT_ANDROID : (Platform.OS === 'ios' ? PROD_API_ROOT : DEV_API_ROOT_WEB))
        : PROD_API_ROOT;

const API_URL = `${API_ROOT}/api`; // mọi API đều qua /api
console.log(API_URL)
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

  refreshProfile: async () => {
    try {
      const response = await api.get('/user/profile/me');
      // đừng set context ở đây
      return response.data;
    } catch (e) {
      console.error('Không thể tải profile mới:', e);
      throw e;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/user/changePassword', { currentPassword, newPassword });
      return response.data; // Trả về thông báo thành công hoặc lỗi
    } catch (error) {
      console.error('Change password API error:', error);
      throw error; // Throw lỗi để xử lý ở nơi gọi API
    }
  },

  // Cập nhật profile
  updateProfile: async (name) => {
    try {
      const response = await api.put('/user/profile/update', { name });
      return response.data; // Trả về thông tin người dùng đã cập nhật
    } catch (error) {
      console.error('Update profile API error:', error);
      throw error; // Throw lỗi để xử lý ở nơi gọi API
    }
  },

  updatePremium: async (durationMonths) => {
    try {
      const response = await api.put('/user/updatePremium', {role : "premium", durationMonths });
      return response.data; // Trả về thông tin người dùng đã cập nhật
    } catch (error) {
      console.error('Update premium API error:', error);
      throw error; // Throw lỗi để xử lý ở nơi gọi API
    }
  }
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

// Admin APIs
export const adminAPI = {
  // Topic Management
  getTopics: async () => {
    const response = await api.get('/topics');
    return response.data;
  },

  createTopic: async (topicData) => {
    const response = await api.post('/topics', topicData);
    return response.data;
  },

  updateTopic: async (topicId, topicData) => {
    const response = await api.put(`/topics/${topicId}`, topicData);
    return response.data;
  },

  deleteTopic: async (topicId) => {
    const response = await api.delete(`/topics/${topicId}`);
    return response.data;
  },

  // Vocabulary Management
  getVocabularies: async (params = {}) => {
    const response = await api.get('vocabulary/search', { params });
    return response.data;
  },

  createVocabulary: async (vocabData) => {
    const response = await api.post('/vocabulary', vocabData);
    return response.data;
  },

  updateVocabulary: async (vocabId, vocabData) => {
    const response = await api.put(`/vocabulary/${vocabId}`, vocabData);
    return response.data;
  },

  deleteVocabulary: async (vocabId) => {
    const response = await api.delete(`/vocabulary/${vocabId}`);
    return response.data;
  },

  // User Management
  getUsers: async (params = {}) => {
    const response = await api.get('/user/admin/users', { params });
    return response.data;
  },

  getUserStatistics: async () => {
    const response = await api.get('/user/admin/users/statistics');
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/user/admin/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`/user/admin/users/${userId}`, userData);
    return response.data;
  },

  resetUserPassword: async (userId, newPassword) => {
    const response = await api.post(`/user/admin/users/${userId}/reset-password`, {
      newPassword,
    });
    return response.data;
  },
};

// Thêm module thanh toán VNPAY
export const paymentAPI = {
  createTopup: async ({ userId, amountVND, method }) => {
    const res = await api.post('/payment/create-topup', { userId, amountVND, method });
    console.log(res)
    return res.data; // { paymentUrl, orderId, amountVND, points }
  },
};

export const battleAPI = {
  // Tạo phòng
  createRoom: async () => {
    const response = await api.post('/battle/room/create');
    return response.data;
  },

  // Tham gia phòng
  joinRoom: async (roomCode) => {
    const response = await api.post('/battle/room/join', { roomCode });
    return response.data;
  },

  // Lấy thông tin phòng
  getRoom: async (roomCode) => {
    const response = await api.get(`/battle/room/${roomCode}`);
    return response.data;
  },

  // Bắt đầu game
  startGame: async (roomCode) => {
    const response = await api.post('/battle/game/start', { roomCode });
    return response.data;
  },

  // Submit câu trả lời
  submitAnswer: async (roomCode, vocabId, answer, timeSpent) => {
    const response = await api.post('/battle/game/answer', {
      roomCode,
      vocabId,
      answer,
      timeSpent
    });
    return response.data;
  },

  // Rời phòng
  leaveRoom: async (roomCode) => {
    const response = await api.post('/battle/room/leave', { roomCode });
    return response.data;
  },
};

// Thêm vào cuối file api.js
export const statisticsAPI = {
  // Lấy thống kê tổng quan hệ thống
  getSystemStatistics: async (period = 'week') => {
    const response = await api.get('/statistics/system', { params: { period } });
    return response.data;
  },

  // Lấy dữ liệu tăng trưởng người dùng
  getUserGrowth: async (period = 'week') => {
    const response = await api.get('/statistics/user-growth', { params: { period } });
    return response.data;
  },

  // Lấy phân bố hoạt động học tập
  getLearningActivity: async () => {
    const response = await api.get('/statistics/learning-activity');
    return response.data;
  },

  // Lấy top topics
  getTopTopics: async (limit = 5) => {
    const response = await api.get('/statistics/top-topics', { params: { limit } });
    return response.data;
  },

  // Lấy phân bố tiến trình học tập
  getLearningDistribution: async () => {
    const response = await api.get('/statistics/learning-distribution');
    return response.data;
  },

  // Lấy người dùng hoạt động hàng ngày
  getDailyActiveUsers: async () => {
    const response = await api.get('/statistics/daily-active');
    return response.data;
  },

  // Lấy các chỉ số nâng cao
  getAdvancedMetrics: async () => {
    const response = await api.get('/statistics/advanced-metrics');
    return response.data;
  },
};

export const audioAPI = {
  // Get audio URL for a word
  getWordAudio: async (word, language = 'en-US') => {
    const response = await api.get(`/audio/word/${word}`, {
      params: { language }
    });
    return response.data;
  },

  // Generate TTS audio
  generateTTS: async (text, options = {}) => {
    const response = await api.get('/audio/tts', {
      params: { text, ...options }
    });
    return response.data;
  },

  // Batch pre-generate audio
  batchGenerate: async (words, language = 'en-US') => {
    const response = await api.post('/audio/batch', {
      words,
      language
    });
    return response.data;
  }
};
export default api;