// AdminDashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';

export default function AdminDashboardScreen({ navigation }) {
    const { user } = useAuth();
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Kiểm tra quyền admin
        if (user?.role !== 'admin') {
            Alert.alert('Lỗi', 'Bạn không có quyền truy cập trang này');
            navigation.goBack();
            return;
        }
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        try {
            const data = await adminAPI.getUserStatistics();
            setStatistics(data);
        } catch (error) {
            console.error('Error loading statistics:', error);
            Alert.alert('Lỗi', 'Không thể tải thống kê');
        } finally {
            setLoading(false);
        }
    };

    const adminFeatures = [
        {
            id: 1,
            title: 'Quản lý Topics',
            description: 'Thêm, sửa, xóa các chủ đề học tập',
            icon: '📚',
            color: '#10B981',
            screen: 'AdminTopics',
        },
        {
            id: 2,
            title: 'Quản lý Vocabulary',
            description: 'Quản lý từ vựng trong hệ thống',
            icon: '📝',
            color: '#3B82F6',
            screen: 'AdminVocabulary',
        },
        {
            id: 3,
            title: 'Quản lý Users',
            description: 'Xem và quản lý người dùng',
            icon: '👥',
            color: '#F59E0B',
            screen: 'AdminUsers',
        },
        {
            id: 4,
            title: 'Thống kê hệ thống',
            description: 'Xem báo cáo và phân tích',
            icon: '📊',
            color: '#8B5CF6',
            screen: 'AdminStatistics',
        },
    ];

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Admin Dashboard</Text>
                    <Text style={styles.headerSubtitle}>Xin chào, {user?.name}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>← Về trang chủ</Text>
                </TouchableOpacity>
            </View>

            {/* Statistics Cards */}
            {statistics && (
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>📈 Tổng quan hệ thống</Text>
                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
                            <Text style={styles.statNumber}>{statistics.totalUsers || 0}</Text>
                            <Text style={styles.statLabel}>Tổng người dùng</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
                            <Text style={styles.statNumber}>{statistics.activeUsers || 0}</Text>
                            <Text style={styles.statLabel}>Đang hoạt động</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                            <Text style={styles.statNumber}>{statistics.premiumUsers || 0}</Text>
                            <Text style={styles.statLabel}>Premium</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
                            <Text style={styles.statNumber}>{statistics.adminUsers || 0}</Text>
                            <Text style={styles.statLabel}>Quản trị viên</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Admin Features */}
            <View style={styles.featuresContainer}>
                <Text style={styles.sectionTitle}>🎯 Chức năng quản lý</Text>
                {adminFeatures.map((feature) => (
                    <TouchableOpacity
                        key={feature.id}
                        style={[styles.featureCard, { backgroundColor: feature.color }]}
                        onPress={() => navigation.navigate(feature.screen)}
                    >
                        <Text style={styles.featureIcon}>{feature.icon}</Text>
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>{feature.title}</Text>
                            <Text style={styles.featureDescription}>{feature.description}</Text>
                        </View>
                        <Text style={styles.featureArrow}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Warning Box */}
            <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>⚠️ Lưu ý quan trọng</Text>
                <Text style={styles.warningText}>
                    Bạn đang sử dụng quyền quản trị viên. Hãy cẩn thận khi thực hiện các
                    thay đổi vì chúng sẽ ảnh hưởng đến toàn bộ hệ thống.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: '#DC2626',
        padding: 20,
        paddingTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    statsContainer: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    featuresContainer: {
        padding: 16,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    featureIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 13,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    featureArrow: {
        fontSize: 32,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    warningBox: {
        margin: 16,
        padding: 16,
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    warningTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#92400E',
        marginBottom: 8,
    },
    warningText: {
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
    },
});