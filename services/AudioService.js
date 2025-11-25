// ============= AUDIO SERVICE (UPDATED FOR EXPO-AUDIO SDK 54+) =============
// services/AudioService.js

import { Audio } from 'expo-av';
import { Directory, File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from "react-native";

// ============= CONFIGURATION =============
const CACHE_DIRECTORY = new Directory(Paths.cache, 'audio');

const AUDIO_CONFIG = {
    API_BASE_URL: 'http://10.0.2.2:3000',
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
        const normalizedWord = word.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const cacheKey = `audio_${normalizedWord}`;

        // 1. Check cache local trước
        const cachedUrl = await this.getCachedAudio(cacheKey);
        if (cachedUrl) {
            console.log("🎯 Cache hit for word:", word);
            return cachedUrl;
        }

        const apiUrl = `${AUDIO_CONFIG.API_BASE_URL}/api/audio/word/${word}?language=${options.language || 'en-US'}`;

        try {
            const response = await fetch(apiUrl);
            const contentType = response.headers.get("content-type");

            console.log("📦 Content-Type:", contentType);

            // Trường hợp 1: Backend trả JSON (tức là file đã có trên S3)
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();

                if (data.url) {
                    console.log("☁️ Audio từ S3:", data.url);

                    // ✅ Tải file mp3 thật từ S3
                    const localUri = await this.downloadAndCache(cacheKey, data.url);
                    return localUri;
                }
            }

            // Trường hợp 2: Backend trả audio stream
            console.log("🎵 Backend returned raw audio stream");
            const localUri = await this.downloadAndCache(cacheKey, apiUrl);
            return localUri;

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

    // Dừng phát
    async stop() {
        if (this.player) {
            await this.player.pause();
            await this.player.remove();
            this.player = null;
            this.isPlaying = false;
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

    // Cleanup old cache
    async cleanupCache() {
        try {
            const dir = this.cacheDirectory;
            if (!dir.exists) return;

            const items = dir.list(); // sync
            let totalSize = 0;
            const fileInfos = [];

            for (const item of items) {
                if (item instanceof File) {
                    totalSize += item.size;
                    fileInfos.push({
                        file: item,
                        size: item.size,
                        modificationTime: item.modificationTime,
                    });
                }
            }

            if (totalSize > AUDIO_CONFIG.CACHE.maxSize) {
                fileInfos.sort((a, b) => a.modificationTime - b.modificationTime);

                let freedSize = 0;
                const targetSize = AUDIO_CONFIG.CACHE.maxSize * 0.8;

                for (const info of fileInfos) {
                    if (totalSize - freedSize <= targetSize) break;
                    info.file.delete();
                    freedSize += info.size;
                    console.log(`🗑️ Deleted old cache: ${info.file.uri}`);
                }

                console.log(`✅ Cache cleanup done. Freed ${(freedSize / 1024 / 1024).toFixed(2)}MB`);
            }
        } catch (error) {
            console.error('Cache cleanup failed:', error);
        }
    }

    // Get cache stats
    async getCacheStats() {
        try {
            const dir = this.cacheDirectory;
            if (!dir.exists) return;

            const files = await dir.list();
            let totalSize = 0;

            for (const filename of files) {
                const fileUri = `${dirUri}${filename}`;
                const file = new FileSystem.File(fileUri);

                const fileExists = await file.exists();
                if (!fileExists) continue;

                const info = await file.getInfo();
                totalSize += info.size;
            }

            return {
                files: files.length,
                totalSize,
                totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            };
        } catch (error) {
            console.error('Error getting cache stats:', error);
            return { files: 0, totalSize: 0, totalSizeMB: 0 };
        }
    }

    // Clear all cache
    async clearAllCache() {
        try {
            const dir = this.cacheDirectory;
            if (!dir.exists) return;

            // Delete entire directory and recreate
            await dir.delete();
            await dir.create();

            // Clear all metadata from AsyncStorage
            const keys = await AsyncStorage.getAllKeys();
            const audioKeys = keys.filter(key => key.startsWith('audio_meta_'));
            await AsyncStorage.multiRemove(audioKeys);

            console.log('✅ All cache cleared');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}

// ============= SINGLETON EXPORT =============
export default new AudioService();