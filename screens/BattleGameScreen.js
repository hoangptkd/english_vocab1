// screens/BattleGameScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    SafeAreaView,
    StatusBar,
    Alert, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import api from '../services/api';

export default function BattleGameScreen({ navigation, route }) {
    const { roomCode, room: initialRoom } = route.params;
    const { user } = useAuth();
    const { socket } = useWebSocket();

    const [room, setRoom] = useState(initialRoom);
    const [phase, setPhase] = useState('preparing'); // 'preparing', 'playing'
    const [prepareTimer, setPrepareTimer] = useState(initialRoom.settings.prepareTime);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [timeLeft, setTimeLeft] = useState(initialRoom.settings.timePerQuestion);
    const [startTime, setStartTime] = useState(null);
    const [opponentAnswered, setOpponentAnswered] = useState(false);

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        setupSocketListeners();
        return () => cleanupSocketListeners();
    }, []);

    useEffect(() => {
        if (phase === 'preparing') {
            const timer = setInterval(() => {
                setPrepareTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        startPlaying();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [phase]);

    useEffect(() => {
        if (phase === 'playing' && !showResult) {
            setStartTime(Date.now());
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleTimeout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [phase, showResult, currentQuestion]);

    const setupSocketListeners = () => {
        if (!socket) return;

        // ✅ Nhận điểm mới NGAY LẬP TỨC
        socket.on('game:score_updated', (data) => {
            console.log('Score updated:', data);
            setRoom(prevRoom => ({
                ...prevRoom,
                scores: data.scores
            }));
        });

        socket.on('game:opponent_answered', (data) => {
            console.log('Opponent answered:', data);
            setOpponentAnswered(true);
        });

        socket.on('game:next_question', (data) => {
            console.log('Next question:', data);
            setRoom(data.room);
            moveToNextQuestion(data.questionIndex);
        });

        socket.on('game:finished', (data) => {
            console.log('Game finished:', data);
            navigation.replace('BattleResult', {
                room: data.room,
                roomCode
            });
        });
    };

    const cleanupSocketListeners = () => {
        if (!socket) return;
        socket.off('game:opponent_answered');
        socket.off('game:next_question');
        socket.off('game:finished');
    };

    const startPlaying = () => {
        setPhase('playing');
        setTimeLeft(room.settings.timePerQuestion);
    };

    const handleAnswerSelect = async (answer) => {
        if (showResult || selectedAnswer) return;

        const currentVocab = room.vocabularies[currentQuestion];
        const timeSpent = Date.now() - startTime;

        setSelectedAnswer(answer);
        setShowResult(true);

        const isCorrect = answer === currentVocab.vocabId.meaning;

        // Animate result
        if (isCorrect) {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.95,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1.05,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }

        // Submit answer to server
        try {
            await api.post('/battle/game/answer', {
                roomCode,
                vocabId: currentVocab.vocabId._id,
                answer,
                timeSpent
            });
        } catch (error) {
            console.error('Submit answer error:', error);
            Alert.alert('Lỗi', 'Không thể gửi câu trả lời');
        }
    };

    const handleTimeout = async () => {
        if (showResult || selectedAnswer) return;

        const currentVocab = room.vocabularies[currentQuestion];
        const timeSpent = room.settings.timePerQuestion * 1000;

        setShowResult(true);

        // Submit wrong answer
        try {
            await api.post('/battle/game/answer', {
                roomCode,
                vocabId: currentVocab.vocabId._id,
                answer: '',
                timeSpent
            });
        } catch (error) {
            console.error('Submit timeout error:', error);
        }
    };

    const moveToNextQuestion = (nextIndex) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setCurrentQuestion(nextIndex);
            setSelectedAnswer(null);
            setShowResult(false);
            setOpponentAnswered(false);
            setTimeLeft(room.settings.timePerQuestion);
            fadeAnim.setValue(1);
            progressAnim.setValue(nextIndex / room.vocabularies.length);
        });
    };

    const getOptionStyle = (option) => {
        if (!showResult) {
            return selectedAnswer === option ? styles.optionSelected : styles.option;
        }

        const currentVocab = room.vocabularies[currentQuestion];
        if (option === currentVocab.vocabId.meaning) {
            return styles.optionCorrect;
        }
        if (option === selectedAnswer) {
            return styles.optionWrong;
        }
        return styles.optionDisabled;
    };

    // Preparing Phase
    if (phase === 'preparing') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" />
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.container}
                >
                    <ScrollView
                        contentContainerStyle={styles.prepareContainer} // Đảm bảo cuộn được
                        showsVerticalScrollIndicator={false} // Tắt thanh cuộn
                    >
                        {/* Home Button */}
                        <TouchableOpacity
                            style={styles.homeButton}
                            onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.homeButtonText}>🏠</Text>
                        </TouchableOpacity>
                        <View style={styles.prepareContainer}>
                            <Text style={styles.prepareTitle}>
                                📚 CHUẨN BỊ
                            </Text>
                            <Text style={styles.prepareSubtitle}>
                                Ghi nhớ 10 từ sau trong {prepareTimer} giây
                            </Text>

                            <Animated.View style={styles.timerCircle}>
                                <Text style={styles.timerText}>{prepareTimer}</Text>
                            </Animated.View>

                            <View style={styles.vocabList}>
                                {room.vocabularies.map((item, index) => (
                                    <View key={index} style={styles.vocabItem}>
                                        <View style={styles.vocabNumber}>
                                            <Text style={styles.vocabNumberText}>{index + 1}</Text>
                                        </View>
                                        <View style={styles.vocabContent}>
                                            <Text style={styles.vocabWord}>
                                                {item.vocabId.word}
                                            </Text>
                                            <Text style={styles.vocabMeaning}>
                                                {item.vocabId.meaning}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    // Playing Phase
    const currentVocab = room.vocabularies[currentQuestion];
    const progress = ((currentQuestion + 1) / room.vocabularies.length) * 100;

    const isHost = user.id === room.host._id;
    const myScore = isHost ? room.scores.host : room.scores.guest;
    const opponentScore = isHost ? room.scores.guest : room.scores.host;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.container}
            >
                {/* Header with scores */}
                <View style={styles.gameHeader}>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreLabel}>BẠN</Text>
                        <Text style={styles.scoreValue}>{myScore}</Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <Text style={styles.questionNumber}>
                            {currentQuestion + 1}/{room.vocabularies.length}
                        </Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                    </View>

                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreLabel}>ĐỐI THỦ</Text>
                        <Text style={styles.scoreValue}>{opponentScore}</Text>
                        {opponentAnswered && (
                            <Text style={styles.opponentStatus}>✓</Text>
                        )}
                    </View>
                </View>

                {/* Timer */}
                <View style={styles.timerContainer}>
                    <View style={[
                        styles.timerBar,
                        timeLeft <= 5 && styles.timerBarDanger
                    ]}>
                        <Animated.View style={[
                            styles.timerBarFill,
                            {
                                width: `${(timeLeft / room.settings.timePerQuestion) * 100}%`
                            }
                        ]} />
                    </View>
                    <Text style={styles.timerLabel}>{timeLeft}s</Text>
                </View>

                {/* Question */}
                <Animated.View style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }]
                    }
                ]}>
                    <View style={styles.questionCard}>
                        <Text style={styles.questionLabel}>Nghĩa của từ này là gì?</Text>
                        <Text style={styles.wordText}>
                            {currentVocab.vocabId.word}
                        </Text>
                        {currentVocab.vocabId.pronunciation && (
                            <Text style={styles.phonetic}>
                                {currentVocab.vocabId.pronunciation}
                            </Text>
                        )}
                    </View>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {currentVocab.options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={getOptionStyle(option)}
                                onPress={() => handleAnswerSelect(option)}
                                disabled={showResult}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.optionLetter}>
                                    {String.fromCharCode(65 + index)}
                                </Text>
                                <Text style={styles.optionText}>{option}</Text>
                                {showResult && option === currentVocab.vocabId.meaning && (
                                    <Text style={styles.checkIcon}>✓</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#667eea',
    },
    container: {
        flex: 1,
    },
    prepareContainer: {
        flex: 1,
        padding: 20,
        paddingTop: 40,
    },
    prepareTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    prepareSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 30,
    },
    timerCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 30,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    timerText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    vocabList: {
        flex: 1,
    },
    vocabItem: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        alignItems: 'center',
    },
    vocabNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    vocabNumberText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    vocabContent: {
        flex: 1,
    },
    vocabWord: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    vocabMeaning: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    gameHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    scoreContainer: {
        alignItems: 'center',
    },
    scoreLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    opponentStatus: {
        fontSize: 16,
        color: '#4ade80',
        marginTop: 2,
    },
    progressContainer: {
        flex: 1,
        marginHorizontal: 20,
    },
    questionNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 6,
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4ade80',
        borderRadius: 3,
    },
    timerContainer: {
        padding: 16,
    },
    timerBar: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    timerBarDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
    },
    timerBarFill: {
        height: '100%',
        backgroundColor: '#4ade80',
    },
    timerLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    questionCard: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    questionLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    wordText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    phonetic: {
        fontSize: 18,
        color: '#6B7280',
    },
    optionsContainer: {
        gap: 12,
    },
    option: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionSelected: {
        flexDirection: 'row',
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4F46E5',
    },
    optionCorrect: {
        flexDirection: 'row',
        backgroundColor: '#D1FAE5',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#10B981',
    },
    optionWrong: {
        flexDirection: 'row',
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#EF4444',
    },
    optionDisabled: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        opacity: 0.6,
    },
    optionLetter: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6B7280',
        marginRight: 12,
        width: 24,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    checkIcon: {
        fontSize: 24,
        color: '#10B981',
        fontWeight: 'bold',
    },
    homeButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 10,
        borderRadius: 50,
        zIndex: 999,
    },
    homeButtonText: {
        fontSize: 24,
        color: '#fff',
    },
});