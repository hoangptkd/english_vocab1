// ============= AUDIO SERVICE (UPDATED FOR EXPO-AUDIO SDK 54+) =============
// services/AudioService.js

import { Audio } from 'expo-av';
import { Directory, File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { audioAPI } from '../services/api';
import {Platform} from "react-native";
import * as FileSystem from 'expo-file-system/legacy';
// ============= CONFIGURATION =============
const CACHE_DIRECTORY = new Directory(Paths.cache, 'audio');
const PROD_API_ROOT = 'https://english-vocab-it2k.onrender.com'; // ✅ Render
const DEV_API_ROOT_ANDROID = 'http://10.0.2.2:3000';
const DEV_API_ROOT_IOS = 'http://192.168.1.7:3000'; // đổi IP LAN của bạn khi cần
const DEV_API_ROOT_WEB = 'http://localhost:3000';
const API_ROOT =
    __DEV__
        ? (Platform.OS === 'android' ? DEV_API_ROOT_ANDROID : (Platform.OS === 'ios' ? PROD_API_ROOT : DEV_API_ROOT_WEB))
        : PROD_API_ROOT;

const AUDIO_CONFIG = {
    API_BASE_URL: API_ROOT,
    CACHE: {
        maxSize: 50 * 1024 * 1024,
        maxAge: 30 * 24 * 60 * 60 * 1000,
    },
};

// ============= AUDIO SERVICE CLASS =============
class AudioService {
    constructor() {
        this.player = null;
        this.isPlaying = false;
        this.cache = new Map();
        this.cacheDirectory = CACHE_DIRECTORY; // ✅ dùng Directory object luôn
        this.initAudio();
        this.sound = null;
    }

    // Khởi tạo Audio player
    async initAudio() {
        try {
            await this.ensureCacheDirectory();
            console.log('✅ Audio service initialized');
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    // ✅ FIX: Đảm bảo thư mục cache tồn tại với URI hợp lệ
    async ensureCacheDirectory() {
        try {
            const dir = this.cacheDirectory;

            console.log('📁 Cache directory URI:', dir.uri);

            if (!dir.exists) {            // exists là property, không phải async
                dir.create();               // create() là sync
                console.log('✅ Audio cache directory created:', dir.uri);
            } else {
                console.log('✅ Audio cache directory exists:', dir.uri);
            }
        } catch (error) {
            console.error('Failed to create cache directory:', error);
            throw error;
        }
    }

    // ============= METHOD 1: Text-to-Speech =============
    async playWithTTS(text, language = 'en-US', options = {}) {
        try {
            const audioUrl = await this.generateTTSAudio(text, language, options);
            await this.playAudio(audioUrl);
        } catch (error) {
            console.error('TTS playback failed:', error);
            throw error;
        }
    }

    // Generate audio từ Backend TTS API
    async generateTTSAudio(text, language, options) {
        const cacheKey = `tts_${text}_${language}`;

        // Check cache trước
        const cachedUrl = await this.getCachedAudio(cacheKey);
        if (cachedUrl) {
            console.log('🎯 Cache hit for TTS:', text);
            return cachedUrl;
        }

        try {
            console.log('🌐 Fetching TTS from backend:', text);

            // Gọi Backend API để generate TTS
            const url = `${AUDIO_CONFIG.API_BASE_URL}/api/audio/tts?text=${encodeURIComponent(text)}&language=${language}`;

            // Download và cache
            const localUri = await this.downloadAndCache(cacheKey, url);
            return localUri;
        } catch (error) {
            console.error('TTS generation failed:', error);
            throw error;
        }
    }

    // ============= METHOD 2: Pre-recorded Audio =============
    async playPreRecorded(word, options = {}) {
        try {
            const audioUrl = await this.getPreRecordedAudio(word, options);
            await this.playAudio(audioUrl);
        } catch (error) {
            console.error('Pre-recorded playback failed:', error);
            throw error;
        }
    }

    // Lấy audio từ Backend
    async getPreRecordedAudio(word, options) {
        const normalizedWord = word.toLowerCase().replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_');
        const cacheKey = `audio_${normalizedWord}`;

        // 1. Check cache local trước
        const cachedUrl = await this.getCachedAudio(cacheKey);
        if (cachedUrl) {
            console.log("🎯 Cache hit for word:", word);
            return cachedUrl;
        }
        const response = await audioAPI.getWordAudio(word, options.language || 'en-US');
        try {
            const contentType = response.headers.get("content-type");

            console.log("📦 Content-Type:", contentType);

            // Trường hợp 1: Backend trả JSON (tức là file đã có trên S3)
            if (contentType && contentType.includes("application/json")) {
                const text = new TextDecoder().decode(response.data);
                const data = JSON.parse(text);
                if (data.url) {
                    console.log("☁️ Audio từ S3:", data.url);

                    // ✅ Tải file mp3 thật từ S3
                    const localUri = await this.downloadAndCache(cacheKey, data.url);
                    return localUri;
                }
            }

            // Trường hợp 2: Backend trả audio stream
            console.log("🎵 Backend returned raw audio stream");
            const filename = `${cacheKey}.mp3`;
            const file = new File(this.cacheDirectory, filename);
            const arrayBuffer = response.data; // chính là ArrayBuffer
            const uint8Array = new Uint8Array(arrayBuffer);
            console.log('📊 Downloaded bytes:', uint8Array.length);

            // Write file
            await file.write(uint8Array);

            console.log('✅ File written successfully');

            // Verify file exists
            if (!file.exists) {
                throw new Error('File write failed - file does not exist');
            }

            await AsyncStorage.setItem(
                `audio_meta_${cacheKey}`,
                JSON.stringify({
                    uri: file.uri,
                    timestamp: Date.now(),
                })
            );
            return file.uri;

        } catch (error) {
            console.error("Failed to get pre-recorded audio:", error);
            throw error;
        }
    }

    // ============= METHOD 3: Hybrid Approach (Smart) =============
    async playSmart(word, options = {}) {
        try {
            // 1. Thử pre-recorded trước
            await this.playPreRecorded(word, options);
        } catch (error) {
            // 2. Fallback sang TTS
            console.log('⚡ Using TTS fallback for:', word);
            // await this.playWithTTS(word, options.language || 'en-US', options);
        }
    }

    // ============= CORE PLAYBACK (UPDATED FOR EXPO-AUDIO) =============
    async playAudio(uri) {
        try {
            console.log('🔊 Playing audio:', uri);

            if (!uri || (!uri.startsWith('file://') && !uri.startsWith('http'))) {
                throw new Error(`Invalid audio URI: ${uri}`);
            }

            // Unload trước nếu đã có sound cũ
            if (this.sound) {
                await this.sound.unloadAsync();
                this.sound = null;
            }

            const { sound } = await Audio.Sound.createAsync({ uri });
            this.sound = sound;

            await this.sound.playAsync();

            this.sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    console.log('✅ Audio playback finished');
                }
            });

        } catch (error) {
            console.error('Audio playback failed:', error);
            throw error;
        }
    }

    async stop() {
        if (this.sound) {
            await this.sound.stopAsync();
            await this.sound.unloadAsync();
            this.sound = null;
        }
    }

    // ============= CACHE MANAGEMENT =============

    // Get cached audio
    async getCachedAudio(key) {
        try {
            // Lấy metadata từ AsyncStorage
            const metadata = await AsyncStorage.getItem(`audio_meta_${key}`);
            if (!metadata) return null;

            const { uri, timestamp } = JSON.parse(metadata);

            // Check expiry
            if (Date.now() - timestamp > AUDIO_CONFIG.CACHE.maxAge) {
                await this.deleteCachedAudio(key);
                return null;
            }

            // ✅ Validate URI trước khi check file
            if (!uri || !uri.startsWith('file://')) {
                console.warn('Invalid cached URI:', uri);
                await this.deleteCachedAudio(key);
                return null;
            }

            // Check file exists
            const file = new File(uri); // hoặc new File(this.cacheDirectory, `${key}.mp3`);

            if (!file.exists) {         // exists là property, không await
                await this.deleteCachedAudio(key);
                return null;
            }

            return uri;
        } catch (error) {
            console.error('Error getting cached audio:', error);
            return null;
        }
    }

    // ✅ FIX: Download and cache với URI validation
    async downloadAndCache(key, url) {
        try {
            const filename = `${key}.mp3`;

            const file = new File(this.cacheDirectory, filename);

            console.log('📥 Downloading to:', file.uri);
            console.log('🌐 From URL:', url);

            let downloadedFile;

            try {
                downloadedFile = await File.downloadFileAsync(url, file);
            } catch (err) {
                console.error('❌ File.downloadFileAsync error:', err);
                throw err; // ném lại cho catch ngoài
            }

            console.log('✅ Download complete:', downloadedFile);
            console.log('✅ Downloaded file uri:', downloadedFile.uri);

            await AsyncStorage.setItem(
                `audio_meta_${key}`,
                JSON.stringify({
                    uri: downloadedFile.uri,
                    timestamp: Date.now(),
                })
            );

            return downloadedFile.uri;
        } catch (error) {
            console.error('Error downloading audio:', error);
            throw error;
        }
    }



    // Delete cached audio
    async deleteCachedAudio(key) {
        try {
            const metadata = await AsyncStorage.getItem(`audio_meta_${key}`);
            if (metadata) {
                const { uri } = JSON.parse(metadata);

                if (uri && uri.startsWith('file://')) {
                    const file = new File(uri);

                    if (file.exists) {
                        file.delete();   // delete() sync
                        console.log('🗑️ Deleted cache:', key);
                    }
                }

                await AsyncStorage.removeItem(`audio_meta_${key}`);
            }
        } catch (error) {
            console.error('Failed to delete cached audio:', error);
        }
    }
}

// ============= SINGLETON EXPORT =============
export default new AudioService();