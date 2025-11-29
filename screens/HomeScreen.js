// HomeScreen.js - Updated with Bottom Navigation
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { learningAPI } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation, route  }) {
  const { user, refreshProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);
  // Khi người dùng quay lại màn hình HomeTab, sẽ gọi lại loadStats để làm mới dữ liệu
  useFocusEffect(
      useCallback(() => {
        // Kiểm tra nếu có tham số reloadStats trong route.params
        if (route?.params?.reloadStats) {
          loadStats();
        }
      }, [route?.params?.reloadStats]) // Điều kiện chỉ gọi lại nếu reloadStats thay đổi
  );
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

  const handleOpenProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const withTimeout = (p, ms = 5000) =>
          Promise.race([
            p,
            new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), ms)),
          ]);

      await withTimeout(refreshProfile());
      // 🔥 Navigate to parent navigator to access Profile modal
      navigation.getParent()?.navigate('Profile');
    } catch (e) {
      console.log('Refresh profile failed:', e?.message || e);
      navigation.getParent()?.navigate('Profile');
    } finally {
      setLoadingProfile(false);
    }
  }, [refreshProfile, navigation]);

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

  // 🔥 Kiểm tra số từ cần ôn tập
  const dueForReview = stats?.dueForReview || 0;
  const hasWordsToReview = dueForReview > 0;

  return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#10B981" />
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
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
                      onPress={() => navigation.getParent()?.navigate('AdminDashboard')}
                      style={styles.adminButton}
                  >
                    <Text style={styles.adminIcon}>⚙️</Text>
                  </TouchableOpacity>
              )}
              <TouchableOpacity
                  onPress={handleOpenProfile}
                  style={[styles.profileButton, loadingProfile && { opacity: 0.7 }]}
                  disabled={loadingProfile}
              >
                {loadingProfile ? (
                    <ActivityIndicator size="small" color="#10B981" />
                ) : (
                    <Text style={styles.profileIcon}>👤</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Premium Banner - Only show for non-premium users */}
          {user?.role === 'user' && (
              <TouchableOpacity
                  style={styles.banner}
                  onPress={() => navigation.getParent()?.navigate('Premium')}
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

          {/* Admin Badge */}
          {user?.role === 'admin' && (
              <View style={styles.adminBadgeContainer}>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>👑 QUẢN TRỊ VIÊN</Text>
                </View>
              </View>
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
                {/* Bar Chart - Giữ lại nhưng thu gọn hơn */}
                {renderBarChart()}
                {/* 🔥 Review Status Card - Thay thế Bar Chart */}
                <View style={styles.reviewStatusCard}>
                  <View style={styles.reviewStatusHeader}>
                    <View style={styles.reviewIconContainer}>
                      <Text style={styles.reviewIcon}>
                        {hasWordsToReview ? '📚' : '✅'}
                      </Text>
                    </View>
                    <View style={styles.reviewStatusTextContainer}>
                      {hasWordsToReview ? (
                          <>
                            <Text style={styles.reviewStatusTitle}>
                              Chuẩn bị ôn tập {dueForReview} từ
                            </Text>
                            <Text style={styles.reviewStatusSubtitle}>
                              Đã đến giờ vàng để ôn tập rồi! 🎯
                            </Text>
                          </>
                      ) : (
                          <>
                            <Text style={styles.reviewStatusTitle}>
                              Hết từ để ôn rồi! 🎉
                            </Text>
                            <Text style={styles.reviewStatusSubtitle}>
                              Bạn đã hoàn thành tốt. Tiếp tục học từ mới nhé!
                            </Text>
                          </>
                      )}
                    </View>
                  </View>
                </View>
                {/* 🔥 MAIN ACTION BUTTON - Động dựa trên số từ cần ôn */}
                <View style={styles.mainActionContainer}>
                  {hasWordsToReview ? (
                      <TouchableOpacity
                          style={[styles.mainActionButton, { backgroundColor: '#F59E0B' }]}
                          onPress={() => navigation.getParent()?.navigate('Review')}
                          activeOpacity={0.9}
                      >
                        <Text style={styles.mainActionIcon}>🔄</Text>
                        <Text style={styles.mainActionText}>Ôn tập ngay</Text>
                      </TouchableOpacity>
                  ) : (
                      <TouchableOpacity
                          style={styles.mainActionButton}
                          onPress={() => navigation.navigate('TopicsTab')}
                          activeOpacity={0.9}
                      >
                        <Text style={styles.mainActionIcon}>📚</Text>
                        <Text style={styles.mainActionText}>Học từ mới</Text>
                      </TouchableOpacity>
                  )}
                </View>

                {/*/!* Thống kê tổng quan *!/*/}
                {/*<View style={styles.statsContainer}>*/}
                {/*  <Text style={styles.sectionTitle}>📈 Thống kê tổng quan</Text>*/}

                {/*  <View style={styles.statsGrid}>*/}
                {/*    <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>*/}
                {/*      <Text style={styles.statNumber}>{stats.statusBreakdown?.learning || 0}</Text>*/}
                {/*      <Text style={styles.statLabel}>Đang học</Text>*/}
                {/*    </View>*/}

                {/*    <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>*/}
                {/*      <Text style={styles.statNumber}>{stats.statusBreakdown?.review || 0}</Text>*/}
                {/*      <Text style={styles.statLabel}>Cần ôn tập</Text>*/}
                {/*    </View>*/}

                {/*    <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>*/}
                {/*      <Text style={styles.statNumber}>{stats.statusBreakdown?.mastered || 0}</Text>*/}
                {/*      <Text style={styles.statLabel}>Đã thuộc</Text>*/}
                {/*    </View>*/}

                {/*    <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>*/}
                {/*      <Text style={styles.statNumber}>{stats.dueForReview || 0}</Text>*/}
                {/*      <Text style={styles.statLabel}>Đến giờ ôn</Text>*/}
                {/*    </View>*/}
                {/*  </View>*/}
                {/*</View>*/}

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
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#10B981',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingBottom: 100, // Padding để không bị che bởi bottom tab
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    backgroundColor: '#10B981',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  adminButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  premiumBadgeContainer: {
    padding: 12,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
  },
  premiumBadge: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  premiumBadgeText: {
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
  // 🔥 REVIEW STATUS CARD
  reviewStatusCard: {
    margin: 16,
    marginTop: 8,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reviewIcon: {
    fontSize: 32,
  },
  reviewStatusTextContainer: {
    flex: 1,
  },
  reviewStatusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  reviewStatusSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  chartContainer: {
    margin: 16,
    marginTop: 8,
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
    marginTop: 6,
  },
  // 🔥 MAIN ACTION BUTTON
  mainActionContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  mainActionButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mainActionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  mainActionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // 🔥 SECONDARY ACTION BUTTON
  secondaryActionContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  secondaryActionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  secondaryActionIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
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
  infoBox: {
    margin: 16,
    marginTop: 8,
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