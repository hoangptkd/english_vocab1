import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image, Modal, Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import { decode } from 'html-entities'; // hoặc dùng decodeURIComponent
import { useAuth } from '../contexts/AuthContext';
import { learningAPI } from '../services/api';
import { paymentAPI, authAPI } from '../services/api';
import {useWebSocket} from "../contexts/WebSocketContext"; // <-- thêm import
export default function ProfileScreen({ navigation }) {
    const { user } = useAuth();
    const { isConnected, lastPaymentNotification, clearPaymentNotification } = useWebSocket();
    const [stats, setStats] = useState({
        totalWords: 0,
        masteredWords: 0,
        currentStreak: 0,
    });
    const [webUrl, setWebUrl] = useState(null);     // URL thanh toán
    const [showPay, setShowPay] = useState(false);  // modal WebView mở thanh toán
    const [method, setMethod] = useState('qr');     // mặc định QR
    const [points, setPoints] = useState(user?.totalPoints || 0); // hiển thị sống
    const [showPaymentNotification, setShowPaymentNotification] = useState(false);

    // 🔥 Lắng nghe payment notification từ WebSocket
    useEffect(() => {
        if (lastPaymentNotification) {
            console.log('📬 New payment notification:', lastPaymentNotification);

            // Hiển thị notification
            setShowPaymentNotification(true);

            // Tự động ẩn sau 5 giây và clear notification
            const timer = setTimeout(() => {
                setShowPaymentNotification(false);
                // 🔥 Clear notification để tránh hiển thị lại
                clearPaymentNotification();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [lastPaymentNotification]);

    useEffect(() => {
        loadStats();
    }, []);
    useEffect(() => {
        setPoints(user?.totalPoints || 0);
    }, [user]);
    const loadStats = async () => {
        try {
            const data = await learningAPI.getStats();
            setStats(data);
        } catch (error) {
            console.error('Không thể tải thống kê:', error);
        }
    };

    // Mở thanh toán VNPAY
    const handleTopup = async (amountVND = 20000) => {
        try {
            const { vnpUrl } = await paymentAPI.createTopup({
                userId: user.id,
                amountVND,
                method, // 'qr' | 'atm' | 'int'
            });
            // Decode URL để tránh double-encoding
            const decodedUrl = decodeURIComponent(vnpUrl);

            console.log('Original URL:', vnpUrl);
            console.log('Decoded URL:', decodedUrl);

            setWebUrl(decodedUrl);
            setShowPay(true);
        } catch (e) {
            console.error(e);
            alert('Không thể tạo giao dịch nạp điểm.');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };
    const achievements = [
        {
            id: 1,
            icon: '📚',
            title: 'Sổ tay cấp độ 1',
            progress: stats.totalWords,
            total: 100,
            color: '#FCD34D',
        },
        {
            id: 2,
            icon: '🏆',
            title: 'Siêu trí nhớ cấp độ 1',
            progress: stats.masteredWords,
            total: 100,
            color: '#F59E0B',
        },
        {
            id: 3,
            icon: '🌱',
            title: 'Bạn đã học tập chăm chỉ',
            days: stats.currentStreak,
            color: '#10B981',
        },
    ];

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.closeIcon}>✕</Text>
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Tài khoản</Text>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </TouchableOpacity>
                </View>

                {/* 🔥 Payment Success Notification */}
                {showPaymentNotification && lastPaymentNotification && (
                    <View style={styles.notificationBanner}>
                        <View style={styles.notificationContent}>
                            <Text style={styles.notificationIcon}>
                                {lastPaymentNotification.pointsAdded ? '🎉' : '❌'}
                            </Text>
                            <View style={styles.notificationText}>
                                <Text style={styles.notificationTitle}>
                                    {lastPaymentNotification.message}
                                </Text>
                                {lastPaymentNotification.success && lastPaymentNotification.pointsAdded && (
                                    <Text style={styles.notificationDetails}>
                                        +{lastPaymentNotification.pointsAdded} điểm •
                                        {formatCurrency(lastPaymentNotification.amountVND)}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowPaymentNotification(false)}
                            style={styles.notificationClose}
                        >
                            <Text style={styles.notificationCloseText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarIcon}>
                                {user?.role === 'admin'
                                    ? '🦊' // icon cho admin
                                    : user?.role === 'premium'
                                        ? '🐉' // icon cho premium
                                        : '🐥'} // icon cho free
                            </Text>
                        </View>

                        <View style={styles.premiumBadge}>
                            <Text style={styles.premiumText}>
                                {user?.role === 'admin'
                                    ? 'Admin account'
                                    : user?.role === 'premium'
                                        ? 'Premium account'
                                        : 'Free account'}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
                    {/* Tổng điểm */}
                    <View style={styles.pointsCard}>
                        <Text style={styles.pointsLabel}>Tổng điểm</Text>
                        <Text style={styles.pointsValue}>{points}</Text>
                    </View>
                </View>

                {/* Premium Banner */}
                <View style={styles.premiumBanner}>
                    <View style={styles.premiumContent}>
                        <Text style={styles.premiumTitle}>MochiVocab Premium</Text>
                        <Text style={styles.premiumSubtitle}>
                            Tài khoản của bạn <Text style={styles.premiumExpired}>đã hết hạn</Text> gia
                            hạn để tiếp tục học bạn nhé
                        </Text>
                        <TouchableOpacity style={styles.premiumButton}>
                            <Text style={styles.premiumButtonText}>Gia hạn ngay</Text>
                        </TouchableOpacity>
                    </View>
                    <Image
                        source={{ uri: 'https://via.placeholder.com/120x120' }}
                        style={styles.premiumIllustration}
                    />
                </View>
                {/* Top-up (Nạp điểm) */}
                <View style={styles.topupSection}>
                    <Text style={styles.sectionTitle}>Nạp điểm (VNPAY)</Text>

                    {/* Chọn phương thức */}
                    <View style={styles.methodRow}>
                        <TouchableOpacity
                            onPress={() => setMethod('qr')}
                            style={[styles.methodBtn, method === 'qr' && styles.methodBtnActive]}
                        >
                            <Text style={[styles.methodText, method === 'qr' && styles.methodTextActive]}>QR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setMethod('atm')}
                            style={[styles.methodBtn, method === 'atm' && styles.methodBtnActive]}
                        >
                            <Text style={[styles.methodText, method === 'atm' && styles.methodTextActive]}>Thẻ ATM</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setMethod('int')}
                            style={[styles.methodBtn, method === 'int' && styles.methodBtnActive]}
                        >
                            <Text style={[styles.methodText, method === 'int' && styles.methodTextActive]}>Thẻ quốc tế</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Gói nạp nhanh */}
                    <View style={styles.packRow}>
                        <TouchableOpacity style={[styles.packBtn, {backgroundColor: '#F59E0B'}]} onPress={() => handleTopup(20000)}>
                            <Text style={styles.packText}>20.000đ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.packBtn, {backgroundColor: '#F59E0B'}]} onPress={() => handleTopup(50000)}>
                            <Text style={styles.packText}>50.000đ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.packBtn, {backgroundColor: '#F59E0B'}]} onPress={() => handleTopup(100000)}>
                            <Text style={styles.packText}>100.000đ</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Achievements */}
                <View style={styles.achievementsSection}>
                    <Text style={styles.sectionTitle}>Chúng ta đã đạt được</Text>

                    {achievements.map((achievement) => (
                        <View key={achievement.id} style={styles.achievementCard}>
                            <View style={styles.achievementIcon}>
                                <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                            </View>
                            <View style={styles.achievementContent}>
                                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                                {achievement.days !== undefined ? (
                                    <Text style={styles.achievementDays}>
                                        <Text style={[styles.achievementDaysNumber, { color: achievement.color }]}>
                                            {achievement.days.toString().padStart(2, '0')}
                                        </Text>{' '}
                                        Ngày liên tiếp
                                    </Text>
                                ) : (
                                    <>
                                        <Text style={styles.achievementProgress}>
                                            <Text style={[styles.achievementProgressNumber, { color: achievement.color }]}>
                                                {achievement.progress}
                                            </Text>
                                            /{achievement.total} từ
                                        </Text>
                                        <View style={styles.progressBar}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    {
                                                        width: `${(achievement.progress / achievement.total) * 100}%`,
                                                        backgroundColor: achievement.color,
                                                    },
                                                ]}
                                            />
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
            <Modal visible={showPay} animationType="slide">
                <View style={{flex:1}}>
                    <View style={styles.webHeader}>
                        <TouchableOpacity onPress={() => setShowPay(false)}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                        <Text style={styles.webTitle}>Thanh toán VNPAY</Text>
                        <View style={{width:24}} />
                    </View>
                    {webUrl ? (
                        <WebView
                            source={{ uri: webUrl }}
                            startInLoadingState
                            onNavigationStateChange={(navState) => {
                                console.log('Current URL:', navState.url);

                                // 🔥 Kiểm tra URL callback từ VNPAY
                                if (navState.url.includes('/vnpay-return') ||
                                    navState.url.includes('vnp_ResponseCode=00')) {
                                    console.log('✅ Thanh toán thành công, đang đóng WebView...');

                                    // Đóng WebView sau 1 giây để user thấy thông báo thành công
                                    setTimeout(() => {
                                        setShowPay(false);
                                        setWebUrl(null);

                                        // Reload lại thông tin user để cập nhật điểm
                                        loadStats();
                                    }, 1500);
                                }

                                // 🔥 Xử lý trường hợp thanh toán thất bại
                                if (navState.url.includes('vnp_ResponseCode') &&
                                    !navState.url.includes('vnp_ResponseCode=00')) {
                                    console.log('❌ Thanh toán thất bại');

                                    setTimeout(() => {
                                        setShowPay(false);
                                        setWebUrl(null);
                                        Alert.alert('Thông báo', 'Thanh toán không thành công. Vui lòng thử lại.');
                                    }, 1500);
                                }
                            }}
                            onError={(syntheticEvent) => {
                                const { nativeEvent } = syntheticEvent;
                                console.error('WebView error:', nativeEvent);
                            }}
                        />
                    ) : (
                        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
                            <Text>Đang tải...</Text>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        backgroundColor: '#10B981',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    closeButton: {
        padding: 8,
    },
    closeIcon: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    settingsButton: {
        padding: 8,
    },
    settingsIcon: {
        fontSize: 24,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        marginTop: -20, // Giảm từ -30 xuống -20
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FEF3C7',
        borderWidth: 4,
        borderColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarIcon: {
        fontSize: 50,
    },
    premiumBadge: {
        position: 'absolute',
        bottom: -5,
        alignSelf: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    premiumText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    premiumBanner: {
        backgroundColor: '#FEF3C7',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    premiumContent: {
        flex: 1,
    },
    premiumTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#F59E0B',
        marginBottom: 8,
    },
    premiumSubtitle: {
        fontSize: 14,
        color: '#1F2937',
        marginBottom: 12,
        lineHeight: 20,
    },
    premiumExpired: {
        fontWeight: 'bold',
        color: '#EF4444',
    },
    premiumButton: {
        backgroundColor: '#F59E0B',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    premiumButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    premiumIllustration: {
        width: 80,
        height: 80,
        marginLeft: 12,
    },
    achievementsSection: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    achievementCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    achievementIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    achievementEmoji: {
        fontSize: 30,
    },
    achievementContent: {
        flex: 1,
    },
    achievementTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    achievementProgress: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    achievementProgressNumber: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    achievementDays: {
        fontSize: 14,
        color: '#6B7280',
    },
    achievementDaysNumber: {
        fontWeight: 'bold',
        fontSize: 20,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    pointsCard: {
        marginTop: 8,
        backgroundColor: '#D1FAE5',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    pointsLabel: { color: '#065F46', fontSize: 12, fontWeight: '600' },
    pointsValue: { color: '#065F46', fontSize: 22, fontWeight: '800', marginTop: 2 },

    topupSection: { padding: 16, paddingTop: 8 },
    methodRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    methodBtn: {
        borderWidth: 1, borderColor: '#10B981', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
        backgroundColor: '#FFFFFF',
    },
    methodBtnActive: { backgroundColor: '#10B981' },
    methodText: { color: '#10B981', fontWeight: '700' },
    methodTextActive: { color: '#FFFFFF' },

    packRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    packBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 1 }, elevation: 2,
    },
    packText: { color: '#FFFFFF', fontWeight: '800' },

    syncBtn: {
        backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    },
    syncText: { color: '#FFFFFF', fontWeight: '700' },

    webHeader: {
        backgroundColor: '#10B981',
        paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
    },
    webTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

    notificationBanner: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    notificationIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    notificationText: {
        flex: 1,
        paddingRight: 20,
    },
    notificationTitle: {
        color: '#1F2937',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    notificationDetails: {
        color: '#10B981',
        fontSize: 13,
        fontWeight: '600',
    },
    notificationClose: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 4,
    },
    notificationCloseText: {
        color: '#6B7280',
        fontSize: 20,
        fontWeight: 'bold',
    },
});