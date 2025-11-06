import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { learningAPI } from '../services/api';

export default function ProfileScreen({ navigation }) {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalWords: 0,
        masteredWords: 0,
        currentStreak: 0,
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await learningAPI.getStats();
            setStats(data);
        } catch (error) {
            console.error('Không thể tải thống kê:', error);
        }
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

            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarIcon}>🐥</Text>
                    </View>
                    <View style={styles.premiumBadge}>
                        <Text style={styles.premiumText}>Free account</Text>
                    </View>
                </View>
                <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
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
        marginTop: -30,
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
});