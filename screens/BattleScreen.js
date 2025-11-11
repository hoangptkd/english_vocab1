// screens/BattleScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Animated,
    Keyboard,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

export default function BattleScreen({ navigation }) {
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);

    const scaleAnim = new Animated.Value(1);

    const handleCreateRoom = async () => {
        setLoading(true);
        try {
            const response = await api.post('/battle/room/create');

            // Navigate to lobby
            navigation.navigate('BattleLobby', {
                roomCode: response.data.room.roomCode,
                isHost: true
            });

        } catch (error) {
            console.error('Create room error:', error);
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tạo phòng');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!roomCode.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập mã phòng');
            return;
        }

        Keyboard.dismiss();
        setLoading(true);

        try {
            const response = await api.post('/battle/room/join', {
                roomCode: roomCode.toUpperCase()
            });

            // Navigate to lobby
            navigation.navigate('BattleLobby', {
                roomCode: response.data.room.roomCode,
                isHost: false
            });

        } catch (error) {
            console.error('Join room error:', error);
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tham gia phòng');
        } finally {
            setLoading(false);
        }
    };

    const animateButton = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#667eea', '#764ba2', '#f093fb']}
                style={styles.container}
            >
                {/* Home Button */}
                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => navigation.navigate('HomeTab')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.homeButtonText}>🏠</Text>
                </TouchableOpacity>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>⚔️ THI ĐẤU ⚔️</Text>
                    <Text style={styles.headerSubtitle}>
                        Thách đấu với bạn bè ngay!
                    </Text>
                </View>

                {/* Battle Icon Animation */}
                <View style={styles.iconContainer}>
                    <Animated.View style={[
                        styles.iconWrapper,
                        { transform: [{ scale: scaleAnim }] }
                    ]}>
                        <Text style={styles.icon}>🎯</Text>
                    </Animated.View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    {/* Create Room Button */}
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => {
                            animateButton();
                            handleCreateRoom();
                        }}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#f093fb', '#f5576c']}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.createIcon}>➕</Text>
                            <Text style={styles.buttonText}>TẠO PHÒNG</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>HOẶC</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Join Room Section */}
                    <View style={styles.joinContainer}>
                        <Text style={styles.joinLabel}>Nhập mã phòng</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="VD: ABC123"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={roomCode}
                            onChangeText={setRoomCode}
                            autoCapitalize="characters"
                            maxLength={6}
                        />
                        <TouchableOpacity
                            style={styles.joinButton}
                            onPress={handleJoinRoom}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#4facfe', '#00f2fe']}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.joinIcon}>🚀</Text>
                                <Text style={styles.buttonText}>THAM GIA</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoIcon}>💡</Text>
                    <Text style={styles.infoText}>
                        Mời bạn bè bằng cách chia sẻ mã phòng!
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
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
    },
    iconContainer: {
        alignItems: 'center',
        marginVertical: 30,
    },
    iconWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    icon: {
        fontSize: 60,
    },
    actionsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    createButton: {
        borderRadius: 16,
        overflow: 'hidden',
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
        paddingHorizontal: 24,
    },
    createIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.7)',
    },
    joinContainer: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    joinLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    joinButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    joinIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    infoIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
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