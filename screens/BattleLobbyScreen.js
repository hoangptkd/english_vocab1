// screens/BattleLobbyScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Animated,
    SafeAreaView,
    StatusBar,
    Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import api from '../services/api';

export default function BattleLobbyScreen({ navigation, route }) {
    const { roomCode, isHost } = route.params;
    const { user } = useAuth();
    const { socket } = useWebSocket();

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);

    const pulseAnim = new Animated.Value(1);
    const waitingAnim = new Animated.Value(0);

    useEffect(() => {
        loadRoom();
        setupSocketListeners();

        return () => {
            cleanupSocketListeners();
        };
    }, []);

    useEffect(() => {
        if (room && !room.guest) {
            // Animate waiting indicator
            Animated.loop(
                Animated.sequence([
                    Animated.timing(waitingAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(waitingAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [room]);

    const loadRoom = async () => {
        try {
            const response = await api.get(`/battle/room/${roomCode}`);
            setRoom(response.data.room);
            setLoading(false);
        } catch (error) {
            console.error('Load room error:', error);
            Alert.alert('Lỗi', 'Không thể tải thông tin phòng');
            navigation.goBack();
        }
    };

    const setupSocketListeners = () => {
        if (!socket) return;

        socket.on('room:guest_joined', (data) => {
            console.log('Guest joined:', data);
            console.log('Guest data:', data.room.guest);

            // ✅ Update state với data mới
            setRoom(data.room);

            // ✅ Log để kiểm tra state sau khi update
            console.log('Room after update:', data.room);
            console.log('Has guest?', !!data.room.guest);
            // Animate pulse effect
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start()
        });

        socket.on('room:guest_left', () => {
            Alert.alert('Thông báo', 'Người chơi đã rời phòng');
            loadRoom();
        });

        socket.on('room:closed', (data) => {
            Alert.alert('Thông báo', data.message, [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        });

        socket.on('game:started', (data) => {
            navigation.replace('BattleGame', {
                roomCode,
                room: data.room
            });
        });
    };

    const cleanupSocketListeners = () => {
        if (!socket) return;
        socket.off('room:guest_joined');
        socket.off('room:guest_left');
        socket.off('room:closed');
        socket.off('game:started');
    };

    const handleStartGame = async () => {
        if (!room?.guest) {
            Alert.alert('Thông báo', 'Cần có đủ 2 người chơi');
            return;
        }

        try {
            await api.post('/battle/game/start', { roomCode });
            // Navigation handled by socket event
        } catch (error) {
            console.error('Start game error:', error);
            Alert.alert('Lỗi', 'Không thể bắt đầu game');
        }
    };

    const handleBackHome = async () => {
        try {
            await api.post('/battle/room/leave', {roomCode});
            navigation.navigate('MainTabs', { screen: 'HomeTab' });
        } catch (error) {
            console.error('Leave room error:', error);
        }
    };

    const handleLeaveRoom = () => {
        Alert.alert(
            'Xác nhận',
            'Bạn có chắc muốn rời phòng?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Rời phòng',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post('/battle/room/leave', { roomCode });
                            navigation.goBack();
                        } catch (error) {
                            console.error('Leave room error:', error);
                        }
                    }
                }
            ]
        );
    };

    const handleShareRoom = async () => {
        try {
            await Share.share({
                message: `Tham gia phòng thi đấu của tôi!\nMã phòng: ${roomCode}`,
                title: 'Mời thi đấu'
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    if (loading || !room) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    const canStart = isHost && room.guest;
// Thêm trước phần return
    console.log('=== RENDER DEBUG ===');
    console.log('room:', room);
    console.log('room.guest:', room?.guest);
    console.log('Has guest?', !!room?.guest);
    console.log('==================');
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.container}
            >
                {/* Home Button */}
                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={handleBackHome}
                    activeOpacity={0.7}
                >
                    <Text style={styles.homeButtonText}>🏠</Text>
                </TouchableOpacity>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>PHÒNG CHỜ</Text>
                    <View style={styles.roomCodeContainer}>
                        <Text style={styles.roomCodeLabel}>MÃ PHÒNG</Text>
                        <Text style={styles.roomCode}>{roomCode}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={handleShareRoom}
                    >
                        <Text style={styles.shareIcon}>📤</Text>
                        <Text style={styles.shareText}>Chia sẻ</Text>
                    </TouchableOpacity>
                </View>

                {/* Players */}
                <View style={styles.playersContainer}>
                    {/* Host Player */}
                    <Animated.View style={[
                        styles.playerCard,
                        { transform: [{ scale: pulseAnim }] }
                    ]}>
                        <LinearGradient
                            colors={['#f093fb', '#f5576c']}
                            style={styles.playerGradient}
                        >
                            <View style={styles.crownContainer}>
                                <Text style={styles.crown}>👑</Text>
                            </View>
                            <View style={styles.avatarContainer}>
                                <Text style={styles.avatar}>
                                    {room.host?.name?.charAt(0).toUpperCase() || '?'}
                                </Text>
                            </View>
                            <Text style={styles.playerName}>
                                {room.host?.name || 'Host'}
                            </Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>CHỦ PHÒNG</Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* VS */}
                    <View style={styles.vsContainer}>
                        <Text style={styles.vsText}>VS</Text>
                    </View>

                    {/* Guest Player */}
                    {room.guest ? (
                        <Animated.View
                            key={room.guest._id}  // ✅ Thêm key này
                            style={[
                                styles.playerCard,
                                { transform: [{ scale: pulseAnim }] }
                            ]}
                        >
                            <LinearGradient
                                colors={['#4facfe', '#00f2fe']}
                                style={styles.playerGradient}
                            >
                                <View style={styles.avatarContainer}>
                                    <Text style={styles.avatar}>
                                        {room.guest?.name?.charAt(0).toUpperCase() || '?'}
                                    </Text>
                                </View>
                                <Text style={styles.playerName}>
                                    {room.guest?.name || 'Guest'}
                                </Text>
                                <View style={[styles.badge, { backgroundColor: '#4facfe' }]}>
                                    <Text style={styles.badgeText}>THÁCH ĐẤU</Text>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    ) : (
                        <Animated.View style={[
                            styles.playerCard,
                            styles.emptyCard,
                            {
                                opacity: waitingAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5, 1]
                                })
                            }
                        ]}>
                            <Text style={styles.waitingIcon}>⏳</Text>
                            <Text style={styles.waitingText}>Đang chờ...</Text>
                        </Animated.View>
                    )}

                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    {canStart ? (
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={handleStartGame}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#11998e', '#38ef7d']}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.startIcon}>🚀</Text>
                                <Text style={styles.buttonText}>BẮT ĐẦU</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.disabledButton}>
                            <Text style={styles.disabledText}>
                                {isHost ? 'Chờ người chơi thứ 2...' : 'Chờ chủ phòng bắt đầu...'}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.leaveButton}
                        onPress={handleLeaveRoom}
                    >
                        <Text style={styles.leaveText}>Rời phòng</Text>
                    </TouchableOpacity>
                </View>

                {/* Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.infoIcon}>💡</Text>
                    <Text style={styles.infoText}>
                        Game sẽ bắt đầu với 10 câu hỏi. Trả lời nhanh để được điểm cao hơn!
                    </Text>
                </View>
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
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#667eea',
    },
    loadingText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 20,
    },
    roomCodeContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    roomCodeLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 4,
    },
    roomCode: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 4,
        textAlign: 'center',
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 12,
    },
    shareIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    shareText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    playersContainer: {
        flexDirection: 'row',  // Sửa từ column thành row
        justifyContent: 'space-between',  // Đảm bảo các thẻ được phân bố đều
        alignItems: 'center',
        marginVertical: 10,  // Giữ khoảng cách giữa các thẻ
    },
    playerCard: {
        width: '45%',  // Điều chỉnh chiều rộng của mỗi thẻ (48% thay vì 50% để có khoảng trống giữa các thẻ)
        height: 160,   // Giữ chiều cao thẻ
        borderRadius: 20,
        overflow: 'hidden',
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    playerGradient: {
        flex: 1,              // ✅ THÊM dòng này
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',  // ✅ THÊM để căn giữa theo chiều dọc
    },
    crownContainer: {
        position: 'absolute',
        top: -10,
        right: 20,
    },
    crown: {
        fontSize: 32,
    },
    avatarContainer: {
        width: 60, // Giảm kích thước avatar
        height: 60, // Giảm kích thước avatar
        borderRadius: 30, // Vẫn giữ dạng tròn
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8, // Giảm khoảng cách
        borderWidth: 2,  // Giảm độ dày border
        borderColor: 'rgba(255,255,255,0.5)',
    },

    playerName: {
        fontSize: 16, // Giảm kích thước font cho tên
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4, // Giảm khoảng cách dưới tên
    },

    badge: {
        backgroundColor: '#f5576c',
        borderRadius: 12,
        paddingVertical: 4, // Giảm padding
        paddingHorizontal: 12, // Giảm padding
    },
    avatar: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    emptyCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        borderStyle: 'dashed',
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        width: '45%',  // Giữ cùng kích thước với các thẻ player khác
        height: 160,
    },
    waitingIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    waitingText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
    },
    vsContainer: {
        marginVertical: 10,
        alignItems: 'center',  // Căn giữa chữ "VS"
    },
    vsText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    actionsContainer: {
        marginTop: 20,
    },
    startButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 12,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
    },
    startIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    disabledButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginBottom: 12,
    },
    disabledText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
    },
    leaveButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.5)',
    },
    leaveText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 12,
        marginTop: 20,
    },
    infoIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
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