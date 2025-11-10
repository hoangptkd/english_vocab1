// HomeScreen.js - Updated with Admin Button
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { learningAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await learningAPI.getStats();
      console.log('Stats data:', data);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      Alert.alert('Lỗi', 'Không thể tải thống kê');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const renderBarChart = () => {
    if (!stats?.levels || stats.levels.length === 0) return null;

    const maxCount = Math.max(...stats.levels.map(d => d.count), 1);
    const chartHeight = 200;
    const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#059669', '#8B5CF6'];

    return (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <View style={styles.notebookIcon}>
              <Text style={styles.notebookText}>📓</Text>
            </View>
            <Text style={styles.chartTitle}>Sổ tay đã có {stats.totalWords || 0} từ</Text>
          </View>

          <View style={styles.chart}>
            {stats.levels.map((item, index) => {
              const barHeight = (item.count / maxCount) * chartHeight;

              return (
                  <View key={item.level} style={styles.barWrapper}>
                    <View style={styles.barContainer}>
                      <Text style={styles.countLabel}>{item.count} từ</Text>
                      <View
                          style={[
                            styles.bar,
                            {
                              height: barHeight || 4,
                              backgroundColor: colors[index],
                            },
                          ]}
                      />
                    </View>
                    <Text style={styles.levelNumber}>{item.level}</Text>
                  </View>
              );
            })}
          </View>
        </View>
    );
  };

  return (
      <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>MOCHIVOCAB</Text>
          </View>
          <View style={styles.headerButtons}>
            {/* Admin Button - Only show if user is admin */}
            {user?.role === 'admin' && (
                <TouchableOpacity
                    onPress={() => navigation.navigate('AdminDashboard')}
                    style={styles.adminButton}
                >
                  <Text style={styles.adminIcon}>⚙️</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                style={styles.profileButton}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Admin Badge */}
        {user?.role === 'admin' && (
            <View style={styles.adminBadgeContainer}>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>👑 QUẢN TRỊ VIÊN</Text>
              </View>
            </View>
        )}

        {/* Premium Banner - Only show for non-premium users */}
        {user?.role === 'user' && (
            <TouchableOpacity
                style={styles.banner}
                onPress={() => navigation.navigate('Premium')}
                activeOpacity={0.8}
            >
              <View style={styles.bannerContent}>
                <Text style={styles.bannerIcon}>🎉</Text>
                <Text style={styles.bannerText}>MỞ TOÀN BỘ KHÓA HỌC</Text>
              </View>
              <View style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>MỞ NGAY</Text>
              </View>
            </TouchableOpacity>
        )}

        {/* Premium Badge - Show for premium users */}
        {user?.role === 'premium' && (
            <View style={styles.premiumBadgeContainer}>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>👑 PREMIUM</Text>
              </View>
            </View>
        )}

        {stats && (
            <>
              {/* Bar Chart */}
              {renderBarChart()}

              {/* Thống kê tổng quan */}
              <View style={styles.statsContainer}>
                <Text style={styles.sectionTitle}>📈 Thống kê tổng quan</Text>

                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={styles.statNumber}>{stats.statusBreakdown?.learning || 0}</Text>
                    <Text style={styles.statLabel}>Đang học</Text>
                  </View>

                  <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={styles.statNumber}>{stats.statusBreakdown?.review || 0}</Text>
                    <Text style={styles.statLabel}>Cần ôn tập</Text>
                  </View>

                  <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={styles.statNumber}>{stats.statusBreakdown?.mastered || 0}</Text>
                    <Text style={styles.statLabel}>Đã thuộc</Text>
                  </View>

                  <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={styles.statNumber}>{stats.dueForReview || 0}</Text>
                    <Text style={styles.statLabel}>Đến giờ ôn</Text>
                  </View>
                </View>

                {stats.dueForReview > 0 && (
                    <View style={styles.alertBox}>
                      <Text style={styles.alertText}>
                        ⏰ Bạn có {stats.dueForReview} từ cần ôn tập ngay!
                      </Text>
                    </View>
                )}
              </View>

              {/* Các nút hành động */}
              <View style={styles.actionsContainer}>
                <Text style={styles.sectionTitle}>🎯 Hôm nay học gì?</Text>

                {/* Nút Học từ mới */}
                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#10B981' }]}
                    onPress={() => navigation.navigate('Topics')}
                >
                  <Text style={styles.actionIcon}>📚</Text>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Học từ mới</Text>
                    <Text style={styles.actionDescription}>
                      Khám phá từ vựng mới mỗi ngày
                    </Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </TouchableOpacity>

                {/* Nút Ôn tập */}
                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#059669' }]}
                    onPress={() => navigation.navigate('Review')}
                >
                  <Text style={styles.actionIcon}>🔄</Text>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Ôn tập</Text>
                    <Text style={styles.actionDescription}>
                      Ôn lại theo giờ vàng để nhớ lâu hơn
                    </Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </TouchableOpacity>

                {/* Nút Thống kê chi tiết */}
                <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: '#DC2626' }]}
                    onPress={() => navigation.navigate('Stats')}
                >
                  <Text style={styles.actionIcon}>📈</Text>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Thống kê chi tiết</Text>
                    <Text style={styles.actionDescription}>
                      Xem tiến trình học tập của bạn
                    </Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </TouchableOpacity>
              </View>

              {/* Info box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>💡 Giờ vàng là gì?</Text>
                <Text style={styles.infoText}>
                  Giờ vàng là khoảng thời gian tối ưu để ôn tập từ vựng. Khi bạn học một
                  từ mới, não bộ sẽ dần quên nó theo thời gian. Ôn tập đúng lúc giúp bạn
                  ghi nhớ từ lâu hơn và hiệu quả hơn!
                </Text>
              </View>
            </>
        )}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  adminButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminIcon: {
    fontSize: 20,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 24,
  },
  adminBadgeContainer: {
    padding: 12,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
  },
  adminBadge: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  banner: {
    backgroundColor: '#FCD34D',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  bannerButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bannerButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  chartContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  notebookIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notebookText: {
    fontSize: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 240,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 220,
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  bar: {
    width: 40,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 4,
  },
  levelNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
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
    fontSize: 14,
    color: '#6B7280',
  },
  alertBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  actionsContainer: {
    padding: 16,
  },
  actionCard: {
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
  actionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  actionArrow: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  infoBox: {
    margin: 16,
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});