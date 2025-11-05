// HomeScreen.js
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

// Bar Chart Component
const BarChart = ({ data }) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 200;
  const barWidth = (width - 80) / data.length - 10;

  const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'];

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>📊 Phân bố mức độ từ vựng</Text>
      
      <View style={styles.chart}>
        {data.map((item, index) => {
          const barHeight = (item.count / maxCount) * chartHeight;
          
          return (
            <View key={item.level} style={styles.barWrapper}>
              <View style={styles.barContainer}>
                <Text style={styles.countLabel}>{item.count}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight || 4,
                      backgroundColor: colors[index],
                      width: barWidth,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{item.label}</Text>
              <Text style={styles.levelNumber}>Lv.{item.level}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.totalSection}>
        <Text style={styles.totalText}>
          Tổng: <Text style={styles.totalNumber}>{data.reduce((sum, d) => sum + d.count, 0)}</Text> từ
        </Text>
      </View>
    </View>
  );
};

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

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', onPress: logout, style: 'destructive' },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {user?.name}! 👋</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {stats && (
        <>
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>📈 Thống kê tổng quan</Text>
            
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
                <Text style={styles.statNumber}>{stats.totalWords || 0}</Text>
                <Text style={styles.statLabel}>Tổng từ</Text>
              </View>
              
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
            </View>

            {stats.dueForReview > 0 && (
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>
                  ⏰ Bạn có {stats.dueForReview} từ cần ôn tập ngay!
                </Text>
              </View>
            )}
          </View>

          {/* Bar Chart */}
          {stats.levels && stats.levels.length > 0 && (
            <BarChart data={stats.levels} />
          )}

          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>🎯 Hôm nay học gì?</Text>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#4F46E5' }]}
              onPress={() => navigation.navigate('LearnNew')}
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
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    padding: 20,
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
  chartContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 240,
    paddingHorizontal: 5,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  bar: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  levelNumber: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 16,
    color: '#6B7280',
  },
  totalNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  actionsContainer: {
    padding: 20,
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
    margin: 20,
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