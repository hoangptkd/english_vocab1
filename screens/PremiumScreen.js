// PremiumScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

const PREMIUM_PACKAGES = [
    {
        id: '3months',
        duration: 3,
        title: '3 Tháng',
        price: 100000,
        priceText: '100.000đ',
        perMonth: '33.333đ/tháng',
        badge: null,
        color: '#3B82F6',
    },
    {
        id: '6months',
        duration: 6,
        title: '6 Tháng',
        price: 150000,
        priceText: '150.000đ',
        perMonth: '25.000đ/tháng',
        badge: 'Tiết kiệm 25%',
        color: '#8B5CF6',
    },
    {
        id: '1year',
        duration: 12,
        title: '1 Năm',
        price: 250000,
        priceText: '250.000đ',
        perMonth: '20.833đ/tháng',
        badge: 'Phổ biến nhất',
        color: '#F59E0B',
    },
    {
        id: '3years',
        duration: 36,
        title: '3 Năm',
        price: 500000,
        priceText: '500.000đ',
        perMonth: '13.889đ/tháng',
        badge: 'Giá trị tốt nhất',
        color: '#10B981',
    },
    {
        id: 'lifetime',
        duration: 1200, // 100 năm = vĩnh viễn
        title: 'Vĩnh Viễn',
        price: 1000000,
        priceText: '1.000.000đ',
        perMonth: 'Trọn đời',
        badge: '👑 VIP',
        color: '#DC2626',
    },
];

const FEATURES = [
    '✨ Không giới hạn từ vựng',
    '📚 Truy cập toàn bộ chủ đề',
    '🎯 Lộ trình học cá nhân hóa',
    '📊 Thống kê chi tiết',
    '🔄 Ôn tập không giới hạn',
    '🎨 Giao diện không quảng cáo',
    '💾 Sao lưu dữ liệu đám mây',
    '🏆 Huy hiệu và thành tích đặc biệt',
];

export default function PremiumScreen({ navigation }) {
    const { user, updateUserData } = useAuth();
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handlePurchase = async () => {
        if (!selectedPackage) {
            Alert.alert('Thông báo', 'Vui lòng chọn gói Premium');
            return;
        }

        Alert.alert(
            'Xác nhận mua gói Premium',
            `Bạn muốn mua gói ${selectedPackage.title} với giá ${selectedPackage.priceText}?\n\nSố điểm hiện tại: ${user?.totalPoints || 0} điểm\nSố điểm cần: ${selectedPackage.price} điểm`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const response = await authAPI.updatePremium(selectedPackage.duration);

                            // Update user data in context
                            if (updateUserData && response.user) {
                                await updateUserData(response.user);
                            }

                            setShowSuccessModal(true);

                            // Auto close modal and go back after 3 seconds
                            setTimeout(() => {
                                setShowSuccessModal(false);
                                navigation.goBack();
                            }, 3000);

                        } catch (error) {
                            console.error('Purchase error:', error);

                            if (error.response?.status === 400) {
                                const data = error.response.data;
                                Alert.alert(
                                    'Không đủ điểm',
                                    `Bạn cần thêm ${data.shortage || 0} điểm để mua gói này.\n\nSố điểm hiện tại: ${data.available || 0}\nSố điểm cần: ${data.required || 0}`,
                                    [
                                        { text: 'Đóng', style: 'cancel' },
                                        {
                                            text: 'Nạp điểm',
                                            onPress: () => {
                                                // Navigate to top-up screen if you have one
                                                Alert.alert('Thông báo', 'Chức năng nạp điểm đang được phát triển');
                                            },
                                        },
                                    ]
                                );
                            } else {
                                Alert.alert(
                                    'Lỗi',
                                    error.response?.data?.message || 'Có lỗi xảy ra khi nâng cấp Premium'
                                );
                            }
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Banner */}
                <View style={styles.headerBanner}>
                    <Text style={styles.crownIcon}>👑</Text>
                    <Text style={styles.headerTitle}>Nâng cấp Premium</Text>
                    <Text style={styles.headerSubtitle}>
                        Mở khóa toàn bộ tính năng và học không giới hạn
                    </Text>
                </View>

                {/* User Points Display */}
                <View style={styles.pointsCard}>
                    <View style={styles.pointsContent}>
                        <Text style={styles.pointsLabel}>Số điểm của bạn</Text>
                        <Text style={styles.pointsValue}>{user?.totalPoints || 0} điểm</Text>
                    </View>
                    <TouchableOpacity style={styles.topupButton}>
                        <Text style={styles.topupText}>Nạp thêm</Text>
                    </TouchableOpacity>
                </View>

                {/* Premium Features */}
                <View style={styles.featuresSection}>
                    <Text style={styles.sectionTitle}>🎁 Quyền lợi Premium</Text>
                    <View style={styles.featuresGrid}>
                        {FEATURES.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Premium Packages */}
                <View style={styles.packagesSection}>
                    <Text style={styles.sectionTitle}>💎 Chọn gói phù hợp</Text>

                    {PREMIUM_PACKAGES.map((pkg) => (
                        <TouchableOpacity
                            key={pkg.id}
                            style={[
                                styles.packageCard,
                                selectedPackage?.id === pkg.id && styles.packageCardSelected,
                            ]}
                            onPress={() => setSelectedPackage(pkg)}
                            activeOpacity={0.7}
                        >
                            {/* Badge */}
                            {pkg.badge && (
                                <View style={[styles.badge, { backgroundColor: pkg.color }]}>
                                    <Text style={styles.badgeText}>{pkg.badge}</Text>
                                </View>
                            )}

                            {/* Radio Button */}
                            <View style={styles.radioButton}>
                                <View
                                    style={[
                                        styles.radioOuter,
                                        selectedPackage?.id === pkg.id && {
                                            borderColor: pkg.color,
                                        },
                                    ]}
                                >
                                    {selectedPackage?.id === pkg.id && (
                                        <View
                                            style={[styles.radioInner, { backgroundColor: pkg.color }]}
                                        />
                                    )}
                                </View>
                            </View>

                            {/* Package Info */}
                            <View style={styles.packageInfo}>
                                <Text style={styles.packageTitle}>{pkg.title}</Text>
                                <Text style={styles.packagePerMonth}>{pkg.perMonth}</Text>
                            </View>

                            {/* Price */}
                            <View style={styles.packagePrice}>
                                <Text style={styles.priceText}>{pkg.priceText}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Trust Badges */}
                <View style={styles.trustSection}>
                    <View style={styles.trustBadge}>
                        <Text style={styles.trustIcon}>🔒</Text>
                        <Text style={styles.trustText}>Thanh toán an toàn</Text>
                    </View>
                    <View style={styles.trustBadge}>
                        <Text style={styles.trustIcon}>↩️</Text>
                        <Text style={styles.trustText}>Hoàn tiền 7 ngày</Text>
                    </View>
                    <View style={styles.trustBadge}>
                        <Text style={styles.trustIcon}>⚡</Text>
                        <Text style={styles.trustText}>Kích hoạt ngay</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Purchase Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[
                        styles.purchaseButton,
                        !selectedPackage && styles.purchaseButtonDisabled,
                        { backgroundColor: selectedPackage?.color || '#9CA3AF' },
                    ]}
                    onPress={handlePurchase}
                    disabled={loading || !selectedPackage}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.purchaseButtonText}>
                            {selectedPackage
                                ? `Mua ngay - ${selectedPackage.priceText}`
                                : 'Chọn gói để tiếp tục'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.successIcon}>🎉</Text>
                        <Text style={styles.successTitle}>Chúc mừng!</Text>
                        <Text style={styles.successText}>
                            Bạn đã nâng cấp Premium thành công
                        </Text>
                        <View style={styles.successBadge}>
                            <Text style={styles.successBadgeText}>👑 PREMIUM</Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    headerBanner: {
        backgroundColor: '#FFFFFF',
        padding: 32,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    crownIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    pointsCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    pointsContent: {
        flex: 1,
    },
    pointsLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    pointsValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#F59E0B',
    },
    topupButton: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    topupText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F59E0B',
    },
    featuresSection: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    featuresGrid: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    featureText: {
        fontSize: 15,
        color: '#374151',
        marginLeft: 8,
    },
    packagesSection: {
        padding: 16,
    },
    packageCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        position: 'relative',
    },
    packageCardSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#F0F9FF',
    },
    badge: {
        position: 'absolute',
        top: -10,
        right: 16,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    radioButton: {
        marginRight: 16,
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    packageInfo: {
        flex: 1,
    },
    packageTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    packagePerMonth: {
        fontSize: 14,
        color: '#6B7280',
    },
    packagePrice: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    trustSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        marginBottom: 80,
    },
    trustBadge: {
        alignItems: 'center',
    },
    trustIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    trustText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    purchaseButton: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    purchaseButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    purchaseButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        marginHorizontal: 32,
    },
    successIcon: {
        fontSize: 80,
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    successText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    successBadge: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    successBadgeText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});