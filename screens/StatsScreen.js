import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { learningAPI } from '../services/api';

export default function StatsScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await learningAPI.getStats();
      setStats(data);
      console.log('Stats loaded:', data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  const masteredPercentage = stats?.total > 0 
    ? ((stats.mastered / stats.total) * 100).toFixed(1) 
    : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>📊 Thống kê chi tiết</Text>
        <Text style={styles.subtitle}>Theo dõi tiến trình học tập của bạn</Text>
      </View>

      <View style={styles.mainStatCard}>
        <Text style={styles.mainStatNumber}>{stats?.totalWords || 0}</Text>
        <Text style={styles.mainStatLabel}>Tổng số từ đã học</Text>
        <View style={styles.progressBarLarge}>
          <View
            style={[styles.progressFillLarge, { width: `${masteredPercentage}%` }]}
          />
        </View>
        <Text style={styles.masteredText}>
          {masteredPercentage}% đã thuộc ({stats?.mastered || 0} từ)
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={styles.statIcon}>📖</Text>
          <Text style={styles.statNumber}>{stats?.statusBreakdown.learning || 0}</Text>
          <Text style={styles.statLabel}>Mới</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
          <Text style={styles.statIcon}>🔄</Text>
          <Text style={styles.statNumber}>{stats?.statusBreakdown.review || 0}</Text>
          <Text style={styles.statLabel}>Cần luyện</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
          <Text style={styles.statIcon}>⏰</Text>
          <Text style={styles.statNumber}>{stats?.dueForReview || 0}</Text>
          <Text style={styles.statLabel}>Đến giờ ôn</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={styles.statNumber}>{stats?.mastered || 0}</Text>
          <Text style={styles.statLabel}>Đã thuộc</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>💡 Mẹo học hiệu quả</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            ✅ Học đều đặn mỗi ngày, không cần nhiều chỉ cần 10-15 phút
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            ✅ Ôn tập đúng giờ để tận dụng "giờ vàng"
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            ✅ Tập trung vào những từ khó, đừng bỏ qua
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            ✅ Áp dụng từ vào câu thực tế để nhớ lâu hơn
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  mainStatCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mainStatNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  mainStatLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  progressBarLarge: {
    width: '100%',
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  masteredText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
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
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  tipText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});