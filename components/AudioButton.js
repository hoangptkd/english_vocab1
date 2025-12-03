// ============= AUDIO BUTTON COMPONENT (UPDATED FOR EXPO-AUDIO) =============
// components/AudioButton.js

import React, { useState } from 'react';
import {
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AudioService from '../services/AudioService';
import audioService from "../services/AudioService";
import { detectLanguage } from '../utils/languageUtils'; // Import hàm trên
// ============= AUDIO BUTTON COMPONENT =============
export const AudioButton = ({
                                word,
                                language,
                                size = 'medium',
                                autoPlay = false,
                                style,
                                onPlayStart,
                                onPlayEnd,
                                onError,
                            }) => {
    const targetLanguage = language || detectLanguage(word);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const scaleAnim = React.useRef(new Animated.Value(1)).current;
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        if (autoPlay) {
            handlePlay();
        }
    }, [autoPlay, word]);

    React.useEffect(() => {
        if (isPlaying) {
            // Tạo hiệu ứng pulse khi đang phát
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isPlaying]);

    const handlePlay = async () => {

        if (isPlaying || isLoading) return;

        try {
            setIsLoading(true);
            onPlayStart?.();

            // Animation khi nhấn
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            setIsPlaying(true);

            // ✅ Phát âm thanh với expo-audio
            await AudioService.playSmart(word, { language: targetLanguage });

            // Delay để đồng bộ với thời gian phát
            setTimeout(() => {
                setIsPlaying(false);
                onPlayEnd?.();
            }, 1500);

        } catch (error) {
            console.error('Audio playback error:', error);
            onError?.(error);
            setIsPlaying(false);
        } finally {
            setIsLoading(false);
        }
    };

    const sizes = {
        small: { buttonSize: 32, iconSize: 18 },
        medium: { buttonSize: 48, iconSize: 24 },
        large: { buttonSize: 64, iconSize: 32 },
    };

    const currentSize = sizes[size] || sizes.medium;

    return (
        <Animated.View
            style={[
                { transform: [{ scale: scaleAnim }] },
                style,
            ]}
        >
            <TouchableOpacity
                style={[
                    styles.button,
                    {
                        width: currentSize.buttonSize,
                        height: currentSize.buttonSize,
                    },
                    isPlaying && styles.buttonPlaying,
                ]}
                onPress={handlePlay}
                disabled={isPlaying || isLoading}
                activeOpacity={0.7}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                    <Animated.View
                        style={{
                            transform: [{ scale: isPlaying ? pulseAnim : 1 }],
                        }}
                    >
                        <Ionicons
                            name={isPlaying ? 'volume-high' : 'volume-medium-outline'}
                            size={currentSize.iconSize}
                            color={isPlaying ? '#FFFFFF' : '#4F46E5'}
                        />
                    </Animated.View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

// ============= INLINE AUDIO TEXT =============
export const AudioText = ({
                              word,
                              language = 'en-US',
                              children,
                              textStyle,
                              audioIconSize = 20,
                          }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlay = async () => {
        if (isPlaying) return;

        setIsPlaying(true);
        try {
            await AudioService.playSmart(word, { language });
        } catch (error) {
            console.error('Audio error:', error);
        }

        setTimeout(() => setIsPlaying(false), 1500);
    };

    return (
        <View style={styles.audioTextContainer}>
            <Text style={[styles.audioText, textStyle]}>{children}</Text>
            <TouchableOpacity onPress={handlePlay} disabled={isPlaying}>
                <Ionicons
                    name={isPlaying ? 'volume-high' : 'volume-medium-outline'}
                    size={audioIconSize}
                    color={isPlaying ? '#4F46E5' : '#6B7280'}
                    style={styles.audioIcon}
                />
            </TouchableOpacity>
        </View>
    );
};

// ============= AUTO-PLAY AUDIO =============
export const AutoPlayAudio = ({ word, language, delay = 0 }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            AudioService.playSmart(word, { language }).catch(console.error);
        }, delay);

        return () => clearTimeout(timer);
    }, [word, language, delay]);

    return null;
};

export const AutoDownloadAudio = ({ word, language = 'en-US' }) => {
    React.useEffect(() => {
        const preloadAudio = async () => {
            try {
                console.log('🔽 Pre-downloading audio:', word);
                // Chỉ tải về cache, không phát
                await AudioService.getPreRecordedAudio(word, { language });
            } catch (error) {
                console.log('⚠️ Pre-download failed, will use TTS on demand:', error.message);
            }
        };

        preloadAudio();
    }, [word, language]);

    return null;
};

// ============= STYLES =============
const styles = StyleSheet.create({
    button: {
        backgroundColor: '#EEF2FF',
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonPlaying: {
        backgroundColor: '#4F46E5',
        shadowColor: '#4F46E5',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    audioTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    audioText: {
        fontSize: 16,
        color: '#1F2937',
    },
    audioIcon: {
        marginLeft: 4,
    },
});