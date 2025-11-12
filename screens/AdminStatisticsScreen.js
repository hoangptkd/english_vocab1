// AdminStatisticsScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    Alert,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { adminAPI, statisticsAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function AdminStatisticsScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('week');

    useEffect(() => {
        loadStatistics();
    }, [selectedPeriod]);

    const loadStatistics = async () => {
        try {
            setLoading(true);

            const [
                systemStats,
                userGrowth,
                learningActivity,
                topTopics,
            ] = await Promise.all([
                statisticsAPI.getSystemStatistics(selectedPeriod),
                statisticsAPI.getUserGrowth(selectedPeriod),
                statisticsAPI.getLearningActivity(),
                statisticsAPI.getTopTopics(5),
            ]);

            setStatistics({
                users: systemStats.users,
                vocabularies: systemStats.vocabularies,
                learning: systemStats.learning,
                battles: systemStats.battles,
                userGrowth: userGrowth,
                learningActivity: learningActivity,
                topTopics: topTopics,
            });
        } catch (error) {
            console.error('Error loading statistics:', error);
            Alert.alert('Lỗi', 'Không thể tải thống kê');
        } finally {
            setLoading(false);
        }
    };

    const formatUserGrowthData = () => {
        if (!statistics?.userGrowth || statistics.userGrowth.length === 0) {
            return {
                labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                datasets: [
                    { data: [0, 0, 0, 0, 0, 0, 0] }
                ]
            };
        }

        const labels = statistics.userGrowth.map(item => {
            const date = new Date(item.date);
            if (selectedPeriod === 'year') {
                return `T${date.getMonth() + 1}`;
            }
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });

        return {
            labels: labels.slice(0, 7), // Giới hạn 7 labels để vừa màn hình
            datasets: [
                {
                    data: statistics.userGrowth.slice(0, 7).map(item => item.newUsers || 0),
                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                    strokeWidth: 2
                },
                {
                    data: statistics.userGrowth.slice(0, 7).map(item => item.activeUsers || 0),
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    strokeWidth: 2
                }
            ],
            legend: ['Người dùng mới', 'Hoạt động']
        };
    };

    const formatVocabDistribution = () => {
        if (!statistics?.vocabularies) {
            return {
                labels: ['Beginner', 'Intermediate', 'Advanced'],
                datasets: [{ data: [0, 0, 0] }]
            };
        }

        return {
            labels: ['Beginner', 'Intermediate', 'Advanced'],
            datasets: [{
                data: [
                    statistics.vocabularies.byLevel?.beginner || 0,
                    statistics.vocabularies.byLevel?.intermediate || 0,
                    statistics.vocabularies.byLevel?.advanced || 0
                ]
            }]
        };
    };

    const formatActivityPieData = () => {
        if (!statistics?.learningActivity) {
            return [];
        }

        return statistics.learningActivity.map(activity => ({
            name: activity.name,
            population: activity.value,
            color: activity.color,
            legendFontColor: '#1F2937',
            legendFontSize: 12
        }));
    };

    const chartConfig = {
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.7,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
        propsForLabels: {
            fontSize: 10
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>Đang tải thống kê...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>📊 Thống kê hệ thống</Text>
                    <Text style={styles.headerSubtitle}>Tổng quan và phân tích chi tiết</Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>← Quay lại</Text>
                </TouchableOpacity>
            </View>

            {/* Period Selector */}
            <View style={styles.periodSelector}>
                {['week', 'month', 'year'].map((period) => (
                    <TouchableOpacity
                        key={period}
                        style={[
                            styles.periodButton,
                            selectedPeriod === period && styles.periodButtonActive,
                        ]}
                        onPress={() => setSelectedPeriod(period)}
                    >
                        <Text
                            style={[
                                styles.periodButtonText,
                                selectedPeriod === period && styles.periodButtonTextActive,
                            ]}
                        >
                            {period === 'week' ? '7 Ngày' : period === 'month' ? '30 Ngày' : 'Năm'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Overview Cards */}
            {statistics && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tổng quan</Text>
                    <View style={styles.cardsGrid}>
                        <StatCard
                            icon="👥"
                            value={statistics.users?.totalUsers || 0}
                            label="Tổng người dùng"
                            color="#3B82F6"
                        />
                        <StatCard
                            icon="⭐"
                            value={statistics.users?.premiumUsers || 0}
                            label="Premium"
                            color="#F59E0B"
                        />
                        <StatCard
                            icon="📚"
                            value={statistics.vocabularies?.total || 0}
                            label="Từ vựng"
                            color="#10B981"
                        />
                        <StatCard
                            icon="🎯"
                            value={`${statistics.learning?.completionRate || 0}%`}
                            label="Hoàn thành"
                            color="#8B5CF6"
                        />
                    </View>
                </View>
            )}

            {/* User Growth Chart */}
            {statistics?.userGrowth && statistics.userGrowth.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tăng trưởng người dùng</Text>
                    <View style={styles.chartContainer}>
                        <LineChart
                            data={formatUserGrowthData()}
                            width={width - 48}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chart}
                            withInnerLines={true}
                            withOuterLines={true}
                            withVerticalLabels={true}
                            withHorizontalLabels={true}
                            fromZero={true}
                        />
                    </View>
                </View>
            )}

            {/* Learning Activity Pie Chart */}
            {statistics?.learningActivity && statistics.learningActivity.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hoạt động học tập</Text>
                    <View style={styles.chartContainer}>
                        <PieChart
                            data={formatActivityPieData()}
                            width={width - 48}
                            height={200}
                            chartConfig={chartConfig}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            absolute
                            style={styles.chart}
                        />
                    </View>
                </View>
            )}

            {/* Vocabulary Distribution */}
            {statistics?.vocabularies && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Phân bố từ vựng theo cấp độ</Text>
                    <View style={styles.chartContainer}>
                        <BarChart
                            data={formatVocabDistribution()}
                            width={width - 48}
                            height={220}
                            chartConfig={{
                                ...chartConfig,
                                color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                            }}
                            style={styles.chart}
                            showValuesOnTopOfBars={true}
                            fromZero={true}
                        />
                    </View>
                </View>
            )}

            {/* Top Topics */}
            {statistics?.topTopics && statistics.topTopics.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Top 5 chủ đề phổ biến</Text>
                    <View style={styles.topicsContainer}>
                        {statistics.topTopics.map((topic, index) => (
                            <View key={index} style={styles.topicItem}>
                                <View style={styles.topicRank}>
                                    <Text style={styles.topicRankText}>#{index + 1}</Text>
                                </View>
                                <View style={styles.topicInfo}>
                                    <Text style={styles.topicName}>{topic.name || 'Unknown'}</Text>
                                    <View style={styles.topicBar}>
                                        <View
                                            style={[
                                                styles.topicBarFill,
                                                {
                                                    width: `${Math.min(
                                                        (topic.count / (statistics.topTopics[0]?.count || 1)) * 100,
                                                        100
                                                    )}%`
                                                }
                                            ]}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.topicCount}>{topic.count}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Learning Metrics */}
            {statistics?.learning && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chỉ số học tập</Text>
                    <View style={styles.metricsContainer}>
                        <MetricCard
                            label="Tổng phiên học"
                            value={statistics.learning.totalSessions || 0}
                            icon="📖"
                            color="#3B82F6"
                        />
                        <MetricCard
                            label="Thời gian TB/phiên"
                            value={`${statistics.learning.avgSessionTime || 0} phút`}
                            icon="⏱️"
                            color="#10B981"
                        />
                        <MetricCard
                            label="Tỷ lệ hoàn thành"
                            value={`${statistics.learning.completionRate || 0}%`}
                            icon="✅"
                            color="#F59E0B"
                        />
                    </View>
                </View>
            )}

            {/* Battle Stats */}
            {statistics?.battles && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thống kê đối kháng</Text>
                    <View style={styles.battleStats}>
                        <View style={styles.battleStatItem}>
                            <Text style={styles.battleStatValue}>{statistics.battles.total || 0}</Text>
                            <Text style={styles.battleStatLabel}>Tổng trận đấu</Text>
                        </View>
                        <View style={styles.battleStatDivider} />
                        <View style={styles.battleStatItem}>
                            <Text style={styles.battleStatValue}>{statistics.battles.completed || 0}</Text>
                            <Text style={styles.battleStatLabel}>Đã hoàn thành</Text>
                        </View>
                    </View>
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

// Stat Card Component
const StatCard = ({ icon, value, label, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// Metric Card Component
const MetricCard = ({ label, value, icon, color }) => (
    <View style={[styles.metricCard, { backgroundColor: color + '20' }]}>
        <Text style={styles.metricIcon}>{icon}</Text>
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    header: {
        backgroundColor: '#8B5CF6',
        padding: 24,
        paddingTop: 50,
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
    periodSelector: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
    },
    periodButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    periodButtonTextActive: {
        color: '#FFFFFF',
    },
    section: {
        padding: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: (width - 44) / 2,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    chartContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center',
    },
    chart: {
        borderRadius: 8,
    },
    topicsContainer: {
        gap: 12,
    },
    topicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    topicRank: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    topicRankText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    topicInfo: {
        flex: 1,
    },
    topicName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 6,
    },
    topicBar: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    topicBarFill: {
        height: '100%',
        backgroundColor: '#8B5CF6',
    },
    topicCount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#8B5CF6',
        marginLeft: 12,
    },
    metricsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    metricCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    metricIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    metricValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    battleStats: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    battleStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    battleStatValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#F59E0B',
        marginBottom: 4,
    },
    battleStatLabel: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    battleStatDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 16,
    },
});