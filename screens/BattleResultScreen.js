// screens/BattleResultScreen.js
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    SafeAreaView,
    StatusBar,
    ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import Confetti from 'react-native-confetti';

export default function BattleResultScreen({ navigation, route }) {
    const { room, roomCode } = route.params;
    const { user } = useAuth();

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const confettiRef = useRef(null);

    const isHost = user.id === room.host._id;
    const myScore = isHost ? room.scores.host : room.scores.guest;
    const opponentScore = isHost ? room.scores.guest : room.scores.host;
    const myName = isHost ? room.host.name : room.guest.name;
    const opponentName = isHost ? room.guest.name : room.host.name;

    const isWinner = room.winner ? room.winner._id === user.id : false;
    const isDraw = !room.winner;

    useEffect(() => {
        // Animate entrance
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();

        // Show confetti if winner
        if (isWinner && confettiRef.current) {
            setTimeout(() => {
                confettiRef.current.startConfetti();
            }, 500);

            setTimeout(() => {
                confettiRef.current.stopConfetti();
            }, 4000);
        }
    }, []);

    const handlePlayAgain = () => {
        // Navigate back to Battle screen to create new room
        navigation.navigate('Battle');
    };

    const handleBackToHome = () => {
        navigation.navigate('MainTabs', { screen: 'HomeTab' });
    };

    const getResultTitle = () => {
        if (isDraw) return '🤝 HÒA!';
        if (isWinner) return '🎉 CHIẾN THẮNG!';
        return '😔 THẤT BẠI!';
    };

    const getResultSubtitle = () => {
        if (isDraw) return 'Cả hai đều chơi tuyệt vời!';
        if (isWinner) return 'Bạn đã xuất sắc!';
        return 'Đừng nản chí, cố gắng lần sau nhé!';
    };

    const getResultGradient = () => {
        if (isDraw) return ['#667eea', '#764ba2'];
        if (isWinner) return ['#11998e', '#38ef7d'];
        return ['#eb3349', '#f45c43'];
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={getResultGradient()}
                style={styles.container}
            >
                <Confetti ref={confettiRef} />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Result Header */}
                    <Animated.View style={[
                        styles.resultHeader,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}>
                        <Text style={styles.resultTitle}>{getResultTitle()}</Text>
                        <Text style={styles.resultSubtitle}>{getResultSubtitle()}</Text>
                    </Animated.View>

                    {/* Score Display */}
                    <Animated.View style={[
                        styles.scoresContainer,
                        { opacity: fadeAnim }
                    ]}>
                        {/* You */}
                        <View style={[
                            styles.playerScore,
                            isWinner && !isDraw && styles.winnerScore
                        ]}>
                            <View style={styles.playerAvatar}>
                                <Text style={styles.avatarText}>
                                    {myName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.playerName}>{myName}</Text>
                            <Text style={styles.playerLabel}>BẠN</Text>
                            <View style={styles.scoreBox}>
                                <Text style={styles.scoreNumber}>{myScore}</Text>
                                <Text style={styles.scoreLabel}>điểm</Text>
                            </View>
                            {isWinner && !isDraw && (
                                <View style={styles.crown}>
                                    <Text style={styles.crownIcon}>👑</Text>
                                </View>
                            )}
                        </View>

                        {/* VS */}
                        <View style={styles.vsContainer}>
                            <Text style={styles.vsText}>VS</Text>
                        </View>

                        {/* Opponent */}
                        <View style={[
                            styles.playerScore,
                            !isWinner && !isDraw && styles.winnerScore
                        ]}>
                            <View style={styles.playerAvatar}>
                                <Text style={styles.avatarText}>
                                    {opponentName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.playerName}>{opponentName}</Text>
                            <Text style={styles.playerLabel}>ĐỐI THỦ</Text>
                            <View style={styles.scoreBox}>
                                <Text style={styles.scoreNumber}>{opponentScore}</Text>
                                <Text style={styles.scoreLabel}>điểm</Text>
                            </View>
                            {!isWinner && !isDraw && (
                                <View style={styles.crown}>
                                    <Text style={styles.crownIcon}>👑</Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>

                    {/* Stats */}
                    <Animated.View style={[
                        styles.statsContainer,
                        { opacity: fadeAnim }
                    ]}>
                        <Text style={styles.statsTitle}>📊 Thống kê trận đấu</Text>

                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Tổng câu hỏi</Text>
                            <Text style={styles.statValue}>{room.vocabularies.length}</Text>
                        </View>

                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Câu trả lời đúng</Text>
                            <Text style={styles.statValue}>
                                {room.answers.filter(a =>
                                    a.userId.toString() === user.id && a.isCorrect
                                ).length}
                            </Text>
                        </View>

                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Độ chính xác</Text>
                            <Text style={styles.statValue}>
                                {Math.round(
                                    (room.answers.filter(a =>
                                        a.userId.toString() === user.id && a.isCorrect
                                    ).length / room.vocabularies.length) * 100
                                )}%
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Action Buttons */}
                    <Animated.View style={[
                        styles.actionsContainer,
                        { opacity: fadeAnim }
                    ]}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handlePlayAgain}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonIcon}>🔄</Text>
                                <Text style={styles.buttonText}>CHƠI LẠI</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleBackToHome}
                        >
                            <Text style={styles.secondaryButtonText}>
                                🏠 Về trang chủ
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Motivational Message */}
                    <Animated.View style={[
                        styles.messageBox,
                        { opacity: fadeAnim }
                    ]}>
                        <Text style={styles.messageIcon}>
                            {isWinner ? '🌟' : '💪'}
                        </Text>
                        <Text style={styles.messageText}>
                            {isWinner
                                ? 'Xuất sắc! Tiếp tục duy trì phong độ này nhé!'
                                : 'Học từ vựng mỗi ngày sẽ giúp bạn tiến bộ nhanh hơn!'
                            }
                        </Text>
                    </Animated.View>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 40,
    },
    resultHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    resultTitle: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        marginBottom: 8,
    },
    resultSubtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.95)',
    },
    scoresContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 30,
    },
    playerScore: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        minWidth: 140,
    },
    winnerScore: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderColor: '#FFD700',
        borderWidth: 3,
        transform: [{ scale: 1.05 }],
    },
    playerAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    playerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    playerLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 12,
    },
    scoreBox: {
        alignItems: 'center',
    },
    scoreNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    scoreLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    crown: {
        position: 'absolute',
        top: -10,
        right: 10,
    },
    crownIcon: {
        fontSize: 32,
    },
    vsContainer: {
        marginHorizontal: 10,
    },
    vsText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    statsContainer: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
        textAlign: 'center',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.2)',
    },
    statLabel: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    actionsContainer: {
        marginBottom: 20,
    },
    primaryButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
    },
    buttonIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    secondaryButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    messageBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    messageIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    messageText: {
        flex: 1,
        fontSize: 14,
        color: 'rgba(255,255,255,0.95)',
        lineHeight: 20,
    },
});